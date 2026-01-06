export const excludeFields = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const copy = { ...obj } as any;
  keys.forEach((k) => delete copy[k]);

  return copy;
};
