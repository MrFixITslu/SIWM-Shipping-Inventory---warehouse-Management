// Simplified server for testing purposes
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test routes for authentication
app.post('/api/v1/auth/register', (req, res) => {
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/v1/auth/login', (req, res) => {
  res.status(200).json({ token: 'test-token' });
});

app.get('/api/v1/auth/profile', (req, res) => {
  res.status(200).json({ user: { id: 1, name: 'Test User' } });
});

// Export app for testing
module.exports = { app };
