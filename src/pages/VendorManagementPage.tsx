import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage';
import AutocompleteInput from '@/components/AutocompleteInput';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import { useVendor } from '@/hooks/useVendor';
import { Vendor, ColumnDefinition } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon, ShipmentIcon } from '@/constants';
import { vendorService } from '@/services/vendorService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const VendorManagementPage: React.FC = () => {
  const { vendors, isLoading: isVendorLoading, error: vendorError, lastUpdatedId, clearLastUpdatedId } = useVendor();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentVendor, setCurrentVendor] = useState<Partial<Vendor>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  const { isModalOpen: isConfirmDeleteOpen, confirmButtonText, showConfirmation: showDeleteConfirmation, handleConfirm: handleConfirmDelete, handleClose: handleCloseDeleteConfirm } = useConfirmationModal();

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

  const handleOpenModal = (vendor?: Vendor) => {
    setError(null);
    setCurrentVendor(vendor || { performanceScore: 80, products: [], lastCommunicationDate: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentVendor({});
    setError(null);
  };

  const handleSaveVendor = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (!currentVendor.name || !currentVendor.email || !currentVendor.contactPerson) {
        throw new Error("Vendor Name, Email, and Contact Person are required.");
      }
      
      if (currentVendor.id) { 
        await vendorService.updateVendor(currentVendor.id, currentVendor as Vendor);
      } else { 
        await vendorService.createVendor(currentVendor as Omit<Vendor, 'id'>);
      }
      
      // No fetch needed, context handles the update via SSE
      handleCloseModal();
    } catch (err: any) {
      console.error("Failed to save vendor:", err);
      let userFriendlyError = "Failed to save vendor. Please try again.";
      if (err.message) {
        if (err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server to save the vendor. Please check your network or server status.";
        } else {
            userFriendlyError = err.message;
        }
      }
      setError(userFriendlyError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVendor = (id: number) => {
     showDeleteConfirmation(async () => {
        setError(null);
        try {
            await vendorService.deleteVendor(id);
            // No fetch needed, context handles the update via SSE
        } catch (err: any) {
            console.error("Failed to delete vendor:", err);
            let userFriendlyError = "Failed to delete vendor. Please try again.";
            if (err.message.toLowerCase().includes("failed to fetch")) {
                userFriendlyError = "Could not connect to the server to delete the vendor. Please check your network or server status.";
            } else {
                userFriendlyError = err.message;
            }
            setError(userFriendlyError);
        }
    }, { confirmText: 'Confirm Delete' });
  };
  
  const filteredVendors = useMemo(() => vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.products.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (vendor.averageLeadTime && vendor.averageLeadTime.toString().includes(searchTerm.toLowerCase()))
  ), [vendors, searchTerm]);
  
  const renderPerformanceScore = (score: number) => {
    let colorClass = 'text-green-600 dark:text-green-400';
    if (score < 80) colorClass = 'text-yellow-600 dark:text-yellow-400';
    if (score < 60) colorClass = 'text-red-600 dark:text-red-400';
    return <span className={`font-semibold ${colorClass}`}>{score}%</span>;
  };
  
  const renderTableActions = useCallback((vendor: Vendor) => (
    <div className="flex space-x-1">
      <button onClick={() => navigate(`/incoming-shipments?supplier=${encodeURIComponent(vendor.name)}`)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1" title="View Shipments" disabled={isSaving}>
        <ShipmentIcon className="h-5 w-5" />
      </button>
      <button onClick={() => handleOpenModal(vendor)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 p-1" title="Edit Vendor" disabled={isSaving}>
        <EditIcon className="h-5 w-5" />
      </button>
      <button onClick={() => handleDeleteVendor(vendor.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1" title="Delete Vendor" disabled={isSaving || isVendorLoading}>
        <DeleteIcon className="h-5 w-5" />
      </button>
    </div>
  ), [isSaving, isVendorLoading, navigate]);

  const columns: ColumnDefinition<Vendor, keyof Vendor>[] = [
    { key: 'name', header: 'Vendor Name', sortable: true },
    { key: 'contactPerson', header: 'Contact Person', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'performanceScore', header: 'Perf. Score', render: (item) => renderPerformanceScore(item.performanceScore), sortable: true },
    { key: 'averageLeadTime', header: 'Lead Time (Days)', render: (item) => item.averageLeadTime ? `${item.averageLeadTime} days` : 'Not set', sortable: true },
    { key: 'lastCommunicationDate', header: 'Last Contact', sortable: true },
    { key: 'products', header: 'Products/Services', render: (item) => item.products.join(', ') },
  ];

  if (isVendorLoading && vendors.length === 0 && !vendorError) {
    return (
      <PageContainer title="Vendor Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="w-12 h-12 text-primary-500" />
           <p className="ml-4 text-lg">Loading vendors...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Vendor Management"
      actions={
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          disabled={isSaving || isVendorLoading}
        >
          <PlusIcon className="h-5 w-5 mr-2" /> Add Vendor
        </button>
      }
    >
      {isVendorLoading && vendors.length > 0 && <div className="absolute top-4 right-4"><LoadingSpinner className="w-6 h-6 text-primary-500" /></div>}
      <ErrorMessage message={!isModalOpen ? error || vendorError : null} />
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <label htmlFor="search-vendors" className="sr-only">Search vendors</label>
          <input
            id="search-vendors"
            type="text"
            placeholder="Search vendors (name, contact, email, products, lead time)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md leading-5 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            autoComplete="off"
          />
        </div>
      </div>

      {!isVendorLoading && filteredVendors.length === 0 && !vendorError && (
         <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">
            {searchTerm ? "No vendors found matching your search." : "No vendors available. Try adding one!"}
        </p>
      )}
      {!isVendorLoading && filteredVendors.length > 0 && (
        <Table<Vendor>
            columns={columns}
            data={filteredVendors}
            actions={renderTableActions}
            rowClassName={(item) => highlightedRow === item.id ? 'animate-row-highlight' : ''}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmButtonText={confirmButtonText}
      />

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentVendor.id ? 'Edit Vendor' : 'Add New Vendor'} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveVendor(); }} className="space-y-4">
          <ErrorMessage message={isModalOpen ? error : null} />
          <div>
            <label htmlFor="vendorName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Vendor Name</label>
            <input 
              type="text" 
              name="name" 
              id="vendorName" 
              value={currentVendor.name || ''} 
              onChange={(e) => setCurrentVendor({...currentVendor, name: e.target.value})} 
              required 
              className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
              autoComplete="organization"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <AutocompleteInput
                value={currentVendor.contactPerson || ''}
                onChange={(value) => setCurrentVendor({...currentVendor, contactPerson: value})}
                options={[...new Set(vendors.map(vendor => vendor.contactPerson).filter(Boolean))]}
                placeholder="Enter contact person name"
                label="Contact Person"
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Email</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                value={currentVendor.email || ''} 
                onChange={(e) => setCurrentVendor({...currentVendor, email: e.target.value})} 
                required 
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                autoComplete="email"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Phone</label>
              <input 
                type="tel" 
                name="phone" 
                id="phone" 
                value={currentVendor.phone || ''} 
                onChange={(e) => setCurrentVendor({...currentVendor, phone: e.target.value})} 
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                autoComplete="tel"
              />
            </div>
             <div>
              <label htmlFor="lastCommunicationDate" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Last Communication Date</label>
              <input 
                type="date" 
                name="lastCommunicationDate" 
                id="lastCommunicationDate" 
                value={currentVendor.lastCommunicationDate || ''} 
                onChange={(e) => setCurrentVendor({...currentVendor, lastCommunicationDate: e.target.value})} 
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="performanceScore" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Performance Score (0-100)</label>
              <input 
                type="number" 
                name="performanceScore" 
                id="performanceScore" 
                value={currentVendor.performanceScore ?? ''} 
                min="0" 
                max="100" 
                onChange={(e) => setCurrentVendor({...currentVendor, performanceScore: parseInt(e.target.value)})} 
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="averageLeadTime" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Average Lead Time (Days)</label>
              <input 
                type="number" 
                name="averageLeadTime" 
                id="averageLeadTime" 
                value={currentVendor.averageLeadTime ?? ''} 
                min="0" 
                onChange={(e) => setCurrentVendor({...currentVendor, averageLeadTime: parseInt(e.target.value) || undefined})} 
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                placeholder="e.g., 14"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <AutocompleteInput
              value={currentVendor.products?.join(', ') || ''}
              onChange={(value) => setCurrentVendor({...currentVendor, products: value.split(',').map(p => p.trim())})}
              options={[...new Set(vendors.flatMap(vendor => vendor.products).filter(Boolean))]}
              placeholder="Enter products/services (comma-separated)"
              label="Products/Services (comma-separated)"
              className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" disabled={isSaving}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50" disabled={isSaving}>
                 {isSaving ? <LoadingSpinner className="w-5 h-5 inline-block" /> : (currentVendor.id ? 'Save Changes' : 'Add Vendor')}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default VendorManagementPage;