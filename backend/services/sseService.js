// backend/services/sseService.js

// ===================================================================================
// ARCHITECTURAL NOTE ON SCALABILITY
// ===================================================================================
// The current implementation of this Server-Sent Events (SSE) service uses a simple
// in-memory Set (`clients`) to store active connections. This approach is perfectly
// functional and efficient for a single-instance Node.js application, which is
// suitable for development and small-scale deployments.
//
// --- Limitation for Production Scaling ---
// This model has a significant limitation in a horizontally-scaled, load-balanced
// production environment. If you run multiple instances of this backend server, each
// instance will have its own separate, in-memory `clients` Set.
//
// Example Problem:
// 1. User A connects and their SSE connection is handled by Server Instance #1.
// 2. User B performs an action (e.g., updates an order) and their API request is
//    handled by Server Instance #2.
// 3. Instance #2 calls `sendEvent()`. It will only broadcast the event to the
//    clients connected to *it*. User A's client, connected to Instance #1, will
//    never receive the event.
//
// --- Recommended Production Solution: Redis Pub/Sub ---
// To solve this, a message broker is required to facilitate communication between
// all server instances. Redis's Pub/Sub feature is an excellent, low-latency choice.
//
// The architecture would change as follows:
// 1. When `sendEvent(eventName, data)` is called on any server instance, instead of
//    iterating over its local clients, it would PUBLISH a message to a Redis
//    channel (e.g., channel named 'sse-events').
// 2. Every server instance would SUBSCRIBE to this 'sse-events' channel upon startup.
// 3. When an instance receives a message from the Redis channel, it then iterates
//    through its own local `clients` Set and writes the event to each of its
//    connected clients.
//
// This ensures that an event originating from any instance is reliably broadcast
// to ALL connected clients, regardless of which instance they are connected to.
//
// Libraries to facilitate this include `redis` (official) or `ioredis`.
// ===================================================================================

// A simple in-memory store for connected clients
const clients = new Set();

const addClient = (res) => {
  clients.add(res);
  console.log(`[SSE] Client connected. Total clients: ${clients.size}`);
  
  // Keep the connection alive
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  res.on('close', () => {
    clearInterval(keepAliveInterval);
    removeClient(res);
  });
};

const removeClient = (res) => {
  clients.delete(res);
  console.log(`[SSE] Client disconnected. Total clients: ${clients.size}`);
};

const sendEvent = (eventName, data) => {
  if (clients.size === 0) return;
  console.log(`[SSE] Broadcasting event '${eventName}' to ${clients.size} client(s)`);
  
  const sseMessage = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  
  for (const client of clients) {
    try {
        client.write(sseMessage);
    } catch (e) {
        console.error(`[SSE] Error writing to a client, removing it. Error:`, e.message);
        removeClient(client);
    }
  }
};

module.exports = {
  addClient,
  removeClient,
  sendEvent,
};