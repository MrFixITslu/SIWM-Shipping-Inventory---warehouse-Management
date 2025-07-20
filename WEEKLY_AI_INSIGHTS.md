# Weekly AI Insights System

## Overview

The Weekly AI Insights system generates comprehensive AI-powered insights every Monday at 9:00 AM, reducing API calls and providing consistent, scheduled analysis for the Vision79 SIWM application.

## Features

### 🕒 **Scheduled Generation**
- **Automatic**: Runs every Monday at 9:00 AM UTC
- **Multiple Timezones**: Also runs at 9:00 AM EST (UTC-5) and PST (UTC-8)
- **Background Processing**: Non-blocking generation with status tracking
- **Cache Management**: 7-day cache with automatic expiration

### 📊 **Insight Types**
1. **Stock Forecasts**: AI-powered stock-out predictions
2. **Low Stock Alerts**: Items below reorder point
3. **Category Analysis**: Inventory distribution by category
4. **Trend Analysis**: Weekly inventory movement patterns

### 🔧 **Management Features**
- **Manual Trigger**: Force generation on demand
- **Status Monitoring**: Real-time service status
- **Cache Control**: Automatic cleanup and expiration
- **Error Handling**: Graceful fallback when AI is unavailable

## Architecture

### Backend Components

#### 1. Scheduled Service (`backend/services/scheduledAiService.js`)
```javascript
// Core scheduling and generation logic
- init() // Initialize cron jobs
- generateWeeklyInsights() // Main generation function
- getCachedInsights() // Retrieve cached data
- forceGenerate() // Manual trigger
- getStatus() // Service status
```

#### 2. Controller (`backend/controllers/scheduledAiController.js`)
```javascript
// API endpoints for frontend consumption
- getWeeklyInsights() // Get full insights
- getInsightsSummary() // Dashboard summary
- getServiceStatus() // Service status
- forceGenerateInsights() // Manual generation
```

#### 3. Routes (`backend/routes/scheduledAiRoutes.js`)
```
GET  /api/v1/scheduled-ai/weekly-insights
GET  /api/v1/scheduled-ai/insights-summary
GET  /api/v1/scheduled-ai/status
POST /api/v1/scheduled-ai/force-generate
```

### Frontend Components

#### 1. Service (`src/services/scheduledAiService.ts`)
```typescript
// Frontend service for consuming insights
- getWeeklyInsights() // Full insights
- getInsightsSummary() // Dashboard data
- getServiceStatus() // Status check
- forceGenerateInsights() // Manual trigger
```

#### 2. Dashboard Integration (`src/pages/DashboardPage.tsx`)
- Displays weekly insights instead of real-time generation
- Shows next update time
- Handles missing insights gracefully

## Configuration

### Environment Variables
```bash
# Optional: Disable rate limiting for debugging
DISABLE_AI_RATE_LIMIT=true

# AI service configuration
GEMINI_API_KEY=your_api_key_here
```

### Schedule Configuration
```javascript
// Default schedule (every Monday at 9:00 AM UTC)
'0 9 * * 1' // Cron expression

// Multiple timezone support
'0 14 * * 1' // 9:00 AM EST
'0 17 * * 1' // 9:00 AM PST
```

## Usage

### 1. Installation
```bash
# Install dependencies
cd backend
npm install node-cron

# Start the server
npm start
```

### 2. Testing
```bash
# Test the scheduled service
cd backend
node test-scheduled-ai.js

# Test rate limiting
node test-ai-rate-limiting.js
```

### 3. Manual Generation
```bash
# Via API
curl -X POST http://localhost:4000/api/v1/scheduled-ai/force-generate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Via frontend
// Use scheduledAiService.forceGenerateInsights()
```

