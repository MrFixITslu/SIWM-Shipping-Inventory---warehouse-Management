
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import { useInventory } from '@/hooks/useInventory';
import { useVendor } from '@/hooks/useVendor';
import { InventoryItem, Vendor, ColumnDefinition } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon } from '@/constants';
import { inventoryService } from '@/services/inventoryService';
import { vendorService } from '@/services/vendorService';
import { LoadingSpinner } from '@/components/icons/LoadingSpinner';

type MasterDataType = 'inventory' | 'vendors' | 'locations';
type EditableItem = Partial<InventoryItem & Vendor>;

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MasterDataType>('inventory');
  
  const { inventory, isLoading: isInventoryLoading, error: inventoryError } = useInventory();
  const { vendors, isLoading: isVendorLoading, error: vendorError } = useVendor();
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);

  const { isModalOpen: isConfirmDeleteOpen, showConfirmation, handleConfirm, handleClose: handleCloseConfirm } = useConfirmationModal();

  const currentData = useMemo(() => {
    switch(activeTab) {
      case 'inventory': return inventory;
      case 'vendors': return vendors;
      default: return [];
    }
  }, [activeTab, inventory, vendors]);

  const isLoading = useMemo(() => isInventoryLoading || isVendorLoading, [isInventoryLoading, isVendorLoading]);
  const currentError = useMemo(() => activeTab === 'inventory' ? inventoryError : vendorError, [activeTab, inventoryError, vendorError]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return currentData;
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return currentData.filter(item => 
        Object.values(item).some(value => 
            String(value).toLowerCase().includes(lowerSearchTerm)
        )
    );
  }, [currentData, searchTerm]);

  const handleOpenModal = (item?: EditableItem) => {
    setError(null);
    if (item) {
      setEditingItem(item);
    } else {
      if (activeTab === 'inventory') setEditingItem({ name: '', sku: '', category: '', location: '', reorderPoint: 0, isSerialized: false, costPrice: 0 });
      if (activeTab === 'vendors') setEditingItem({ name: '', email: '', contactPerson: '', phone: '', products: [], performanceScore: 80, lastCommunicationDate: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setError(null);
  }

  const handleSave = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    setError(null);

    try {
        if (activeTab === 'inventory') {
            const itemToSave = { ...editingItem } as InventoryItem;
            if (editingItem.id) {
                await inventoryService.updateInventoryItem(editingItem.id, itemToSave);
            } else {
                await inventoryService.addInventoryItem(itemToSave);
            }
        } else if (activeTab === 'vendors') {
            const itemToSave = { ...editingItem } as Vendor;
             if (editingItem.id) {
                await vendorService.updateVendor(editingItem.id, itemToSave);
            } else {
                await vendorService.createVendor(itemToSave);
            }
        }
        // No fetch needed, context handles the update via SSE
        handleCloseModal();
    } catch (err: any) {
        setError(err.message || "Failed to save data.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = (item: EditableItem) => {
    showConfirmation(async () => {
        if (!item.id) return;
        setError(null);
        try {
            if (activeTab === 'inventory') {
                await inventoryService.deleteInventoryItem(item.id);
            } else if (activeTab === 'vendors') {
                await vendorService.deleteVendor(item.id);
            }
            // No fetch needed, context handles the update via SSE
        } catch (err: any) {
            setError(err.message || "Failed to delete item.");
        }
    }, { confirmText: 'Confirm Delete' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    setEditingItem(prev => {
        if (!prev) return null;
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
        let finalValue: any = value;
        if(isCheckbox) finalValue = checked;
        else if (type === 'number') finalValue = parseFloat(value) || 0;
        else if (name === 'products') finalValue = value.split(',').map(p => p.trim());
        
        return { ...prev, [name]: finalValue };
    });
  };

  const renderActions = useCallback((item: EditableItem) => (
    <div className="flex space-x-2">
        <button onClick={() => handleOpenModal(item)} className="p-1 text-primary-500 hover:text-primary-700" title="Edit"><EditIcon className="h-5 w-5" /></button>
        <button onClick={() => handleDelete(item)} className="p-1 text-red-500 hover:text-red-700" title="Delete"><DeleteIcon className="h-5 w-5" /></button>
    </div>
  ), []);

  const inventoryColumns: ColumnDefinition<InventoryItem, keyof InventoryItem>[] = [
    { key: 'sku', header: 'SKU', sortable: true }, { key: 'name', header: 'Name', sortable: true },
    { key: 'category', header: 'Category', sortable: true }, { key: 'location', header: 'Location', sortable: true },
  ];
  const vendorColumns: ColumnDefinition<Vendor, keyof Vendor>[] = [
    { key: 'name', header: 'Name', sortable: true }, { key: 'contactPerson', header: 'Contact', sortable: true },
    { key: 'email', header: 'Email', sortable: true }, { key: 'phone', header: 'Phone', sortable: true },
  ];

  const renderContent = () => {
    if(isLoading) return <div className="flex justify-center items-center h-48"><LoadingSpinner className="w-8 h-8 text-primary-500" /><p className="ml-3">Loading {activeTab}...</p></div>;
    if(currentError) return <ErrorMessage message={currentError} />;
    if(filteredData.length === 0) return <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">{searchTerm ? `No ${activeTab} found matching your search.` : `No ${activeTab} available.`}</p>

    switch (activeTab) {
      case 'inventory': return <Table<InventoryItem> columns={inventoryColumns} data={filteredData as InventoryItem[]} actions={renderActions} />;
      case 'vendors': return <Table<Vendor> columns={vendorColumns} data={filteredData as Vendor[]} actions={renderActions} />;
      case 'locations': return <p className="text-secondary-600 dark:text-secondary-400 py-8 text-center">Locations master data management coming soon.</p>;
      default: return null;
    }
  };

  const renderModalContent = () => {
    if (!editingItem) return null;
    
    if (activeTab === 'inventory') {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label>Name</label><input name="name" value={editingItem.name || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} /></div>
                    <div><label>SKU</label><input name="sku" value={editingItem.sku || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} /></div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label>Category</label><input name="category" value={editingItem.category || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} /></div>
                    <div><label>Location</label><input name="location" value={editingItem.location || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} /></div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label>Cost Price</label><input type="number" name="costPrice" value={editingItem.costPrice ?? ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} /></div>
                    <div><label>Reorder Point</label><input type="number" name="reorderPoint" value={editingItem.reorderPoint ?? ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} disabled={editingItem.isSerialized} /></div>
                </div>
                 <div>
                    <label className="flex items-center"><input type="checkbox" name="isSerialized" checked={editingItem.isSerialized || false} onChange={handleInputChange} className="h-4 w-4 rounded" /><span className="ml-2">Is Serialized</span></label>
                </div>
            </div>
        );
    }
    
    if (activeTab === 'vendors') {
        return (
             <div className="space-y-4">
                <div><label className="block text-sm font-medium">Name</label><input name="name" value={editingItem.name || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium">Contact Person</label><input name="contactPerson" value={editingItem.contactPerson || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} required /></div>
                    <div><label className="block text-sm font-medium">Email</label><input type="email" name="email" value={editingItem.email || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} required /></div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium">Phone</label><input type="tel" name="phone" value={editingItem.phone || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} /></div>
                    <div><label className="block text-sm font-medium">Last Communication</label><input type="date" name="lastCommunicationDate" value={editingItem.lastCommunicationDate || ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} /></div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Performance Score (0-100)</label>
                    <input type="number" name="performanceScore" value={editingItem.performanceScore ?? ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} min="0" max="100" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Products (comma-separated)</label>
                    <input name="products" value={Array.isArray(editingItem.products) ? editingItem.products.join(', ') : ''} onChange={handleInputChange} className={`mt-1 w-full ${TAILWIND_INPUT_CLASSES}`} />
                </div>
            </div>
        );
    }
    return null;
  };

  return (
    <PageContainer 
        title="Master Data Governance"
        actions={ activeTab !== 'locations' &&
             <button onClick={() => handleOpenModal()} className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md">
                <PlusIcon className="h-5 w-5 mr-2" /> Add New {activeTab.slice(0, -1)}
            </button>
        }
    >
      <div className="mb-4 border-b border-secondary-300 dark:border-secondary-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {(['inventory', 'vendors', 'locations'] as MasterDataType[]).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
              className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="mb-4">
        <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className={`block w-full pl-4 pr-3 py-2 ${TAILWIND_INPUT_CLASSES}`} disabled={activeTab === 'locations'} />
      </div>
      
      {renderContent()}

      <Modal isOpen={isModalOpen && !!editingItem} onClose={handleCloseModal} title={editingItem?.id ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`} size="lg">
          <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <ErrorMessage message={error} />
            {renderModalContent()}
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 rounded-md" disabled={isSaving}>Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md disabled:opacity-50" disabled={isSaving}>
                    {isSaving ? <LoadingSpinner className="w-5 h-5"/> : 'Save'}
                </button>
            </div>
          </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirm}
        title={`Delete ${activeTab.slice(0,-1)}`}
        message="Are you sure? This action cannot be undone."
        confirmButtonText="Confirm Delete"
      />
    </PageContainer>
  );
};

export default MasterDataPage;
