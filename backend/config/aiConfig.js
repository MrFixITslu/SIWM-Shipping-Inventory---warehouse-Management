// backend/config/aiConfig.js

const AI_CONFIG = {
    // Gemini API settings
    gemini: {
        model: "gemini-1.5-pro-latest",
        maxTokens: 4096,
        temperature: 0.7,
        maxRetries: 3,
        retryDelayMs: 5000,
    },
    
    // Rate limiting settings
    rateLimits: {
        // Per-minute limits
        requestsPerMinute: 15,
        // Per-day limits (approximate)
        requestsPerDay: 1500,
        // Retry configuration
        retryDelayMs: 5000,
        maxRetries: 3,
        // Exponential backoff multiplier
        backoffMultiplier: 2,
    },
    
    // Fallback settings
    fallback: {
        enabled: true,
        confidenceThreshold: 0.7,
        maxFallbackItems: 5,
    },
    
    // Error messages
    messages: {
        quotaExceeded: "AI service quota exceeded. Please try again later or upgrade your API plan.",
        rateLimitExceeded: "Rate limit exceeded. Please wait before making more requests.",
        serviceUnavailable: "AI service temporarily unavailable. Using fallback data.",
        fallbackActive: "Using fallback predictions while AI quota resets.",
    },
    
    // Feature flags
    features: {
        stockForecast: true,
        asnDelayPrediction: true,
        routeOptimization: true,
        pdfExtraction: true,
    }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
    AI_CONFIG.rateLimits.requestsPerMinute = 10; // More conservative in production
    AI_CONFIG.rateLimits.requestsPerDay = 1000;
}

if (process.env.NODE_ENV === 'development') {
    AI_CONFIG.rateLimits.requestsPerMinute = 30; // More lenient in development
    AI_CONFIG.rateLimits.requestsPerDay = 2000;
}

// Debug mode - disable rate limiting if needed
if (process.env.DISABLE_AI_RATE_LIMIT === 'true') {
    console.log('[AI Config] Rate limiting disabled for debugging');
    AI_CONFIG.rateLimits.requestsPerMinute = 999999; // Effectively disable
}

module.exports = AI_CONFIG; 