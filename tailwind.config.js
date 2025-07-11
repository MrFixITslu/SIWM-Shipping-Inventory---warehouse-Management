/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#F7F8FA',
        surface: '#FFFFFF',
        primary: {
          50: '#f5f7ff',
          100: '#edefff',
          200: '#d1d5fa',
          300: '#b0b6f1',
          400: '#8a93e6',
          500: '#6366F1', // Indigo 500
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          500: '#06B6D4', // Cyan 500
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: '#22C55E',
        warning: '#F59E42',
        error: '#EF4444',
        info: '#3B82F6',
        border: '#E5E7EB',
        text: {
          primary: '#1A202C',
          secondary: '#64748B',
        },
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(16, 30, 54, 0.06)',
        focus: '0 0 0 3px rgba(99, 102, 241, 0.3)',
      },
      borderRadius: {
        xl: '1rem',
        lg: '0.75rem',
        md: '0.5rem',
      },
    }
  },
  plugins: [],
}