import imageToColours from "get-image-colors";
import imageToPixels from "get-pixels";
import { DetectedPath, RGBA } from "./common";
import * as conversions from "./conversions";
import RDP from "./RDP";

const getTwoMaxima = (arr: number[]) => {
  const max = Math.max(...arr);
  const others = [...arr];
  others.splice(arr.indexOf(max), 1);
  const secondMax = Math.max(...others);
  return [max, secondMax];
};

const chunk = <T>(arr: T[], n: number) => {
  const results: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    const result = arr.slice(i, i + n);
    results.push(result);
  }
  return results;
};

const getMean = (arr: number[]) => {
  let total = 0;
  for (const n of arr) {
    total += n;
  }
  return total / arr.length;
};

class PathImage {
  constructor(public imagePath: string) {}
  async getPalette() {
    return await imageToColours(this.imagePath);
  }
  async getLuminanceThreshold() {
    const palette = await this.getPalette();
    const luminancePerColour = palette.map(colour => colour.luminance());
    const [maxLum, secondMaxLum] = getTwoMaxima(luminancePerColour);
    const lumDifference = maxLum - secondMaxLum;
    const threshold = secondMaxLum + 0.75 * lumDifference;
    return threshold;
  }
  getPixels(): Promise<{ width: number; height: number; rgba: RGBA[] }> {
    return new Promise((resolve, reject) => {
      imageToPixels(this.imagePath, (err, pixels) => {
        if (err) reject(err);
        const [width, height] = pixels.shape;
        const bytes = Array.from(pixels.data);
        const rgbaColours = chunk(bytes, 4) as RGBA[];
        resolve({ width, height, rgba: rgbaColours });
      });
    });
  }
  brightPixelIndicesToEdgeIndices(brightPixelIndices: number[]) {
    return brightPixelIndices.filter((current, i) => {
      if (i === 0) return false;
      const previous = brightPixelIndices[i - 1];
      const next = brightPixelIndices[i + 1];
      const hasBrightNeighbours =
        current - previous === 1 && next - current === 1;
      return !hasBrightNeighbours;
    });
  }
  async detectEdges() {
    const threshold = await this.getLuminanceThreshold();
    const pixels = await this.getPixels();
    const allHighAlpha = pixels.rgba.every(rgba => rgba[3] === 255);
    if (!allHighAlpha) {
      throw "Not all pixels had a 255 alpha value";
    }
    const rgbPerPix = pixels.rgba.map(conversions.RGBAToRGB);
    const luminancePerPix = rgbPerPix.map(conversions.rgbToLuminance);
    const isBrightPerPix = luminancePerPix.map(lum => lum > threshold);
    const brightPixelIndices: number[] = [];
    for (const i in isBrightPerPix) {
      const isBright = isBrightPerPix[i];
      isBright && brightPixelIndices.push(parseInt(i));
    }
    const edgeIndices = this.brightPixelIndicesToEdgeIndices(
      brightPixelIndices
    );
    const edges = conversions.indicesToPoints(edgeIndices, pixels.width);
    return edges;
  }
}

export default class PathDetector {
  image: PathImage;
  constructor(imagePath: string) {
    this.image = new PathImage(imagePath);
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
