// backend/middleware/rateLimitMiddleware.js

// Simple in-memory rate limiter for AI endpoints
const rateLimitStore = new Map();

const rateLimitMiddleware = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute
        maxRequests = 10,     // max requests per window
        message = 'Too many requests, please try again later.',
        statusCode = 429
    } = options;

    return (req, res, next) => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        
        console.log(`[RateLimit] Request from ${key} at ${new Date(now).toISOString()}`);
        
        if (!rateLimitStore.has(key)) {
            rateLimitStore.set(key, {
                requests: [],
                resetTime: now + windowMs
            });
            console.log(`[RateLimit] Created new entry for ${key}`);
        }
        
        const userData = rateLimitStore.get(key);
        
        // Reset if window has passed
        if (now > userData.resetTime) {
            userData.requests = [];
            userData.resetTime = now + windowMs;
            console.log(`[RateLimit] Reset window for ${key}`);
        }
        
        // Remove old requests outside the window
        const oldCount = userData.requests.length;
        userData.requests = userData.requests.filter(time => now - time < windowMs);
        if (oldCount !== userData.requests.length) {
            console.log(`[RateLimit] Cleaned up ${oldCount - userData.requests.length} old requests for ${key}`);
        }
        
        console.log(`[RateLimit] ${key} has ${userData.requests.length}/${maxRequests} requests in current window`);
        
        // Check if limit exceeded
        if (userData.requests.length >= maxRequests) {
            const retryAfter = Math.ceil((userData.resetTime - now) / 1000);
            console.log(`[RateLimit] Rate limit exceeded for ${key}. Retry after ${retryAfter}s`);
            return res.status(statusCode).json({
                error: {
                    message,
                    retryAfter,
                    limit: maxRequests,
                    windowMs
                }
            });
        }
        
        // Add current request
        userData.requests.push(now);
        console.log(`[RateLimit] Request allowed for ${key}. Remaining: ${maxRequests - userData.requests.length}`);
        
        // Add headers for client information
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': maxRequests - userData.requests.length,
            'X-RateLimit-Reset': userData.resetTime
        });
        
        next();
    };
};

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, data] of rateLimitStore.entries()) {
        if (now > data.resetTime + 5 * 60 * 1000) { // 5 minutes after reset
            rateLimitStore.delete(key);
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        console.log(`[RateLimit] Cleaned up ${cleanedCount} old entries`);
    }
}, 5 * 60 * 1000);

module.exports = rateLimitMiddleware; 