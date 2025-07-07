import { WarehouseOrder, OrderItem, OrderStatus } from '@/types';
import { api } from './apiHelper';

export const orderService = {
  getOrders: (): Promise<WarehouseOrder[]> => {
    return api.get('/orders');
  },

  getOrderById: (id: number): Promise<WarehouseOrder | null> => {
    return api.get(`/orders/${id}`);
  },

  createOrder: (orderData: Omit<WarehouseOrder, 'id' | 'createdAt' | 'status'> & { status?: WarehouseOrder['status'], items: Array<Omit<OrderItem, 'name'>> }): Promise<WarehouseOrder> => {
    const payload = { ...orderData, status: orderData.status || OrderStatus.Pending };
    return api.post('/orders', payload);
  },

  updateOrder: (id: number, orderData: Partial<WarehouseOrder>): Promise<WarehouseOrder> => {
    return api.put(`/orders/${id}`, orderData);
  },

  deleteOrder: (id: number): Promise<void> => {
    return api.delete(`/orders/${id}`);
  },

  getShippableOrders: (): Promise<WarehouseOrder[]> => {
    return api.get('/orders/shippable');
  },

  confirmPickup: (orderId: number): Promise<WarehouseOrder> => {
    return api.post(`/orders/${orderId}/confirm-pickup`, {});
  },

  confirmReceipt: (orderId: number): Promise<WarehouseOrder> => {
    return api.post(`/orders/${orderId}/confirm-receipt`, {});
  }
};
