import { mapToCamel } from '../utils/dbMappers';
import { api } from './apiHelper';

const reportingService = {
  getReportData: async (reportKey: string, filters?: Record<string, any>): Promise<any[]> => {
    console.log(`Frontend Service: Fetching report data for ${reportKey} with filters:`, filters);
    let queryString = '';
    if (filters && Object.keys(filters).length > 0) {
      const stringFilters: Record<string, string> = {};
      for (const key in filters) {
        if (Object.prototype.hasOwnProperty.call(filters, key) && filters[key] !== undefined && filters[key] !== null) {
          stringFilters[key] = String(filters[key]);
        }
      }
      if (Object.keys(stringFilters).length > 0) {
        queryString = '?' + new URLSearchParams(stringFilters).toString();
      }
    }
    const jsonData = await api.get<any[]>(`/reports/${reportKey}${queryString}`);
    return mapToCamel(jsonData);
  }
};

export { reportingService };
