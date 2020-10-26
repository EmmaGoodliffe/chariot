import { getMean } from "../helpers";
import { DetectedSign, Point, RGB } from "./common";
import * as conversions from "./conversions";
import Image from "./Image";
import Vector from "./Vector";

const isRgbRed = (rgb: RGB) => {
  const thresholdFraction = 0.2;
  const [r, g, b] = rgb;
  const highRed = r > (1 - thresholdFraction) * 255;
  const lowGreen = g < thresholdFraction * 255;
  const lowBlue = b < thresholdFraction * 255;
  return highRed && lowGreen && lowBlue;
};

export default class SignDetector {
  image: Image;
  constructor(imagePath: string) {
    this.image = new Image(imagePath);
  }
  private getMinimumAndMaximum(
    greyScalePerSignPix: number[],
    allPixels: {
      rgb: RGB;
      point: Point;
    }[]
  ): [Point, Point] {
    let minX = Infinity;
    let minY = Infinity;
    for (const i in greyScalePerSignPix) {
      const greyScale = greyScalePerSignPix[i];
      const { x, y } = allPixels[i].point;
      if (greyScale !== -1) {
        if (x < minX) {
          minX = x;
        }
        if (y < minY) {
          minY = y;
        }
      }
    }
    let maxX = 0;
    let maxY = 0;
    for (const i in greyScalePerSignPix) {
      const greyScale = greyScalePerSignPix[i];
      const { x, y } = allPixels[i].point;
      if (greyScale !== -1) {
        if (x > maxX) {
          maxX = x;
        }
        if (y > maxY) {
          maxY = y;
        }
      }
    }
    const min = { x: minX, y: minY };
    const max = { x: maxX, y: maxY };
    return [min, max];
  }
  async detect(): Promise<DetectedSign> {
    const pixels = await this.image.getPixels();
    const rgbPerPix = pixels.rgba.map(conversions.RGBAToRGB);
    const isRedPerPix = rgbPerPix.map(isRgbRed);
    const redPixelIndices: number[] = [];
    for (const i in isRedPerPix) {
      const isRed = isRedPerPix[i];
      isRed && redPixelIndices.push(parseInt(i));
    }
    const redPixels = conversions.indicesToPoints(
      redPixelIndices,
      pixels.width
    );
    const xPerRedPix = redPixels.map(pixel => pixel.x);
    const yPerRedPix = redPixels.map(pixel => pixel.y);
    const averageRedPixel = {
      x: getMean(xPerRedPix),
      y: getMean(yPerRedPix),
    };
    const centreVector = Vector.from(averageRedPixel);
    const radiusPerRedPix = redPixels.map(pixel =>
      Vector.dist(Vector.from(pixel), centreVector)
    );
    const minRadius = Math.min(...radiusPerRedPix);
    const allPixels = rgbPerPix.map((rgb, i) => {
      const points = conversions.indicesToPoints([i], pixels.width);
      if (points.length !== 1) {
        throw "Bad conversion of indices to points";
      }
      const [point] = points;
      return {
        rgb,
        point,
      };
    });
    const signGreyScalePerPix: number[] = allPixels.map(pixel => {
      const distance = Vector.dist(Vector.from(pixel.point), centreVector);
      if (distance < minRadius) return getMean(pixel.rgb);
      return -1;
    });
    const [minSign, maxSign] = this.getMinimumAndMaximum(
      signGreyScalePerPix,
      allPixels
    );
    const signWidth = 1 + maxSign.x - minSign.x;
    const signHeight = 1 + maxSign.y - minSign.y;
    if (signWidth !== signHeight) {
      throw "Detected sign is not a circle";
    }
    const signCroppedGreyScalePerPix = signGreyScalePerPix
      .filter((greyScale, i) => {
        const { x, y } = allPixels[i].point;
        const goodX = x >= minSign.x && x <= maxSign.x;
        const goodY = y >= minSign.y && y <= maxSign.y;
        const goodPoint = goodX && goodY;
        return goodPoint;
      })
      .map(greyScale => {
        if (greyScale === -1) return 255;
        if (greyScale > 255 / 2) return 255;
        return 0;
      })
      .map(greyScale => 255 - greyScale);
    return {
      points: redPixels,
      centre: averageRedPixel,
      radius: minRadius,
      sign: signCroppedGreyScalePerPix,
    };
  }
}
