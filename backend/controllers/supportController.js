// backend/controllers/supportController.js
const { getPool } = require('../config/db');
const { mapToCamel } = require('../utils/dbMappers');

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

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND st.status = $${paramCount}`;
      params.push(status);
    }

    if (priority && priority !== 'all') {
      paramCount++;
      query += ` AND st.priority = $${paramCount}`;
      params.push(priority);
    }

    if (category && category !== 'all') {
      paramCount++;
      query += ` AND st.category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (st.title ILIKE $${paramCount} OR st.ticket_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
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

// Get support ticket by ID
const getSupportTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const result = await pool.query(`
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
      WHERE st.id = $1
    `, [id]);

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

// Create support ticket
const createSupportTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      assigned_to,
      warehouse_id,
      related_order_id,
      related_shipment_id
    } = req.body;

    const pool = getPool();
    
    // Generate ticket number
    const ticketNumberResult = await pool.query(`
      SELECT COUNT(*) as count FROM support_tickets 
      WHERE created_at >= CURRENT_DATE
    `);
    const count = parseInt(ticketNumberResult.rows[0].count) + 1;
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const result = await pool.query(`
      INSERT INTO support_tickets (
        ticket_number, title, description, category, priority,
        assigned_to, created_by, warehouse_id, related_order_id, related_shipment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [ticketNumber, title, description, category, priority, assigned_to, req.user.id, warehouse_id, related_order_id, related_shipment_id]);

    const ticket = mapToCamel(result.rows[0]);
    res.status(201).json({ ticket });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: 'Failed to create support ticket' });
  }
};

// Update support ticket
const updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      priority,
      status,
      assigned_to,
      warehouse_id,
      related_order_id,
      related_shipment_id,
      resolution_notes
    } = req.body;

    const pool = getPool();
    const result = await pool.query(`
      UPDATE support_tickets SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        assigned_to = COALESCE($6, assigned_to),
        warehouse_id = COALESCE($7, warehouse_id),
        related_order_id = COALESCE($8, related_order_id),
        related_shipment_id = COALESCE($9, related_shipment_id),
        resolution_notes = COALESCE($10, resolution_notes),
        updated_at = CURRENT_TIMESTAMP,
        resolved_at = CASE WHEN $5 = 'resolved' AND status != 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
      WHERE id = $11
      RETURNING *
    `, [title, description, category, priority, status, assigned_to, warehouse_id, related_order_id, related_shipment_id, resolution_notes, id]);

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

// Delete support ticket
const deleteSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    const result = await pool.query('DELETE FROM support_tickets WHERE id = $1 RETURNING *', [id]);

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
    
    const result = await pool.query(`
      SELECT 
        str.*,
        u.name as user_name
      FROM support_ticket_responses str
      LEFT JOIN users u ON str.user_id = u.id
      WHERE str.ticket_id = $1
      ORDER BY str.created_at ASC
    `, [ticketId]);

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
    
    const result = await pool.query(`
      INSERT INTO support_ticket_responses (
        ticket_id, user_id, message, is_internal
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [ticketId, req.user.id, message, is_internal]);

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
    
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets
      FROM support_tickets
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
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
  getSupportTicketById,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  getTicketResponses,
  addTicketResponse,
  getSupportDashboardMetrics,
  getSupportTicketTrends
}; 