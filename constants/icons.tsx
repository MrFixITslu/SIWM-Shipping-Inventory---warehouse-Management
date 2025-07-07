
import React from 'react';
import { 
  HomeIcon as HeroHomeIcon, 
  TruckIcon as HeroTruckIcon, 
  ArchiveBoxIcon as HeroArchiveBoxIcon, 
  ShoppingCartIcon as HeroShoppingCartIcon, 
  PaperAirplaneIcon as HeroPaperAirplaneIcon, 
  UsersIcon as HeroUsersIcon, 
  ChatBubbleLeftEllipsisIcon as HeroChatBubbleLeftEllipsisIcon, 
  Cog6ToothIcon as HeroCog6ToothIcon, 
  SunIcon as HeroSunIcon, 
  MoonIcon as HeroMoonIcon, 
  PlusIcon as HeroPlusIcon, 
  PencilIcon as HeroPencilIcon, 
  TrashIcon as HeroTrashIcon, 
  MagnifyingGlassIcon as HeroMagnifyingGlassIcon, 
  ChevronDownIcon as HeroChevronDownIcon, 
  ChevronUpIcon as HeroChevronUpIcon, 
  XMarkIcon as HeroXMarkIcon, 
  ExclamationTriangleIcon as HeroExclamationTriangleIcon, 
  CheckCircleIcon as HeroCheckCircleIcon,
  Bars3Icon as HeroBars3Icon,
  TagIcon as HeroTagIcon, 
  CheckBadgeIcon as HeroCheckBadgeIcon,
  ChartBarIcon as HeroChartBarIcon, 
  BellIcon as HeroBellIcon, 
  ArrowTrendingUpIcon as HeroArrowTrendingUpIcon,
  DocumentTextIcon as HeroDocumentTextIcon,
  WrenchScrewdriverIcon as HeroWrenchScrewdriverIcon,
  CpuChipIcon as HeroCpuChipIcon,
  InformationCircleIcon as HeroInformationCircleIcon, 
  ViewfinderCircleIcon as HeroViewfinderCircleIcon,
  BookOpenIcon as HeroBookOpenIcon,
  CircleStackIcon as HeroCircleStackIcon, 
  ArrowLeftOnRectangleIcon as HeroArrowLeftOnRectangleIcon,
  UserCircleIcon as HeroUserCircleIcon,
  ClipboardDocumentCheckIcon as HeroClipboardDocumentCheckIcon,
  CurrencyDollarIcon as HeroCurrencyDollarIcon,
  ShieldCheckIcon as HeroShieldCheckIcon,
  ClockIcon as HeroClockIcon,
  XCircleIcon as HeroXCircleIcon
} from '@heroicons/react/24/outline';

// Re-exporting Heroicons with a consistent style or providing custom ones
export const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroHomeIcon {...props} />;
export const ShipmentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroTruckIcon {...props} />;
export const InventoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroArchiveBoxIcon {...props} />;
export const OrderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroShoppingCartIcon {...props} />;
export const DispatchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroPaperAirplaneIcon {...props} />;
export const VendorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroUsersIcon {...props} />;
export const ChatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroChatBubbleLeftEllipsisIcon {...props} />;
export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCog6ToothIcon {...props} />;
export const SunIconSolid: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroSunIcon {...props} />;
export const MoonIconSolid: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroMoonIcon {...props} />;
export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroPlusIcon {...props} />;
export const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroPencilIcon {...props} />;
export const DeleteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroTrashIcon {...props} />;
export const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroMagnifyingGlassIcon {...props} />;
export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroChevronDownIcon {...props} />;
export const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroChevronUpIcon {...props} />;
export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroXMarkIcon {...props} />;

// Updated WarningIcon type to correctly accept 'title' prop from HeroIcons
type HeroIconProps = React.ComponentProps<typeof HeroExclamationTriangleIcon>;
export const WarningIcon: React.FC<HeroIconProps> = (props) => <HeroExclamationTriangleIcon {...props} />;

export const SuccessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCheckCircleIcon {...props} />;
export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroInformationCircleIcon {...props} />; 
export const Bars3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroBars3Icon {...props} />;
export const SerialIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroTagIcon {...props} />; 
export const CheckBadgeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCheckBadgeIcon {...props} />;
export const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroChartBarIcon {...props} />;
export const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroBellIcon {...props} />;
export const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroArrowTrendingUpIcon {...props} />;
export const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroDocumentTextIcon {...props} />;
export const OperationsIcon: React.FC<React.ComponentProps<typeof HeroWrenchScrewdriverIcon>> = (props) => <HeroWrenchScrewdriverIcon {...props} />;
export const WrenchScrewdriverIcon: React.FC<React.ComponentProps<typeof HeroWrenchScrewdriverIcon>> = (props) => <HeroWrenchScrewdriverIcon {...props} />;
export const ViewfinderCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroViewfinderCircleIcon {...props} />;
export const AiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCpuChipIcon {...props} />;
export const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroBookOpenIcon {...props} />;
export const DatabaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCircleStackIcon {...props} />;
export const ArrowLeftOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroArrowLeftOnRectangleIcon {...props} />;
export const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroUserCircleIcon {...props} />;
export const ClipboardDocumentCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroClipboardDocumentCheckIcon {...props} />;
export const CurrencyDollarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroCurrencyDollarIcon {...props} />;
export const ShieldCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroShieldCheckIcon {...props} />;
export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroClockIcon {...props} />;
export const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroXCircleIcon {...props} />;


// Direct export for icons used by their original names
export const PaperAirplaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroPaperAirplaneIcon {...props} />;
export const ChatBubbleLeftEllipsisIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroChatBubbleLeftEllipsisIcon {...props} />;
export const TruckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HeroTruckIcon {...props} />;
