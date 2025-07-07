import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage';
import SerialManagementModal from '@/components/SerialManagementModal';
import AutocompleteInput from '@/components/AutocompleteInput';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { InventoryItem, ColumnDefinition } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon, SerialIcon, ArrowLeftOnRectangleIcon, ShipmentIcon } from '@/constants';
import { inventoryService } from '@/services/inventoryService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { debounce } from '@/utils/performance';

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const InventoryManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const asnId = searchParams.get('asnId');
  
  const {
    inventory,
    isLoading: isInventoryLoading,
    error: inventoryError,
    lastUpdatedId,
    clearLastUpdatedId,
  } = useInventory();

  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentItem, setCurrentItem] = useState<Partial<InventoryItem>>({});
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [selectedItemForSerials, setSelectedItemForSerials] = useState<InventoryItem | null>(null);
  const [showSerialNotification, setShowSerialNotification] = useState(false);

  const { isModalOpen: isConfirmDeleteOpen, confirmButtonText, showConfirmation, handleConfirm: handleConfirmDelete, handleClose: handleCloseDeleteConfirm } = useConfirmationModal();

  const handleReturnToShipment = () => {
    navigate(`/incoming-shipments?selectedAsn=${asnId}`);
  };

  // Debounced search to improve performance
  const debouncedSetSearchTerm = useCallback(
    debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSetSearchTerm(value);
  };

  useEffect(() => {
    if (lastUpdatedId) {
      setHighlightedRow(lastUpdatedId.id);
      const timer = setTimeout(() => {
        setHighlightedRow(null);
        clearLastUpdatedId();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdatedId, clearLastUpdatedId]);

  const filteredInventory = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return inventory;
    const lower = debouncedSearchTerm.toLowerCase();
    return inventory.filter(item =>
      item.name?.toLowerCase().includes(lower) ||
      item.sku?.toLowerCase().includes(lower) ||
      item.category?.toLowerCase().includes(lower) ||
      item.location?.toLowerCase().includes(lower)
    );
  }, [inventory, debouncedSearchTerm]);

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
        
        // Auto-open serial management modal for serialized items when quantity is entered
        if (name === 'quantity' && currentItem.isSerialized && valueToSet && Number(valueToSet) > 0) {
          // Check if this is an existing item
          const existingItem = inventory.find(item => 
            item.name === currentItem.name && 
            item.sku === currentItem.sku && 
            item.category === currentItem.category && 
            item.location === currentItem.location
          );
          
          if (existingItem) {
            // For existing serialized items, open modal to add additional serials
            setSelectedItemForSerials(existingItem);
            setShowSerialNotification(true);
            setIsSerialModalOpen(true);
          }
        }
    }
  };

  const handleNameChange = (value: string) => {
    // Check if the selected value matches an existing item
    const existingItem = inventory.find(item => item.name === value);
    
    setCurrentItem(prev => ({
      ...prev,
      name: value,
      // Auto-populate fields if an existing item is selected
      ...(existingItem && {
        sku: existingItem.sku,
        category: existingItem.category,
        location: existingItem.location,
        reorderPoint: existingItem.reorderPoint,
        costPrice: existingItem.costPrice,
        isSerialized: existingItem.isSerialized,
        // Set quantity to 0 for manual input - will be added to existing quantity
        quantity: 0,
      }),
    }));
  };

  const handleCategoryChange = (value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      category: value,
    }));
  };

  const handleLocationChange = (value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      location: value,
    }));
  };

  const handleSaveItem = async () => {
    setError(null);
    setIsSaving(true);
    try {
      // Check if this is an existing item (by name) that we're adding quantity to
      const existingItem = inventory.find(item => 
        item.name === currentItem.name && 
        item.sku === currentItem.sku && 
        item.category === currentItem.category && 
        item.location === currentItem.location
      );

      const newQuantity = Number(currentItem.quantity || 0);
      
      if (existingItem && !currentItem.id) {
        // Adding quantity to existing item
        const updatedQuantity = existingItem.isSerialized 
          ? (existingItem.serialNumbers?.length || 0) + newQuantity
          : (existingItem.quantity || 0) + newQuantity;
        
        const itemToSave = {
          ...existingItem,
          quantity: updatedQuantity,
          reorderPoint: Number(currentItem.reorderPoint || existingItem.reorderPoint || 0),
          costPrice: Number(currentItem.costPrice || existingItem.costPrice || 0),
        };

        await inventoryService.updateInventoryItem(existingItem.id, itemToSave as InventoryItem);
      } else {
        // For serialized items, don't add to inventory yet - just prepare for serial number entry
        if (currentItem.isSerialized && !currentItem.id) {
          // Store the item data temporarily for serial number entry
          const tempItem = {
            ...currentItem,
            quantity: 0, // Will be set when serial numbers are added
            reorderPoint: Number(currentItem.reorderPoint || 0),
            costPrice: Number(currentItem.costPrice || 0),
          };

          if (!tempItem.name || !tempItem.sku || !tempItem.category || !tempItem.location) {
            throw new Error('Name, SKU, Category, and Location are required fields.');
          }

          // Store the temporary item data for serial management
          setCurrentItem(tempItem);
          setSelectedItemForSerials({
            ...tempItem,
            id: -1, // Temporary ID
            serialNumbers: [],
          } as InventoryItem);
          setShowSerialNotification(true);
          setIsSerialModalOpen(true);
          handleCloseItemModal();
          return; // Don't save to inventory yet
        } else {
          // Creating new non-serialized item or updating existing item by ID
          const itemToSave = {
            ...currentItem,
            quantity: newQuantity,
            reorderPoint: Number(currentItem.reorderPoint || 0),
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
        }
      }
      
      // No fetchInventory() call needed, context handles the update via SSE
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
        // No fetchInventory() call needed, context handles the update via SSE
      } catch (err: any) {
        let userFriendlyError = "Failed to delete item.";
        if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
          userFriendlyError = "Could not connect to server to delete item.";
        } else if (err.message) {
          userFriendlyError = err.message;
        }
        setError(userFriendlyError);
      }
    }, { confirmText: 'Confirm Delete' });
  }, [showConfirmation]);

  const handleOpenSerialModal = useCallback((item: InventoryItem) => {
    setSelectedItemForSerials(item);
    setIsSerialModalOpen(true);
  }, []);

  const handleCloseSerialModal = () => {
    setIsSerialModalOpen(false);
    setSelectedItemForSerials(null);
    setShowSerialNotification(false);
  };

  const handleSaveSerials = async (itemId: number, serials: string[]) => {
    try {
      if (itemId === -1) {
        // This is a new serialized item that needs to be added to inventory
        const newItem = {
          ...currentItem,
          quantity: serials.length,
          serialNumbers: serials,
        } as Omit<InventoryItem, 'id'>;

        await inventoryService.addInventoryItem(newItem);
      } else {
        // This is an existing item being updated
        // For existing items, we need to append the new serials to existing ones
        const existingItem = inventory.find(item => item.id === itemId);
        if (existingItem) {
          const existingSerials = existingItem.serialNumbers || [];
          const allSerials = [...existingSerials, ...serials];
          await inventoryService.manageItemSerials(itemId, allSerials);
        } else {
          await inventoryService.manageItemSerials(itemId, serials);
        }
      }
      // No fetchInventory() call needed, context handles the update via SSE
    } catch (err: any) {
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
      {/* Shipment Processing Banner */}
      {asnId && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShipmentIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Processing Shipment #{asnId}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Add items to inventory for this shipment. When finished, return to complete the receiving process.
                </p>
              </div>
            </div>
            <button
              onClick={handleReturnToShipment}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
              Return to Shipment
            </button>
          </div>
        </div>
      )}
      <div className="mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <label htmlFor="search-inventory" className="sr-only">Search inventory</label>
          <input
            id="search-inventory"
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`${TAILWIND_INPUT_CLASSES} pl-10 w-full max-w-md`}
            autoComplete="off"
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <Table
        columns={columns}
        data={filteredInventory}
        actions={renderTableActions}
        rowClassName={(item) => 
          highlightedRow === item.id 
            ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' 
            : ''
        }
      />

      {/* Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        title={currentItem.id ? 'Edit Item' : 'Add New Item'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <AutocompleteInput
                value={currentItem.name || ''}
                onChange={handleNameChange}
                options={inventory.map(item => item.name).filter(Boolean)}
                placeholder="Enter item name"
                label="Item Name"
                required
                className={TAILWIND_INPUT_CLASSES}
              />
            </div>
            <div>
              <label htmlFor="item-sku" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                SKU *
              </label>
              <input
                id="item-sku"
                type="text"
                name="sku"
                value={currentItem.sku || ''}
                onChange={handleInputChange}
                className={TAILWIND_INPUT_CLASSES}
                required
                autoComplete="off"
              />
            </div>
            <div>
              <AutocompleteInput
                value={currentItem.category || ''}
                onChange={handleCategoryChange}
                options={[...new Set(inventory.map(item => item.category).filter(Boolean))]}
                placeholder="Enter category"
                label="Category"
                required
                className={TAILWIND_INPUT_CLASSES}
              />
            </div>
            <div>
              <AutocompleteInput
                value={currentItem.location || ''}
                onChange={handleLocationChange}
                options={[...new Set(inventory.map(item => item.location).filter(Boolean))]}
                placeholder="Enter location"
                label="Location"
                required
                className={TAILWIND_INPUT_CLASSES}
              />
            </div>
            <div>
              <label htmlFor="item-costPrice" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Cost Price
              </label>
              <input
                id="item-costPrice"
                type="number"
                name="costPrice"
                value={currentItem.costPrice || ''}
                onChange={handleInputChange}
                className={TAILWIND_INPUT_CLASSES}
                step="0.01"
                min="0"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="item-quantity" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {currentItem.isSerialized ? 'Serial Numbers Count' : 'Quantity to Add'}
              </label>
              <input
                id="item-quantity"
                type="number"
                name="quantity"
                value={currentItem.isSerialized ? (currentItem.serialNumbers?.length || 0) : (currentItem.quantity || '')}
                onChange={handleInputChange}
                className={TAILWIND_INPUT_CLASSES}
                min="0"
                disabled={currentItem.isSerialized}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="item-reorderPoint" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Reorder Point
              </label>
              <input
                id="item-reorderPoint"
                type="number"
                name="reorderPoint"
                value={currentItem.reorderPoint || ''}
                onChange={handleInputChange}
                className={TAILWIND_INPUT_CLASSES}
                min="0"
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              id="item-isSerialized"
              type="checkbox"
              name="isSerialized"
              checked={currentItem.isSerialized || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="item-isSerialized" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
              This item is serialized (tracked by individual serial numbers)
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCloseItemModal}
            className="px-4 py-2 text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveItem}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Add Item'}
          </button>
        </div>
      </Modal>

      {/* Serial Management Modal */}
      {selectedItemForSerials && (
        <SerialManagementModal
          isOpen={isSerialModalOpen}
          onClose={handleCloseSerialModal}
          item={selectedItemForSerials}
          onSaveSerials={handleSaveSerials}
          showNotification={showSerialNotification}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmButtonText={confirmButtonText}
      />
    </PageContainer>
  );
};

export default InventoryManagementPage;