import { readFileSync } from "fs";
import { join } from "path";
import { Task } from "../common";
import { chunk } from "../helpers";
import MNIST from "./MNIST";
import NeuralNetwork from "./NeuralNetwork";

const data = {
  byteOffset: 80,
  width: 28,
  categories: ["hexagon", "lightning", "snowflake", "traffic light"],
} as const;

type Category = typeof data.categories[number];

export default class QuickDraw {
  dir: string;
  nn: NeuralNetwork;
  constructor() {
    this.dir = "QuickDraw/data";
    const labels = [...data.categories];
    const inputUnits = data.width ** 2;
    const hiddenUnits = inputUnits; // Arbitrary
    this.nn = new NeuralNetwork(null, labels, inputUnits, hiddenUnits);
  }
  readNPYFile(path: string, flat?: false): Uint8Array[];
  readNPYFile(path: string, flat: true): Uint8Array;
  readNPYFile(path: string, flat = false): Uint8Array | Uint8Array[] {
    const raw = readFileSync(path);
    const bytes = new Uint8Array(raw);
    const body = bytes.slice(data.byteOffset);
    const images = flat ? body : chunk(body, data.width ** 2);
    return images;
  }
  readImageFile(category: Category, task: Task): number[][] {
    const path = join(__dirname, this.dir, `${task}-${category}`);
    const body = MNIST.readBinaryFile(path);
    const images = chunk(body, data.width ** 2);
    return images;
  }
  readAllFiles(task: Task): [number[][], Category[]] {
    const allImages: number[][] = [];
    const allLabels: Category[] = [];
    for (const category of data.categories) {
      const images = this.readImageFile(category, task);
      for (const image of images) {
        allImages.push(image);
        allLabels.push(category);
      }
    }
    return [allImages, allLabels];
  }
  async train(): Promise<number> {
    const [images, labels] = this.readAllFiles("train");
    const loss = await this.nn.trainVerbose(images, labels, 1, 1);
    return loss;
  }
  async test(nn?: NeuralNetwork): Promise<number> {
    const [images, labels] = this.readAllFiles("train");
    return await (nn || this.nn).test(images, labels);
  }
  static getRequiredWidth(): typeof data.width {
    return data.width;
  }
  static async prepareImage(
    image: number[],
    width?: number,
    height?: number
  ): Promise<number[]> {
    return await MNIST.prepareImage(image, width, height);
  }
}
