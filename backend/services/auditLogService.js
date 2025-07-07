

const { getPool } = require('../config/db');
const { mapToCamel } = require('../utils/dbMappers');

/**
 * Logs a user management action to the database.
 * @param {number} actingUserId - The ID of the admin performing the action.
 * @param {number} targetUserId - The ID of the user being acted upon.
 * @param {string} action - A description of the action (e.g., 'USER_CREATED', 'STATUS_UPDATED').
 * @param {object} [details={}] - A JSON object containing details of the change (e.g., { from: 'active', to: 'inactive' }).
 */
const logUserAction = async (actingUserId, targetUserId, action, details = {}) => {
  try {
    const pool = getPool();
    await pool.query(
      'INSERT INTO user_audit_log (acting_user_id, target_user_id, action, details) VALUES ($1, $2, $3, $4)',
      [actingUserId, targetUserId, action, details]
    );
  } catch (error) {
    console.error('Failed to log user action:', { actingUserId, targetUserId, action, error });
    // In a production environment, you might want to send this to a more robust logging service.
  }
};

const getAuditLogsForUser = async (targetUserId) => {
  const pool = getPool();
  const res = await pool.query(`
    SELECT 
        al.id, al.action, al.details, al.timestamp,
        au.name as acting_user_name,
        tu.name as target_user_name
    FROM user_audit_log al
    LEFT JOIN users au ON al.acting_user_id = au.id
    LEFT JOIN users tu ON al.target_user_id = tu.id
    WHERE al.target_user_id = $1
    ORDER BY al.timestamp DESC
  `, [targetUserId]);
  return mapToCamel(res.rows);
};


module.exports = { logUserAction, getAuditLogsForUser };