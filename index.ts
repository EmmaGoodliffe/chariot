import { writeFileSync } from "fs";
import { join } from "path";
import PathDetector from "./path-detection/src";

const PATH = join(__dirname, "input.png");

const run = async () => {
  const detector = new PathDetector(PATH);
  const path = await detector.detect(5);
  writeFileSync("output.json", JSON.stringify(path));
};

run().catch(console.error);
