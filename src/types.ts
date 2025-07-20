export enum FeeStatus {
    PendingSubmission = 'Pending Submission',
    PendingApproval = 'Pending Approval',
    Approved = 'Approved',
    Rejected = 'Rejected',
    PaymentConfirmed = 'Payment Confirmed',
}

export interface ShipmentFees {
    duties?: number;
    shipping?: number;
    storage?: number;
}


export interface ASNItem {
    id: number;
    asnId: number;
    inventoryItemId: number;
    quantity: number;
    newSerials?: string[];
    itemName?: string;
    itemSku?: string;
}

export interface ASN {
  id: number;
  poNumber?: string;
  department?: string;
  supplier: string;
  expectedArrival: string;
  status: 'On Time' | 'Delayed' | 'At the Warehouse' | 'Processing' | 'Discrepancy Review' | 'Complete';
  itemCount: number;
  carrier: string;
  poFileData?: string;
  poFileName?: string;
  vendorInvoiceData?: string;
  vendorInvoiceName?: string;
  shippingInvoiceData?: string;
  shippingInvoiceName?: string;
  billOfLadingData?: string;
  billOfLadingName?: string;
  // New fields for Broker/Finance workflow
  brokerId?: number;
  brokerName?: string;
  fees?: ShipmentFees;
  feeStatus?: FeeStatus;
  feeStatusHistory?: Array<{ status: string; timestamp: string; userId?: number; fromStatus?: string }>;
  paymentConfirmationName?: string;
  paymentConfirmationData?: string;
  createdAt?: string;
  completedAt?: string;
  items?: ASNItem[];
  // New warehouse-related fields
  warehouse_id?: number;
  warehouse_name?: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  department?: string; // New: Department field for inventory items
  quantity: number; // For non-serialized, this is total. For serialized, this is serialNumbers.length
  location: string; // e.g., Aisle 5, Shelf B
  reorderPoint: number;
  supplierId?: number;
  lastStocktakeDate?: string;
  imageUrl?: string; 
  isSerialized?: boolean; // New: Indicates if the item is tracked by individual serial numbers
  serialNumbers?: string[]; // New: Array of unique serial numbers for this item
  costPrice?: number; // For stock valuation
  entryDate?: string; // For aging report
  lastMovementDate?: string; // For aging report
  isAged?: boolean; // New: Indicates if this item was in the warehouse before the app was available
  // New warehouse-related fields
  warehouse_id?: number;
  warehouse_name?: string;
  zone_code?: string;
  aisle_code?: string;
  shelf_code?: string;
  safety_stock?: number;
  primary_vendor_id?: number;
}

export enum OrderStatus {
  Pending = 'Pending',
  Acknowledged = 'Acknowledged',
  Picking = 'Picking',
  Packed = 'Packed',
  ReadyForPickup = 'Ready for Pick-up',
  PickedUp = 'Picked Up', // Indicates it has left warehouse control for dispatch
  Completed = 'Completed', // Indicates items have been received by end destination/requester
  Cancelled = 'Cancelled'
}

export interface OrderItem {
  itemId: number;
  quantity: number; // For serialized, this would often be 1 per serial, or total count of serials
  name?: string; // Denormalized for display
  pickedSerialNumbers?: string[]; // New: Specific serials picked for this order item
}

export interface WarehouseOrder {
  id: number;
  department: string;
  items: OrderItem[];
  status: OrderStatus;
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  picker?: string; // This is the technician's name
  technicianId?: number; // The ID of the technician user
  statusHistory?: Array<{ status: string; timestamp: string; userId?: number; userName?: string; }>; // Log of status changes
  // New warehouse-related fields
  warehouse_id?: number;
  warehouse_name?: string;
}


export interface OutboundShipment {
  id: number;
  orderId?: number; // Made optional for inter-warehouse transfers
  carrier: 'FedEx' | 'UPS' | 'DHL' | 'Other';
  trackingNumber: string;
  destinationAddress: string;
  status: 'Preparing' | 'In Transit' | 'Delivered' | 'Delayed' | 'Returned';
  dispatchDate: string;
  estimatedDeliveryDate: string;
  shippedSerialNumbers?: Record<number, string[]>; 
  actualDeliveryDate?: string; // For SLA compliance
  
  // New fields for Broker/Finance workflow
  brokerId?: number;
  brokerName?: string;
  fees?: ShipmentFees;
  feeStatus?: FeeStatus;
  feeStatusHistory?: Array<{ status: string; timestamp: string; userId?: number; fromStatus?: string }>;
  paymentConfirmationName?: string;
  paymentConfirmationData?: string; // e.g., transaction ID or receipt data
  createdAt?: string;
  // New warehouse-related fields
  warehouse_id?: number;
  warehouse_name?: string;
}

