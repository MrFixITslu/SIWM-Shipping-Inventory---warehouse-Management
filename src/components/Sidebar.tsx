


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { dashboardService } from '@/services/dashboardService';
import { ALL_NAV_ITEMS } from '@/constants';
import DesktopSidebar from './sidebar/DesktopSidebar';
import MobileSidebar from './sidebar/MobileSidebar';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, toggleDarkMode, isDarkMode }) => {
  const auth = useAuth();
  const navigate = useNavigate();

  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch initial count on mount
  useEffect(() => {
    if (auth.user) {
      dashboardService.getUnacknowledgedOrdersCount()
        .then(count => setNotificationCount(count))
        .catch(err => console.error("Failed to fetch initial notification count:", err));
    }
  }, [auth.user]);

  // Listen for real-time updates to the notification count
  useRealtimeUpdates({
    'unacknowledged_orders_count_changed': (data: { count: number }) => {
      if (typeof data.count === 'number') {
        setNotificationCount(data.count);
      }
    }
  });

  // Re-filter navigation items when permissions or notification count changes
  useEffect(() => {
    if (auth.user) {
      const permittedNavs = ALL_NAV_ITEMS
        .filter(item => auth.user?.role === 'admin' || auth.user?.permissions.includes(item.permission))
        .map(item => item.path === '/orders' ? { ...item, notificationCount } : item);
      setNavItems(permittedNavs);
    }
  }, [auth.user, notificationCount]);

  const handleLogout = () => {
    auth.logout();
    navigate('/login'); // Redirect to login page after logout
  };

  const mainNavLinks = navItems.filter(item => !item.isBottom);
  const bottomNavLinks = navItems.filter(item => item.isBottom);

  return (
    <>
      <MobileSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        mainNavLinks={mainNavLinks}
        bottomNavLinks={bottomNavLinks}
        user={auth.user}
      />
      
      <DesktopSidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        mainNavLinks={mainNavLinks}
        bottomNavLinks={bottomNavLinks}
        user={auth.user}
      />
      
      {/* Hamburger menu for mobile, shown when sidebar is closed */}
      <div className="fixed top-0 left-0 z-50 p-4 lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-800 rounded-md shadow-md"
          aria-label="Open navigation menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
    </>
  );
};

export default Sidebar;