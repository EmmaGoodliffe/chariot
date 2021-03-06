import { Point } from "../common";
import * as conversions from "../conversions";
import { getMean } from "../helpers";
import Image from "../Image";
import RDP from "./RDP";

interface DetectedPath {
  edges: Point[];
  midpoints: Point[];
  path: Point[];
}

export default class PathDetector {
  image: Image;
  constructor(imagePath: string) {
    this.image = new Image(imagePath);
  }
  async detect(epsilon: number): Promise<DetectedPath> {
    const edges = await this.image.detectEdges();
    const edgeLines = conversions.pointsToLines(edges);
    const midpointLines = edgeLines.map(line =>
      line.length === 2 ? getMean(line) : NaN
    );
    const midpoints = conversions.singlyOccupiedLinesToPoints(midpointLines);
    const rdp = new RDP(midpoints, epsilon);
    const simplified = rdp.simplify();
    return {
      edges,
      midpoints,
      path: simplified,
    };
  }
}
