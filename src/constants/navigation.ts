
import { NavItem } from '@/types';
import { 
  HomeIcon, 
  ShipmentIcon, 
  InventoryIcon, 
  OrderIcon, 
  DispatchIcon, 
  VendorIcon, 
  WrenchScrewdriverIcon,
  DatabaseIcon,
  ChartBarIcon, 
  BellIcon,
  ShieldCheckIcon,
  BookOpenIcon,
  ChatIcon,
  BuildingOfficeIcon,
} from './icons';

export const ALL_NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon, permission: 'dashboard' },
  { name: 'Incoming Shipments', path: '/incoming-shipments', icon: ShipmentIcon, permission: 'incoming-shipments' },
  { name: 'Inventory', path: '/inventory', icon: InventoryIcon, permission: 'inventory' },
  { name: 'Warehouse Orders', path: '/orders', icon: OrderIcon, permission: 'orders' },
  { name: 'Dispatch & Logistics', path: '/dispatch', icon: DispatchIcon, permission: 'dispatch' },
  { name: 'Warehouse Management', path: '/warehouse-management', icon: BuildingOfficeIcon, permission: 'warehouse-management' },
  { name: 'Vendors', path: '/vendors', icon: VendorIcon, permission: 'vendors' },
  { name: 'Asset Management', path: '/assets', icon: WrenchScrewdriverIcon, permission: 'assets' },
  { name: 'Master Data Governance', path: '/master-data', icon: DatabaseIcon, permission: 'master-data' },
  { name: 'Reporting & Analytics', path: '/reports', icon: ChartBarIcon, permission: 'reports' },
  { name: 'Notifications', path: '/notifications', icon: BellIcon, permission: 'notifications' },
  { name: 'Compliance', path: '/compliance', icon: ShieldCheckIcon, permission: 'compliance' },
  { name: 'User Management', path: '/user-management', icon: ShieldCheckIcon, permission: 'user-management' },
  { name: 'Customer Support', path: '/customer-support', icon: ChatIcon, permission: 'customer-support' },
  { name: 'User Guide', path: '/help', icon: BookOpenIcon, permission: 'help', isBottom: true },
];