// backend/services/dashboardServiceBackend.js
const { getPool } = require('../config/db');
const { mapToCamel } = require('../utils/dbMappers');

const getDashboardMetrics = async () => {
    const pool = getPool();
    
    // Using Promise.all to run queries in parallel for efficiency
    const [
        activeShipmentsRes,
        inventoryItemsRes,
        pendingOrdersRes,
        dispatchesTodayRes,
        activeVendorsRes,
        stockAlertsRes
    ] = await Promise.all([
        pool.query("SELECT COUNT(*) FROM outbound_shipments WHERE status IN ('Preparing', 'In Transit')"),
        pool.query("SELECT COUNT(*) FROM inventory_items"),
        pool.query("SELECT COUNT(*) FROM warehouse_orders WHERE status IN ('Pending', 'Picking')"),
        pool.query("SELECT COUNT(*) FROM outbound_shipments WHERE dispatch_date = CURRENT_DATE"),
        pool.query("SELECT COUNT(*) FROM vendors"),
        pool.query("SELECT COUNT(*) FROM inventory_items WHERE is_serialized = FALSE AND quantity < reorder_point")
    ]);

    return {
        activeShipments: parseInt(activeShipmentsRes.rows[0].count, 10),
        inventoryItems: parseInt(inventoryItemsRes.rows[0].count, 10),
        pendingOrders: parseInt(pendingOrdersRes.rows[0].count, 10),
        dispatchesToday: parseInt(dispatchesTodayRes.rows[0].count, 10),
        activeVendors: parseInt(activeVendorsRes.rows[0].count, 10),
        stockAlerts: parseInt(stockAlertsRes.rows[0].count, 10),
    };
};

const getShipmentChartData = async () => {
    const pool = getPool();
    // This query generates a series of the last 6 months and left joins the aggregated data.
    const query = `
        WITH months AS (
            SELECT generate_series(
                date_trunc('month', NOW() - interval '5 months'),
                date_trunc('month', NOW()),
                '1 month'
            )::date as month_start
        )
        SELECT
            TO_CHAR(m.month_start, 'Mon') as name,
            COALESCE(i.count, 0)::int as incoming,
            COALESCE(o.count, 0)::int as outgoing
        FROM months m
        LEFT JOIN (
            SELECT date_trunc('month', expected_arrival) as month, COUNT(*) as count
            FROM asns
            WHERE expected_arrival >= date_trunc('month', NOW() - interval '5 months')
            GROUP BY 1
        ) i ON m.month_start = i.month
        LEFT JOIN (
            SELECT date_trunc('month', dispatch_date) as month, COUNT(*) as count
            FROM outbound_shipments
            WHERE dispatch_date >= date_trunc('month', NOW() - interval '5 months')
            GROUP BY 1
        ) o ON m.month_start = o.month
        ORDER BY m.month_start;
    `;
    const res = await pool.query(query);
    return res.rows;
};

const getOrderVolumeChartData = async () => {
    const pool = getPool();
    const query = `
        WITH months AS (
            SELECT generate_series(
                date_trunc('month', NOW() - interval '5 months'),
                date_trunc('month', NOW()),
                '1 month'
            )::date as month_start
        )
        SELECT
            TO_CHAR(m.month_start, 'Mon') as name,
            COALESCE(o.count, 0)::int as orders
        FROM months m
        LEFT JOIN (
            SELECT date_trunc('month', created_at) as month, COUNT(*) as count
            FROM warehouse_orders
            WHERE created_at >= date_trunc('month', NOW() - interval '5 months')
            GROUP BY 1
        ) o ON m.month_start = o.month
        ORDER BY m.month_start;
    `;
    const res = await pool.query(query);
    return res.rows;
};

const getUnacknowledgedOrdersCount = async () => {
    const pool = getPool();
    const res = await pool.query("SELECT COUNT(*) FROM warehouse_orders WHERE status = 'Pending'");
    return parseInt(res.rows[0].count, 10);
};

const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0 || seconds === null) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
    return `${(seconds / 86400).toFixed(1)} days`;
};

const getWorkflowMetrics = async () => {
    const pool = getPool();
    const [asnRes, outboundRes] = await Promise.all([
        pool.query("SELECT id, created_at, fee_status_history, arrived_at FROM asns WHERE fee_status_history IS NOT NULL"),
        pool.query("SELECT id, created_at, fee_status_history FROM outbound_shipments WHERE fee_status_history IS NOT NULL")
    ]);
    const allShipments = [...asnRes.rows, ...outboundRes.rows];

    const durations = {
        submission: [],
        approval: [],
        payment: [],
        delivery: []
    };

    for (const shipment of allShipments) {
        let history = [];
        // Robustly handle history data which might be a pre-parsed array or a corrupted string
        if (Array.isArray(shipment.fee_status_history)) {
            history = shipment.fee_status_history;
        } else if (typeof shipment.fee_status_history === 'string') {
            try {
                const parsed = JSON.parse(shipment.fee_status_history);
                if (Array.isArray(parsed)) {
                    history = parsed;
                }
            } catch (e) {
                console.warn(`Could not parse fee_status_history string for shipment ID: ${shipment.id || '(unknown)'}`);
            }
        }
        
        if (history.length === 0) {
            continue; // Skip if no valid history entries
        }

        history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const findFirstTs = (status) => history.find(h => h.status === status)?.timestamp;
        
        const t_creation = new Date(shipment.created_at);
        const t_submitted = findFirstTs('Pending Approval');
        const t_approved = findFirstTs('Approved');
        const t_paid = findFirstTs('Payment Confirmed');

        if(t_submitted) {
            durations.submission.push((new Date(t_submitted) - t_creation) / 1000);
        }
        if(t_approved && t_submitted) {
            durations.approval.push((new Date(t_approved) - new Date(t_submitted)) / 1000);
        }
        if(t_paid && t_approved) {
            durations.payment.push((new Date(t_paid) - new Date(t_approved)) / 1000);
        }

        // Check if it's an inbound ASN (has arrived_at property) and calculate delivery time
        if (shipment.hasOwnProperty('arrived_at') && shipment.arrived_at && t_paid) {
            const deliveryDuration = (new Date(shipment.arrived_at) - new Date(t_paid)) / 1000;
            if (deliveryDuration >= 0) {
                durations.delivery.push(deliveryDuration);
            }
        }
    }

    const calculateAverage = (arr) => {
        if(arr.length === 0) return null;
        const sum = arr.reduce((acc, val) => acc + val, 0);
        return sum / arr.length;
    };
    
    return {
        brokerSubmissionAvg: formatDuration(calculateAverage(durations.submission)),
        financeApprovalAvg: formatDuration(calculateAverage(durations.approval)),
        brokerPaymentAvg: formatDuration(calculateAverage(durations.payment)),
        deliveryFromPaymentAvg: formatDuration(calculateAverage(durations.delivery)),
    };
};

