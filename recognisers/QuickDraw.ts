import fs from "fs";
import nd from "ndjson";
import { join } from "path";
import { Point } from "../common";
import Image from "../Image";

const data = {
  width: 256,
} as const;

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
  console.time("read");
  const sketches = await readSketches("traffic light");
  console.timeEnd("read");
  console.time("points");
  const pointSketches = [sketches[0]].map(sketch => ({
    ...sketch,
    points: sketch.drawing.map(strokeToPoints).flat(),
  }));
  console.timeEnd("points");
  console.time("images");
  const imageSketches = pointSketches.map(sketch => {
    const { points } = sketch;
    const image = Array<number>(data.width ** 2).fill(0);
    for (const point of points) {
      const { x, y } = point;
      const i = y * data.width + x;
      image[i] = 255;
    }
    return {
      ...sketch,
      image,
    };
  });
  console.timeEnd("images");
  console.time("save");
  const { image } = imageSketches[0];
  const png = await Image.imageToPNG(image, data.width, data.width);
  await png.writeAsync("./traffic light.png");
  console.timeEnd("save");
};

run().catch(console.error);
