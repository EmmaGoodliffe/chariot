import fs from "fs";
import nd from "ndjson";
import { join } from "path";

type Stroke = [number[], number[]];

interface Sketch {
  word: string;
  countrycode: string;
  timestamp: string;
  recognized: boolean;
  key_id: string;
  drawing: Stroke[];
}

const readSketches = (category: string): Promise<Sketch[]> =>
  new Promise((resolve, reject) => {
    const path = join(__dirname, `QuickDraw/data/${category}.ndjson`);
    const sketches: Sketch[] = [];
    fs.createReadStream(path)
      .pipe(nd.parse())
      .on("data", sketch => sketches.push(sketch))
      .on("error", reject)
      .on("end", () => resolve(sketches));
  });

const run = async () => {
  const sketches = await readSketches("traffic light");
  console.log(sketches[0].drawing[0], sketches[0].drawing[0]);
};

run().catch(console.error);
