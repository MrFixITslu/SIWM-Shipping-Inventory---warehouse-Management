// src/services/complianceService.ts
// Placeholder for future compliance feature API calls
import { api } from './apiHelper';

// Example type, would be defined in types.ts
interface ComplianceDocument {
    id: number;
    name: string;
    status: 'active' | 'expired' | 'pending_review';
    expiryDate: string;
}

export const complianceService = {
  getDocuments: (): Promise<ComplianceDocument[]> => {
    // This endpoint does not exist yet
    // return api.get('/compliance/documents');
    return Promise.resolve([]); // Return empty array for now
  },

  addDocument: (docData: Omit<ComplianceDocument, 'id'>): Promise<ComplianceDocument> => {
    // This endpoint does not exist yet
    // return api.post('/compliance/documents', docData);
    const newDoc = { id: Date.now(), ...docData };
    return Promise.resolve(newDoc);
  }
};
