import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@strong40_cache_';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const cacheStorage = {
  async set<T>(key: string, data: T): Promise<void> {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
  },

  async get<T>(key: string): Promise<T | null> {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const cacheItem: CacheItem<T> = JSON.parse(cached);
    const isExpired = Date.now() - cacheItem.timestamp > CACHE_EXPIRY;

    if (isExpired) {
      await this.remove(key);
      return null;
    }

    return cacheItem.data;
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  },

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  },
};

// Specific cache keys
export const CacheKeys = {
  TODAY_TASKS: 'today_tasks',
  HABITS: 'habits',
  HABIT_LOGS: 'habit_logs',
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  AREAS: 'areas',
  PROJECTS: 'projects',
};
