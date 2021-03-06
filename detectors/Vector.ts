// Ripped from p5.js (licence: GNU Lesser General Public License v2.1)
// p5.js: https://p5js.org/
// Original file: https://github.com/processing/p5.js/blob/1cb4a98ab02befa55d286ff4e07690ec77843b2b/src/math/p5.Vector.js
// Licence: https://github.com/processing/p5.js/blob/1cb4a98ab02befa55d286ff4e07690ec77843b2b/license.txt

export default class Vector {
  constructor(public x = 0, public y = 0, public z = 0) {}
  set(v: Vector): this {
    this.x = v.x || 0;
    this.y = v.y || 0;
    this.z = v.z || 0;
    return this;
  }
  copy(): Vector {
    return new Vector(this.x, this.y, this.z);
  }
  add(v: Vector): this {
    this.x += v.x || 0;
    this.y += v.y || 0;
    this.z += v.z || 0;
    return this;
  }
  sub(v: Vector): this {
    this.x -= v.x || 0;
    this.y -= v.y || 0;
    this.z -= v.z || 0;
    return this;
  }
  mul(n: number): this {
    this.x *= n;
    this.y *= n;
    this.z *= n;
    return this;
  }
  div(n: number): this {
    this.x /= n;
    this.y /= n;
    this.z /= n;
    return this;
  }
  mag(): number {
    return Math.sqrt(this.magSq());
  }
  magSq(): number {
    const { x, y, z } = this;
    return x ** 2 + y ** 2 + z ** 2;
  }
  /**
   * Calculate the dot product of 2 vectors
   * @param v Vector
   * @returns Dot product
   */
  dot(v: Vector): number {
    const x = v.x || 0;
    const y = v.y || 0;
    const z = v.z || 0;
    return this.x * x + this.y * y + this.z * z;
  }
  /**
   * Calculate a vector composed of the cross product between 2 vectors
   * @param v Vector
   * @returns Vector composed of cross product
   */
  cross(v: Vector): Vector {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    return new Vector(x, y, z);
  }
  dist(v: Vector): number {
    return v.copy().sub(this).mag();
  }
  normalise(): this {
    const mag = this.mag();
    this.div(mag);
    return this;
  }
  setMag(n: number): this {
    return this.normalise().mul(n);
  }
  static random2D(): Vector {
    return new Vector(Math.random(), Math.random()).normalise();
  }
  static add(v1: Vector, v2: Vector): Vector {
    return v1.copy().add(v2);
  }
  static sub(v1: Vector, v2: Vector): Vector {
    return v1.copy().sub(v2);
  }
  static mul(v: Vector, n: number): Vector {
    return v.copy().mul(n);
  }
  static div(v: Vector, n: number): Vector {
    return v.copy().div(n);
  }
  static dist(v1: Vector, v2: Vector): number {
    return v1.dist(v2);
  }
  static from(vectorLike: { x: number; y: number; z?: number }): Vector {
    const { x, y, z } = vectorLike;
    return new Vector(x, y, z);
  }
}
