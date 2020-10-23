import { writeFileSync } from "fs";
import { join } from "path";
// import PathDetector from "./detectors/src/PathDetector";
import SignDetector from "./detectors/SignDetector";

const PATH = join(__dirname, "sign.png");

const run = async () => {
  // const detector = new PathDetector(PATH);
  // const path = await detector.detect(5);
  const detector = new SignDetector(PATH);
  const result = await detector.detect();
  writeFileSync("output.json", JSON.stringify(result));
};

run().catch(console.error);
