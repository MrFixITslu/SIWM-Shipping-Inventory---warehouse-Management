// Backend test setup
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_vision79_siwm';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests unless explicitly needed
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});

// Helper function to restore console for specific tests
global.enableConsoleLogs = () => {
  console.log = originalLog;
  console.error = originalError;
};

global.disableConsoleLogs = () => {
  console.log = jest.fn();
  console.error = jest.fn();
}; 