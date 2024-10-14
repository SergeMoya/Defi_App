import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

export const getCachedData = <T>(key: string): T | undefined => {
  return cache.get<T>(key);
};

export const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, data);
};