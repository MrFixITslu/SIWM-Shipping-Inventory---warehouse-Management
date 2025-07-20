import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage';
import SerialManagementModal from '@/components/SerialManagementModal';
import AutocompleteInput from '@/components/AutocompleteInput';
import ExcelUploadModal from '@/components/ExcelUploadModal';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem, ColumnDefinition } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon, SerialIcon, ArrowLeftOnRectangleIcon, ShipmentIcon, UploadIcon } from '@/constants';
import { inventoryService } from '@/services/inventoryService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { debounce } from '@/utils/performance';
import { asnService } from '@/services/asnService';

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";
const departmentOptions = ["Digicel+", "Digicel Business", "Commercial", "Marketing", "Outside Plant (OSP)", "Field Force & HVAC"];

const InventoryManagementPage: React.FC = () => {
  const { user, isLoadingAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const asnId = searchParams.get('asnId');

  // Show loading spinner while auth is being checked
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12 text-primary-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-secondary-600 dark:text-secondary-400">Loading...</p>
        </div>
      </div>
    );
  }
  
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
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [addedItemsForAsn, setAddedItemsForAsn] = useState<Array<{name: string, sku: string, quantity: number, serialNumbers?: string[]}>>([]);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);

  // Add filter state
  const [agedFilter, setAgedFilter] = useState<'all' | 'aged' | 'non-aged'>('all');

  const { isModalOpen: isConfirmDeleteOpen, confirmButtonText, showConfirmation, handleConfirm: handleConfirmDelete, handleClose: handleCloseDeleteConfirm } = useConfirmationModal();

  const handleReturnToShipment = async () => {
    if (!asnId) return;
    try {
      if (addedItemsForAsn.length === 0) {
        setError('You must add at least one item to receive for this shipment.');
        return;
      }
      // Fetch ASN to check status
      const asn = await asnService.getASNById(Number(asnId));
      if (!asn) {
        setError('ASN not found.');
        return;
      }
      // Only call receiveShipment if ASN is not already received/processing
      if (asn.status === 'On Time' || asn.status === 'Delayed' || asn.status === 'At the Warehouse') {
        // Map addedItemsForAsn to ReceivedItem[]
        const receivedItems = addedItemsForAsn.map(added => {
          const inv = inventory.find(i => i.name === added.name && i.sku === added.sku);
          return {
            itemId: inv?.id || 0,
            receivedQuantity: added.quantity,
            receivedSerials: added.serialNumbers,
          };
        });
        if (receivedItems.some(item => !item.itemId)) {
          setError('One or more items could not be matched to inventory. Please check item names and SKUs.');
          return;
        }
        await asnService.receiveShipment(Number(asnId), receivedItems);
      }
      // Always navigate back to incoming shipments
      const addedItemsParam = addedItemsForAsn.length > 0 ? `&addedItems=${encodeURIComponent(JSON.stringify(addedItemsForAsn))}` : '';
      const url = `/incoming-shipments?selectedAsn=${asnId}${addedItemsParam}`;
      navigate(url);
    } catch (err: any) {
      setError(err.message || 'Failed to mark shipment as received.');
    }
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
      
      // Show success notification
      const message = lastUpdatedId.type === 'create' 
        ? 'Item added successfully!' 
        : 'Item updated successfully!';
      setSuccessMessage(message);
      setShowSuccessNotification(true);
      
      // Auto-hide success notification after 3 seconds
      const successTimer = setTimeout(() => {
        setShowSuccessNotification(false);
        setSuccessMessage('');
      }, 3000);
      
      // Clear highlight after 2 seconds
      const timer = setTimeout(() => {
        setHighlightedRow(null);
        clearLastUpdatedId();
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(successTimer);
      };
    }
  }, [lastUpdatedId, clearLastUpdatedId]);

  const filteredInventory = useMemo(() => {
    let result = inventory;
    if (agedFilter === 'aged') {
      result = result.filter(item => item.isAged);
    } else if (agedFilter === 'non-aged') {
      result = result.filter(item => !item.isAged);
    }
    if (!debouncedSearchTerm.trim()) return result;
    const lower = debouncedSearchTerm.toLowerCase();
    return result.filter(item =>
      item.name?.toLowerCase().includes(lower) ||
      item.sku?.toLowerCase().includes(lower) ||
      item.category?.toLowerCase().includes(lower) ||
      item.location?.toLowerCase().includes(lower)
    );
  }, [inventory, debouncedSearchTerm, agedFilter]);

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

  const handleDepartmentChange = (value: string) => {
    setCurrentItem(prev => ({
      ...prev,
      department: value,
    }));
  };

  const handleSaveItem = async () => {
    console.log('handleSaveItem called with currentItem:', currentItem);
    setError(null);
    setIsSaving(true);
    try {
      // Check if this is an existing item (by name) that we're adding quantity to
      const existingItem = inventory.find(item => 
        item.name === currentItem.name && 
        item.sku === currentItem.sku && 
        item.category === currentItem.category && 
        item.department === currentItem.department &&
        item.location === currentItem.location
      );

      console.log('Existing item found:', existingItem);

      const newQuantity = Number(currentItem.quantity || 0);
      
      if (existingItem && !currentItem.id) {
        console.log('Adding quantity to existing item');
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

        console.log('Updating existing item:', itemToSave);
        await inventoryService.updateInventoryItem(existingItem.id, itemToSave as InventoryItem);
        // Update or add to addedItemsForAsn
        if (asnId) {
          setAddedItemsForAsn(prev => {
            const idx = prev.findIndex(i => i.name === existingItem.name && i.sku === existingItem.sku);
            const updated = { name: existingItem.name, sku: existingItem.sku, quantity: updatedQuantity, serialNumbers: existingItem.serialNumbers };
            if (idx !== -1) {
              const arr = [...prev];
              arr[idx] = updated;
              return arr;
            } else {
              return [...prev, updated];
            }
          });
        }
      } else if (currentItem.isSerialized && !currentItem.id) {
        console.log('Preparing serialized item for serial number entry');
        // For new serialized items, prepare for serial number entry
        const tempItem = {
          ...currentItem,
          quantity: 0, // Will be set when serial numbers are added
          reorderPoint: Number(currentItem.reorderPoint || 0),
          costPrice: Number(currentItem.costPrice || 0),
        };

        if (!tempItem.name || !tempItem.sku || !tempItem.category || !tempItem.department || !tempItem.location) {
          throw new Error('Name, SKU, Category, Department, and Location are required fields.');
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
        console.log('Creating new item or updating existing item by ID');
        // Creating new non-serialized item or updating existing item by ID
        const itemToSave = {
          ...currentItem,
          quantity: newQuantity,
          reorderPoint: Number(currentItem.reorderPoint || 0),
          costPrice: Number(currentItem.costPrice || 0),
        };

        if (!itemToSave.name || !itemToSave.sku || !itemToSave.category || !itemToSave.department || !itemToSave.location) {
          throw new Error('Name, SKU, Category, Department, and Location are required fields.');
        }

        console.log('Saving item:', itemToSave);

        if (itemToSave.id) {
          await inventoryService.updateInventoryItem(itemToSave.id, itemToSave as InventoryItem);
        } else {
          const savedItem = await inventoryService.addInventoryItem(itemToSave as Omit<InventoryItem, 'id'>);
          // Track the added item for this ASN
          if (asnId) {
            setAddedItemsForAsn(prev => {
              const idx = prev.findIndex(i => i.name === savedItem.name && i.sku === savedItem.sku);
              const updated = { name: savedItem.name, sku: savedItem.sku, quantity: savedItem.quantity, serialNumbers: savedItem.serialNumbers };
              if (idx !== -1) {
                const arr = [...prev];
                arr[idx] = updated;
                return arr;
              } else {
                return [...prev, updated];
              }
            });
          }
        }
      }
      
      console.log('Item saved successfully');
      // No fetchInventory() call needed, context handles the update via SSE
      handleCloseItemModal();
    } catch (err: any) {
      console.error('Error saving item:', err);
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

  const handleExcelUploadComplete = async (items: any[]) => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Convert processed items to inventory format and save them
      for (const item of items) {
        const inventoryItem = {
          name: item.itemName,
          sku: item.sku,
          category: item.category || 'General', // Use category from Excel or default
          quantity: item.quantity,
          location: item.location || 'Warehouse A', // Use location from Excel or default
          reorderPoint: item.reorderPoint || Math.max(Math.floor(item.quantity * 0.2), 5), // Use reorder point from Excel or default
          isSerialized: false,
          costPrice: item.costPrice || 0, // Use cost price from Excel or default
          entryDate: new Date().toISOString(),
          department: item.department
        };
        
        await inventoryService.addInventoryItem(inventoryItem);
      }
      
      // Show success message
      setSuccessMessage(`Successfully uploaded ${items.length} items from Excel file!`);
      setShowSuccessNotification(true);
      
      // Auto-hide success notification after 3 seconds
      setTimeout(() => {
        setShowSuccessNotification(false);
        setSuccessMessage('');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload items from Excel file');
    } finally {
      setIsSaving(false);
    }
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

        const savedItem = await inventoryService.addInventoryItem(newItem);
        // Track the added serialized item for this ASN
        if (asnId) {
          setAddedItemsForAsn(prev => {
            const idx = prev.findIndex(i => i.name === savedItem.name && i.sku === savedItem.sku);
            const updated = { name: savedItem.name, sku: savedItem.sku, quantity: savedItem.quantity, serialNumbers: savedItem.serialNumbers };
            if (idx !== -1) {
              const arr = [...prev];
              arr[idx] = updated;
              return arr;
            } else {
              return [...prev, updated];
            }
          });
        }
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
        <div className="flex space-x-2">
          <button
            onClick={() => setIsExcelUploadModalOpen(true)}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
          >
            <UploadIcon className="h-5 w-5 mr-2" />
            Upload Excel
          </button>
          <button
            onClick={() => handleOpenItemModal()}
            className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Item
          </button>
        </div>
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
                  {addedItemsForAsn.length > 0 
                    ? `${addedItemsForAsn.length} item(s) added to inventory. Continue adding items or return to complete the receiving process.`
                    : 'Add items to inventory for this shipment. When finished, return to complete the receiving process.'
                  }
                </p>
                {addedItemsForAsn.length > 0 && (
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-300">
                    <strong>Added items:</strong> {addedItemsForAsn.map(item => `${item.name} (${item.quantity})`).join(', ')}
                  </div>
                )}
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
      {asnId && addedItemsForAsn.length > 0 && (
        <div className="my-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h4 className="font-semibold text-blue-700 dark:text-blue-200 mb-2">Items to be Received for this Shipment:</h4>
          <ul className="list-disc pl-6">
            {addedItemsForAsn.map((item, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-medium">{item.name}</span> (SKU: {item.sku}) — Qty: {item.quantity}
                {item.serialNumbers && item.serialNumbers.length > 0 && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">Serials: {item.serialNumbers.join(', ')}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4">
        <div className="relative flex-1">
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

      {error && <ErrorMessage message={error} />}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {successMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowSuccessNotification(false)}
                className="inline-flex text-green-400 hover:text-green-600 dark:hover:text-green-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
        <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(); }} className="space-y-4">
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
              <label htmlFor="item-department" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Department *
              </label>
              <select
                id="item-department"
                name="department"
                value={currentItem.department || ''}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className={TAILWIND_INPUT_CLASSES}
                required
              >
                <option value="">Select Department</option>
                {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
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
                {currentItem.isSerialized ? 'Serial Numbers Count' : (currentItem.id ? 'Quantity to Update' : 'Quantity to Add')}
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

          <div className="flex items-center">
            <input
              id="item-isAged"
              type="checkbox"
              name="isAged"
              checked={currentItem.isAged || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="item-isAged" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
              Aged Items
            </label>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleCloseItemModal}
              className="px-4 py-2 text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : (currentItem.id ? 'Update' : 'Add Item')}
            </button>
          </div>
        </form>
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

      {/* Excel Upload Modal */}
      <ExcelUploadModal
        isOpen={isExcelUploadModalOpen}
        onClose={() => setIsExcelUploadModalOpen(false)}
        onUploadComplete={handleExcelUploadComplete}
      />
    </PageContainer>
  );
};

export default InventoryManagementPage;