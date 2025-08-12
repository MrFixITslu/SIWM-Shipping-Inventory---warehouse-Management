// Backend test setup for PostgreSQL
// Note: Tests require a real PostgreSQL database or mocked database for now
// In production, consider using pg-mem or similar for in-memory PostgreSQL testing

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_vision79_siwm';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_SECURE = 'false';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASSWORD = 'test-password';
process.env.PORT = '3001'; // Use different port for tests

// Mock the Gemini AI service to prevent external API calls during testing
jest.mock('../services/geminiServiceBackend', () => ({
  generateChatResponse: jest.fn().mockResolvedValue({
    success: true,
    response: 'Mocked AI response for testing'
  }),
  generateAIInsight: jest.fn().mockResolvedValue({
    success: true,
    insight: 'Mocked AI insight for testing'
  })
}));

// Mock database connection for tests that don't need real DB
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
  getPool: jest.fn().mockReturnValue({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
  })
}));

// Mock the email service to prevent SMTP authentication during testing
jest.mock('../services/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendNotificationEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Mock node-cron to prevent scheduled tasks during testing
jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

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