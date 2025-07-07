
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
      { key: 'itemName', header: 'Item Name', sortable: true },
      { key: 'serialNumber', header: 'Serial Number', sortable: true },
      { key: 'location', header: 'Location', sortable: true },
      { key: 'status', header: 'Status', sortable: true },
      { key: 'entryDate', header: 'Entry Date', sortable: true },
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
      { key: 'entryDate', header: 'Entry Date', sortable: true },
      { key: 'lastMovementDate', header: 'Last Movement', sortable: true },
      { key: 'daysInStock', header: 'Days In Stock', sortable: true },
      { key: 'costPrice', header: 'Cost Price', sortable: true, render: (item: {costPrice?: number}) => item.costPrice ? `$${item.costPrice.toFixed(2)}` : 'N/A' },
      { key: 'totalValue', header: 'Total Value', sortable: true, render: (item: {quantity: number; costPrice?: number}) => `$${(item.quantity * (item.costPrice || 0)).toFixed(2)}` },
    ],
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