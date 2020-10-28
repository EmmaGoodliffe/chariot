import { readFileSync } from "fs";
import { join } from "path";
import { chunk } from "../helpers";
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
  readNPYFile(path: string): Uint8Array[] {
    const raw = readFileSync(path);
    const bytes = new Uint8Array(raw);
    const body = bytes.slice(data.byteOffset);
    const images = chunk(body, data.width ** 2);
    return images;
  }
  readImageFile(category: Category): Uint8Array[] {
    const path = join(__dirname, `${this.dir}/${category}.npy`);
    const images = this.readNPYFile(path);
    return images;
  }
}
