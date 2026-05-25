import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

// 2. 🛡️ STRICT LIMITER: For sensitive routes (Login, Signup, OTP)
const strictRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
    })
  : null;

// 3. 🛡️ STANDARD LIMITER: For general app usage (Feed, Profiles, etc.)
const standardRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '10 s'),
      analytics: false,
    })
  : null;

export default async function middleware(request) {
  if (!redis) {
    console.warn('[SHIELD BYPASS] Missing Upstash Redis REST credentials; middleware rate limit disabled.');
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  const ip = (request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
  const url = new URL(request.url);
  const path = url.pathname;

  // --- STRICT ZONE ---
  if (path.startsWith('/api/auth') || path.startsWith('/api/send-otp') || path.startsWith('/supabase')) {
    const { success, limit, reset, remaining } = await strictRatelimit.limit(`strict_${ip}`);
    
    if (!success) {
      console.warn(`[SHIELD ACTIVE] Blocked IP: ${ip} from hammering Auth endpoint.`);
      return new Response(
        JSON.stringify({ error: "Security limit reached. Please wait 60 seconds before trying again." }),
        { 
            status: 429, 
            headers: { 
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString()
            } 
        }
      );
    }
  }

  // --- STANDARD ZONE ---
  else if (path.startsWith('/api/')) {
    const { success, limit, reset, remaining } = await standardRatelimit.limit(`standard_${ip}`);
    
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Slow down." }),
        { 
            status: 429, 
            headers: { 
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString()
            } 
        }
      );
    }
  }

  return new Response(null, {
    headers: { 'x-middleware-next': '1' }
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
