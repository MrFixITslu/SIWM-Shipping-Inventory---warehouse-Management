

const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { mapToCamel, mapToSnake } = require('../utils/dbMappers');
const { logUserAction } = require('./auditLogService');

const findUserByEmail = async (email) => {
  const pool = getPool();
  // IMPORTANT: Also check for active status during login
  const res = await pool.query("SELECT * FROM users WHERE email = $1 AND status = 'active'", [email]);
  // Return the raw DB object with password for password matching
  return res.rows[0] ? { ...res.rows[0] } : null;
};

const findUserById = async (id) => {
  const pool = getPool();
  const userId = parseInt(id, 10); 
  if (isNaN(userId)) {
      throw new Error('Invalid user ID format');
  }
  const res = await pool.query('SELECT id, name, email, role, status, contact_number, created_at, updated_at, permissions FROM users WHERE id = $1', [userId]);
  return mapToCamel(res.rows[0]); // Map to camelCase for application use
};

const getUsers = async (filters = {}) => {
  const pool = getPool();
  let query = 'SELECT id, name, email, role, status, contact_number, created_at, permissions FROM users';
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }
  if (filters.role) {
    conditions.push(`role = $${paramIndex++}`);
    values.push(filters.role);
  }
  if (filters.searchTerm) {
    conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    values.push(`%${filters.searchTerm}%`);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY name ASC';
  
  const res = await pool.query(query, values);
  return mapToCamel(res.rows);
};


const createUser = async (userData, actingAdminId) => { // Expects camelCase
  const { name, email, password, role = 'Requester', contactNumber, permissions = [] } = userData;
  const pool = getPool();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const dbData = mapToSnake({ name, email, password: hashedPassword, role, contactNumber, status: 'active', permissions });

  const res = await pool.query(
    'INSERT INTO users (name, email, password, role, contact_number, status, permissions) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [dbData.name, dbData.email, dbData.password, dbData.role, dbData.contact_number, dbData.status, dbData.permissions]
  );
  
  const newUser = mapToCamel(res.rows[0]);
  
  await logUserAction(actingAdminId, newUser.id, 'USER_CREATED', { email: newUser.email, role: newUser.role });

  // Exclude password from returned object
  delete newUser.password;
  return newUser;
};

const updateUser = async (userId, dataToUpdate, actingAdminId) => {
  const pool = getPool();
  const userToUpdate = await findUserById(userId);
  if (!userToUpdate) throw new Error('User not found');
  if (userToUpdate.id === actingAdminId && dataToUpdate.role === 'admin' && userToUpdate.role !== 'admin') {
      // Allow an admin to edit their own permissions but not self-demote
      if(dataToUpdate.role && dataToUpdate.role !== 'admin') throw new Error("Admins cannot change their own role.");
  }

  const dbData = mapToSnake(dataToUpdate);
  const fields = [];
  const values = [];
  let paramIndex = 1;
  for (const key in dbData) {
      if (Object.hasOwnProperty.call(dbData, key)) {
          fields.push(`${key} = $${paramIndex++}`);
          values.push(dbData[key]);
      }
  }

  if (fields.length === 0) return userToUpdate;

  values.push(userId);
  const queryText = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  
  const res = await pool.query(queryText, values);
  const updatedUser = mapToCamel(res.rows[0]);
  
  // Log specific changes
  if(dataToUpdate.role && dataToUpdate.role !== userToUpdate.role) {
    await logUserAction(actingAdminId, userId, 'GROUP_REASSIGNED', { from: userToUpdate.role, to: dataToUpdate.role });
  }
  if(dataToUpdate.permissions) {
    const oldPerms = new Set(userToUpdate.permissions || []);
    const newPerms = new Set(dataToUpdate.permissions || []);
    const added = [...newPerms].filter(p => !oldPerms.has(p));
    const removed = [...oldPerms].filter(p => !newPerms.has(p));
    if (added.length > 0 || removed.length > 0) {
        await logUserAction(actingAdminId, userId, 'PERMISSIONS_UPDATED', { added, removed });
    }
  }

  delete updatedUser.password;
  return updatedUser;
};

const updateUserStatus = async (userId, status, actingAdminId) => {
  const pool = getPool();
  const userToUpdate = await findUserById(userId);
  if (!userToUpdate) throw new Error('User not found');
  if (userToUpdate.id === actingAdminId) throw new Error('Admins cannot change their own status.');

  const res = await pool.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING *', [status, userId]);
  
  const updatedUser = mapToCamel(res.rows[0]);
  await logUserAction(actingAdminId, updatedUser.id, 'STATUS_UPDATED', { from: userToUpdate.status, to: updatedUser.status });

  delete updatedUser.password;
  return updatedUser;
};

const updateUserGroup = async (userId, newRole, actingAdminId) => {
  const pool = getPool();
  const userToUpdate = await findUserById(userId);
  if (!userToUpdate) throw new Error('User not found');
   if (userToUpdate.id === actingAdminId) throw new Error('Admins cannot change their own role.');

  const res = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING *', [newRole, userId]);
  
  const updatedUser = mapToCamel(res.rows[0]);
  await logUserAction(actingAdminId, updatedUser.id, 'GROUP_REASSIGNED', { from: userToUpdate.role, to: updatedUser.role });

  delete updatedUser.password;
  return updatedUser;
};

const resetPassword = async (userId, newPassword, actingAdminId) => {
  const pool = getPool();
  const userToUpdate = await findUserById(userId);
  if (!userToUpdate) throw new Error('User not found');
  if (userToUpdate.id === actingAdminId) throw new Error('Admins cannot reset their own password via this panel.');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
  await logUserAction(actingAdminId, userId, 'PASSWORD_RESET');

  return { message: 'Password has been reset successfully.' };
};

const deleteUser = async (userId, actingAdminId) => {
  const pool = getPool();
  const userToDelete = await findUserById(userId);
  if (!userToDelete) throw new Error('User not found');
  if (userToDelete.id === actingAdminId) throw new Error('Admins cannot delete their own account.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Before deleting the user, log the action.
    await logUserAction(actingAdminId, userId, 'USER_DELETED', { email: userToDelete.email, role: userToDelete.role });
    
    // Explicitly delete related data to ensure integrity and prevent orphaned rows.
    // This is safer than relying solely on database cascade settings which might be missed.
    await client.query('DELETE FROM user_alert_preferences WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM scheduled_report_subscriptions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_audit_log WHERE target_user_id = $1 OR acting_user_id = $1', [userId]);
    
    // Now, delete the user. The ON DELETE SET NULL on other tables will handle remaining references.
    const res = await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    if (res.rowCount === 0) {
        throw new Error('User not found during deletion transaction.');
    }

    return { success: true, message: 'User deleted successfully.' };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const matchPassword = async (email, enteredPassword) => {
  const pool = getPool();
  // Find user by email regardless of status to provide a consistent response,
  // but login controller will use findUserByEmail which checks status.
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];
  if (!user) return false;
  return await bcrypt.compare(enteredPassword, user.password);
};

module.exports = {
  findUserByEmail,
  findUserById,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserGroup,
  resetPassword,
  deleteUser,
  matchPassword,
};