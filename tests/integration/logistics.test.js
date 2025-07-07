const request = require('supertest');
const { app } = require('../../backend/server');
const { getPool } = require('../../backend/config/db');

describe('Logistics Optimization API', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create test user and get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@vision79.com',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    const pool = getPool();
    await pool.query('DELETE FROM users WHERE email = $1', ['test@vision79.com']);
    await pool.end();
  });

  describe('POST /api/v1/logistics/optimize-shipping-route', () => {
    it('should optimize shipping route with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/optimize-shipping-route')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          constraints: {
            maxCost: 5000,
            timeLimit: '48h',
            preferredCarrier: 'FedEx'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimalRoute');
      expect(response.body.data).toHaveProperty('alternativeRoutes');
      expect(response.body.data).toHaveProperty('costSavings');
      expect(response.body.data).toHaveProperty('timeSavings');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    it('should return 400 for missing origin', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/optimize-shipping-route')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destination: 'Los Angeles, CA',
          constraints: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Origin and destination are required');
    });

    it('should return 400 for missing destination', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/optimize-shipping-route')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'New York, NY',
          constraints: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Origin and destination are required');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/optimize-shipping-route')
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          constraints: {}
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/logistics/forecast-inventory', () => {
    it('should forecast inventory with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/forecast-inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          historicalData: {
            monthly_sales: [100, 120, 90, 150, 130, 140],
            seasonal_factors: [1.2, 1.1, 0.9, 1.3, 1.0, 1.1]
          },
          currentStock: {
            item_A: 50,
            item_B: 30,
            item_C: 75
          },
          leadTimes: {
            item_A: 7,
            item_B: 14,
            item_C: 3
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('forecast');
      expect(response.body.data).toHaveProperty('reorderPoints');
      expect(response.body.data).toHaveProperty('riskItems');
      expect(response.body.data).toHaveProperty('optimizationSuggestions');
    });

    it('should return 400 for missing historical data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/forecast-inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentStock: { item_A: 50 },
          leadTimes: { item_A: 7 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Historical data and current stock are required');
    });

    it('should return 400 for missing current stock', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/forecast-inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          historicalData: { monthly_sales: [100, 120, 90] },
          leadTimes: { item_A: 7 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Historical data and current stock are required');
    });
  });

  describe('POST /api/v1/logistics/analyze-supplier-performance', () => {
    it('should analyze supplier performance with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/analyze-supplier-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierData: {
            name: 'Supplier A',
            rating: 4.2,
            delivery_time: 5,
            quality_score: 0.95
          },
          orderHistory: [
            {
              order_id: '123',
              delivery_date: '2024-01-15',
              on_time: true,
              quality: 'excellent'
            },
            {
              order_id: '124',
              delivery_date: '2024-01-20',
              on_time: false,
              quality: 'good'
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('performanceScore');
      expect(response.body.data).toHaveProperty('onTimeDelivery');
      expect(response.body.data).toHaveProperty('qualityRating');
      expect(response.body.data).toHaveProperty('costEffectiveness');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('riskAssessment');
    });

    it('should return 400 for missing supplier data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/analyze-supplier-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderHistory: [{ order_id: '123', delivery_date: '2024-01-15' }]
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Supplier data and order history are required');
    });

    it('should return 400 for missing order history', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/analyze-supplier-performance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierData: { name: 'Supplier A', rating: 4.2 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Supplier data and order history are required');
    });
  });

  describe('POST /api/v1/logistics/optimize-warehouse-layout', () => {
    it('should optimize warehouse layout with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/optimize-warehouse-layout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentLayout: {
            zones: [
              {
                name: 'Zone A',
                items: ['item1', 'item2'],
                pick_time: 2.5
              }
            ]
          },
          inventoryData: {
            item1: { quantity: 100, size: 'small', frequency: 'high' },
            item2: { quantity: 50, size: 'medium', frequency: 'medium' }
          },
          orderPatterns: {
            peak_hours: [9, 10, 11],
            popular_combinations: [['item1', 'item2']]
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('optimizedLayout');
      expect(response.body.data).toHaveProperty('efficiencyImprovements');
      expect(response.body.data).toHaveProperty('spaceUtilization');
      expect(response.body.data).toHaveProperty('pickPathOptimization');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    it('should return 400 for missing current layout', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/optimize-warehouse-layout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          inventoryData: { item1: { quantity: 100 } },
          orderPatterns: { peak_hours: [9, 10, 11] }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Current layout and inventory data are required');
    });

    it('should return 400 for missing inventory data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/optimize-warehouse-layout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentLayout: { zones: [] },
          orderPatterns: { peak_hours: [9, 10, 11] }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Current layout and inventory data are required');
    });
  });

  describe('POST /api/v1/logistics/generate-procurement-insights', () => {
    it('should generate procurement insights with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/generate-procurement-insights')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          procurementData: {
            spend: 50000,
            suppliers: ['A', 'B', 'C'],
            categories: ['electronics', 'office']
          },
          marketTrends: {
            inflation_rate: 0.03,
            supply_chain_issues: ['electronics'],
            commodity_prices: { steel: 'up' }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('costAnalysis');
      expect(response.body.data).toHaveProperty('supplierRecommendations');
      expect(response.body.data).toHaveProperty('negotiationPoints');
      expect(response.body.data).toHaveProperty('riskMitigation');
      expect(response.body.data).toHaveProperty('marketOpportunities');
    });

    it('should return 400 for missing procurement data', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/generate-procurement-insights')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          marketTrends: { inflation_rate: 0.03 }
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Procurement data is required');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on logistics endpoints', async () => {
      const requests = Array(11).fill().map(() =>
        request(app)
          .post('/api/v1/logistics/optimize-shipping-route')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            origin: 'New York, NY',
            destination: 'Los Angeles, CA',
            constraints: {}
          })
      );

      const responses = await Promise.all(requests);
      const successfulRequests = responses.filter(r => r.status === 200);
      const rateLimitedRequests = responses.filter(r => r.status === 429);

      expect(successfulRequests.length).toBeLessThanOrEqual(10);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service unavailability gracefully', async () => {
      // Mock AI service to be unavailable
      const originalGeminiService = require('../../backend/services/geminiServiceBackend');
      jest.spyOn(originalGeminiService, 'optimizeShippingRoute').mockRejectedValue(
        new Error('AI service not available')
      );

      const response = await request(app)
        .post('/api/v1/logistics/optimize-shipping-route')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          constraints: {}
        });

      expect(response.status).toBe(503);
      expect(response.body.message).toContain('AI service not available');

      // Restore original service
      jest.restoreAllMocks();
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/logistics/forecast-inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          historicalData: 'invalid json',
          currentStock: { item_A: 50 },
          leadTimes: { item_A: 7 }
        });

      expect(response.status).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/logistics/optimize-shipping-route')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          constraints: {}
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // 10 seconds max
    });
  });
}); 