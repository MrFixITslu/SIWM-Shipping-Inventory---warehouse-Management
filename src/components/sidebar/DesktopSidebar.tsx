import React from 'react';
import { NavLink } from 'react-router-dom';
import { NavItem, User } from '@/types';
import {
  APP_NAME,
  UserCircleIcon,
  SunIconSolid,
  MoonIconSolid,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  CloseIcon as HeroXMarkIcon,
} from '@/constants';

interface DesktopSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  mainNavLinks: NavItem[];
  bottomNavLinks: NavItem[];
  user: User | null;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isOpen,
  setIsOpen,
  isDarkMode,
  toggleDarkMode,
  handleLogout,
  mainNavLinks,
  bottomNavLinks,
  user,
}) => {
  const commonIconClass = "h-6 w-6 transition-colors duration-200";
  const linkClass = "flex items-center px-4 py-3 rounded-lg hover:bg-primary-500 hover:text-white transition-colors duration-200";
  const activeLinkClass = "bg-primary-600 text-white shadow-md";
  const inactiveLinkClass = "text-secondary-700 dark:text-secondary-300 hover:dark:text-white";

  const renderDesktopNavLinks = (items: NavItem[]) => (
    items.map((item) => (
         <NavLink
              key={item.name}
              to={item.path}
              title={isOpen ? '' : item.name}
              className={({ isActive }) =>
                `${linkClass} ${isActive ? activeLinkClass : inactiveLinkClass} ${isOpen ? '' : 'justify-center'}`
              }
            >
              <div className="relative flex-shrink-0">
                <item.icon className={commonIconClass} />
                {isOpen && item.notificationCount && item.notificationCount > 0 &&
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full align-super relative -top-2">
                    {item.notificationCount}
                  </span>
                }
                {!isOpen && item.notificationCount && item.notificationCount > 0 &&
                  <span className="absolute -top-1 right-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full align-super">
                    {item.notificationCount}
                  </span>
                }
              </div>
              {isOpen && <span className="flex-1 ml-3">{item.name}</span>}
              {isOpen && item.isBeta && 
                <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded-full">Beta</span>
              }
            </NavLink>
    ))
  );

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex-col bg-white dark:bg-secondary-800 shadow-lg transition-all duration-300 ease-in-out hidden lg:flex ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className={`flex items-center h-16 px-4 border-b border-secondary-200 dark:border-secondary-700 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        {isOpen && <span className="text-xl font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">{APP_NAME}</span>}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 rounded-md text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 focus:outline-none"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <HeroXMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-grow p-4 space-y-2">
          {user && isOpen && (
            <div className="px-0 py-3 mb-2 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center">
                <UserCircleIcon className={`${commonIconClass} mr-3 text-secondary-500 dark:text-secondary-400 flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-secondary-800 dark:text-secondary-200 truncate">{user.name}</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          {renderDesktopNavLinks(mainNavLinks)}
        </nav>
        <nav className="p-4 space-y-2 border-t border-secondary-200 dark:border-secondary-700">
            {renderDesktopNavLinks(bottomNavLinks)}
        </nav>
      </div>
      <div className={`p-4 border-t border-secondary-200 dark:border-secondary-700 space-y-2 ${isOpen ? '' : 'flex flex-col items-center'}`}>
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center px-4 py-3 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors duration-200 ${isOpen ? 'w-full' : ''}`}
        >
          {isDarkMode ? <SunIconSolid className={`${commonIconClass} ${isOpen ? 'mr-3' : ''}`} /> : <MoonIconSolid className={`${commonIconClass} ${isOpen ? 'mr-3' : ''}`} />}
          {isOpen && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
         {user && (
            <button
              onClick={handleLogout}
              title="Logout"
              className={`flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-700/50 transition-colors duration-200 ${isOpen ? 'w-full' : ''}`}
            >
              <ArrowLeftOnRectangleIcon className={`${commonIconClass} ${isOpen ? 'mr-3' : ''}`} />
              {isOpen && <span>Logout</span>}
            </button>
          )}
      </div>
    </aside>
  );
};

export default DesktopSidebar;