
import React from 'react';
import Sidebar from '@/components/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, isSidebarOpen, setIsSidebarOpen, isDarkMode, toggleDarkMode }) => {
  return (
    <>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-secondary-100 dark:bg-secondary-900 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </>
  );
};

export default Layout;
