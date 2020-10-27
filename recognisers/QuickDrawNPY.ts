import { readFileSync } from "fs";
import { join } from "path";

const run = async () => {
  const raw = readFileSync(
    join(__dirname, "./QuickDraw/data/traffic light.npy")
  );
  const bytes = new Uint8Array(raw);
  console.log(bytes.length);
};

run().catch(console.error);
