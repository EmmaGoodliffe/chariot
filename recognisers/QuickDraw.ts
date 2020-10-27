import { readFileSync } from "fs";
import { join } from "path";
import { chunk } from "../helpers";
import Image from "../Image";

const data = {
  byteOffset: 80,
  width: 28,
} as const;

const run = async () => {
  const raw = readFileSync(
    join(__dirname, "./QuickDraw/data/traffic light.npy")
  );
  const bytes = new Uint8Array(raw);
  const body = bytes.slice(data.byteOffset);
  const images = chunk(body, data.width ** 2);
  const png = await Image.imageToPNG(
    Array.from(images[0]),
    data.width,
    data.width
  );
  await png.writeAsync("./traffic light.png");
};

run().catch(console.error);
