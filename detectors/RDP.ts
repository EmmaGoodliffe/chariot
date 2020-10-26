import { Point } from "../common";
import Vector from "./Vector";

export default class RDP {
  nodes: Vector[];
  simplified: Vector[];
  constructor(nodes: Point[], public epsilon: number) {
    this.nodes = nodes.map(node => Vector.from(node));
    this.simplified = [];
  }
  private findFurthest(a: number, b: number) {
    let recordDistance = -1;
    const start = this.nodes[a];
    const end = this.nodes[b];
    let furthestIndex = -1;
    for (let i = a + 1; i < b; i++) {
      const current = this.nodes[i];
      const d = RDP.getDistancePointFromLine(current, [start, end]);
      if (d > recordDistance) {
        recordDistance = d;
        furthestIndex = i;
      }
    }
    if (recordDistance > this.epsilon) {
      return furthestIndex;
    } else {
      return -1;
    }
  }
  private rdp(startIndex: number, endIndex: number) {
    const nextIndex = this.findFurthest(startIndex, endIndex);
    if (nextIndex > 0) {
      if (startIndex !== nextIndex) {
        this.rdp(startIndex, nextIndex);
      }
      this.simplified.push(this.nodes[nextIndex]);
      if (endIndex !== nextIndex) {
        this.rdp(nextIndex, endIndex);
      }
    }
  }
  simplify(): Vector[] {
    const total = this.nodes.length;
    const start = this.nodes[0];
    const end = this.nodes[total - 1];
    this.simplified = [];
    this.simplified.push(start);
    this.rdp(0, total - 1);
    this.simplified.push(end);
    return this.simplified;
  }
  static getDistancePointFromLine(p: Vector, [a, b]: [Vector, Vector]): number {
    const ap = Vector.sub(p, a);
    const ab = Vector.sub(b, a);
    ab.normalise();
    ab.mul(ap.dot(ab));
    const normalPoint = Vector.add(a, ab);
    return Vector.dist(p, normalPoint);
  }
}
