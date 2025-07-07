// services/vendorService.ts
import { Vendor } from '@/types';
import { api } from './apiHelper';

export const vendorService = {
  getVendors: (): Promise<Vendor[]> => {
    return api.get('/vendors');
  },
  getVendorById: (id: number): Promise<Vendor | null> => {
    return api.get(`/vendors/${id}`);
  },
  createVendor: (vendorData: Omit<Vendor, 'id'>): Promise<Vendor> => {
    return api.post('/vendors', vendorData);
  },
  updateVendor: (id: number, vendorData: Partial<Vendor>): Promise<Vendor> => {
    return api.put(`/vendors/${id}`, vendorData);
  },
  deleteVendor: (id: number): Promise<void> => {
    return api.delete(`/vendors/${id}`);
  },
};
