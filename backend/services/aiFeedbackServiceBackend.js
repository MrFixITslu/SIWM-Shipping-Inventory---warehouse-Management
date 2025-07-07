// backend/services/aiFeedbackServiceBackend.js
const { getPool } = require('../config/db');

const saveAIFeedback = async (feedbackData, userId) => {
  const pool = getPool();
  const { suggestion_id, page, rating, comment } = feedbackData;
  const res = await pool.query(
    'INSERT INTO ai_feedback (user_id, suggestion_id, page, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, suggestion_id, page, rating, comment]
  );
  console.log('AI Feedback Received and Stored in DB:', res.rows[0]);
  return { ...res.rows[0] }; // Return a copy
};

const getAllAIFeedback = async () => {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM ai_feedback ORDER BY timestamp DESC');
  return res.rows.map(f => ({...f}));
};

module.exports = { saveAIFeedback, getAllAIFeedback };