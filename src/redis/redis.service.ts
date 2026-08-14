import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
    });
  }

  // step: set value
  async set(key: string, value: any, ttl?: number) {
    if (ttl) {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  // step: get value
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  //step: get or set
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached) {
      return cached;
    }

    const data = await callback();

    await this.set(key, data, ttl);

    return data;
  }

  // step: delete value
  async del(key: string) {
    await this.client.del(key);
  }

  // step: incr
  async incr(key: string, ttl?: number) {
    const value = await this.client.incr(key);
    if (ttl && value === 1) {
      await this.client.expire(key, ttl);
    }
    return value;
  }

  // step: exist key
  async exists(key: string) {
    return await this.client.exists(key);
  }

  // step: get client
  getClient() {
    return this.client;
  }

  // step: close connection
  async onModuleDestroy() {
    await this.client.quit();
  }

  //step: delete key redis invalid cached
  async deletePattern(pattern: string) {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
  async deletePatternCached(key: string) {
    await this.deletePattern(`${key}:*`);
    console.log(`delete key: ${key} succsessfuly`);
  }
}
