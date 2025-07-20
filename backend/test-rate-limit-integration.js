// backend/test-rate-limit-integration.js
const express = require('express');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');

// Create a simple test server
const app = express();
app.use(express.json());

// Apply rate limiting
const testRateLimit = rateLimitMiddleware({
    windowMs: 60 * 1000,
    maxRequests: 3,
    message: 'Test rate limit exceeded',
    statusCode: 429
});

// Test endpoint
app.get('/test', testRateLimit, (req, res) => {
    res.json({ message: 'Success', timestamp: new Date().toISOString() });
});

// Start server
const PORT = 4001;
const server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log('Testing rate limiting with 5 requests (should allow 3, block 2)...\n');
    
    // Test the endpoint
    testEndpoint();
});

async function testEndpoint() {
    const baseUrl = `http://localhost:${PORT}`;
    
    for (let i = 1; i <= 5; i++) {
        try {
            console.log(`Request ${i}:`);
            const response = await fetch(`${baseUrl}/test`);
            const data = await response.json();
            
            if (response.ok) {
                console.log(`  ✅ Success: ${data.message}`);
            } else {
                console.log(`  ❌ Failed: ${data.error.message}`);
                if (data.error.retryAfter) {
                    console.log(`  ⏰ Retry after: ${data.error.retryAfter} seconds`);
                }
            }
            
            console.log(`  📊 Status: ${response.status}`);
            console.log(`  📋 Headers:`, {
                'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
                'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
                'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset')
            });
            console.log('');
            
        } catch (error) {
            console.log(`  💥 Error: ${error.message}`);
            console.log('');
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Test completed. Shutting down server...');
    server.close();
    process.exit(0);
} 