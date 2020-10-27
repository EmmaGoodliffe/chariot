import fs from "fs";
import nd from "ndjson";
import { join } from "path";
import { Point } from "../common";

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

const strokeToPoints = (stroke: Stroke) => {
  const [xs, ys] = stroke;
  if (xs.length !== ys.length) {
    throw "Different number of x and y values in stroke";
  }
  const points: Point[] = [];
  for (const i in xs) {
    const x = xs[i];
    const y = ys[i];
    points.push({ x, y });
  }
  return points;
};

const run = async () => {
  const sketches = await readSketches("traffic light");
  const pointSketches = sketches.map(sketch => ({
    ...sketch,
    drawing: sketch.drawing.map(strokeToPoints),
  }));
  console.log(pointSketches[0].drawing[0]);
};

run().catch(console.error);
