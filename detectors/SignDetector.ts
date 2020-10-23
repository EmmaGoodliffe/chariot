import { DetectedSign, RGB } from "./common";
import * as conversions from "./conversions";
import { getMean } from "./helpers";
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
    const redXPerPix = redPixels.map(pixel => pixel.x);
    const redYPerPix = redPixels.map(pixel => pixel.y);
    const averagePixel = {
      x: getMean(redXPerPix),
      y: getMean(redYPerPix),
    };
    const centreVector = Vector.from(averagePixel);
    const radiusPerPix = redPixels.map(pixel =>
      Vector.dist(Vector.from(pixel), centreVector)
    );
    const minRadius = Math.min(...radiusPerPix);
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
      if (distance < minRadius) {
        return getMean(pixel.rgb);
      } else {
        return -1;
      }
    });
    let signMinX = Infinity;
    let signMinY = Infinity;
    for (const i in signGreyScalePerPix) {
      const greyScale = signGreyScalePerPix[i];
      const { x, y } = allPixels[i].point;
      if (greyScale !== -1) {
        if (x < signMinX) {
          signMinX = x;
        }
        if (y < signMinY) {
          signMinY = y;
        }
      }
    }
    let signMaxX = 0;
    let signMaxY = 0;
    for (const i in signGreyScalePerPix) {
      const greyScale = signGreyScalePerPix[i];
      const { x, y } = allPixels[i].point;
      if (greyScale !== -1) {
        if (x > signMaxX) {
          signMaxX = x;
        }
        if (y > signMaxY) {
          signMaxY = y;
        }
      }
    }
    const signWidth = 1 + signMaxX - signMinX;
    const signHeight = 1 + signMaxY - signMinY;
    if (signWidth !== signHeight) {
      throw "Detected sign is not a circle";
    }
    const signCroppedGreyScalePerPix = signGreyScalePerPix.filter(
      (greyScale, i) => {
        const { x, y } = allPixels[i].point;
        const goodX = x >= signMinX && x <= signMaxX;
        const goodY = y >= signMinY && y <= signMaxY;
        const goodPoint = goodX && goodY;
        return goodPoint;
      }
    );
    const signFixedCroppedGreyScalePerPix = signCroppedGreyScalePerPix.map(
      greyScale => {
        if (greyScale === -1) return 255;
        if (greyScale > 255 / 2) return 255;
        return 0;
      }
    );
    const signInvertedFixedCroppedGreyScalePerPix = signFixedCroppedGreyScalePerPix.map(
      greyScale => 255 - greyScale
    );
    return {
      points: redPixels,
      centre: averagePixel,
      radius: minRadius,
      sign: signInvertedFixedCroppedGreyScalePerPix,
    };
  }
}