export interface Vendor {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  performanceScore: number; // 0-100
  lastCommunicationDate: string;
  products: string[]; // List of product categories they supply
  averageLeadTime?: number; // in days
  totalSpend?: number; 
  // New warehouse-related fields
  preferred_warehouse_id?: number;
  preferred_warehouse_name?: string;
}

export interface ChatMessage {
  id:string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  isLoading?: boolean;
}

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  permission: string; // Permission required to see this nav item
  isBeta?: boolean; // For new features
  isBottom?: boolean; // For items like Logout
  notificationCount?: number;
}

export interface DashboardMetric {
  title: string;
  value: string | number;
  change?: string; // e.g., "+5%"
  changeType?: 'positive' | 'negative';
  icon: React.ElementType;
  description?: string;
}

export interface WorkflowMetric {
    title: string;
    value: string;
    icon: React.ElementType;
}


// For table component
export interface ColumnDefinition<T, K extends keyof T> {
  key: K;
  header: string;
  render?: (item: T) => React.ReactNode; // Optional custom renderer
  sortable?: boolean;
}

// Reporting & Alerting Module Types

export enum ReportCategory {
  Inventory = "Inventory Reports",
  ProcurementVendor = "Procurement & Vendor Reports",
  InboundOutbound = "Inbound & Outbound Reports",
  WarehouseOps = "Warehouse Operations Reports",
  AIPredictive = "AI & Predictive Reports",
}

export type ReportFilterType = 'date-range' | 'select' | 'multi-select' | 'text' | 'number-range';

export interface ReportFilterOption {
  value: string | number;
  label: string;
}
export interface ReportFilter {
  id: string;
  label: string;
  type: ReportFilterType;
  options?: ReportFilterOption[]; 
  defaultValue?: any;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  aiPowered?: boolean;
  filters?: ReportFilter[];
  columns: ColumnDefinition<any, any>[];
  naturalLanguageQuery?: string; // For matching NL queries
  sampleDataKey?: string; // Key to fetch data from reportingService
}

export enum AlertSeverity {
  Info = 'Info',
  Warning = 'Warning',
  Error = 'Error',
  Critical = 'Critical'
}

export interface AlertLogEntry {
  id: number;
  timestamp: number;
  severity: AlertSeverity;
  message: string;
  type: string; // e.g., 'Low Stock', 'Delayed Shipment'
  isRead: boolean;
  detailsLink?: string; // Optional link to relevant page/item
}

export enum NotificationChannel {
  InApp = 'In-App',
  Email = 'Email',
  SMS = 'SMS',
}

