import { readFileSync } from "fs";
import Jimp from "jimp";
import { join } from "path";
import { chunk } from "../../helpers";

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
  imageWidth: 28,
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
  constructor() {
    this.dir = "data";
  }
  readLabelFile(task: Task): number[] {
    const raw = readFileSync(join(__dirname, `${this.dir}/${task}-labels`));
    const bytes = Array.from(new Uint8Array(raw));
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
    return body;
  }
  readImageFile(task: Task): number[][] {
    const raw = readFileSync(join(__dirname, `${this.dir}/${task}-images`));
    const bytes = Array.from(new Uint8Array(raw));
    const magicNumber = get4Bytes(bytes, 0);
    if (magicNumber !== data.magicNumber.image) {
      throw "Bad image magic number header";
    }
    const length = get4Bytes(bytes, 4);
    const height = get4Bytes(bytes, 8);
    if (height !== data.imageWidth) {
      throw "Bad image height";
    }
    const width = get4Bytes(bytes, 12);
    if (width !== data.imageWidth) {
      throw "Bad image width";
    }
    const body = bytes.slice(16);
    const consistentLength = length === body.length / data.imageWidth ** 2;
    const correctLength = length === data.length[task];
    if (!(consistentLength && correctLength)) {
      throw "Bad image length header";
    }
    const images = chunk(body, data.imageWidth ** 2);
    return images;
  }
  static imageToPng(image: number[]): Promise<Jimp> {
    return new Promise((resolve, reject) => {
      const width = data.imageWidth;
      new Jimp(width, width, (err, png) => {
        if (err) reject(err);
        for (const i_ in image) {
          const i = parseInt(i_);
          const greyScale = image[i];
          const x = i % width;
          const y = Math.floor(i / width);
          const rgb = Array<number>(3).fill(greyScale);
          const hexes = rgb.map(decimalToHexByte);
          const fullHex = `0x${hexes.join("")}ff`;
          const fullDecimal = parseInt(fullHex);
          png.setPixelColour(fullDecimal, x, y);
        }
        resolve(png);
      });
    });
  }
  static resizePng(png: Jimp, width: number): Promise<Jimp> {
    return new Promise((resolve, reject) => {
      png.resize(width, width, err => {
        if (err) reject(err);
        resolve(png);
      });
    });
  }
}
