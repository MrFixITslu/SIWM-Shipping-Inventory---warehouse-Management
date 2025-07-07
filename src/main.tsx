import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Make sure App.tsx exists in the same folder
import './index.css'; // Optional: include global styles if you have them

// Find the root DOM node (must exist in index.html)
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element with id="root" not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
