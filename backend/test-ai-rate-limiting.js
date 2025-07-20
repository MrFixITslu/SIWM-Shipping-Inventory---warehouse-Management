// backend/test-ai-rate-limiting.js
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');

// Test rate limiting middleware
console.log('Testing AI Rate Limiting...\n');

const mockReq = {
    ip: '192.168.1.1'
};

const mockRes = {
    status: (code) => ({
        json: (data) => {
            console.log(`Response: ${code} -`, data);
            return mockRes;
        }
    }),
    set: (headers) => {
        console.log('Headers set:', headers);
        return mockRes;
    }
};

const mockNext = () => {
    console.log('Request allowed');
};

// Create rate limiter with 3 requests per minute
const testRateLimit = rateLimitMiddleware({
    windowMs: 60 * 1000,
    maxRequests: 3,
    message: 'Test rate limit exceeded',
    statusCode: 429
});

console.log('Testing normal requests (should allow 3):');
for (let i = 1; i <= 4; i++) {
    console.log(`\nRequest ${i}:`);
    testRateLimit(mockReq, mockRes, mockNext);
}

console.log('\n' + '='.repeat(50));
console.log('Testing with different IP (should reset limits):');
const mockReq2 = { ip: '192.168.1.2' };
for (let i = 1; i <= 3; i++) {
    console.log(`\nRequest ${i} from different IP:`);
    testRateLimit(mockReq2, mockRes, mockNext);
}

console.log('\n' + '='.repeat(50));
console.log('Testing quota exceeded error detection:');

const testErrors = [
    { message: 'You exceeded your current quota, please check your plan and billing details.' },
    { message: 'RESOURCE_EXHAUSTED' },
    { message: '429 Too Many Requests' },
    { message: 'Rate limit exceeded' },
    { message: 'Normal error message' }
];

const { isQuotaExceededError } = require('./services/geminiServiceBackend');

testErrors.forEach((error, index) => {
    const isQuota = isQuotaExceededError(error);
    console.log(`Error ${index + 1}: "${error.message}" -> Quota Error: ${isQuota}`);
});

console.log('\nTest completed!'); 