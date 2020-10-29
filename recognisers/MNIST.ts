import { join } from "path";
import { Task } from "../common";
import * as conversions from "../conversions";
import { chunk, getMean, readBinaryFile } from "../helpers";
import Image from "../Image";
import NeuralNetwork from "./NeuralNetwork";

const metadata = {
  length: {
    train: 60000,
    test: 10000,
  },
  magicNumber: {
    label: 2049,
    image: 2051,
  },
  width: 28,
} as const;

interface Data {
  images: number[][];
  labels: string[];
}

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
  data: Data;
  constructor() {
    this.dir = "MNIST/data";
    const labels = Array(9 + 1)
      .fill(0)
      .map((value, i) => `${i}`);
    const inputUnits = metadata.width ** 2;
    const hiddenUnits = inputUnits; // Arbitrary
    this.nn = new NeuralNetwork(null, labels, inputUnits, hiddenUnits);
    this.data = { images: [], labels: [] };
  }
  private readLabels(task: Task) {
    const path = join(__dirname, `${this.dir}/${task}-labels`);
    const bytes = readBinaryFile(path);
    const magicNumber = get4Bytes(bytes, 0);
    if (magicNumber !== metadata.magicNumber.label) {
      throw "Bad label magic number header";
    }
    const length = get4Bytes(bytes, 4);
    const body = bytes.slice(8);
    const consistentLength = length === body.length;
    const correctLength = length === metadata.length[task];
    if (!(consistentLength && correctLength)) {
      throw "Bad label length header";
    }
    return body.map(n => `${n}`);
  }
  private readImages(task: Task) {
    const path = join(__dirname, `${this.dir}/${task}-images`);
    const bytes = readBinaryFile(path);
    const magicNumber = get4Bytes(bytes, 0);
    if (magicNumber !== metadata.magicNumber.image) {
      throw "Bad image magic number header";
    }
    const length = get4Bytes(bytes, 4);
    const height = get4Bytes(bytes, 8);
    if (height !== metadata.width) {
      throw "Bad image height";
    }
    const width = get4Bytes(bytes, 12);
    if (width !== metadata.width) {
      throw "Bad image width";
    }
    const body = bytes.slice(16);
    const consistentLength = length === body.length / metadata.width ** 2;
    const correctLength = length === metadata.length[task];
    if (!(consistentLength && correctLength)) {
      throw "Bad image length header";
    }
    const images = chunk(body, metadata.width ** 2);
    return images;
  }
  readData(task: Task): Data {
    const images = this.readImages(task);
    const labels = this.readLabels(task);
    this.data = {
      images,
      labels,
    };
    return this.data;
  }
  async train(): Promise<number> {
    const { images, labels } = this.data;
    const loss = await this.nn.trainVerbose(images, labels);
    return loss;
  }
  async test(nn?: NeuralNetwork): Promise<number> {
    const { images, labels } = this.data;
    return await (nn || this.nn).test(images, labels);
  }
  static async prepareImage(
    image: number[],
    width?: number,
    height?: number,
    targetWidth?: number
  ): Promise<number[]> {
    const w = width || Math.sqrt(image.length);
    const h = height || Math.sqrt(image.length);
    const targetW = targetWidth || metadata.width;
    const png = await Image.imageToPNG(image, w, h);
    const resizedPng = await Image.resizePNG(png, targetW);
    const rgbaPerPix = Image.PNGToPixels(resizedPng);
    const rgbPerPix = rgbaPerPix.map(conversions.RGBAToRGB);
    const greyScalePerPix = rgbPerPix.map(getMean);
    return greyScalePerPix;
  }
}
