import { NextRequest } from 'next/server'

// Simple in-memory rate limiting (for production, use Redis)
const attempts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  request: NextRequest,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  
  // Clean up expired entries
  for (const [key, value] of attempts.entries()) {
    if (now > value.resetTime) {
      attempts.delete(key)
    }
  }
  
  const current = attempts.get(ip)
  
  if (!current || now > current.resetTime) {
    // First attempt or window expired
    const resetTime = now + windowMs
    attempts.set(ip, { count: 1, resetTime })
    return { allowed: true, remaining: maxAttempts - 1, resetTime }
  }
  
  if (current.count >= maxAttempts) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  // Increment counter
  current.count++
  attempts.set(ip, current)
  
  return { 
    allowed: true, 
    remaining: maxAttempts - current.count, 
    resetTime: current.resetTime 
  }
}