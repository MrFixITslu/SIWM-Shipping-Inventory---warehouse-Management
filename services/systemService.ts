
// services/systemService.ts
import { api } from './apiHelper';

export const systemService = {
  resetTransactionalData: (): Promise<{ message: string }> => {
    return api.post('/system/reset-transactional-data', {});
  },
};
