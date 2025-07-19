// backend/services/reportingServiceBackend.js
const { getPool } = require('../config/db');
const { mapToCamel } = require('../utils/dbMappers');

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>'"]/g, '').trim();
};

// Valid filter values
const VALID_CATEGORIES = ['electronics', 'mechanical', 'electrical', 'tools', 'safety', 'packaging'];
const VALID_LOCATIONS = ['warehouse-a', 'warehouse-b', 'warehouse-c', 'storage-room', 'loading-dock'];
const VALID_SHORTFALL_RANGES = ['low', 'medium', 'high'];
const VALID_RISK_LEVELS = ['critical', 'high', 'medium', 'low'];
const VALID_LEAD_TIME_RANGES = ['short', 'medium', 'long'];

const getReportData = async (reportKey, filters = {}) => {
  const pool = getPool();
  let query = '';
  let queryParams = [];
  let rawData = [];

  switch (reportKey) {
    case 'inv_stock_levels':
      query = 'SELECT sku, name, category, quantity, location, reorder_point, cost_price, is_serialized FROM inventory_items';
      const stockConditions = [];
      
      if (filters.category && VALID_CATEGORIES.includes(filters.category.toLowerCase())) {
        stockConditions.push('lower(category) = lower($1)');
        queryParams.push(filters.category.toLowerCase());
      }
      
      if (filters.location && VALID_LOCATIONS.includes(filters.location.toLowerCase())) {
        const locationParam = stockConditions.length > 0 ? 2 : 1;
        stockConditions.push(`lower(location) LIKE $${locationParam}`);
        queryParams.push(`%${filters.location.toLowerCase()}%`);
      }
      
      if (stockConditions.length > 0) {
        query += ' WHERE ' + stockConditions.join(' AND ');
      }
      
      query += ' ORDER BY name ASC';
      const stockLevelsRes = await pool.query(query, queryParams);
      rawData = mapToCamel(stockLevelsRes.rows).map(item => ({
        ...item,
        reorderPoint: item.isSerialized ? 'N/A' : item.reorderPoint,
      }));
      break;

    case 'inv_serialized_report':
      query = `
        SELECT 
          i.sku, 
          i.name as item_name, 
          unnest(i.serial_numbers) as serial_number, 
          i.location, 
          'In Stock' as status,
          i.entry_date,
          i.id as item_id 
        FROM inventory_items i 
        WHERE i.is_serialized = TRUE AND i.serial_numbers IS NOT NULL AND array_length(i.serial_numbers, 1) > 0
      `;
      
      if (filters.sku && typeof filters.sku === 'string') {
        const sanitizedSku = sanitizeInput(filters.sku);
        if (sanitizedSku.length > 0) {
          query += ' AND lower(i.sku) LIKE $1';
          queryParams.push(`%${sanitizedSku.toLowerCase()}%`);
        }
      }
      
      query += ' ORDER BY i.name, serial_number ASC';
      const serializedRes = await pool.query(query, queryParams);
      rawData = mapToCamel(serializedRes.rows);
      break;

    case 'inv_aging_report':
      query = `
        SELECT 
          sku, 
          name, 
          quantity, 
          entry_date, 
          COALESCE(last_movement_date, entry_date) as last_movement_date,
          (CURRENT_DATE - COALESCE(entry_date, CURRENT_DATE)) as days_in_stock,
          cost_price,
          (quantity * COALESCE(cost_price, 0)) as total_value,
          is_aged
        FROM inventory_items
        WHERE is_aged = TRUE
      `;
      
      if (filters.minDaysInStock && !isNaN(parseInt(filters.minDaysInStock))) {
        const minDays = parseInt(filters.minDaysInStock);
        if (minDays >= 0) {
          query += ' AND (CURRENT_DATE - COALESCE(entry_date, CURRENT_DATE)) >= $1';
          queryParams.push(minDays);
        }
      }
      
      query += ' ORDER BY days_in_stock DESC';
      const agingRes = await pool.query(query, queryParams);
      rawData = mapToCamel(agingRes.rows);
      break;

    case 'inv_below_reorder_point':
      query = `
        SELECT 
          id as item_id,
          name as item_name,
          sku,
          quantity as current_quantity,
          reorder_point,
          (reorder_point - quantity) as shortfall,
          category,
          location
        FROM inventory_items 
        WHERE quantity < reorder_point AND is_serialized = FALSE
      `;
      
      const belowReorderConditions = [];
      
      if (filters.category && VALID_CATEGORIES.includes(filters.category.toLowerCase())) {
        belowReorderConditions.push(`lower(category) = lower($${queryParams.length + 1})`);
        queryParams.push(filters.category.toLowerCase());
      }
      
      if (filters.location && VALID_LOCATIONS.includes(filters.location.toLowerCase())) {
        belowReorderConditions.push(`lower(location) LIKE $${queryParams.length + 1}`);
        queryParams.push(`%${filters.location.toLowerCase()}%`);
      }
      
      if (filters.shortfallRange && VALID_SHORTFALL_RANGES.includes(filters.shortfallRange)) {
        switch (filters.shortfallRange) {
          case 'low':
            belowReorderConditions.push(`(reorder_point - quantity) BETWEEN 1 AND 10`);
            break;
          case 'medium':
            belowReorderConditions.push(`(reorder_point - quantity) BETWEEN 11 AND 50`);
            break;
          case 'high':
            belowReorderConditions.push(`(reorder_point - quantity) > 50`);
            break;
        }
      }
      
      if (belowReorderConditions.length > 0) {
        query += ' AND ' + belowReorderConditions.join(' AND ');
      }
      
      query += ' ORDER BY shortfall DESC';
      
      const belowReorderRes = await pool.query(query, queryParams);
      rawData = mapToCamel(belowReorderRes.rows);
      break;

    case 'inv_stock_out_risk_6months':
      // Default run rate: 66 installs/week (11 installs/day × 6 days/week)
      const weeklyRunRate = 66;
      const sixMonthWeeks = 26;
      const totalInstalls = weeklyRunRate * sixMonthWeeks; // 1,716 installs
      const variability = 0.1; // 10% variability
      
      query = `
        SELECT 
          i.id as item_id,
          i.name as item_name,
          i.sku,
          i.quantity as current_quantity,
          i.category,
          i.location,
          COALESCE(v.average_lead_time, 14) as lead_time
        FROM inventory_items i
        LEFT JOIN vendors v ON i.supplier_id = v.id
        WHERE i.is_serialized = FALSE
      `;
      
      const stockOutConditions = [];
      
      if (filters.category && VALID_CATEGORIES.includes(filters.category.toLowerCase())) {
        stockOutConditions.push(`lower(i.category) = lower($${queryParams.length + 1})`);
        queryParams.push(filters.category.toLowerCase());
      }
      
      if (filters.riskLevel && VALID_RISK_LEVELS.includes(filters.riskLevel)) {
        switch (filters.riskLevel) {
          case 'critical':
            stockOutConditions.push(`i.quantity < (i.reorder_point * 0.5)`);
            break;
          case 'high':
            stockOutConditions.push(`i.quantity BETWEEN (i.reorder_point * 0.5) AND (i.reorder_point * 0.8)`);
            break;
          case 'medium':
            stockOutConditions.push(`i.quantity BETWEEN (i.reorder_point * 0.8) AND i.reorder_point`);
            break;
          case 'low':
            stockOutConditions.push(`i.quantity BETWEEN i.reorder_point AND (i.reorder_point * 1.2)`);
            break;
        }
      }
      
      if (filters.leadTimeRange && VALID_LEAD_TIME_RANGES.includes(filters.leadTimeRange)) {
        switch (filters.leadTimeRange) {
          case 'short':
            stockOutConditions.push(`COALESCE(v.average_lead_time, 14) <= 7`);
            break;
          case 'medium':
            stockOutConditions.push(`COALESCE(v.average_lead_time, 14) BETWEEN 8 AND 21`);
            break;
          case 'long':
            stockOutConditions.push(`COALESCE(v.average_lead_time, 14) >= 22`);
            break;
        }
      }
      
      if (stockOutConditions.length > 0) {
        query += ' AND ' + stockOutConditions.join(' AND ');
      }
      
      query += ' ORDER BY i.quantity ASC';
      
      const stockOutRiskRes = await pool.query(query, queryParams);
      
      // Calculate demand and stock-out projections
      rawData = mapToCamel(stockOutRiskRes.rows).map(item => {
        // Calculate demand based on item type (simplified logic)
        let demandPerInstall = 1; // Default
        if (item.sku.toLowerCase().includes('clamp')) demandPerInstall = 20;
        else if (item.sku.toLowerCase().includes('cable') && item.sku.toLowerCase().includes('tie')) demandPerInstall = 30;
        else if (item.sku.toLowerCase().includes('clip') || item.sku.toLowerCase().includes('hook')) demandPerInstall = 15;
        
        const sixMonthDemand = totalInstalls * demandPerInstall;
        const demandRange = {
          min: Math.round(sixMonthDemand * (1 - variability)),
          max: Math.round(sixMonthDemand * (1 + variability))
        };
        
        // Calculate projected stock-out date
        const weeklyDemand = sixMonthDemand / sixMonthWeeks;
        const weeksUntilStockOut = Math.max(0, (item.currentQuantity - item.leadTime * weeklyDemand / 7) / weeklyDemand);
        const projectedStockOutDate = weeksUntilStockOut <= 0 ? 'Immediate' : `Week ${Math.ceil(weeksUntilStockOut)}`;
        
        return {
          ...item,
          sixMonthDemand,
          demandRange,
          projectedStockOutDate,
          variability: Math.round(variability * 100)
        };
      });
      break;

    case 'inv_run_rate_history':
      // For now, return a single current run rate record
      // In a real implementation, this would query a run_rate_history table
      rawData = [{
        weeklyInstalls: 66,
        source: 'default',
        lastUpdated: new Date().toISOString()
      }];
      break;

    case 'ai_stock_out_forecast':
      query = `
        SELECT 
            id as item_id, sku, name as item_name, quantity as current_stock, reorder_point 
        FROM inventory_items 
        WHERE is_serialized = FALSE AND reorder_point > 0 AND quantity < (reorder_point * 1.5)
        ORDER BY (quantity::decimal / reorder_point::decimal) ASC LIMIT 10
      `;
      const forecastCandidates = (await pool.query(query)).rows;
      rawData = mapToCamel(forecastCandidates).map(item => {
          const consumptionRatio = item.currentStock / ((item.reorderPoint * 1.5) || 1); 
          const confidence = 0.8 + (1 - consumptionRatio) * 0.15;
          const predictedStockOutDays = Math.round(consumptionRatio * 14) + 1;
          const recommendedReorderQty = Math.max(0, (item.reorderPoint || 0) * 2 - item.currentStock);
          return {
              itemId: item.itemId,
              sku: item.sku,
              itemName: item.itemName,
              currentStock: item.currentStock,
              predictedStockOutDays,
              confidence: parseFloat(confidence.toFixed(2)),
              recommendedReorderQty: Math.ceil(recommendedReorderQty / 5) * 5,
          };
      });
      break;
      
    case 'vendor_performance':
      query = `
        SELECT 
          id, name, contact_person, email, performance_score,
          average_lead_time, total_spend
        FROM vendors
        ORDER BY performance_score DESC
      `;
      const vendorPerfRes = await pool.query(query);
      rawData = mapToCamel(vendorPerfRes.rows).map(vendor => ({
        ...vendor,
        onTimeDeliveryRate: vendor.performanceScore || 0,
        qualityRating: parseFloat(((vendor.performanceScore || 0) / 20).toFixed(1)),
      }));
      break;

    case 'compliance_document_status':
      query = `
        SELECT 
          cd.name, rs.name as standard_name, cd.status, cd.version, 
          cd.expiry_date, cd.last_reviewed_date, cd.responsible_person 
        FROM compliance_documents cd
        LEFT JOIN regulatory_standards rs ON cd.standard_id = rs.id
        ORDER BY cd.status, cd.expiry_date ASC NULLS LAST
      `;
      const complianceDocsRes = await pool.query(query);
      rawData = mapToCamel(complianceDocsRes.rows);
      break;

    default:
      console.warn(`Backend report key "${reportKey}" not fully implemented for PostgreSQL. Applying generic filter if possible.`);
      rawData = []; 
  }
  
  return _applyGenericTextFilter(rawData, filters);
};

// Generic text filter function with input validation
const _applyGenericTextFilter = (data, filters) => {
  if (!filters.searchTerm || typeof filters.searchTerm !== 'string') {
    return data;
  }
  
  const sanitizedSearch = sanitizeInput(filters.searchTerm.toLowerCase());
  if (sanitizedSearch.length === 0) {
    return data;
  }
  
  return data.filter(item => {
    return Object.values(item).some(value => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(sanitizedSearch);
      }
      return false;
    });
  });
};

module.exports = {
  getReportData
};