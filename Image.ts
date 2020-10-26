import imageToColours from "get-image-colors";
// import imageToPixels from "get-pixels";
import Jimp from "jimp";
// import { chunk } from "../helpers";
import { Point, RGBA } from "./common";
import * as conversions from "./conversions";

const getTwoMaxima = (arr: number[]) => {
  const max = Math.max(...arr);
  const others = [...arr];
  others.splice(arr.indexOf(max), 1);
  const secondMax = Math.max(...others);
  return [max, secondMax];
};

export default class Image {
  constructor(public imagePath: string) {}
  private async getPalette(): Promise<chroma.Color[]> {
    return await imageToColours(this.imagePath);
  }
  private async getLuminanceThreshold(): Promise<number> {
    const palette = await this.getPalette();
    const luminancePerColour = palette.map(colour => colour.luminance());
    const [maxLum, secondMaxLum] = getTwoMaxima(luminancePerColour);
    const lumDifference = maxLum - secondMaxLum;
    const threshold = secondMaxLum + 0.75 * lumDifference;
    return threshold;
  }
  // getPixels(): Promise<{ width: number; height: number; rgba: RGBA[] }> {
  //   // TODO: use jimp
  //   return new Promise((resolve, reject) => {
  //     imageToPixels(this.imagePath, (err, pixels) => {
  //       if (err) reject(err);
  //       const [width, height] = pixels.shape;
  //       const bytes = Array.from(pixels.data);
  //       const rgbaColours = chunk(bytes, 4) as RGBA[];
  //       resolve({ width, height, rgba: rgbaColours });
  //     });
  //   });
  // }
  async getPixels(): Promise<{ width: number; height: number; rgba: RGBA[] }> {
    const png = await Jimp.read(this.imagePath);
    const pixels = Image.PNGToPixels(png);
    return {
      width: png.getWidth(),
      height: png.getHeight(),
      rgba: pixels,
    };
  }
  async detectEdges(): Promise<Point[]> {
    const threshold = await this.getLuminanceThreshold();
    const pixels = await this.getPixels();
    const allHighAlpha = pixels.rgba.every(rgba => rgba[3] === 255);
    if (!allHighAlpha) {
      throw "Not all pixels have a 255 alpha value";
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
  static imageToPNG(
    image: number[],
    width: number,
    height: number
  ): Promise<Jimp> {
    return new Promise((resolve, reject) => {
      new Jimp(width, height, (err, png) => {
        if (err) reject(err);
        for (const i_ in image) {
          const i = parseInt(i_);
          const greyScale = image[i];
          const x = i % width;
          const y = Math.floor(i / width);
          const colour = Jimp.rgbaToInt(greyScale, greyScale, greyScale, 255);
          png.setPixelColour(colour, x, y);
        }
        resolve(png);
      });
    });
  }
  static resizePNG(png: Jimp, width: number): Promise<Jimp> {
    // TODO: don't override original PNG
    return new Promise((resolve, reject) => {
      png.resize(width, width, err => {
        if (err) reject(err);
        resolve(png);
      });
    });
  }
  static PNGToPixels(png: Jimp): RGBA[] {
    const width = png.getWidth();
    const height = png.getHeight();
    const rgbaPerPix: RGBA[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colour = png.getPixelColour(x, y);
        const rgba = Jimp.intToRGBA(colour);
        const { r, g, b, a } = rgba;
        rgbaPerPix.push([r, g, b, a]);
      }
    }
    return rgbaPerPix;
  }
}