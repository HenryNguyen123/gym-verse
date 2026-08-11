export const ttlsRedis: number[] = [5, 10, 15];

export const getRedisKey = (key: string, ttl: number) => {
  return key + `:` + ttl + 'ms';
};

export const getCacheRedisKeys = (key: string, ttls: number[]) => {
  const cacheKeys: string[] = [];
  for (const ttl of ttls) {
    cacheKeys.push(key + ':' + ttl + 'ms');
  }
  return cacheKeys;
};
