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
