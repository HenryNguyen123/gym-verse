export const normalizeSearch = (key?: string): string => {
  return key?.trim().toLowerCase() ?? '';
};
