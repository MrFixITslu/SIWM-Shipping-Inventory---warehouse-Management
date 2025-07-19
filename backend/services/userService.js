

const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { mapToCamel, mapToSnake } = require('../utils/dbMappers');
const { logUserAction } = require('./auditLogService');

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>'"]/g, '').trim();
};

// Valid status values
const VALID_STATUSES = ['active', 'inactive'];
const VALID_ROLES = ['admin', 'manager', 'Warehouse', 'Finance', 'Broker', 'Requester', 'Technician', 'Contractor'];

const findUserByEmail = async (email) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email provided');
  }
  
  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const pool = getPool();
  // IMPORTANT: Also check for active status during login
  const res = await pool.query("SELECT * FROM users WHERE email = $1 AND status = 'active'", [sanitizedEmail]);
  // Return the raw DB object with password for password matching
  return res.rows[0] ? { ...res.rows[0] } : null;
};

const findUserById = async (id) => {
  const pool = getPool();
  const userId = parseInt(id, 10); 
  if (isNaN(userId) || userId <= 0) {
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

  // Sanitize and validate filters
  if (filters.status && VALID_STATUSES.includes(filters.status)) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }
  
  if (filters.role && VALID_ROLES.includes(filters.role)) {
    conditions.push(`role = $${paramIndex++}`);
    values.push(filters.role);
  }
  
  if (filters.searchTerm && typeof filters.searchTerm === 'string') {
    const sanitizedSearch = sanitizeInput(filters.searchTerm);
    if (sanitizedSearch.length > 0) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      values.push(`%${sanitizedSearch}%`);
      paramIndex++;
    }
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
  
  // Validate required fields
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }
  
  // Validate role
  if (!VALID_ROLES.includes(role)) {
    throw new Error('Invalid role specified');
  }
  
  // Sanitize inputs
  const sanitizedName = sanitizeInput(name);
  const sanitizedEmail = sanitizeInput(email.toLowerCase());
  const sanitizedContactNumber = contactNumber ? sanitizeInput(contactNumber) : null;
  
  if (sanitizedName.length < 2 || sanitizedName.length > 50) {
    throw new Error('Name must be between 2 and 50 characters');
  }
  
  const pool = getPool();

  // Increase bcrypt rounds for better security (12 instead of 10)
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const dbData = mapToSnake({ 
    name: sanitizedName, 
    email: sanitizedEmail, 
    password: hashedPassword, 
    role, 
    contactNumber: sanitizedContactNumber, 
    status: 'active', 
    permissions 
  });

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
  
  // Prevent self-demotion for admins
  if (userToUpdate.id === actingAdminId && dataToUpdate.role && dataToUpdate.role !== 'admin') {
    throw new Error("Admins cannot change their own role.");
  }
  
  // Validate role if provided
  if (dataToUpdate.role && !VALID_ROLES.includes(dataToUpdate.role)) {
    throw new Error('Invalid role specified');
  }

  // Sanitize inputs
  const sanitizedData = {};
  if (dataToUpdate.name) sanitizedData.name = sanitizeInput(dataToUpdate.name);
  if (dataToUpdate.email) sanitizedData.email = sanitizeInput(dataToUpdate.email.toLowerCase());
  if (dataToUpdate.contactNumber) sanitizedData.contactNumber = sanitizeInput(dataToUpdate.contactNumber);
  if (dataToUpdate.role) sanitizedData.role = dataToUpdate.role;
  if (dataToUpdate.permissions) sanitizedData.permissions = dataToUpdate.permissions;
  if (dataToUpdate.status && VALID_STATUSES.includes(dataToUpdate.status)) {
    sanitizedData.status = dataToUpdate.status;
  }

  const dbData = mapToSnake(sanitizedData);
  const fields = [];
  const values = [];
  let paramIndex = 1;
  let roleChanged = false;
  
  for (const key in dbData) {
      if (Object.hasOwnProperty.call(dbData, key)) {
          fields.push(`${key} = $${paramIndex++}`);
          values.push(dbData[key]);
          if (key === 'role' && dbData[key] !== userToUpdate.role) {
            roleChanged = true;
          }
      }
  }
  
  if (roleChanged) {
    fields.push(`token_invalidated_at = CURRENT_TIMESTAMP`);
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
  if (!VALID_STATUSES.includes(status)) {
    throw new Error('Invalid status specified');
  }
  
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
  if (!VALID_ROLES.includes(newRole)) {
    throw new Error('Invalid role specified');
  }
  
  const pool = getPool();
  const userToUpdate = await findUserById(userId);
  if (!userToUpdate) throw new Error('User not found');
  if (userToUpdate.id === actingAdminId) throw new Error('Admins cannot change their own role.');
  
  const res = await pool.query('UPDATE users SET role = $1, token_invalidated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [newRole, userId]);
  const updatedUser = mapToCamel(res.rows[0]);
  await logUserAction(actingAdminId, updatedUser.id, 'GROUP_REASSIGNED', { from: userToUpdate.role, to: updatedUser.role });
  delete updatedUser.password;
  return updatedUser;
};

const resetPassword = async (userId, newPassword, actingAdminId) => {
  // Validate password strength
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  if (!PASSWORD_REGEX.test(newPassword)) {
    throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
  }
  
  const pool = getPool();
  const userToUpdate = await findUserById(userId);
  if (!userToUpdate) throw new Error('User not found');
  if (userToUpdate.id === actingAdminId) throw new Error('Admins cannot reset their own password via this panel.');

  // Use 12 rounds for better security
  const salt = await bcrypt.genSalt(12);
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
  if (!email || !enteredPassword) {
    return false;
  }
  
  const pool = getPool();
  // Find user by email regardless of status to provide a consistent response,
  // but login controller will use findUserByEmail which checks status.
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
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