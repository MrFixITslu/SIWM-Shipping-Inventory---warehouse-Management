// services/asnService.ts
import { ASN, ShipmentFees, FeeStatus, ReceivedItem } from '@/types';
import { api } from './apiHelper';

export const asnService = {
  getASNs: (): Promise<ASN[]> => {
    return api.get('/asns');
  },

  getASNById: (id: number): Promise<ASN | null> => {
    return api.get(`/asns/${id}`);
  },

  createASN: (asnData: Omit<ASN, 'id' | 'status'> & { status?: ASN['status'], items?: any[] }): Promise<ASN> => {
    const payload = { ...asnData, status: asnData.status || 'On Time' };
    return api.post('/asns', payload);
  },

  updateASN: (id: number, asnData: Partial<ASN>): Promise<ASN> => {
    return api.put(`/asns/${id}`, asnData);
  },

  deleteASN: (id: number): Promise<void> => {
    return api.delete(`/asns/${id}`);
  },

  submitFees: (id: number, fees: ShipmentFees): Promise<ASN> => {
    return api.post(`/asns/${id}/submit-fees`, { fees });
  },

  approveFees: (id: number, feeStatus: FeeStatus.Approved | FeeStatus.Rejected): Promise<ASN> => {
    return api.post(`/asns/${id}/approve-fees`, { feeStatus });
  },

  confirmPayment: (id: number, receiptFile: File | null): Promise<ASN> => {
    const formData = new FormData();
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }
    return api.postForm(`/asns/${id}/confirm-payment`, formData);
  },

  receiveShipment: (id: number, receivedItems: ReceivedItem[]): Promise<ASN> => {
    return api.post(`/asns/${id}/receive`, { receivedItems });
  },

  completeShipment: async (asnId: number) => {
    const response = await api.post<ASN>(`/asns/${asnId}/complete`, {});
    return response;
  },
};
