import { join } from "path";
import { Task } from "../common";
import { chunk, readBinaryFile } from "../helpers";
import MNIST from "./MNIST";
import NeuralNetwork from "./NeuralNetwork";
import { data as quickDrawData } from "./QuickDraw/data";

const data = {
  width: quickDrawData.width,
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
  readImageFile(category: Category, task: Task): number[][] {
    const path = join(__dirname, this.dir, `${task}-${category}`);
    const body = readBinaryFile(path);
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
  static async prepareImage(
    image: number[],
    width?: number,
    height?: number
  ): Promise<number[]> {
    return await MNIST.prepareImage(image, width, height);
  }
}
