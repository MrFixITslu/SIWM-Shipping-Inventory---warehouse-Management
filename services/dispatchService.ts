import { OutboundShipment, ShipmentFees, FeeStatus } from '@/types';
import { api } from './apiHelper';

export const dispatchService = {
  getDispatches: (): Promise<OutboundShipment[]> => {
    return api.get('/dispatch');
  },

  getDispatchById: (id: number): Promise<OutboundShipment | null> => {
    return api.get(`/dispatch/${id}`);
  },

  createDispatch: (dispatchData: Partial<Omit<OutboundShipment, 'id'>> & { shippedSerialNumbersString?: string }): Promise<OutboundShipment> => {
    return api.post('/dispatch', dispatchData);
  },

  updateDispatch: (id: number, dispatchData: Partial<OutboundShipment> & { shippedSerialNumbersString?: string }): Promise<OutboundShipment> => {
    return api.put(`/dispatch/${id}`, dispatchData);
  },

  deleteDispatch: (id: number): Promise<void> => {
    return api.delete(`/dispatch/${id}`);
  },

  submitFees: (id: number, fees: ShipmentFees): Promise<OutboundShipment> => {
    return api.post(`/dispatch/${id}/submit-fees`, { fees });
  },

  approveFees: (id: number, feeStatus: FeeStatus.Approved | FeeStatus.Rejected): Promise<OutboundShipment> => {
    return api.post(`/dispatch/${id}/approve-fees`, { feeStatus });
  },

  confirmPayment: (id: number, receiptFile: File | null): Promise<OutboundShipment> => {
    const formData = new FormData();
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }
    return api.postForm(`/dispatch/${id}/confirm-payment`, formData);
  }
};
