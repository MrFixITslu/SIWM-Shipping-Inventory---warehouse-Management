# AI Quota Handling Improvements

## Overview

This document describes the comprehensive improvements made to handle Gemini API quota exceeded errors gracefully in the Vision79 SIWM application.

## Problem

The application was experiencing frequent 429 (Quota Exceeded) errors from the Gemini API, causing:
- Failed AI predictions on the dashboard
- Poor user experience with error messages
- No fallback functionality when AI was unavailable

## Solution

### 1. Enhanced Error Handling

#### Backend Improvements
- **Rate Limiting**: Implemented in-memory rate limiting to prevent excessive API calls
- **Retry Logic**: Added exponential backoff retry mechanism for quota errors
- **Fallback Data**: Created fallback prediction algorithms when AI is unavailable
- **Error Classification**: Proper detection and handling of different error types

#### Frontend Improvements
- **Graceful Degradation**: Better error messages and user feedback
- **Fallback Indicators**: Clear indication when using fallback data
- **Retry Mechanisms**: Automatic retry with user feedback

### 2. Configuration Management

Created `backend/config/aiConfig.js` to centralize:
- Rate limiting settings
- Retry configuration
- Error messages
- Feature flags
- Environment-specific overrides

### 3. Rate Limiting Implementation

#### Middleware (`backend/middleware/rateLimitMiddleware.js`)
- Per-IP rate limiting
- Configurable windows and limits
- Automatic cleanup of old entries
- Proper HTTP headers for client information

#### Service-Level Rate Limiting (`backend/services/geminiServiceBackend.js`)
- Request tracking and throttling
- Exponential backoff for retries
- Quota error detection and handling

### 4. Fallback Data Generation

When AI quota is exceeded, the system now provides:
- **Stock Forecasts**: Based on reorder points and current inventory
- **ASN Predictions**: Generic delay warnings
- **Route Optimization**: Basic grouping suggestions

## Configuration

### Rate Limits
```javascript
// Development
requestsPerMinute: 30
requestsPerDay: 2000

// Production  
requestsPerMinute: 10
requestsPerDay: 1000
```

### Retry Configuration
```javascript
retryDelayMs: 5000        // Base delay
maxRetries: 3             // Maximum retry attempts
backoffMultiplier: 2      // Exponential backoff
```

## Usage

### Backend Routes
All AI endpoints now include rate limiting:
```javascript
router.get('/stock-forecast', aiRateLimit, getStockOutForecast);
router.post('/asn-delay-prediction', aiRateLimit, getAsnDelayPrediction);
router.post('/route-optimization', aiRateLimit, getRouteOptimizationSuggestion);
```

### Frontend Integration
The frontend automatically handles quota errors and displays appropriate messages:
- Shows fallback data when available
- Indicates when using fallback vs. AI predictions
- Provides clear error messages for users

## Error Messages

### Quota Exceeded
- Backend: "AI service quota exceeded. Please try again later or upgrade your API plan."
- Frontend: "AI insights temporarily unavailable due to API quota limits. Fallback data is being used."

### Rate Limit Exceeded
- "Rate limit exceeded. Please wait before making more requests."

### Service Unavailable
- "AI service temporarily unavailable. Using fallback data."

## Testing

Run the test script to verify rate limiting:
```bash
cd backend
node test-ai-rate-limiting.js
```

## Monitoring

The system logs:
- Quota exceeded events
- Retry attempts with delays
- Fallback data usage
- Rate limit violations

## Future Improvements

1. **Redis Integration**: Replace in-memory rate limiting with Redis for production
2. **Advanced Fallbacks**: Implement more sophisticated fallback algorithms
3. **Quota Monitoring**: Add dashboard for API usage monitoring
4. **Circuit Breaker**: Implement circuit breaker pattern for API failures
5. **Caching**: Cache AI responses to reduce API calls

## Files Modified

### Backend
- `backend/services/geminiServiceBackend.js` - Enhanced error handling and retry logic
- `backend/controllers/aiInsightController.js` - Added fallback data generation
- `backend/middleware/rateLimitMiddleware.js` - New rate limiting middleware
- `backend/routes/aiInsightRoutes.js` - Applied rate limiting to routes
- `backend/config/aiConfig.js` - New configuration management

### Frontend
- `src/services/aiInsightService.ts` - Improved error handling
- `src/pages/DashboardPage.tsx` - Better user feedback and fallback indicators

### Testing
- `backend/test-ai-rate-limiting.js` - Rate limiting test script

## Benefits

1. **Improved User Experience**: No more broken AI features due to quota limits
2. **Reduced API Costs**: Rate limiting prevents excessive API calls
3. **Better Reliability**: Fallback data ensures functionality even when AI is unavailable
4. **Clear Feedback**: Users understand when fallback data is being used
5. **Scalable**: Configuration can be adjusted for different environments 