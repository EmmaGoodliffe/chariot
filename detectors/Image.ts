import imageToColours from "get-image-colors";
import imageToPixels from "get-pixels";
import { Point, RGBA } from "./common";
import * as conversions from "./conversions";

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

export default class Image {
  constructor(public imagePath: string) {}
  async getPalette(): Promise<chroma.Color[]> {
    return await imageToColours(this.imagePath);
  }
  async getLuminanceThreshold(): Promise<number> {
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
  async detectEdges(): Promise<Point[]> {
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
    const edgeIndices = Image.brightPixelIndicesToEdgeIndices(
      brightPixelIndices
    );
    const edges = conversions.indicesToPoints(edgeIndices, pixels.width);
    return edges;
  }
  static brightPixelIndicesToEdgeIndices(
    brightPixelIndices: number[]
  ): number[] {
    return brightPixelIndices.filter((current, i) => {
      if (i === 0) return false;
      const previous = brightPixelIndices[i - 1];
      const next = brightPixelIndices[i + 1];
      const hasBrightNeighbours =
        current - previous === 1 && next - current === 1;
      return !hasBrightNeighbours;
    });
  }
}
