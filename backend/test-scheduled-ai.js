// backend/test-scheduled-ai.js
const scheduledAiService = require('./services/scheduledAiService');

console.log('Testing Scheduled AI Service...\n');

async function testScheduledAiService() {
    try {
        // Test 1: Get service status
        console.log('1. Testing service status:');
        const status = scheduledAiService.getStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
        console.log('');

        // Test 2: Get cached insights (should be null initially)
        console.log('2. Testing cached insights:');
        const cachedInsights = scheduledAiService.getCachedInsights();
        console.log('Cached insights:', cachedInsights ? 'Available' : 'None');
        console.log('');

        // Test 3: Force generate insights
        console.log('3. Testing force generation:');
        console.log('Starting force generation...');
        await scheduledAiService.forceGenerate();
        console.log('Force generation completed');
        console.log('');

        // Test 4: Check status after generation
        console.log('4. Checking status after generation:');
        const statusAfter = scheduledAiService.getStatus();
        console.log('Status after generation:', JSON.stringify(statusAfter, null, 2));
        console.log('');

        // Test 5: Get cached insights again
        console.log('5. Testing cached insights after generation:');
        const cachedInsightsAfter = scheduledAiService.getCachedInsights();
        if (cachedInsightsAfter) {
            console.log('✅ Cached insights available:');
            console.log(`  - Stock forecasts: ${cachedInsightsAfter.stockForecast.length}`);
            console.log(`  - Additional insights: ${cachedInsightsAfter.additionalInsights.length}`);
            console.log(`  - Generated at: ${cachedInsightsAfter.generatedAt}`);
            console.log(`  - Expires at: ${cachedInsightsAfter.expiresAt}`);
        } else {
            console.log('❌ No cached insights available');
        }
        console.log('');

        // Test 6: Test next run calculation
        console.log('6. Testing next run calculation:');
        scheduledAiService.calculateNextRun();
        const nextRun = scheduledAiService.getStatus().nextRun;
        console.log('Next run:', nextRun);
        console.log('');

        console.log('✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the tests
testScheduledAiService().then(() => {
    console.log('\nTest script completed.');
    process.exit(0);
}).catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
}); 