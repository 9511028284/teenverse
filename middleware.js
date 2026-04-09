import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 1. Initialize Redis (Automatically handles both Vercel naming conventions)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

// 2. 🛡️ STRICT LIMITER: For sensitive routes (Login, Signup, OTP)
// Allows exactly 5 requests per 1 minute window.
const strictRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true, 
});

// 3. 🛡️ STANDARD LIMITER: For general app usage (Feed, Profiles, etc.)
// Allows 30 requests per 10 seconds.
const standardRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(30, '10 s'),
  analytics: false,
});

export async function middleware(request) {
  // Grab the user's IP Address from Vercel's Edge headers
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const path = request.nextUrl.pathname;

  // --- STRICT ZONE ---
  // Apply to your Auth and OTP endpoints
  if (path.startsWith('/api/auth') || path.startsWith('/api/send-otp') || path.startsWith('/supabase')) {
    const { success, limit, reset, remaining } = await strictRatelimit.limit(`strict_${ip}`);
    
    if (!success) {
      console.warn(`[SHIELD ACTIVE] Blocked IP: ${ip} from hammering Auth endpoint.`);
      return new NextResponse(
        JSON.stringify({ 
            error: "Security limit reached. Please wait 60 seconds before trying again." 
        }),
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
  // Apply to all other API requests to prevent general scraping/DDoS
  else if (path.startsWith('/api/')) {
    const { success, limit, reset, remaining } = await standardRatelimit.limit(`standard_${ip}`);
    
    if (!success) {
      return new NextResponse(
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

  // If the user passes the checks, let them through to the backend!
  return NextResponse.next();
}

// 4. Configure Middleware matching paths
// This ensures Vercel ONLY runs this script for API calls, saving your free tier limits!
export const config = {
  matcher: '/api/:path*',
};