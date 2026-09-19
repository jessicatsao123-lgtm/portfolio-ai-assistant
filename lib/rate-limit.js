// In-memory rate limiter. Resets on cold start and isn't shared across
// serverless instances, so it's a backstop against scripted abuse rather
// than a hard guarantee — but the real risk here is a free Groq API key
// getting hammered by a script, and this stops that cheaply with no new
// infra (Upstash/Vercel KV) required for a template project like this.

const buckets = new Map();

function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

module.exports = { checkRateLimit, getClientIp };
