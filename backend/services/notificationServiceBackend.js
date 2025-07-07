

// backend/services/notificationServiceBackend.js
const { getPool } = require('../config/db');
const { mapToCamel, mapToSnake } = require('../utils/dbMappers');

const getAlertsForUser = async (userId) => {
  const pool = getPool();
  // Fetch alerts for this user OR system-wide alerts (user_id IS NULL)
  const res = await pool.query(
    'SELECT * FROM alert_log WHERE user_id = $1 OR user_id IS NULL ORDER BY timestamp DESC',
    [userId]
  );
  return mapToCamel(res.rows);
};

const markAlertAsReadForUser = async (userId, alertIdParam) => {
  const pool = getPool();
  const alertId = parseInt(alertIdParam, 10);
  if(isNaN(alertId)) throw new Error('Invalid Alert ID for marking as read');

  // Ensure user can only mark their own alerts or system alerts as read FOR THEM (more complex for system alerts)
  // Simple version: just mark it read.
  const res = await pool.query(
    'UPDATE alert_log SET is_read = TRUE WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) RETURNING id',
    [alertId, userId]
  );
  return res.rowCount > 0;
};

const markAllAlertsAsReadForUser = async (userId) => {
  const pool = getPool();
  // Only mark unread alerts for this user or system alerts as read for this user
  // This is simplified. True "mark all as read for user" for system alerts might involve a separate user_alert_status table.
  await pool.query(
    'UPDATE alert_log SET is_read = TRUE WHERE (user_id = $1 OR user_id IS NULL) AND is_read = FALSE',
    [userId]
  );
  return true;
};

const addSystemAlert = async (alertData) => { // Expects camelCase
  const pool = getPool();
  const dbData = mapToSnake(alertData);
  const { severity, message, type, details_link, user_id = null } = dbData; // user_id can be null for system-wide
  const res = await pool.query(
    'INSERT INTO alert_log (severity, message, type, details_link, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [severity, message, type, details_link, user_id]
  );
  console.log("System Alert Added to DB:", res.rows[0]);
  return mapToCamel(res.rows[0]);
};

const getUserPreferences = async (userId) => {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM user_alert_preferences WHERE user_id = $1', [userId]);
  return mapToCamel(res.rows);
};

const saveUserPreferences = async (userId, preferences) => { // Expects camelCase preferences
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Simple approach: delete existing and insert new for the user
    await client.query('DELETE FROM user_alert_preferences WHERE user_id = $1', [userId]);
    for (const pref of preferences) {
      const dbPref = mapToSnake(pref);
      await client.query(
        'INSERT INTO user_alert_preferences (user_id, alert_type, channels, enabled) VALUES ($1, $2, $3, $4)',
        [userId, dbPref.alert_type, dbPref.channels, dbPref.enabled]
      );
    }
    await client.query('COMMIT');
    console.log(`Alert preferences saved for user ${userId}`);
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`Error saving alert preferences for user ${userId}:`, e);
    throw e;
  } finally {
    client.release();
  }
};

const getScheduledSubscriptions = async (userId) => {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM scheduled_report_subscriptions WHERE user_id = $1', [userId]);
  return mapToCamel(res.rows);
};

const saveScheduledSubscriptions = async (userId, subscriptions) => { // Expects camelCase subscriptions
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM scheduled_report_subscriptions WHERE user_id = $1', [userId]);
    for (const sub of subscriptions) {
      const dbSub = mapToSnake(sub);
      await client.query(
        'INSERT INTO scheduled_report_subscriptions (user_id, report_id, report_name, frequency, channels, enabled) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, dbSub.report_id, dbSub.report_name, dbSub.frequency, dbSub.channels, dbSub.enabled]
      );
    }
    await client.query('COMMIT');
    console.log(`Scheduled reports subscriptions saved for user ${userId}`);
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`Error saving scheduled reports for user ${userId}:`, e);
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  getAlertsForUser,
  markAlertAsReadForUser,
  markAllAlertsAsReadForUser,
  addSystemAlert,
  getUserPreferences,
  saveUserPreferences,
  getScheduledSubscriptions,
  saveScheduledSubscriptions,
};