const getItemsBelowReorderPoint = async () => {
    const pool = getPool();
    const query = `
        SELECT 
            ii.id as item_id,
            ii.name as item_name,
            ii.sku,
            ii.quantity as current_quantity,
            ii.reorder_point,
            (ii.reorder_point - ii.quantity) as shortfall,
            ii.location
        FROM inventory_items ii
        WHERE ii.is_serialized = FALSE 
        AND ii.quantity < ii.reorder_point
        ORDER BY shortfall DESC
    `;
    const res = await pool.query(query);
    return res.rows.map(mapToCamel);
};

const getItemsAtRiskOfStockOut = async () => {
    const pool = getPool();
    
    // Get current run rate (default: 66 installs/week)
    const runRateQuery = `
        SELECT weekly_installs, last_updated, source
        FROM system_settings 
        WHERE setting_key = 'run_rate'
        LIMIT 1
    `;
    const runRateRes = await pool.query(runRateQuery);
    const weeklyInstalls = runRateRes.rows.length > 0 ? runRateRes.rows[0].weekly_installs : 66;
    
    // Calculate 6-month demand (26 weeks)
    const sixMonthDemand = weeklyInstalls * 26;
    const variability = 0.10; // 10% variability
    
    const query = `
        SELECT 
            ii.id as item_id,
            ii.name as item_name,
            ii.sku,
            ii.quantity as current_quantity,
            ii.safety_stock,
            COALESCE(v.lead_time_days, 14) as lead_time_days,
            $1 as six_month_demand,
            $2 as variability
        FROM inventory_items ii
        LEFT JOIN vendors v ON ii.primary_vendor_id = v.id
        WHERE ii.is_serialized = FALSE
        AND ii.quantity < ($1 + ii.safety_stock)
        ORDER BY (ii.quantity - ($1 + ii.safety_stock)) ASC
    `;
    
    const res = await pool.query(query, [sixMonthDemand, variability]);
    
    return res.rows.map(row => {
        const demandRange = {
            min: Math.round(row.six_month_demand * (1 - row.variability)),
            max: Math.round(row.six_month_demand * (1 + row.variability))
        };
        
        // Calculate projected stock-out date
        const weeklyDemand = row.six_month_demand / 26;
        const weeksUntilStockOut = Math.max(0, Math.floor((row.current_quantity - row.safety_stock) / weeklyDemand));
        const projectedStockOutDate = weeksUntilStockOut > 0 ? `Week ${weeksUntilStockOut}` : 'Immediate';
        
        return {
            itemId: row.item_id,
            itemName: row.item_name,
            sku: row.sku,
            currentQuantity: row.current_quantity,
            sixMonthDemand: row.six_month_demand,
            demandRange,
            projectedStockOutDate,
            leadTime: row.lead_time_days
        };
    });
};

const getCurrentRunRate = async () => {
    const pool = getPool();
    const query = `
        SELECT weekly_installs, last_updated, source
        FROM system_settings 
        WHERE setting_key = 'run_rate'
        LIMIT 1
    `;
    const res = await pool.query(query);
    
    if (res.rows.length > 0) {
        return {
            weeklyInstalls: res.rows[0].weekly_installs,
            lastUpdated: res.rows[0].last_updated,
            source: res.rows[0].source
        };
    }
    
    // Default values if no setting exists
    return {
        weeklyInstalls: 66,
        lastUpdated: new Date().toISOString(),
        source: 'default'
    };
};

const updateRunRate = async (weeklyInstalls) => {
    const pool = getPool();
    const query = `
        INSERT INTO system_settings (setting_key, weekly_installs, last_updated, source)
        VALUES ('run_rate', $1, NOW(), 'manual')
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
            weekly_installs = EXCLUDED.weekly_installs,
            last_updated = EXCLUDED.last_updated,
            source = EXCLUDED.source
    `;
    await pool.query(query, [weeklyInstalls]);
    
    return getCurrentRunRate();
};

module.exports = {
    getDashboardMetrics,
    getShipmentChartData,
    getOrderVolumeChartData,
    getUnacknowledgedOrdersCount,
    getWorkflowMetrics,
    getItemsBelowReorderPoint,
    getItemsAtRiskOfStockOut,
    getCurrentRunRate,
    updateRunRate,
};