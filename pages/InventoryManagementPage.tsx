import React, { useState, useMemo, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import SerialManagementModal from '@/components/SerialManagementModal';
import AutocompleteInput from '@/components/AutocompleteInput';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem, ColumnDefinition } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, SerialIcon, SearchIcon } from '@/constants';
import { inventoryService } from '@/services/inventoryService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const InventoryManagementPage: React.FC = () => {
  const { user } = useAuth();
  const {
    inventory,
    isLoading: isInventoryLoading,
    error: inventoryError,
    // fetchInventory is no longer needed here for CUD ops
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentItem, setCurrentItem] = useState<Partial<InventoryItem>>({});
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [selectedItemForSerials, setSelectedItemForSerials] = useState<InventoryItem | null>(null);

  // Add filter state
  const [agedFilter, setAgedFilter] = useState<'all' | 'aged' | 'non-aged'>('all');

  const { isModalOpen: isConfirmDeleteOpen, showConfirmation, handleConfirm: handleConfirmDelete, handleClose: handleCloseDeleteConfirm } = useConfirmationModal();

  const filteredInventory = useMemo(() => {
    let result = inventory;
    if (agedFilter === 'aged') {
      result = result.filter(item => item.isAged);
    } else if (agedFilter === 'non-aged') {
      result = result.filter(item => !item.isAged);
    }
    if (!searchTerm.trim()) return result;
    const lower = searchTerm.toLowerCase();
    return result.filter(item =>
      item.name?.toLowerCase().includes(lower) ||
      item.sku?.toLowerCase().includes(lower) ||
      item.category?.toLowerCase().includes(lower) ||
      item.location?.toLowerCase().includes(lower)
    );
  }, [inventory, searchTerm, agedFilter]);

  const handleOpenItemModal = useCallback((item?: InventoryItem) => {
    setError(null);
    setCurrentItem(item || { isSerialized: false, quantity: 0, reorderPoint: 0 });
    setIsItemModalOpen(true);
  }, []);

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setCurrentItem({});
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    if (isCheckbox && name === 'isSerialized') {
        const checked = (e.target as HTMLInputElement).checked;
        setCurrentItem(prev => {
            const newState: Partial<InventoryItem> = { ...prev, isSerialized: checked };
            if (checked) {
                // When becoming serialized, quantity is derived from serials. Reorder point is not applicable.
                newState.quantity = prev.serialNumbers?.length || 0;
                newState.reorderPoint = 0;
            } else {
                // When becoming non-serialized, quantity might be set to current serials length or a default
                newState.quantity = prev.serialNumbers?.length || 0;
            }
            return newState;
        });
    } else {
        const valueToSet = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        setCurrentItem(prev => ({
            ...prev,
            [name]: valueToSet,
        }));
    }
  };

  const handleSaveItem = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const itemToSave = {
        ...currentItem,
        quantity: currentItem.isSerialized ? currentItem.serialNumbers?.length || 0 : Number(currentItem.quantity || 0),
        reorderPoint: currentItem.isSerialized ? 0 : Number(currentItem.reorderPoint || 0),
        costPrice: Number(currentItem.costPrice || 0),
      };

      if (!itemToSave.name || !itemToSave.sku || !itemToSave.category || !itemToSave.location) {
        throw new Error('Name, SKU, Category, and Location are required fields.');
      }

      if (itemToSave.id) {
        await inventoryService.updateInventoryItem(itemToSave.id, itemToSave as InventoryItem);
      } else {
        await inventoryService.addInventoryItem(itemToSave as Omit<InventoryItem, 'id'>);
      }
      // No need to call fetchInventory(), context handles the update via SSE
      handleCloseItemModal();
    } catch (err: any) {
      let userFriendlyError = "An unexpected error occurred.";
      if (err.message) {
          if (err.message.toLowerCase().includes("failed to fetch")) {
              userFriendlyError = "Could not connect to the server. Please check your network or server status.";
          } else {
              userFriendlyError = err.message;
          }
      }
      setError(userFriendlyError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = useCallback((id: number) => {
    showConfirmation(async () => {
      setError(null);
      try {
        await inventoryService.deleteInventoryItem(id);
        // No need to call fetchInventory(), context handles the update via SSE
      } catch (err: any) {
        let userFriendlyError = "Failed to delete item.";
        if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
          userFriendlyError = "Could not connect to server to delete item.";
        } else if (err.message) {
          userFriendlyError = err.message;
        }
        setError(userFriendlyError);
      }
    });
  }, [showConfirmation]);

  const handleOpenSerialModal = useCallback((item: InventoryItem) => {
    setSelectedItemForSerials(item);
    setIsSerialModalOpen(true);
  }, []);

  const handleCloseSerialModal = () => {
    setIsSerialModalOpen(false);
    setSelectedItemForSerials(null);
  };

  const handleSaveSerials = async (itemId: number, serials: string[]) => {
    try {
      await inventoryService.manageItemSerials(itemId, serials);
      // No need to call fetchInventory(), context handles the update via SSE
    } catch (err: any)
    {
      alert(`Error saving serials: ${err.message}`);
    }
  };

  const renderTableActions = useCallback((item: InventoryItem) => (
    <div className="flex space-x-1">
      {item.isSerialized && (
        <button onClick={() => handleOpenSerialModal(item)} className="text-blue-600 hover:text-blue-800 p-1" title="Manage Serials">
          <SerialIcon className="h-5 w-5" />
        </button>
      )}
      <button onClick={() => handleOpenItemModal(item)} className="text-primary-600 hover:text-primary-800 p-1" title="Edit Item">
        <EditIcon className="h-5 w-5" />
      </button>
      {user?.role === 'admin' && (
        <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete Item">
          <DeleteIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  ), [user, handleOpenSerialModal, handleOpenItemModal, handleDeleteItem]);

  const columns: ColumnDefinition<InventoryItem, keyof InventoryItem>[] = useMemo(() => [
    { key: 'name', header: 'Item Name', sortable: true },
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'quantity', header: 'Quantity', sortable: true, render: (item) => item.isSerialized ? item.serialNumbers?.length || 0 : item.quantity },
    { key: 'location', header: 'Location', sortable: true },
    { key: 'reorderPoint', header: 'Reorder Point', sortable: true, render: (item) => item.reorderPoint },
    { key: 'isAged', header: 'Aged Item', sortable: true, render: (item) => item.isAged ? '✔️' : '' },
  ], []);

  if (inventoryError) {
    return (
      <PageContainer title="Inventory Management">
        <div className="p-4 text-red-600 bg-red-100 rounded-md dark:bg-red-800/30 dark:text-red-300">
          Error loading inventory: {inventoryError}
        </div>
      </PageContainer>
    );
  }

  if (isInventoryLoading && (!inventory || inventory.length === 0)) {
    return (
      <PageContainer title="Inventory Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="w-12 h-12 text-primary-500" />
          <p className="ml-4 text-lg">Loading inventory...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Inventory Management"
      actions={
        <button
          onClick={() => handleOpenItemModal()}
          className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Item
        </button>
      }
    >
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <label htmlFor="search-inventory" className="sr-only">Search inventory</label>
          <input
            id="search-inventory"
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`${TAILWIND_INPUT_CLASSES} pl-10 w-full max-w-md`}
            autoComplete="off"
          />
        </div>
        <div className="mt-2 md:mt-0">
          <label htmlFor="aged-filter" className="mr-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">Aged Filter:</label>
          <select
            id="aged-filter"
            value={agedFilter}
            onChange={e => setAgedFilter(e.target.value as 'all' | 'aged' | 'non-aged')}
            className="border border-secondary-300 dark:border-secondary-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
          >
            <option value="all">All</option>
            <option value="aged">Only Aged</option>
            <option value="non-aged">Only Non-Aged</option>
          </select>
        </div>
      </div>

      {isInventoryLoading && inventory.length > 0 && <div className="absolute top-4 right-4"><LoadingSpinner className="w-6 h-6 text-primary-500" /></div>}
      
      {!isInventoryLoading && filteredInventory.length === 0 && !inventoryError && (
        <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">
          {searchTerm
            ? 'No inventory items found matching your search.'
            : 'No inventory items available. Try adding one!'}
        </p>
      )}
      {!isInventoryLoading && filteredInventory.length > 0 && (
        <Table<InventoryItem>
          columns={columns}
          data={filteredInventory}
          actions={renderTableActions}
        />
      )}

      <Modal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        title={currentItem.id ? 'Edit Item' : 'Add New Item'}
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(); }} className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-800/30 dark:text-red-300 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <AutocompleteInput
                value={currentItem.name || ''}
                onChange={(value) => setCurrentItem(prev => ({ ...prev, name: value }))}
                options={inventory.map(item => item.name || '').filter(Boolean)}
                placeholder="Enter item name"
                label="Item Name"
                required
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
              />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">SKU</label>
              <input type="text" name="sku" id="sku" value={currentItem.sku || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <AutocompleteInput
                value={currentItem.category || ''}
                onChange={(value) => setCurrentItem(prev => ({ ...prev, category: value }))}
                options={[...new Set(inventory.map(item => item.category || '').filter(Boolean))]}
                placeholder="Enter category"
                label="Category"
                required
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
              />
            </div>
            <div>
              <AutocompleteInput
                value={currentItem.location || ''}
                onChange={(value) => setCurrentItem(prev => ({ ...prev, location: value }))}
                options={[...new Set(inventory.map(item => item.location || '').filter(Boolean))]}
                placeholder="Enter location"
                label="Location"
                required
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isSerialized"
                checked={currentItem.isSerialized || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">Item is Serialized</span>
            </label>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">If checked, quantity is managed via individual serial numbers. Add serials after creating the item.</p>
          </div>

          <div className="pt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isAged"
                checked={currentItem.isAged || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">Aged Item</span>
            </label>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">Check this to mark as aged, or items older than 365 days are automatically aged.</p>
          </div>

          {!currentItem.isSerialized && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Quantity</label>
                <input type="number" name="quantity" id="quantity" value={currentItem.quantity ?? ''} onChange={handleInputChange} min="0" required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} />
              </div>
              <div>
                <label htmlFor="reorderPoint" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Reorder Point</label>
                <input type="number" name="reorderPoint" id="reorderPoint" value={currentItem.reorderPoint ?? ''} onChange={handleInputChange} min="0" required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={handleCloseItemModal} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm" disabled={isSaving}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm disabled:opacity-50" disabled={isSaving}>
              {isSaving ? <LoadingSpinner className="w-5 h-5" /> : (currentItem.id ? 'Save Changes' : 'Add Item')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />

      <SerialManagementModal
        isOpen={isSerialModalOpen}
        onClose={handleCloseSerialModal}
        item={selectedItemForSerials}
        onSaveSerials={handleSaveSerials}
      />
    </PageContainer>
  );
};

export default InventoryManagementPage;