import { readdirSync, writeFileSync } from "fs";
import { basename, join } from "path";
import QuickDraw from "../QuickDraw";

const dir = join(__dirname, "data");
const rawDir = join(dir, "raw");
const trainLength = 60000;
const testLength = 10000;
const width = QuickDraw.getRequiredWidth();
const trainByteLength = trainLength * width ** 2;
const testByteLength = testLength * width ** 2;

const quickDraw = new QuickDraw();

const files = readdirSync(rawDir);
for (const file of files) {
  const path = join(rawDir, file);
  const images = quickDraw.readNPYFile(path, true);
  if (images.length < trainLength + testLength) {
    throw `There are not ${trainLength + testLength} images in ${file}`;
  }
  const trainImages = images.slice(0, trainByteLength);
  const testImages = images.slice(
    trainByteLength,
    trainByteLength + testByteLength
  );
  const trainBuffer = Buffer.from(trainImages);
  const testBuffer = Buffer.from(testImages);
  const category = basename(file, ".npy");
  const trainPath = join(dir, `train-${category}`);
  const testPath = join(dir, `test-${category}`);
  writeFileSync(trainPath, trainBuffer);
  writeFileSync(testPath, testBuffer);
}
