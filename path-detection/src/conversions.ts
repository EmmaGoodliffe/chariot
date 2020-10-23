import { Point, RGB, RGBA } from "./common";

export const rgbToLuminance = (rgb: RGB): number => {
  const [r, g, b] = rgb;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance;
};

export const indicesToPoints = (indices: number[], width: number): Point[] => {
  return indices.map(index => {
    const x = index % width;
    const y = Math.floor(index / width);
    return { x, y };
  });
};

export const pointsToLines = (points: Point[]): number[][] => {
  const lines: number[][] = [];
  for (const point of points) {
    const { x, y } = point;
    if (lines[y]) {
      lines[y].push(x);
    } else {
      lines[y] = [x];
    }
  }
  return lines;
};

export const singlyOccupiedLinesToPoints = (lines: number[]): Point[] => {
  const points: Point[] = [];
  for (const i in lines) {
    const point = lines[i];
    const x = point;
    const y = parseInt(i);
    point && points.push({ x, y });
  }
  return points;
};

export const RGBAToRGB = (rgba: RGBA): RGB => {
  const [r, g, b] = rgba;
  return [r, g, b];
};
