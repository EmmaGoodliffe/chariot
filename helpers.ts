export const chunk = <T>(arr: T[], n: number): T[][] => {
  const results: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    const result = arr.slice(i, i + n);
    results.push(result);
  }
  return results;
};
