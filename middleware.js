import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 1. Initialize Redis using your exact Vercel credentials
const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.VERCEL_OIDC_TOKEN,
});

// 2. 🛡️ STRICT LIMITER: For sensitive routes (Login, Signup, OTP)
const strictRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true, 
});

// 3. 🛡️ STANDARD LIMITER: For general app usage (Feed, Profiles, etc.)
const standardRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(30, '10 s'),
  analytics: false,
});

export default async function middleware(request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
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
  matcher: '/api/:path*',
};