import { readdirSync, readFileSync, writeFileSync } from "fs";
import { basename, extname, join } from "path";

const NPY_EXT = ".npy";

export const metadata = {
  byteOffset: 80,
  width: 28,
} as const;

const dir = join(__dirname, "data");
const rawDir = join(dir, "raw");
const trainLength = 60000;
const testLength = 10000;

const readNPYFile = (path: string) => {
  const raw = readFileSync(path);
  const bytes = new Uint8Array(raw);
  const body = bytes.slice(metadata.byteOffset);
  return body;
};

const prepare = (): void => {
  const files = readdirSync(rawDir);
  if (!files.length) {
    throw `There were no files in ${rawDir}`;
  }
  const allNpyFiles = files.every(file => extname(file) === NPY_EXT);
  if (!allNpyFiles) {
    throw `Not all the files in ${rawDir} were ${NPY_EXT} files`;
  }
  const trainPerFileLength = trainLength / files.length;
  const testPerFileLength = testLength / files.length;
  const trainByteLength = trainPerFileLength * metadata.width ** 2;
  const testByteLength = testPerFileLength * metadata.width ** 2;
  const totalByteLength = trainByteLength + testByteLength;
  for (const file of files) {
    const path = join(rawDir, file);
    const images = readNPYFile(path);
    if (images.length < totalByteLength) {
      throw `There are not ${totalByteLength} images in ${file}`;
    }
    const trainImages = images.slice(0, trainByteLength);
    const testImages = images.slice(trainByteLength, totalByteLength);
    const category = basename(file, NPY_EXT);
    const trainPath = join(dir, `train-${category}`);
    const testPath = join(dir, `test-${category}`);
    writeFileSync(trainPath, Buffer.from(trainImages));
    writeFileSync(testPath, Buffer.from(testImages));
  }

  console.log("Prepared QuickDraw data");
};

export default prepare;
