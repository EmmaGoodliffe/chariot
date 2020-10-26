import { getMean } from "../helpers";
import { DetectedPath, RGBA } from "./common";
import * as conversions from "./conversions";
import Image from "./Image";
import RDP from "./RDP";

export default class PathDetector {
  image: Image;
  constructor(imagePath: string) {
    this.image = new Image(imagePath);
  }
  async getImagePalette(): Promise<RGBA[]> {
    const palette = await this.image.getPalette();
    return palette.map(colour => colour.rgba());
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
