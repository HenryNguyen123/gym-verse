export const timeNow = (): number => performance.now();

export const measureTime = (label: string, start: number): void => {
  console.log(`${label}: ${(performance.now() - start).toFixed(4)} ms`);
};