export interface UserAlertPreference {
  alertType: string; // Corresponds to AlertLogEntry.type
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface ScheduledReportSubscription {
  reportId: string; // Corresponds to ReportDefinition.id
  reportName?: string; // Denormalized
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface NotificationPreferences {
  alertPreferences: UserAlertPreference[];
  scheduledReportSubscriptions: ScheduledReportSubscription[];
}


// Sample data types for specific reports (illustrative)
export interface StockLevelReportItem extends InventoryItem {
    // Inherits from InventoryItem, can add more specific fields if needed
}

export interface SerializedInventoryReportItem {
    itemId: number;
    itemName: string;
    sku: string;
    serialNumber: string;
    location: string;
    status: 'In Stock' | 'Allocated' | 'Shipped' | 'Returned'; // Example statuses
    entryDate?: string;
}

export interface VendorPerformanceReportItem extends Vendor {
    onTimeDeliveryRate: number; // percentage
    qualityRating: number; // e.g., 1-5 stars or percentage
}

export interface StockOutRiskForecastItem {
    itemId: number;
    itemName: string;
    sku: string;
    currentStock: number;
    predictedStockOutDays: number;
    confidence: number;
    recommendedReorderQty: number;
}

// Asset Management Module Types
export enum WarehouseAssetType {
  Forklift = 'Forklift',
  PalletJack = 'Pallet Jack',
  ConveyorBelt = 'Conveyor Belt',
  ShelvingUnit = 'Shelving Unit',
  HandheldScanner = 'Handheld Scanner',
  RoboticArm = 'Robotic Arm',
  AGV = 'Automated Guided Vehicle',
  Other = 'Other Equipment',
}

export enum AssetStatus {
  Operational = 'Operational',
  UnderMaintenance = 'Under Maintenance',
  RequiresRepair = 'Requires Repair',
  Decommissioned = 'Decommissioned',
}

export interface WarehouseAsset {
  id: number;
  name: string;
  assetType: WarehouseAssetType;
  serialNumber?: string;
  location: string; 
  status: AssetStatus;
  purchaseDate: string; 
  purchaseCost?: number;
  lastMaintenanceDate?: string; 
  nextScheduledMaintenance?: string;
  notes?: string;
  imageUrl?: string;
}

export enum MaintenanceType {
  Preventive = 'Preventive',
  Corrective = 'Corrective',
  Inspection = 'Inspection',
  Upgrade = 'Upgrade',
}

export interface MaintenanceRecord {
  id: number;
  assetId: number; 
  assetName?: string; 
  date: string; 
  type: MaintenanceType;
  description: string;
  performedBy?: string; 
  cost?: number;
  downtimeHours?: number; 
}

// Authentication Types
export type UserRole = 'admin' | 'manager' | 'Warehouse' | 'Finance' | 'Broker' | 'Requester' | 'Technician' | 'Contractor';

export interface User {
  id: number; // Unified ID for frontend use
  name: string;
  email: string;
  role: UserRole;
  token: string;
  permissions: string[];
  // Fields for User Management Page
  contactNumber?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

// For technician dropdown
export interface UserSummary {
  id: number;
  name: string;
  role?: UserRole;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: User['role']) => Promise<void>;
  logout: () => void;
}

// For user audit trail
export interface AuditLogEntry {
  id: number;
  actingUserName: string | null;
  targetUserName: string;
  action: string;
  details: any;
  timestamp: string;
}

// For receiving workflow
export interface ReceivedItem {
    itemId: number;
    receivedQuantity: number;
    receivedSerials?: string[];
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_id?: number;
  capacity_sqft?: number;
  status: 'active' | 'inactive' | 'maintenance';
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseZone {
  id: number;
  warehouse_id: number;
  name: string;
  code: string;
  description?: string;
  temperature_zone: 'ambient' | 'cold' | 'frozen';
  created_at: string;
}

export interface WarehouseAisle {
  id: number;
  zone_id: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

export interface WarehouseShelf {
  id: number;
  aisle_id: number;
  name: string;
  code: string;
  level: number;
  capacity_cubic_ft?: number;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'inventory' | 'shipping' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: number;
  created_by: number;
  warehouse_id?: number;
  related_order_id?: number;
  related_shipment_id?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface SupportTicketResponse {
  id: number;
  ticket_id: number;
  user_id?: number;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface OfflineAction {
  id: number;
  user_id: number;
  action_type: 'create' | 'update' | 'delete';
  entity_type: 'inventory' | 'order' | 'shipment' | 'asn' | 'support_ticket';
  entity_id?: number;
  action_data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  processed_at?: string;
  retry_count: number;
}

export interface InventoryMovement {
  id: number;
  inventory_item_id: number;
  warehouse_id: number;
  movement_type: 'received' | 'shipped' | 'transferred' | 'adjusted' | 'counted';
  quantity: number;
  from_location?: string;
  to_location?: string;
  reference_type?: 'order' | 'shipment' | 'asn' | 'manual';
  reference_id?: number;
  performed_by?: number;
  notes?: string;
  created_at: string;
}

export interface WarehouseCapacity {
  id: number;
  warehouse_id: number;
  date: string;
  total_capacity_cubic_ft?: number;
  used_capacity_cubic_ft?: number;
  available_capacity_cubic_ft?: number;
  capacity_percentage?: number;
  created_at: string;
}

export interface WarehousePerformance {
  id: number;
  warehouse_id: number;
  date: string;
  orders_processed: number;
  shipments_processed: number;
  items_received: number;
  items_shipped: number;
  average_order_fulfillment_time_hours?: number;
  average_shipment_processing_time_hours?: number;
  created_at: string;
}

// Enhanced InventoryItem with warehouse support




// Dashboard types for multi-warehouse
export interface WarehouseMetric {
  warehouse_id: number;
  warehouse_name: string;
  warehouse_code: string;
  active_shipments: number;
  inventory_items: number;
  pending_orders: number;
  dispatches_today: number;
  stock_alerts: number;
  capacity_percentage: number;
}

export interface InventoryFlowData {
  warehouse_id: number;
  warehouse_name: string;
  movements_today: number;
  items_received: number;
  items_shipped: number;
  items_transferred: number;
  average_processing_time_hours: number;
}

// Customer Support Dashboard types
export interface SupportDashboardMetric {
  total_tickets: number;
  open_tickets: number;
  resolved_today: number;
  average_resolution_time_hours: number;
  tickets_by_priority: Record<string, number>;
  tickets_by_category: Record<string, number>;
}

// Offline capability types
export interface OfflineStatus {
  isOnline: boolean;
  lastSyncTime?: string;
  pendingActions: number;
  syncInProgress: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedActions: number;
  failedActions: number;
  errors: string[];
}