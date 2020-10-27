export const getMean = (arr: number[]): number => {
  let total = 0;
  for (const n of arr) {
    total += n;
  }
  return total / arr.length;
};

// export const chunk = <T>(arr: T[], n: number): T[][] => {
//   const results: T[][] = [];
//   for (let i = 0; i < arr.length; i += n) {
//     const result = arr.slice(i, i + n);
//     results.push(result);
//   }
//   return results;
// };

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
