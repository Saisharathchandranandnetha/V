import { headers } from 'next/headers'

type RateLimitStore = Map<string, { count: number; lastReset: number }>

const globalForRateLimit = global as unknown as { rateLimitMap: RateLimitStore }

const rateLimitMap = globalForRateLimit.rateLimitMap || new Map()

if (process.env.NODE_ENV !== 'production') {
    globalForRateLimit.rateLimitMap = rateLimitMap
}

export async function checkRateLimit(limit: number = 5) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1'

    // Config: X requests per 60 seconds
    const windowMs = 60 * 1000

    const now = Date.now()
    const entry = rateLimitMap.get(ip) ?? { count: 0, lastReset: now }

    // Logic to reset window
    if (now - entry.lastReset > windowMs) {
        entry.count = 0
        entry.lastReset = now
    }

    if (entry.count >= limit) {
        return { success: false }
    }

    entry.count++
    rateLimitMap.set(ip, entry)

    return { success: true }
}
