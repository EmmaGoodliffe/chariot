export type RGB = [number, number, number];

export type RGBA = [number, number, number, number];

export interface Point {
  x: number;
  y: number;
}

export interface DetectedPath {
  edges: Point[];
  midpoints: Point[];
  path: Point[];
}

export interface DetectedSign {
  points: Point[];
  centre: Point;
  radius: number;
  sign: number[];
}
