// backend/controllers/supportController.js
const { getPool } = require('../config/db');
const { mapToCamel } = require('../utils/dbMappers');

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>'"]/g, '').trim();
};

// Valid filter values
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_CATEGORIES = ['technical', 'logistics', 'inventory', 'billing', 'general'];

// Get all support tickets
const getSupportTickets = async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    const pool = getPool();
    
    let query = `
      SELECT 
        st.*,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        w.name as warehouse_name,
        wo.id as order_id,
        os.id as shipment_id
      FROM support_tickets st
      LEFT JOIN users u1 ON st.created_by = u1.id
      LEFT JOIN users u2 ON st.assigned_to = u2.id
      LEFT JOIN warehouses w ON st.warehouse_id = w.id
      LEFT JOIN warehouse_orders wo ON st.related_order_id = wo.id
      LEFT JOIN outbound_shipments os ON st.related_shipment_id = os.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (status && status !== 'all' && VALID_STATUSES.includes(status)) {
      paramCount++;
      query += ` AND st.status = $${paramCount}`;
      params.push(status);
    }

    if (priority && priority !== 'all' && VALID_PRIORITIES.includes(priority)) {
      paramCount++;
      query += ` AND st.priority = $${paramCount}`;
      params.push(priority);
    }

    if (category && category !== 'all' && VALID_CATEGORIES.includes(category)) {
      paramCount++;
      query += ` AND st.category = $${paramCount}`;
      params.push(category);
    }

    if (search && typeof search === 'string') {
      const sanitizedSearch = sanitizeInput(search);
      if (sanitizedSearch.length > 0) {
        paramCount++;
        query += ` AND (st.title ILIKE $${paramCount} OR st.ticket_number ILIKE $${paramCount})`;
        params.push(`%${sanitizedSearch}%`);
      }
    }

    query += ` ORDER BY st.created_at DESC`;

    const result = await pool.query(query, params);
    const tickets = result.rows.map(mapToCamel);
    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ message: 'Failed to fetch support tickets' });
  }
};

// Create a new support ticket
const createSupportTicket = async (req, res) => {
  try {
    const { title, description, priority, category, relatedOrderId, relatedShipmentId, warehouseId } = req.body;
    const pool = getPool();
    
    // Validate required fields
    if (!title || !description || !priority || !category) {
      return res.status(400).json({ message: 'Title, description, priority, and category are required' });
    }
    
    // Validate input values
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority value' });
    }
    
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category value' });
    }
    
    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = sanitizeInput(description);
    
    if (sanitizedTitle.length < 5 || sanitizedTitle.length > 200) {
      return res.status(400).json({ message: 'Title must be between 5 and 200 characters' });
    }
    
    if (sanitizedDescription.length < 10 || sanitizedDescription.length > 2000) {
      return res.status(400).json({ message: 'Description must be between 10 and 2000 characters' });
    }
    
    const ticketNumber = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const result = await pool.query(
      `INSERT INTO support_tickets 
       (ticket_number, title, description, priority, category, status, created_by, related_order_id, related_shipment_id, warehouse_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
       RETURNING *`,
      [
        ticketNumber,
        sanitizedTitle,
        sanitizedDescription,
        priority,
        category,
        'open',
        req.user.id,
        relatedOrderId || null,
        relatedShipmentId || null,
        warehouseId || null
      ]
    );
    
    const ticket = mapToCamel(result.rows[0]);
    res.status(201).json({ ticket });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: 'Failed to create support ticket' });
  }
};

// Update a support ticket
const updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, notes } = req.body;
    const pool = getPool();
    
    // Validate ticket ID
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId) || ticketId <= 0) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }
    
    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority value' });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      params.push(status);
    }
    
    if (priority) {
      paramCount++;
      updateFields.push(`priority = $${paramCount}`);
      params.push(priority);
    }
    
    if (assignedTo !== undefined) {
      paramCount++;
      updateFields.push(`assigned_to = $${paramCount}`);
      params.push(assignedTo);
    }
    
    if (notes && typeof notes === 'string') {
      const sanitizedNotes = sanitizeInput(notes);
      if (sanitizedNotes.length > 0) {
        paramCount++;
        updateFields.push(`notes = $${paramCount}`);
        params.push(sanitizedNotes);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    paramCount++;
    updateFields.push(`updated_at = NOW()`);
    params.push(ticketId);
    
    const query = `
      UPDATE support_tickets 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    
    const ticket = mapToCamel(result.rows[0]);
    res.json({ ticket });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({ message: 'Failed to update support ticket' });
  }
};

