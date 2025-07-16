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

  createASN: (asnData: Omit<ASN, 'id' | 'status'> & { status?: ASN['status'], items?: any[], quoteFile?: File | null, poFile?: File | null, invoiceFile?: File | null, bolFile?: File | null }): Promise<ASN> => {
    const formData = new FormData();
    // Append all fields except files
    Object.entries(asnData).forEach(([key, value]) => {
      if (key === 'quoteFile' || key === 'poFile' || key === 'invoiceFile' || key === 'bolFile') return;
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as any);
        }
      }
    });
    // Append files if present
    if (asnData.quoteFile) formData.append('quoteFile', asnData.quoteFile);
    if (asnData.poFile) formData.append('poFile', asnData.poFile);
    if (asnData.invoiceFile) formData.append('invoiceFile', asnData.invoiceFile);
    if (asnData.bolFile) formData.append('bolFile', asnData.bolFile);
    return api.postForm('/asns', formData);
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
