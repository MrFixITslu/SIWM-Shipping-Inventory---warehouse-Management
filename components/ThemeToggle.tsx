

import React from 'react';
import { SunIconSolid, MoonIconSolid } from '@/constants'; // Ensure these are correctly imported

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <SunIconSolid className="h-6 w-6 text-yellow-400" />
      ) : (
        <MoonIconSolid className="h-6 w-6 text-secondary-700" />
      )}
    </button>
  );
};

export default ThemeToggle;