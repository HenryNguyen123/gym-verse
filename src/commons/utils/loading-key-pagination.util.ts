// load key pagination
export const buildPaginationLoadingKey = (
  search: string,
  page: number,
  limit: number,
): string => {
  return `${search}:${page}:${limit}`;
};
