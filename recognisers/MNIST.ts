import { readFileSync } from "fs";
import { join } from "path";
import { RGBAToRGB } from "../conversions";
import { chunk, getMean } from "../helpers";
import Image from "../Image";
import NeuralNetwork from "./NeuralNetwork";

type Task = "train" | "test";

const data = {
  length: {
    train: 60000,
    test: 10000,
  },
  magicNumber: {
    label: 2049,
    image: 2051,
  },
  width: 28,
  largeFileBytes: 50 * 10 ** 6,
} as const;

const decimalToHexByte = (n: number) => {
  if (n < 256) return n.toString(16).padStart(2, "0");
  throw "Decimal number must be smaller than 256 to convert to byte";
};

const hexToDecimal = (hex: string) => parseInt(`0x${hex}`);

const get4Bytes = (bytes: number[], byteIndex: number) =>
  hexToDecimal(
    bytes
      .slice(byteIndex, byteIndex + 4)
      .map(decimalToHexByte)
      .join("")
  );

export default class MNIST {
  dir: string;
  nn: NeuralNetwork;
  constructor() {
    this.dir = "MNIST/data";
    const labels = Array(9 + 1)
      .fill(0)
      .map((value, i) => `${i}`);
    const inputUnits = data.width ** 2;
    const hiddenUnits = inputUnits;
    this.nn = new NeuralNetwork(null, labels, inputUnits, hiddenUnits);
  }
  readBinaryFile(path: string): number[] {
    const raw = readFileSync(path);
    const bytes = new Uint8Array(raw);
    if (bytes.byteLength > data.largeFileBytes) {
      const mb = (bytes.byteLength / 10 ** 6).toFixed(2);
      throw `File is too large to efficiently convert to array, ~${mb}MB`;
    }
    const bytesArr = Array.from(bytes); // Not memory/time efficient but acceptable because files are small
    return bytesArr;
  }
  readLabelFile(task: Task): string[] {
    const path = join(__dirname, `${this.dir}/${task}-labels`);
    const bytes = this.readBinaryFile(path);
    const magicNumber = get4Bytes(bytes, 0);
    if (magicNumber !== data.magicNumber.label) {
      throw "Bad label magic number header";
    }
    const length = get4Bytes(bytes, 4);
    const body = bytes.slice(8);
    const consistentLength = length === body.length;
    const correctLength = length === data.length[task];
    if (!(consistentLength && correctLength)) {
      throw "Bad label length header";
    }
    return body.map(n => `${n}`);
  }
  readImageFile(task: Task): number[][] {
    const path = join(__dirname, `${this.dir}/${task}-images`);
    const bytes = this.readBinaryFile(path);
    const magicNumber = get4Bytes(bytes, 0);
    if (magicNumber !== data.magicNumber.image) {
      throw "Bad image magic number header";
    }
    const length = get4Bytes(bytes, 4);
    const height = get4Bytes(bytes, 8);
    if (height !== data.width) {
      throw "Bad image height";
    }
    const width = get4Bytes(bytes, 12);
    if (width !== data.width) {
      throw "Bad image width";
    }
    const body = bytes.slice(16);
    const consistentLength = length === body.length / data.width ** 2;
    const correctLength = length === data.length[task];
    if (!(consistentLength && correctLength)) {
      throw "Bad image length header";
    }
    const images = chunk(body, data.width ** 2);
    return images;
  }
  async train(verbose = true, untilLossIsLessThan?: number): Promise<number> {
    const chunkSize = 1000;
    const images = this.readImageFile("train");
    const labels = this.readLabelFile("train");
    const imageChunks = chunk(images, chunkSize);
    const labelChunks = chunk(labels, chunkSize);
    let loss = -1;
    for (let i = 0; i < imageChunks.length; i++) {
      const imageChunk = imageChunks[i];
      const labelChunk = labelChunks[i];
      const start = Date.now();
      loss = await this.nn.train(imageChunk, labelChunk);
      const end = Date.now();
      verbose &&
        console.log({
          loss,
          progress: `${(((i + 1) / imageChunks.length) * 100).toFixed(2)}%`,
          time: `${(end - start) / 1000}s`,
          memory: this.nn.getTensorsInMemory(),
        });
      if (untilLossIsLessThan && loss < untilLossIsLessThan) {
        verbose && console.log("Loss on exit:", loss);
        return loss;
      }
    }
    return loss;
  }
  async test(nn?: NeuralNetwork): Promise<number> {
    const images = this.readImageFile("test");
    const labels = this.readLabelFile("test");
    return await (nn || this.nn).test(images, labels);
  }
  static async prepareImage(
    image: number[],
    width?: number,
    height?: number
  ): Promise<number[]> {
    const w = width || Math.sqrt(image.length);
    const h = height || Math.sqrt(image.length);
    const png = await Image.imageToPNG(image, w, h);
    const resizedPng = await Image.resizePNG(png, data.width);
    const rgbaPerPix = Image.PNGToPixels(resizedPng);
    const rgbPerPix = rgbaPerPix.map(RGBAToRGB);
    const greyScalePerPix = rgbPerPix.map(getMean);
    return greyScalePerPix;
  }
}
