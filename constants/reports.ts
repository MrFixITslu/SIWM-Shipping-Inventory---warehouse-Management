import { ReportCategory, ReportDefinition, ColumnDefinition, InventoryItem } from '@/types';

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'inv_stock_levels',
    name: 'Current Stock Levels',
    description: 'View current quantities by SKU, location, and category.',
    category: ReportCategory.Inventory,
    sampleDataKey: 'inv_stock_levels', // Key matches backend service logic
    filters: [
      { id: 'category', label: 'Category', type: 'select', options: [] }, // Options will be populated dynamically
      { id: 'location', label: 'Location', type: 'text' },
    ],
    columns: [
      { key: 'sku', header: 'SKU', sortable: true },
      { key: 'name', header: 'Item Name', sortable: true },
      { key: 'category', header: 'Category', sortable: true },
      { key: 'quantity', header: 'Quantity', sortable: true },
      { key: 'location', header: 'Location', sortable: true },
      { key: 'reorderPoint', header: 'Reorder Point', sortable: true, render: (item: InventoryItem) => item.isSerialized ? 'N/A' : item.reorderPoint },
    ] as ColumnDefinition<InventoryItem, keyof InventoryItem>[],
    naturalLanguageQuery: 'current stock levels'
  },
  {
    id: 'inv_serialized_report',
    name: 'Serialized Inventory Report',
    description: 'Track individual serialized items and their status.',
    category: ReportCategory.Inventory,
    sampleDataKey: 'inv_serialized_report',
    filters: [{ id: 'sku', label: 'SKU', type: 'text' }, { id: 'status', label: 'Status', type: 'select', options: [{value: 'In Stock', label: 'In Stock'}, {value: 'Allocated', label: 'Allocated'}] }],
    columns: [
      { key: 'sku', header: 'SKU', sortable: true },
      { key: 'item_name', header: 'Item Name', sortable: true }, // Note: backend might return item_name
      { key: 'serial_number', header: 'Serial Number', sortable: true }, // Note: backend might return serial_number
      { key: 'location', header: 'Location', sortable: true },
      { key: 'status', header: 'Status', sortable: true },
      { key: 'entry_date', header: 'Entry Date', sortable: true }, // Note: backend might return entry_date
    ],
  },
  {
    id: 'inv_aging_report',
    name: 'Inventory Aging Report',
    description: 'Identify slow-moving and obsolete stock based on age.',
    category: ReportCategory.Inventory,
    sampleDataKey: 'inv_aging_report',
    filters: [{ id: 'minDaysInStock', label: 'Min. Days In Stock', type: 'number-range' }],
    columns: [
      { key: 'sku', header: 'SKU', sortable: true },
      { key: 'name', header: 'Item Name', sortable: true },
      { key: 'quantity', header: 'Quantity', sortable: true },
      { key: 'entry_date', header: 'Entry Date', sortable: true },
      { key: 'last_movement_date', header: 'Last Movement', sortable: true },
      { key: 'days_in_stock', header: 'Days In Stock', sortable: true },
      { key: 'cost_price', header: 'Cost Price', sortable: true, render: (item: {cost_price?: number}) => item.cost_price ? `$${item.cost_price.toFixed(2)}` : 'N/A' },
      { key: 'total_value', header: 'Total Value', sortable: true, render: (item: {quantity: number; cost_price?: number}) => `$${(item.quantity * (item.cost_price || 0)).toFixed(2)}` },
    ],
  },
  {
    id: 'inv_below_reorder_point',
    name: 'Items Below Reorder Point',
    description: 'Critical items that have fallen below their reorder point and require immediate attention.',
    category: ReportCategory.Inventory,
    sampleDataKey: 'inv_below_reorder_point',
    filters: [
      { id: 'category', label: 'Category', type: 'select', options: [] },
      { id: 'location', label: 'Location', type: 'text' },
      { id: 'shortfallRange', label: 'Shortfall Range', type: 'select', options: [
        { value: 'low', label: 'Low (1-10 units)' },
        { value: 'medium', label: 'Medium (11-50 units)' },
        { value: 'high', label: 'High (50+ units)' }
      ]}
    ],
    columns: [
      { key: 'itemName', header: 'Item Name', sortable: true },
      { key: 'sku', header: 'SKU', sortable: true },
      { key: 'currentQuantity', header: 'Current Quantity', sortable: true },
      { key: 'reorderPoint', header: 'Reorder Point', sortable: true },
      { key: 'shortfall', header: 'Shortfall', sortable: true, render: (item: any) => 
        `-${item.shortfall}`
      },
      { key: 'category', header: 'Category', sortable: true },
      { key: 'location', header: 'Location', sortable: true },
    ] as ColumnDefinition<any, keyof any>[],
    naturalLanguageQuery: 'below reorder point'
  },
  {
    id: 'inv_stock_out_risk_6months',
    name: 'Items at Risk of Stock-Out (6 Months)',
    description: 'Items projected to run out of stock within 6 months based on current demand patterns and lead times.',
    category: ReportCategory.AIPredictive,
    aiPowered: true,
    sampleDataKey: 'inv_stock_out_risk_6months',
    filters: [
      { id: 'category', label: 'Category', type: 'select', options: [] },
      { id: 'riskLevel', label: 'Risk Level', type: 'select', options: [
        { value: 'critical', label: 'Critical (< 4 weeks)' },
        { value: 'high', label: 'High (4-8 weeks)' },
        { value: 'medium', label: 'Medium (8-12 weeks)' },
        { value: 'low', label: 'Low (12-24 weeks)' }
      ]},
      { id: 'leadTimeRange', label: 'Lead Time', type: 'select', options: [
        { value: 'short', label: 'Short (1-7 days)' },
        { value: 'medium', label: 'Medium (8-21 days)' },
        { value: 'long', label: 'Long (22+ days)' }
      ]}
    ],
    columns: [
      { key: 'itemName', header: 'Item Name', sortable: true },
      { key: 'sku', header: 'SKU', sortable: true },
      { key: 'currentQuantity', header: 'Current Quantity', sortable: true },
      { key: 'sixMonthDemand', header: '6-Month Demand', sortable: true, render: (item: any) => 
        `${item.sixMonthDemand.toLocaleString()} (${item.demandRange.min.toLocaleString()}–${item.demandRange.max.toLocaleString()})`
      },
      { key: 'projectedStockOutDate', header: 'Projected Stock-Out', sortable: true, render: (item: any) => 
        item.projectedStockOutDate
      },
      { key: 'leadTime', header: 'Lead Time (Days)', sortable: true },
      { key: 'variability', header: 'Variability (%)', sortable: true, render: (item: any) => `±${item.variability}%` },
      { key: 'category', header: 'Category', sortable: true },
      { key: 'location', header: 'Location', sortable: true },
    ] as ColumnDefinition<any, keyof any>[],
    naturalLanguageQuery: 'stock out risk 6 months'
  },
  {
    id: 'inv_run_rate_history',
    name: 'Run Rate History & Configuration',
    description: 'Track historical run rates and configuration changes for demand forecasting.',
    category: ReportCategory.AIPredictive,
    sampleDataKey: 'inv_run_rate_history',
    filters: [
      { id: 'dateRange', label: 'Date Range', type: 'select', options: [
        { value: '7days', label: 'Last 7 Days' },
        { value: '30days', label: 'Last 30 Days' },
        { value: '90days', label: 'Last 90 Days' },
        { value: 'all', label: 'All Time' }
      ]},
      { id: 'source', label: 'Data Source', type: 'select', options: [
        { value: 'dispatch', label: 'Dispatch Data' },
        { value: 'manual', label: 'Manual Input' },
        { value: 'default', label: 'Default Values' }
      ]}
    ],
    columns: [
      { key: 'weeklyInstalls', header: 'Weekly Installs', sortable: true },
      { key: 'source', header: 'Source', sortable: true, render: (item: any) => 
        item.source.charAt(0).toUpperCase() + item.source.slice(1)
      },
      { key: 'lastUpdated', header: 'Last Updated', sortable: true, render: (item: any) => 
        new Date(item.lastUpdated).toLocaleDateString()
      },
      { key: 'dailyAverage', header: 'Daily Average', sortable: true, render: (item: any) => 
        Math.round(item.weeklyInstalls / 6).toLocaleString()
      },
      { key: 'monthlyProjection', header: 'Monthly Projection', sortable: true, render: (item: any) => 
        Math.round(item.weeklyInstalls * 4.33).toLocaleString()
      },
    ] as ColumnDefinition<any, keyof any>[],
    naturalLanguageQuery: 'run rate history'
  },
  {
    id: 'ai_stock_out_forecast',
    name: 'Stock-Out Risk Forecast',
    description: 'AI-powered prediction of items at risk of stocking out.',
    category: ReportCategory.AIPredictive,
    aiPowered: true,
    sampleDataKey: 'ai_stock_out_forecast',
    columns: [
      { key: 'sku', header: 'SKU', sortable: true },
      { key: 'itemName', header: 'Item Name', sortable: true }, // Matches mock and expected backend key from service
      { key: 'currentStock', header: 'Current Stock', sortable: true },
      { key: 'predictedStockOutDays', header: 'Predicted Stock-Out (Days)', sortable: true },
      { key: 'confidence', header: 'Confidence', sortable: true, render: (item: {confidence?: number}) => item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : 'N/A'},
      { key: 'recommendedReorderQty', header: 'Rec. Reorder Qty', sortable: true },
    ],
    naturalLanguageQuery: 'stock out risk'
  },
];
