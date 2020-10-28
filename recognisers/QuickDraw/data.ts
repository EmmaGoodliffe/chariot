import { readdirSync, readFileSync, writeFileSync } from "fs";
import { basename, join } from "path";

export const data = {
  byteOffset: 80,
  width: 28,
} as const;

const dir = join(__dirname, "data");
const rawDir = join(dir, "raw");
const trainLength = 60000;
const testLength = 10000;
const trainByteLength = trainLength * data.width ** 2;
const testByteLength = testLength * data.width ** 2;

function readNPYFile(path: string) {
  const raw = readFileSync(path);
  const bytes = new Uint8Array(raw);
  const body = bytes.slice(data.byteOffset);
  return body;
}

const files = readdirSync(rawDir);
for (const file of files) {
  const path = join(rawDir, file);
  const images = readNPYFile(path);
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
