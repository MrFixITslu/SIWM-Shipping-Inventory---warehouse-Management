# Troubleshooting Guide

## Common Issues and Solutions

### 1. WebSocket Connection Issues

**Problem**: WebSocket connection to 'ws://localhost:5176/?token=...' failed

**Solution**: 
- The Vite dev server runs on port 5173, not 5176
- Make sure you're accessing the app at `http://localhost:5173`
- If you see port 5176 in the URL, refresh the page or restart the dev server

**To restart the dev server**:
```bash
# Stop the current server (Ctrl+C)
# Then run:
npm run dev:clean
```

### 2. Service Worker Errors

**Problem**: "Failed to convert value to 'Response'" errors

**Solution**: 
- The service worker has been updated to handle missing files gracefully
- Clear your browser cache and reload the page
- Or unregister the service worker in DevTools > Application > Service Workers

### 3. Icon Loading Issues

**Problem**: Manifest icons failing to load

**Solution**:
- Icons are now properly configured in the manifest
- Clear browser cache and reload
- Check that icon files exist in `/public/icons/`

### 4. Hot Module Replacement (HMR) Issues

**Problem**: Changes not reflecting automatically

**Solution**:
- Restart the dev server: `npm run dev:clean`
- Check that you're accessing the correct port (5173)
- Clear browser cache

### 5. Development Server Port Conflicts

**Problem**: Port already in use

**Solution**:
```bash
# Kill processes on port 5173
npx kill-port 5173

# Or restart with clean cache
npm run dev:clean
```

## Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start only frontend (for debugging)
npm run dev:frontend

# Start only backend
npm run dev:backend

# Clean start (clears Vite cache)
npm run dev:clean

# Build for production
npm run build

# Preview production build
npm run preview
```

## Browser Setup

1. **Clear Cache**: Hard refresh (Ctrl+Shift+R) or clear browser cache
2. **DevTools**: Open DevTools and check:
   - Console for errors
   - Network tab for failed requests
   - Application > Service Workers for SW issues
3. **Access URL**: Make sure you're using `http://localhost:5173`

## File Structure

```
Inventoryapp/
├── public/
│   ├── icons/           # App icons
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker
├── src/
│   ├── utils/
│   │   └── serviceWorker.ts  # SW registration
│   └── ...
└── vite.config.ts      # Vite configuration
```

## Common Fixes

1. **Port Issues**: Always use port 5173 for development
2. **Cache Issues**: Use `npm run dev:clean` to clear Vite cache
3. **Service Worker**: Unregister in DevTools if causing issues
4. **Icons**: Check that icon files exist in `/public/icons/`
5. **HMR**: Restart dev server if hot reload stops working 