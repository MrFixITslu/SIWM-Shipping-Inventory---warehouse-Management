import { useEffect, useRef } from 'react';
import { BASE_API_URL } from '../services/apiConfig';

interface RealtimeHandlers {
  [key: string]: (data: any) => void;
}

export function useRealtimeUpdates(handlers?: RealtimeHandlers) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // If no handlers provided, don't establish connection
    if (!handlers || Object.keys(handlers).length === 0) {
      return;
    }

    // Create SSE connection
    const eventSource = new EventSource(`${BASE_API_URL}/system/sse`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection established');
    };

    // Listen for specific events by name
    Object.entries(handlers).forEach(([eventName, handler]) => {
      if (handler) {
        eventSource.addEventListener(eventName, (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`[SSE] Received event '${eventName}':`, data);
            handler(data);
          } catch (error) {
            console.error(`Error parsing SSE event '${eventName}':`, error);
          }
        });
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      }, 5000);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [handlers]);

  // Return a function to manually close the connection if needed
  return () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };
}
