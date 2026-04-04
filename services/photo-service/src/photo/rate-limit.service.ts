import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type Bucket = {
  count: number;
  startedAt: number;
};

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  assertWithinLimit(key: string, maxRequests: number, windowMs: number) {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || now - current.startedAt >= windowMs) {
      this.buckets.set(key, { count: 1, startedAt: now });
      return;
    }

    if (current.count >= maxRequests) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    this.buckets.set(key, current);
  }
}
