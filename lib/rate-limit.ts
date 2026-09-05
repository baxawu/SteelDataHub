/**
 * Rate limiter đơn giản, in-memory, theo IP + route key.
 *
 * LƯU Ý QUAN TRỌNG: trên Vercel (serverless), mỗi instance có bộ nhớ riêng nên
 * limiter này KHÔNG chính xác tuyệt đối khi scale nhiều instance. Cho production
 * thật (chống brute-force login, DDoS), nên thay bằng Upstash Redis rate limit
 * (@upstash/ratelimit) hoặc Vercel Firewall / WAF. Ở đây dùng để có 1 lớp bảo vệ
 * cơ bản ngay cả khi chưa setup Redis.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}
