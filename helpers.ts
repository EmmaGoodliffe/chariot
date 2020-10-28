import { readFileSync } from "fs";

export const getMean = (arr: number[]): number => {
  let total = 0;
  for (const n of arr) {
    total += n;
  }
  return total / arr.length;
};

type ArrayOrBytes<T> = T[] | Uint8Array;

export function chunk<T>(arr: T[], n: number): T[][];
export function chunk(arr: Uint8Array, n: number): Uint8Array[];
export function chunk<T>(arr: ArrayOrBytes<T>, n: number): ArrayOrBytes<T>[] {
  const results: ArrayOrBytes<T>[] = [];
  for (let i = 0; i < arr.length; i += n) {
    const result = arr.slice(i, i + n);
    results.push(result);
  }
  return results;
}

export const readBinaryFile = (path: string): number[] => {
  const raw = readFileSync(path);
  const bytes = new Uint8Array(raw);
  if (bytes.byteLength > 50 * 10 ** 6) {
    const mb = (bytes.byteLength / 10 ** 6).toFixed(2);
    throw `File is too large to efficiently convert to array, ~${mb}MB`;
  }
  const bytesArr = Array.from(bytes); // Not memory/time efficient but acceptable because files are small
  return bytesArr;
};