// Get support ticket by ID
const getSupportTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    // Validate ticket ID
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId) || ticketId <= 0) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }
    
    const result = await pool.query(
      `SELECT 
        st.*,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        w.name as warehouse_name,
        wo.id as order_id,
        os.id as shipment_id
      FROM support_tickets st
      LEFT JOIN users u1 ON st.created_by = u1.id
      LEFT JOIN users u2 ON st.assigned_to = u2.id
      LEFT JOIN warehouses w ON st.warehouse_id = w.id
      LEFT JOIN warehouse_orders wo ON st.related_order_id = wo.id
      LEFT JOIN outbound_shipments os ON st.related_shipment_id = os.id
      WHERE st.id = $1`,
      [ticketId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    
    const ticket = mapToCamel(result.rows[0]);
    res.json({ ticket });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({ message: 'Failed to fetch support ticket' });
  }
};

// Delete support ticket
const deleteSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId) || ticketId <= 0) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    const result = await pool.query('DELETE FROM support_tickets WHERE id = $1 RETURNING *', [ticketId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json({ message: 'Support ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    res.status(500).json({ message: 'Failed to delete support ticket' });
  }
};

// Get ticket responses
const getTicketResponses = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const pool = getPool();
    
    const ticketIdInt = parseInt(ticketId, 10);
    if (isNaN(ticketIdInt) || ticketIdInt <= 0) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    const result = await pool.query(`
      SELECT 
        str.*,
        u.name as user_name
      FROM support_ticket_responses str
      LEFT JOIN users u ON str.user_id = u.id
      WHERE str.ticket_id = $1
      ORDER BY str.created_at ASC
    `, [ticketIdInt]);

    const responses = result.rows.map(mapToCamel);
    res.json({ responses });
  } catch (error) {
    console.error('Error fetching ticket responses:', error);
    res.status(500).json({ message: 'Failed to fetch ticket responses' });
  }
};

// Add ticket response
const addTicketResponse = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, is_internal } = req.body;
    const pool = getPool();
    
    const ticketIdInt = parseInt(ticketId, 10);
    if (isNaN(ticketIdInt) || ticketIdInt <= 0) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    const result = await pool.query(`
      INSERT INTO support_ticket_responses (
        ticket_id, user_id, message, is_internal
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [ticketIdInt, req.user.id, message, is_internal]);

    const response = mapToCamel(result.rows[0]);
    res.status(201).json({ response });
  } catch (error) {
    console.error('Error adding ticket response:', error);
    res.status(500).json({ message: 'Failed to add ticket response' });
  }
};

// Get support dashboard metrics
const getSupportDashboardMetrics = async (req, res) => {
  try {
    const pool = getPool();
    
    const [
      totalTicketsResult,
      openTicketsResult,
      resolvedTodayResult,
      avgResolutionTimeResult,
      ticketsByPriorityResult,
      ticketsByCategoryResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM support_tickets'),
      pool.query("SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open', 'in_progress')"),
      pool.query("SELECT COUNT(*) as count FROM support_tickets WHERE status = 'resolved' AND DATE(resolved_at) = CURRENT_DATE"),
      pool.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (resolved_at::timestamp - created_at::timestamp))/3600) as avg_hours
        FROM support_tickets 
        WHERE status = 'resolved' AND resolved_at IS NOT NULL
      `),
      pool.query(`
        SELECT priority, COUNT(*) as count 
        FROM support_tickets 
        GROUP BY priority
      `),
      pool.query(`
        SELECT category, COUNT(*) as count 
        FROM support_tickets 
        GROUP BY category
      `)
    ]);

    const ticketsByPriority = {};
    ticketsByPriorityResult.rows.forEach(row => {
      ticketsByPriority[row.priority] = parseInt(row.count);
    });

    const ticketsByCategory = {};
    ticketsByCategoryResult.rows.forEach(row => {
      ticketsByCategory[row.category] = parseInt(row.count);
    });

    const metrics = {
      total_tickets: parseInt(totalTicketsResult.rows[0].count),
      open_tickets: parseInt(openTicketsResult.rows[0].count),
      resolved_today: parseInt(resolvedTodayResult.rows[0].count),
      average_resolution_time_hours: parseFloat(avgResolutionTimeResult.rows[0].avg_hours) || 0,
      tickets_by_priority: ticketsByPriority,
      tickets_by_category: ticketsByCategory
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching support dashboard metrics:', error);
    res.status(500).json({ message: 'Failed to fetch support dashboard metrics' });
  }
};

// Get support ticket trends
const getSupportTicketTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const pool = getPool();
    
    const daysInt = parseInt(days, 10);
    if (isNaN(daysInt) || daysInt <= 0) {
      return res.status(400).json({ message: 'Invalid days value' });
    }

    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets
      FROM support_tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '${daysInt} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const trends = result.rows.map(mapToCamel);
    res.json({ trends });
  } catch (error) {
    console.error('Error fetching support ticket trends:', error);
    res.status(500).json({ message: 'Failed to fetch support ticket trends' });
  }
};

module.exports = {
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  getSupportTicketById,
  deleteSupportTicket,
  getTicketResponses,
  addTicketResponse,
  getSupportDashboardMetrics,
  getSupportTicketTrends
}; 