### 4. Monitoring
```bash
# Check service status
curl http://localhost:4000/api/v1/scheduled-ai/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get insights summary
curl http://localhost:4000/api/v1/scheduled-ai/insights-summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Reference

### Get Weekly Insights
```http
GET /api/v1/scheduled-ai/weekly-insights
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "stockForecast": [...],
    "additionalInsights": [...],
    "generatedAt": "2024-01-15T09:00:00.000Z",
    "expiresAt": "2024-01-22T09:00:00.000Z"
  }
}
```

### Get Insights Summary
```http
GET /api/v1/scheduled-ai/insights-summary
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "stockForecasts": [...],
    "additionalInsights": [...],
    "summary": {
      "totalForecasts": 5,
      "criticalAlerts": 2,
      "lastUpdated": "2024-01-15T09:00:00.000Z",
      "nextUpdate": "2024-01-22T09:00:00.000Z"
    }
  }
}
```

### Get Service Status
```http
GET /api/v1/scheduled-ai/status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "status": {
    "isRunning": false,
    "lastRun": "2024-01-15T09:00:00.000Z",
    "nextRun": "2024-01-22T09:00:00.000Z",
    "hasCachedData": true,
    "cacheSize": 1,
    "hasInsights": true,
    "insightsAge": 2
  }
}
```

## Data Models

### WeeklyInsights
```typescript
interface WeeklyInsights {
  stockForecast: StockOutRiskForecastItem[];
  additionalInsights: AdditionalInsight[];
  generatedAt: string;
  expiresAt: string;
}
```

### StockOutRiskForecastItem
```typescript
interface StockOutRiskForecastItem {
  sku: string;
  itemName: string;
  currentStock: number;
  predictedStockOutDays: number;
  confidence: number;
  recommendedReorderQty: number;
  isFallback?: boolean;
}
```

### AdditionalInsight
```typescript
interface AdditionalInsight {
  type: 'lowStock' | 'categoryAnalysis' | 'trendAnalysis';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  data?: any;
  items?: Array<{
    name: string;
    sku: string;
    current: number;
    reorderPoint: number;
  }>;
}
```

## Benefits

### 🚀 **Performance**
- **Reduced API Calls**: Only one generation per week vs. real-time
- **Faster Dashboard**: Cached insights load instantly
- **Lower Costs**: Minimal Gemini API usage

### 🔒 **Reliability**
- **Consistent Availability**: Insights always available (cached)
- **Graceful Degradation**: Fallback data when AI is unavailable
- **Error Recovery**: Automatic retry and fallback mechanisms

### 📈 **User Experience**
- **Predictable Updates**: Users know when insights refresh
- **No Loading Delays**: Instant access to cached insights
- **Clear Status**: Shows next update time and data freshness

### 💰 **Cost Optimization**
- **Scheduled Usage**: Controlled API consumption
- **Efficient Caching**: 7-day cache reduces redundant calls
- **Rate Limiting**: Prevents quota exceeded errors

## Monitoring & Maintenance

### Logs to Monitor
```bash
# Service initialization
[ScheduledAiService] Initializing weekly AI insights generation...
[ScheduledAiService] Weekly AI insights scheduled for every Monday at 9:00 AM

# Generation process
[ScheduledAiService] Starting weekly AI insights generation...
[ScheduledAiService] Weekly insights generated successfully in 2500ms

# Cache management
[ScheduledAiService] Cache expired, clearing...
```

### Health Checks
```bash
# Check if service is running
curl http://localhost:4000/api/v1/scheduled-ai/status

# Verify insights are available
curl http://localhost:4000/api/v1/scheduled-ai/insights-summary
```

### Troubleshooting

#### No Insights Available
1. Check if service is initialized
2. Verify cron jobs are running
3. Check for AI service errors
4. Force generate insights manually

#### Stale Data
1. Check cache expiration
2. Verify last generation time
3. Force refresh if needed

#### Generation Failures
1. Check AI service quota
2. Verify database connectivity
3. Review error logs
4. Check rate limiting

## Future Enhancements

1. **Database Storage**: Store insights in database for persistence
2. **Email Notifications**: Alert when insights are ready
3. **Advanced Scheduling**: Configurable schedules per user
4. **Insight History**: Track insights over time
5. **Custom Insights**: User-defined insight types
6. **Export Features**: Download insights as reports

## Files Modified

### Backend
- `backend/services/scheduledAiService.js` - Core scheduling service
- `backend/controllers/scheduledAiController.js` - API controller
- `backend/routes/scheduledAiRoutes.js` - API routes
- `backend/utils/mockHttp.js` - Testing utilities
- `backend/server.js` - Service initialization
- `backend/package.json` - Added node-cron dependency

### Frontend
- `src/services/scheduledAiService.ts` - Frontend service
- `src/pages/DashboardPage.tsx` - Dashboard integration

### Testing
- `backend/test-scheduled-ai.js` - Service testing
- `backend/test-ai-rate-limiting.js` - Rate limiting tests

### Documentation
- `WEEKLY_AI_INSIGHTS.md` - This documentation
- `AI_QUOTA_HANDLING.md` - Related quota handling docs 