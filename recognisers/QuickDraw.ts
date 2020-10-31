import { join } from "path";
import { Task } from "../common";
import { chunk, readBinaryFile } from "../helpers";
import MNIST from "./MNIST";
import NeuralNetwork from "./NeuralNetwork";
import { metadata as importedMetadata } from "./QuickDraw/data";

const metadata = {
  width: importedMetadata.width,
  categories: ["hexagon", "lightning", "snowflake", "traffic light"],
} as const;

type Category = typeof metadata.categories[number];

interface Data {
  images: number[][];
  labels: Category[];
}

export default class QuickDraw {
  dir: string;
  nn: NeuralNetwork<Category>;
  data: Data;
  constructor() {
    this.dir = "QuickDraw/data";
    const labels = [...metadata.categories];
    const inputUnits = metadata.width ** 2;
    const hiddenUnits = inputUnits; // Arbitrary
    this.nn = new NeuralNetwork(null, labels, inputUnits, hiddenUnits);
    this.data = { images: [], labels: [] };
  }
  private readImages(category: Category, task: Task): number[][] {
    const path = join(__dirname, this.dir, `${task}-${category}`);
    const body = readBinaryFile(path);
    const images = chunk(body, metadata.width ** 2);
    return images;
  }
  readData(task: Task): Data {
    const allImages: number[][] = [];
    const allLabels: Category[] = [];
    for (const category of metadata.categories) {
      const images = this.readImages(category, task);
      for (const image of images) {
        allImages.push(image);
        allLabels.push(category);
      }
    }
    this.data = {
      images: allImages,
      labels: allLabels,
    };
    return this.data;
  }
  async train(): Promise<number> {
    const { images, labels } = this.data;
    const loss = await this.nn.trainVerbose(images, labels);
    return loss;
  }
  async test(nn?: NeuralNetwork<Category>): Promise<number> {
    const { images, labels } = this.data;
    return await (nn || this.nn).test(images, labels);
  }
  static async prepareImage(
    image: number[],
    width?: number,
    height?: number
  ): Promise<number[]> {
    const targetWidth = metadata.width;
    return await MNIST.prepareImage(image, width, height, targetWidth);
  }
}
