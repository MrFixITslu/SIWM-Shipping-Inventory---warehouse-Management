import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityContextType {
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');

  // Check user's system preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load user preferences from localStorage
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' || 'medium';
    
    setIsHighContrast(savedHighContrast);
    setFontSizeState(savedFontSize);
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (isReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply font size
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${fontSize}`);
  }, [isHighContrast, isReducedMotion, fontSize]);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('highContrast', newValue.toString());
  };

  const toggleReducedMotion = () => {
    const newValue = !isReducedMotion;
    setIsReducedMotion(newValue);
    localStorage.setItem('reducedMotion', newValue.toString());
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size);
  };

  const announceToScreenReader = (message: string) => {
    // Create a live region for screen reader announcements
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove the announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const value: AccessibilityContextType = {
    isHighContrast,
    isReducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    announceToScreenReader
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessibility toolbar component
export const AccessibilityToolbar: React.FC = () => {
  const {
    isHighContrast,
    isReducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize
  } = useAccessibility();

  return (
    <div 
      className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50"
      role="toolbar"
      aria-label="Accessibility options"
    >
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        Accessibility Options
      </h3>
      
      <div className="space-y-3">
        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="high-contrast" className="text-sm text-gray-700 dark:text-gray-300">
            High Contrast
          </label>
          <button
            id="high-contrast"
            onClick={toggleHighContrast}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isHighContrast ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={isHighContrast}
            aria-label="Toggle high contrast mode"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isHighContrast ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="reduced-motion" className="text-sm text-gray-700 dark:text-gray-300">
            Reduced Motion
          </label>
          <button
            id="reduced-motion"
            onClick={toggleReducedMotion}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isReducedMotion ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={isReducedMotion}
            aria-label="Toggle reduced motion mode"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isReducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Font Size Controls */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
            Font Size
          </label>
          <div className="flex space-x-2">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-3 py-1 text-xs rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  fontSize === size
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                aria-label={`Set font size to ${size}`}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Screen reader only class
export const srOnly = 'sr-only';

// Focus trap hook for modals
export const useFocusTrap = (isActive: boolean) => {
  useEffect(() => {
    if (!isActive) return;

    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusableElement = document.querySelector(focusableElements) as HTMLElement;
    const focusableContent = document.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstFocusableElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);
};

// Skip to main content link
export const SkipToMainContent: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
  >
    Skip to main content
  </a>
); 