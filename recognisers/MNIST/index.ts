import { readFileSync } from "fs";
import { join } from "path";

type Task = "train" | "test";

const data = {
  length: {
    train: 60000 as const,
    test: 10000 as const,
  },
};

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

const readLabelFile = (task: Task) => {
  const raw = readFileSync(join(__dirname, `data/${task}-labels`));
  const bytes = Array.from(new Uint8Array(raw));
  const magicNumber = get4Bytes(bytes, 0);
  if (magicNumber !== 2049) {
    throw "Magic number header is not 2051";
  }
  const length = get4Bytes(bytes, 4);
  const body = bytes.slice(8);
  const consistentLength = length === body.length;
  const correctLength = length === data.length[task];
  if (!(consistentLength && correctLength)) {
    throw "Length header is incorrect";
  }
  return body;
};

const run = async (): Promise<void> => {
  const trainLabels = readLabelFile("train");
  const testLabels = readLabelFile("test");
  console.log({ trainLabels, testLabels });
};

export default run;

/*
60k training (9,912,422B + 28,881B)
10k testing (1,648,877B + 4,542B)

28x28

Training labels (28,881B)
0 | 32b int    | 2049 (0x00000801) | magic number (MSB first)
4 | "          | 60k  | number of labels
8 | unsigned B | ?    | label
...
? = 0-9

Training images (9,912,422B)
0  | 32b int    | 2051 (0x00000803) | magic number
4  | "          | 60k  | number of images
8  | "          | 28   | height of images
12 | "          | "    | width of images
16 | unsigned B | ?    | grey scale of pixel
...
? = 0-255

Testing files are the same but number of labels/images is 10k instead of 60k
*/
