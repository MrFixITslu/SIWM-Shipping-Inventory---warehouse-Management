
import { useLayoutEffect } from 'react';

export default function useModalScrollLock(isOpen: boolean) {
  useLayoutEffect(() => {
    if (isOpen) {
      // Get original body overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Get scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Apply styles to body
      document.body.style.overflow = 'hidden';
      // Add padding to account for scrollbar
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      // Cleanup function to restore original styles
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.paddingRight = '0px';
      };
    }
  }, [isOpen]);
}