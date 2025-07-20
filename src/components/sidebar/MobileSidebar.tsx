import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem, User } from '@/types';
import {
  APP_NAME,
  UserCircleIcon,
  SunIconSolid,
  MoonIconSolid,
  ArrowLeftOnRectangleIcon,
  CloseIcon as HeroXMarkIcon,
} from '@/constants';

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  mainNavLinks: NavItem[];
  bottomNavLinks: NavItem[];
  user: User | null;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  setIsOpen,
  isDarkMode,
  toggleDarkMode,
  handleLogout,
  mainNavLinks,
  bottomNavLinks,
  user
}) => {
  const commonIconClass = "h-6 w-6 transition-colors duration-200";
  const linkClass = "flex items-center px-4 py-3 rounded-lg hover:bg-primary-500 hover:text-white transition-colors duration-200";
  const activeLinkClass = "bg-primary-600 text-white shadow-md";
  const inactiveLinkClass = "text-secondary-700 dark:text-secondary-300 hover:dark:text-white";

  const renderNavLinks = (items: NavItem[], onClick?: () => void) => (
    items.map((item) => (
      <NavLink
        key={item.name}
        to={item.path}
        onClick={onClick}
        className={({ isActive }) =>
          `${linkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
        }
      >
        <div className="relative flex-shrink-0">
          <item.icon className={commonIconClass} />
          {/* Notification count as superscript in top right corner for warehouse orders */}
          {typeof item.notificationCount === 'number' && item.path === '/orders' && (
            <sup className="absolute -top-2 -right-2 text-xs font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5 shadow-md z-10">
              {item.notificationCount}
            </sup>
          )}
        </div>
        <span className="flex-1 ml-3">{item.name}</span>
        {item.isBeta && <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded-full">Beta</span>}
      </NavLink>
    ))
  );

  return (
    <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)}></div>
      <div className={`relative flex flex-col w-64 h-full bg-white dark:bg-secondary-800 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200 dark:border-secondary-700">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{APP_NAME}</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-secondary-500 hover:text-primary-500"
            aria-label="Close navigation menu"
          >
            <HeroXMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {user && (
            <div className="px-4 py-3 mb-2 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center">
                <UserCircleIcon className={`${commonIconClass} mr-3 text-secondary-500 dark:text-secondary-400`} />
                <div>
                  <p className="text-sm font-medium text-secondary-800 dark:text-secondary-200">{user.name}</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          {renderNavLinks(mainNavLinks, () => setIsOpen(false))}
          <div className="pt-2 mt-2 border-t border-secondary-200 dark:border-secondary-700">
              {renderNavLinks(bottomNavLinks, () => setIsOpen(false))}
          </div>
        </nav>
        <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors duration-200"
          >
            {isDarkMode ? <SunIconSolid className={`${commonIconClass} mr-2`} /> : <MoonIconSolid className={`${commonIconClass} mr-2`} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-700/50 transition-colors duration-200"
            >
              <ArrowLeftOnRectangleIcon className={`${commonIconClass} mr-2`} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;