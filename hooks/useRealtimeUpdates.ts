import { useEffect, useRef } from 'react';
import { authService } from '@/services/authService';
import { BASE_API_URL } from '@/services/apiConfig';
import { WarehouseOrder, ASN, OutboundShipment, InventoryItem, Vendor, WarehouseAsset } from '@/types';

type EventHandler = (data: any) => void;

interface EventMap {
  'unacknowledged_orders_count_changed': { count: number };
  'order_created': WarehouseOrder;
  'order_updated': WarehouseOrder;
  'order_deleted': { id: number };
  'asn_created': ASN;
  'asn_updated': ASN;
  'asn_deleted': { id: number };
  'dispatch_created': OutboundShipment;
  'dispatch_updated': OutboundShipment;
  'dispatch_deleted': { id: number };
  'inventory_created': InventoryItem;
  'inventory_updated': InventoryItem;
  'inventory_deleted': { id: number };
  'vendor_created': Vendor;
  'vendor_updated': Vendor;
  'vendor_deleted': { id: number };
  'asset_created': WarehouseAsset;
  'asset_updated': WarehouseAsset;
  'asset_deleted': { id: number };
}

type EventHandlers = {
  [K in keyof EventMap]?: (data: EventMap[K]) => void;
};

export const useRealtimeUpdates = (handlers: EventHandlers) => {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = authService.getCurrentUser()?.token;
    if (!token) {
      console.warn("No auth token found, SSE connection not established.");
      return;
    }

    const sseUrl = `${BASE_API_URL}/events?token=${token}`;
    const eventSource = new EventSource('http://localhost:4000/api/v1/system/sse');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection established.');
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
    };

    Object.entries(handlers).forEach(([eventName, handler]) => {
      if (handler) {
        eventSource.addEventListener(eventName, (event) => {
          try {
            const data = JSON.parse(event.data);
            handler(data);
          } catch (e) {
            console.error(`Failed to parse SSE event data for '${eventName}':`, e);
          }
        });
      }
    });

    return () => {
      if (eventSourceRef.current) {
        console.log('Closing SSE connection.');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [handlers]); 
};