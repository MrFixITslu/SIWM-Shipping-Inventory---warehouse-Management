const CACHE_NAME = 'vision79-inventory-v1';
const STATIC_CACHE = 'vision79-static-v1';
const DYNAMIC_CACHE = 'vision79-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/v1/inventory',
  '/api/v1/vendors',
  '/api/v1/orders',
  '/api/v1/dashboard'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        // Cache files individually to handle missing files gracefully
        return Promise.allSettled(
          STATIC_FILES.map(file => 
            cache.add(file).catch(error => {
              console.warn(`Failed to cache ${file}:`, error);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Static files caching completed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP/HTTPS requests (chrome-extension, data:, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip Vite HMR requests
  if (url.pathname.includes('__vite') || url.pathname.includes('@vite')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Handle icon requests specifically
  if (url.pathname.includes('/icons/')) {
    event.respondWith(handleIconRequest(request));
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle icon requests with proper error handling
async function handleIconRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      return response;
    }
    // If icon not found, return a default response
    return new Response('', { status: 404 });
  } catch (error) {
    console.warn('Icon request failed:', request.url, error);
    return new Response('', { status: 404 });
  }
}

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Skip non-HTTP/HTTPS requests
  if (!url.protocol.startsWith('http')) {
    return fetch(request);
  }

  // Only cache GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for GET requests
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          error: 'No internet connection. Please check your network and try again.',
          offline: true 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const url = new URL(request.url);
  
  // Skip non-HTTP/HTTPS requests
  if (!url.protocol.startsWith('http')) {
    return fetch(request);
  }
  
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  const url = new URL(request.url);
  
  // Skip non-HTTP/HTTPS requests
  if (!url.protocol.startsWith('http')) {
    return fetch(request);
  }
  
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }
    return response;
  } catch (error) {
    // Return a basic offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Vision79 Inventory</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { color: #666; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Vision79 Inventory</h1>
          <div class="offline-message">
            <p>You are currently offline.</p>
            <p>Please check your internet connection and try again.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get stored offline actions
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await performOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Background sync failed for action:', action, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Store offline actions in IndexedDB
async function storeOfflineAction(action) {
  const db = await openDB();
  const transaction = db.transaction(['offlineActions'], 'readwrite');
  const store = transaction.objectStore('offlineActions');
  await store.add({
    id: Date.now().toString(),
    action,
    timestamp: Date.now()
  });
}

// Get stored offline actions
async function getOfflineActions() {
  const db = await openDB();
  const transaction = db.transaction(['offlineActions'], 'readonly');
  const store = transaction.objectStore('offlineActions');
  return await store.getAll();
}

// Remove offline action after successful sync
async function removeOfflineAction(id) {
  const db = await openDB();
  const transaction = db.transaction(['offlineActions'], 'readwrite');
  const store = transaction.objectStore('offlineActions');
  await store.delete(id);
}

// Perform offline action
async function performOfflineAction(action) {
  const { method, url, body } = action;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...action.headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

// Open IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('Vision79Inventory', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store for offline actions
      if (!db.objectStoreNames.contains('offlineActions')) {
        const store = db.createObjectStore('offlineActions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'STORE_OFFLINE_ACTION') {
    event.waitUntil(storeOfflineAction(event.data.action));
  }
}); 