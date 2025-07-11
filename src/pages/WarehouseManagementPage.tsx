import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import { Warehouse, ColumnDefinition } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, BuildingOfficeIcon } from '@/constants';
import { warehouseService } from '@/services/warehouseService';

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const WarehouseManagementPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState<Partial<Warehouse>>({});

  const { isModalOpen: isConfirmDeleteOpen, showConfirmation, handleConfirm, handleClose: handleCloseConfirm } = useConfirmationModal();

  // Load warehouses on component mount
  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await warehouseService.getWarehouses();
      setWarehouses(data);
    } catch (err: any) {
      console.error('Failed to load warehouses:', err);
      setError(err.message || 'Failed to load warehouses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (warehouse?: Warehouse) => {
    setError(null);
    if (warehouse) {
      setCurrentWarehouse(warehouse);
    } else {
      setCurrentWarehouse({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: 'USA',
        postal_code: '',
        phone: '',
        email: '',
        timezone: 'UTC',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentWarehouse({});
    setError(null);
  };

  const handleSaveWarehouse = async () => {
    if (!currentWarehouse.name || !currentWarehouse.code || !currentWarehouse.address || !currentWarehouse.city || !currentWarehouse.state) {
      setError('Warehouse name, code, address, city, and state are required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (currentWarehouse.id) {
        await warehouseService.updateWarehouse(currentWarehouse.id, currentWarehouse);
      } else {
        await warehouseService.createWarehouse(currentWarehouse as Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>);
      }
      
      await loadWarehouses();
      handleCloseModal();
    } catch (err: any) {
      console.error('Failed to save warehouse:', err);
      let userFriendlyError = 'Failed to save warehouse. Please try again.';
      if (err.message) {
        if (err.message.toLowerCase().includes('failed to fetch')) {
          userFriendlyError = 'Could not connect to the server to save the warehouse. Please check your network or server status.';
        } else {
          userFriendlyError = err.message;
        }
      }
      setError(userFriendlyError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    showConfirmation(async () => {
      try {
        await warehouseService.deleteWarehouse(warehouse.id);
        await loadWarehouses();
      } catch (err: any) {
        console.error('Failed to delete warehouse:', err);
        setError(err.message || 'Failed to delete warehouse');
      }
    }, { confirmText: 'Delete Warehouse' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    
    setCurrentWarehouse(prev => ({
      ...prev,
      [name]: isNumber ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const renderActions = useCallback((warehouse: Warehouse) => (
    <div className="flex space-x-2">
      <button 
        onClick={() => handleOpenModal(warehouse)} 
        className="p-1 text-primary-500 hover:text-primary-700" 
        title="Edit"
      >
        <EditIcon className="h-5 w-5" />
      </button>
      <button 
        onClick={() => handleDeleteWarehouse(warehouse)} 
        className="p-1 text-red-500 hover:text-red-700" 
        title="Delete"
      >
        <DeleteIcon className="h-5 w-5" />
      </button>
    </div>
  ), []);

  const columns: ColumnDefinition<Warehouse, keyof Warehouse>[] = [
    { key: 'code', header: 'Code', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'city', header: 'City', sortable: true },
    { key: 'state', header: 'State', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
  ];

  const filteredWarehouses = useMemo(() => {
    if (!searchTerm) return warehouses;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return warehouses.filter(warehouse => 
      Object.values(warehouse).some(value => 
        String(value).toLowerCase().includes(lowerSearchTerm)
      )
    );
  }, [warehouses, searchTerm]);

  if (isLoading) {
    return (
      <PageContainer title="Warehouse Management">
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner className="w-8 h-8 text-primary-500" />
          <p className="ml-3">Loading warehouses...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="Warehouse Management"
      actions={
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          disabled={isSaving}
        >
          <PlusIcon className="h-5 w-5 mr-2" /> Create Warehouse
        </button>
      }
    >
      <ErrorMessage message={!isModalOpen ? error : null} />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:border-secondary-600 dark:text-secondary-100"
          />
          <BuildingOfficeIcon className="absolute left-3 top-2.5 h-5 w-5 text-secondary-400" />
        </div>
      </div>

      {/* Warehouse Table */}
      {!isLoading && filteredWarehouses.length === 0 && (
        <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">
          {searchTerm
            ? 'No warehouses found matching your search.'
            : 'No warehouses available. Create your first warehouse!'}
        </p>
      )}

      {!isLoading && filteredWarehouses.length > 0 && (
        <Table<Warehouse>
          columns={columns}
          data={filteredWarehouses}
          actions={renderActions}
        />
      )}

      {/* Create/Edit Warehouse Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={currentWarehouse.id ? 'Edit Warehouse' : 'Create New Warehouse'} 
        size="xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveWarehouse(); }} className="space-y-4">
          <ErrorMessage message={isModalOpen ? error : null} />
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Warehouse Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={currentWarehouse.name || ''}
                onChange={handleInputChange}
                required
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="e.g., Main Distribution Center"
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Warehouse Code *
              </label>
              <input
                type="text"
                name="code"
                id="code"
                value={currentWarehouse.code || ''}
                onChange={handleInputChange}
                required
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="e.g., WH001"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Address *
              </label>
              <textarea
                name="address"
                id="address"
                value={currentWarehouse.address || ''}
                onChange={handleInputChange}
                required
                rows={3}
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="Full street address"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={currentWarehouse.city || ''}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                  placeholder="e.g., Springfield"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  id="state"
                  value={currentWarehouse.state || ''}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                  placeholder="e.g., IL"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Country
              </label>
              <input
                type="text"
                name="country"
                id="country"
                value={currentWarehouse.country || 'USA'}
                onChange={handleInputChange}
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="e.g., USA"
              />
            </div>
            <div>
              <label htmlFor="postal_code" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Postal Code
              </label>
              <input
                type="text"
                name="postal_code"
                id="postal_code"
                value={currentWarehouse.postal_code || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="e.g., 62701"
              />
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Timezone
              </label>
              <select
                name="timezone"
                id="timezone"
                value={currentWarehouse.timezone || 'UTC'}
                onChange={handleInputChange}
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Contact Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={currentWarehouse.phone || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="e.g., 555-123-4567"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={currentWarehouse.email || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="e.g., warehouse@company.com"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="capacity_sqft" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Capacity (sq ft)
              </label>
              <input
                type="number"
                name="capacity_sqft"
                id="capacity_sqft"
                value={currentWarehouse.capacity_sqft || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="e.g., 50000"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={currentWarehouse.status || 'active'}
                onChange={handleInputChange}
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2 inline" />
                  {currentWarehouse.id ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                currentWarehouse.id ? 'Update Warehouse' : 'Create Warehouse'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirm}
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? This action cannot be undone and will affect all associated inventory and orders."
        confirmButtonText="Delete Warehouse"
      />
    </PageContainer>
  );
};

export default WarehouseManagementPage;
