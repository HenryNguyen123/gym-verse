export interface QueryType {
  search?: string;
  page?: number;
  limit?: number;
}
export const getRedisPaginationKey = (
  query: QueryType,
  key: string,
  ttl: number,
): string => {
  const { search = '', page = 1, limit = 10 } = query;
  return `${key}:${page}:${limit}:${search.toLowerCase()}:${ttl}m`;
};
