-- Dashboard Performance Optimization Scripts (Simplified)
-- Run these queries to improve dashboard loading performance

-- 1. Create indexes for frequently queried dashboard tables (simple approach)
CREATE INDEX IF NOT EXISTS idx_inventory_items_warehouse_status ON inventory_items(warehouse_id, quantity, reorder_point);
CREATE INDEX IF NOT EXISTS idx_warehouse_orders_status_warehouse ON warehouse_orders(warehouse_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse_date ON inventory_movements(warehouse_id, created_at, movement_type);
CREATE INDEX IF NOT EXISTS idx_outbound_shipments_warehouse_status ON outbound_shipments(warehouse_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_vendors_preferred_warehouse ON vendors(preferred_warehouse_id);

-- 2. Create materialized view for warehouse metrics (refresh every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS warehouse_metrics_mv AS
SELECT 
  w.id as warehouse_id,
  w.name as warehouse_name,
  w.code as warehouse_code,
  w.capacity_sqft as capacity,
  COUNT(DISTINCT i.id) as inventory_items,
  COUNT(DISTINCT wo.id) as pending_orders,
  COUNT(DISTINCT CASE WHEN i.quantity <= i.reorder_point THEN i.id END) as stock_alerts,
  ROUND((COUNT(DISTINCT i.id) / NULLIF(w.capacity_sqft, 0)) * 100, 2) as capacity_percentage,
  NOW() as last_updated
FROM warehouses w
LEFT JOIN inventory_items i ON w.id = i.warehouse_id
LEFT JOIN warehouse_orders wo ON w.id = wo.warehouse_id AND wo.status = 'Pending'
GROUP BY w.id, w.name, w.code, w.capacity_sqft;

-- 3. Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_warehouse_metrics_mv_warehouse_id ON warehouse_metrics_mv(warehouse_id);

-- 4. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_warehouse_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW warehouse_metrics_mv;
END;
$$ LANGUAGE plpgsql;

-- 5. Create indexes for ASN-related queries
CREATE INDEX IF NOT EXISTS idx_asns_created_at ON asns(created_at);
CREATE INDEX IF NOT EXISTS idx_fee_status_history_asn_status ON fee_status_history(asn_id, status, timestamp);

-- 6. Create indexes for support dashboard
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created ON support_tickets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority_status ON support_tickets(priority, status);

-- 7. Create indexes for offline actions
CREATE INDEX IF NOT EXISTS idx_offline_actions_status_created ON offline_actions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_offline_actions_type_status ON offline_actions(action_type, status);

-- 8. Analyze tables for better query planning
ANALYZE warehouses;
ANALYZE inventory_items;
ANALYZE warehouse_orders;
ANALYZE inventory_movements;
ANALYZE outbound_shipments;
ANALYZE vendors;
ANALYZE asns;
ANALYZE fee_status_history;
ANALYZE support_tickets;
ANALYZE offline_actions;

-- 9. Create function to get dashboard metrics efficiently
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE(
  active_shipments bigint,
  inventory_items bigint,
  pending_orders bigint,
  dispatches_today bigint,
  active_vendors bigint,
  stock_alerts bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT os.id) as active_shipments,
    COUNT(DISTINCT ii.id) as inventory_items,
    COUNT(DISTINCT wo.id) as pending_orders,
    COUNT(DISTINCT CASE WHEN DATE(os.created_at) = CURRENT_DATE THEN os.id END) as dispatches_today,
    COUNT(DISTINCT v.id) as active_vendors,
    COUNT(DISTINCT CASE WHEN ii.quantity <= ii.reorder_point THEN ii.id END) as stock_alerts
  FROM warehouses w
  LEFT JOIN inventory_items ii ON w.id = ii.warehouse_id
  LEFT JOIN warehouse_orders wo ON w.id = wo.warehouse_id AND wo.status = 'Pending'
  LEFT JOIN outbound_shipments os ON w.id = os.warehouse_id AND os.status IN ('Preparing', 'In Transit')
  LEFT JOIN vendors v ON w.id = v.preferred_warehouse_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to get workflow metrics efficiently
CREATE OR REPLACE FUNCTION get_workflow_metrics()
RETURNS TABLE(
  orders_acknowledged bigint,
  orders_picked bigint,
  orders_packed bigint,
  orders_shipped bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN wo.status = 'Acknowledged' THEN 1 END) as orders_acknowledged,
    COUNT(CASE WHEN wo.status = 'Picking' THEN 1 END) as orders_picked,
    COUNT(CASE WHEN wo.status = 'Packed' THEN 1 END) as orders_packed,
    COUNT(CASE WHEN wo.status = 'Shipped' THEN 1 END) as orders_shipped
  FROM warehouse_orders wo;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant necessary permissions
GRANT SELECT ON warehouse_metrics_mv TO postgres;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO postgres;
GRANT EXECUTE ON FUNCTION get_workflow_metrics() TO postgres;
GRANT EXECUTE ON FUNCTION refresh_warehouse_metrics() TO postgres;

-- 12. Create a view for inventory flow data
CREATE OR REPLACE VIEW inventory_flow_view AS
SELECT 
  DATE(im.created_at) as date,
  im.warehouse_id,
  SUM(CASE WHEN im.movement_type = 'received' THEN im.quantity ELSE 0 END) as received,
  SUM(CASE WHEN im.movement_type = 'dispatched' THEN im.quantity ELSE 0 END) as dispatched,
  SUM(CASE WHEN im.movement_type = 'transferred' THEN im.quantity ELSE 0 END) as transferred
FROM inventory_movements im
WHERE im.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(im.created_at), im.warehouse_id
ORDER BY date DESC;

-- 13. Create index for the view
CREATE INDEX IF NOT EXISTS idx_inventory_flow_view_date_warehouse ON inventory_flow_view(date, warehouse_id);

-- 14. Set statistics for better query planning
ALTER TABLE warehouses SET (autovacuum_analyze_scale_factor = 0.1);
ALTER TABLE inventory_items SET (autovacuum_analyze_scale_factor = 0.1);
ALTER TABLE warehouse_orders SET (autovacuum_analyze_scale_factor = 0.1);
ALTER TABLE inventory_movements SET (autovacuum_analyze_scale_factor = 0.1);

-- 15. Create a function to manually refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW warehouse_metrics_mv;
  RAISE NOTICE 'All dashboard materialized views refreshed';
END;
$$ LANGUAGE plpgsql;

-- 16. Create a function to get performance statistics
CREATE OR REPLACE FUNCTION get_dashboard_performance_stats()
RETURNS TABLE(
  table_name text,
  total_rows bigint,
  last_vacuum timestamp,
  last_analyze timestamp,
  cache_hit_ratio numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins + n_tup_upd + n_tup_del as total_rows,
    last_vacuum,
    last_analyze,
    CASE 
      WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
      ELSE ROUND(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2)
    END as cache_hit_ratio
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
  AND tablename IN ('warehouses', 'inventory_items', 'warehouse_orders', 'inventory_movements');
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM get_dashboard_metrics();
-- SELECT * FROM get_workflow_metrics();
-- SELECT * FROM get_dashboard_performance_stats();
-- SELECT refresh_warehouse_metrics();
-- SELECT refresh_all_dashboard_views(); 