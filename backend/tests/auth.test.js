const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Mock pg.Pool for Jest
jest.mock('pg', () => {
  const mPool = { connect: jest.fn(), query: jest.fn(), end: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
};

// Import the app after mocking
const { app } = require('../server-test');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Requester'
      };

      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // User doesn't exist
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            name: userData.name, 
            email: userData.email, 
            role: userData.role,
            permissions: []
          }] 
        }); // User created

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('token');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
      expect(response.body.role).toBe(userData.role);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test User' })
        .expect(400);

      expect(response.body.message).toContain('Please add all fields');
    });

    it('should return 400 if user already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      mockPool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: userData.email }] 
      }); // User exists

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const hashedPassword = await bcrypt.hash(loginData.password, 10);

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Test User',
          email: loginData.email,
          password: hashedPassword,
          role: 'Requester',
          permissions: []
        }]
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe(loginData.email);
    });

    it('should return 401 with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          name: 'Test User',
          email: loginData.email,
          password: hashedPassword,
          role: 'Requester',
          permissions: []
        }]
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.message).toContain('Please provide email and password');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const user = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'Requester',
        permissions: []
      };

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

      mockPool.query.mockResolvedValueOnce({
        rows: [user]
      });

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body._id).toBe(user.id);
      expect(response.body.name).toBe(user.name);
      expect(response.body.email).toBe(user.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, no token');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Not authorized, token failed');
    });
  });
}); 