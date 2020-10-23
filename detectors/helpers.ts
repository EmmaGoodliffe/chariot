export const getMean = (arr: number[]): number => {
  let total = 0;
  for (const n of arr) {
    total += n;
  }
  return total / arr.length;
};
