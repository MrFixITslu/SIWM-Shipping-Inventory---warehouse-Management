


import React, { useState, useCallback, useRef, useMemo } from 'react';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import { useAsset } from '@/hooks/useAsset';
import { WarehouseAsset, MaintenanceRecord, ColumnDefinition, WarehouseAssetType, AssetStatus, MaintenanceType } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon, WrenchScrewdriverIcon, ViewfinderCircleIcon } from '@/constants';
import { assetService } from '@/services/assetService';
import { LoadingSpinner } from '@/components/icons/LoadingSpinner';

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const AssetManagementPage: React.FC = () => {
  const { assets, isLoading: isAssetLoading, error: assetError } = useAsset();
  const [selectedAssetLogs, setSelectedAssetLogs] = useState<MaintenanceRecord[]>([]);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Partial<WarehouseAsset>>({});
  const [currentMaintenanceRecord, setCurrentMaintenanceRecord] = useState<Partial<MaintenanceRecord>>({});
  const [selectedAssetForMaintenance, setSelectedAssetForMaintenance] = useState<WarehouseAsset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isModalOpen: isConfirmDeleteOpen, showConfirmation, handleConfirm: handleConfirmDelete, handleClose: handleCloseDeleteConfirm } = useConfirmationModal();
  const assetModalContentRef = useRef<HTMLDivElement>(null);
  const maintenanceModalContentRef = useRef<HTMLDivElement>(null);

  const handleCloseMaintenanceModal = useCallback(() => {
    setIsMaintenanceModalOpen(false);
    setCurrentMaintenanceRecord({});
    setSelectedAssetForMaintenance(null);
    setSelectedAssetLogs([]);
    setError(null); 
  }, []);

  const handleOpenAssetModal = (asset?: WarehouseAsset) => {
    setCurrentAsset(asset || { status: AssetStatus.Operational, purchaseDate: new Date().toISOString().split('T')[0] });
    setIsAssetModalOpen(true);
    setError(null); 
  };

  const handleCloseAssetModal = () => {
    setIsAssetModalOpen(false);
    setCurrentAsset({});
    setError(null);
  };

  const handleSaveAsset = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (!currentAsset.name || !currentAsset.assetType || !currentAsset.location || !currentAsset.status || !currentAsset.purchaseDate) {
        throw new Error("Asset Name, Type, Location, Status, and Purchase Date are required.");
      }
      if (currentAsset.id) {
        await assetService.updateAsset(currentAsset as WarehouseAsset);
      } else {
        await assetService.addAsset(currentAsset as Omit<WarehouseAsset, 'id'>);
      }
      // No need to fetch assets, context handles the update via SSE
      handleCloseAssetModal();
    } catch (err: any) {
      console.error("Failed to save asset:", err);
      let userFriendlyError = "Failed to save asset. Please try again.";
      if (err.message.toLowerCase().includes("failed to fetch")) {
          userFriendlyError = "Could not connect to the server to save the asset.";
      } else { userFriendlyError = err.message; }
      setError(userFriendlyError);
      assetModalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAsset = (id: number) => {
    showConfirmation(async () => {
        setError(null);
        try { 
            await assetService.deleteAsset(id); 
            // No need to fetch assets, context handles the update via SSE
        }
        catch (err: any) {
             let userFriendlyError = "Failed to delete asset. Please try again.";
             if (err.message) userFriendlyError = err.message;
             setError(userFriendlyError);
        }
    });
  };
  
  const handleOpenMaintenanceModal = async (asset: WarehouseAsset) => {
    setSelectedAssetForMaintenance(asset);
    setError(null);
    setIsMaintenanceModalOpen(true);
    setIsMaintenanceLoading(true);
    setSelectedAssetLogs([]);
    setCurrentMaintenanceRecord({ assetId: asset.id, date: new Date().toISOString().split('T')[0], type: MaintenanceType.Preventive });

    try {
      const logs = await assetService.getMaintenanceRecordsForAsset(asset.id);
      setSelectedAssetLogs(logs);
    } catch (err: any) {
        setError(err.message || 'Could not load maintenance logs.');
        setSelectedAssetLogs([]);
    } finally {
        setIsMaintenanceLoading(false);
    }
  };

  const handleSaveMaintenanceRecord = async () => {
    if (!selectedAssetForMaintenance) return;
    setIsSaving(true);
    setError(null);
    try {
      if (!currentMaintenanceRecord.date || !currentMaintenanceRecord.type || !currentMaintenanceRecord.description) {
          throw new Error("Date, Type, and Description are required for maintenance record.");
      }
      const recordToSave = { ...currentMaintenanceRecord, assetId: selectedAssetForMaintenance.id };

      if (currentMaintenanceRecord.id) {
        const updatedRecord = await assetService.updateMaintenanceRecord(selectedAssetForMaintenance.id, currentMaintenanceRecord.id, recordToSave as MaintenanceRecord);
        setSelectedAssetLogs(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
      } else {
        const newRecord = await assetService.addMaintenanceRecord(selectedAssetForMaintenance.id, recordToSave as Omit<MaintenanceRecord, 'id' | 'assetName'>);
        setSelectedAssetLogs(prev => [...prev, newRecord]);
      }
      
      setCurrentMaintenanceRecord({ assetId: selectedAssetForMaintenance.id, date: new Date().toISOString().split('T')[0], type: MaintenanceType.Preventive });
    } catch (err: any) {
      console.error("Failed to save maintenance record:", err);
      let userFriendlyError = "Failed to save maintenance record. Please try again.";
      if (err.message) userFriendlyError = err.message;
      setError(userFriendlyError);
      maintenanceModalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteMaintenanceRecord = (recordId: number) => {
    if (!selectedAssetForMaintenance) return;
    const assetId = selectedAssetForMaintenance.id;
    showConfirmation(async () => {
        setError(null);
        try {
            await assetService.deleteMaintenanceRecord(assetId, recordId);
            setSelectedAssetLogs(prev => prev.filter(r => r.id !== recordId));
        } catch(err: any) {
            let userFriendlyError = "Error deleting maintenance record. Please try again.";
            if (err.message) userFriendlyError = err.message;
            setError(userFriendlyError);
        }
    });
  };
  
  const handleClearMaintenanceForm = () => {
    setError(null);
    setCurrentMaintenanceRecord({ 
        id: undefined, // Explicitly clear the ID
        assetId: selectedAssetForMaintenance?.id, 
        date: new Date().toISOString().split('T')[0], 
        type: MaintenanceType.Preventive 
    });
  }

  const renderAssetTableActions = useCallback((asset: WarehouseAsset) => (
    <div className="flex space-x-1">
        <button onClick={() => handleOpenMaintenanceModal(asset)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1" title="View/Add Maintenance Log" disabled={isSaving}>
        <ViewfinderCircleIcon className="h-5 w-5" />
        </button>
        <button onClick={() => handleOpenAssetModal(asset)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 p-1" title="Edit Asset" disabled={isSaving}>
        <EditIcon className="h-5 w-5" />
        </button>
        <button onClick={() => handleDeleteAsset(asset.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1" title="Delete Asset" disabled={isSaving || isAssetLoading}>
        <DeleteIcon className="h-5 w-5" />
        </button>
    </div>
  ), [isSaving, isAssetLoading, handleOpenMaintenanceModal, handleOpenAssetModal, handleDeleteAsset]);

  const renderMaintenanceTableActions = useCallback((record: MaintenanceRecord) => (
      <div className="flex space-x-1">
        <button onClick={() => {setCurrentMaintenanceRecord(record); setError(null);}} className="text-primary-600 hover:text-primary-800 p-1" title="Edit Record" disabled={isSaving}>
            <EditIcon className="h-4 w-4" />
        </button>
        <button onClick={() => handleDeleteMaintenanceRecord(record.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete Record" disabled={isSaving || isMaintenanceLoading}>
            <DeleteIcon className="h-4 w-4" />
        </button>
    </div>
  ), [isSaving, isMaintenanceLoading, handleDeleteMaintenanceRecord]);


  const getAssetStatusBadge = (status: AssetStatus) => {
    const statusClasses: Record<AssetStatus, string> = {
      [AssetStatus.Operational]: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
      [AssetStatus.UnderMaintenance]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
      [AssetStatus.RequiresRepair]: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200',
      [AssetStatus.Decommissioned]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusClasses[status] || statusClasses[AssetStatus.Decommissioned]}`}>{status}</span>;
  };
  
  const isMaintenanceOverdue = (asset: WarehouseAsset): boolean => {
    if (!asset.nextScheduledMaintenance) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(asset.nextScheduledMaintenance) < today;
  };

  const assetColumns: ColumnDefinition<WarehouseAsset, keyof WarehouseAsset>[] = [
    { key: 'name', header: 'Asset Name', sortable: true, render: item => 
        <span className={`font-medium ${isMaintenanceOverdue(item) ? 'text-red-500 dark:text-red-400' : ''}`}>
            {item.name} 
            {isMaintenanceOverdue(item) && (
              <WrenchScrewdriverIcon className="h-4 w-4 inline-block ml-1 text-red-500" title="Maintenance Overdue" />
            )}
        </span> 
    },
    { key: 'assetType', header: 'Type', sortable: true },
    { key: 'location', header: 'Location', sortable: true },
    { key: 'status', header: 'Status', render: (item) => getAssetStatusBadge(item.status), sortable: true },
    { key: 'purchaseDate', header: 'Purchase Date', sortable: true },
    { key: 'nextScheduledMaintenance', header: 'Next Maintenance', sortable: true, render: (item) => item.nextScheduledMaintenance || 'N/A' },
  ];

  const maintenanceColumns: ColumnDefinition<MaintenanceRecord, keyof MaintenanceRecord>[] = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'description', header: 'Description', sortable: false },
    { key: 'performedBy', header: 'Performed By', sortable: true, render: item => item.performedBy || 'N/A' },
    { key: 'cost', header: 'Cost', sortable: true, render: item => item.cost ? `$${item.cost.toFixed(2)}` : 'N/A' },
  ];
  
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isAssetLoading && assets.length === 0 && !assetError) {
    return (
      <PageContainer title="Warehouse Asset Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="w-12 h-12 text-primary-500" />
           <p className="ml-4 text-lg">Loading assets...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Warehouse Asset Management"
      actions={
        <button
          onClick={() => handleOpenAssetModal()}
          className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          disabled={isSaving || isAssetLoading}
        >
          <PlusIcon className="h-5 w-5 mr-2" /> Add Asset
        </button>
      }
    >
      {isAssetLoading && assets.length > 0 && <div className="absolute top-4 right-4"><LoadingSpinner className="w-6 h-6 text-primary-500" /></div>}
      <ErrorMessage message={!isAssetModalOpen && !isMaintenanceModalOpen ? (error || assetError) : null} />
      
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search assets (name, type, location)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md leading-5 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {!isAssetLoading && filteredAssets.length === 0 && !assetError && (
        <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">
            {searchTerm ? "No assets found matching your search." : "No assets available. Try adding one!"}
        </p>
      )}
      {!isAssetLoading && filteredAssets.length > 0 && (
        <Table<WarehouseAsset>
            columns={assetColumns}
            data={filteredAssets}
            actions={renderAssetTableActions}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title={`Delete Item`}
        message={`Are you sure you want to delete this item? This action cannot be undone.`}
      />
      
      <Modal isOpen={isAssetModalOpen} onClose={handleCloseAssetModal} title={currentAsset.id ? 'Edit Asset' : 'Add New Asset'} size="2xl" contentRef={assetModalContentRef}>
        <form onSubmit={(e) => { e.preventDefault(); handleSaveAsset(); }} className="space-y-4">
          <ErrorMessage message={isAssetModalOpen ? error : null} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <label htmlFor="assetName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Asset Name</label> <input type="text" name="assetName" id="assetName" value={currentAsset.name || ''} onChange={(e) => setCurrentAsset({...currentAsset, name: e.target.value})} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
              <div> <label htmlFor="assetType" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Asset Type</label> <select name="assetType" id="assetType" value={currentAsset.assetType || ''} onChange={(e) => setCurrentAsset({...currentAsset, assetType: e.target.value as WarehouseAssetType})} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}> <option value="">Select Type</option> {Object.values(WarehouseAssetType).map(type => (<option key={type} value={type}>{type}</option>))} </select> </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <label htmlFor="assetLocation" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Location</label> <input type="text" name="assetLocation" id="assetLocation" value={currentAsset.location || ''} onChange={(e) => setCurrentAsset({...currentAsset, location: e.target.value})} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
              <div> <label htmlFor="assetStatus" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Status</label> <select name="assetStatus" id="assetStatus" value={currentAsset.status || ''} onChange={(e) => setCurrentAsset({...currentAsset, status: e.target.value as AssetStatus})} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}> {Object.values(AssetStatus).map(type => (<option key={type} value={type}>{type}</option>))} </select> </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <label htmlFor="assetSerialNumber" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Serial Number (Optional)</label> <input type="text" name="assetSerialNumber" id="assetSerialNumber" value={currentAsset.serialNumber || ''} onChange={(e) => setCurrentAsset({...currentAsset, serialNumber: e.target.value})} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
              <div> <label htmlFor="purchaseDate" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Purchase Date</label> <input type="date" name="purchaseDate" id="purchaseDate" value={currentAsset.purchaseDate || ''} onChange={(e) => setCurrentAsset({...currentAsset, purchaseDate: e.target.value})} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <label htmlFor="lastMaintenanceDate" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Last Maintenance (Optional)</label> <input type="date" name="lastMaintenanceDate" id="lastMaintenanceDate" value={currentAsset.lastMaintenanceDate || ''} onChange={(e) => setCurrentAsset({...currentAsset, lastMaintenanceDate: e.target.value})} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
              <div> <label htmlFor="nextScheduledMaintenance" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Next Maintenance (Optional)</label> <input type="date" name="nextScheduledMaintenance" id="nextScheduledMaintenance" value={currentAsset.nextScheduledMaintenance || ''} onChange={(e) => setCurrentAsset({...currentAsset, nextScheduledMaintenance: e.target.value})} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
          </div>
          <div><label htmlFor="notes" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Notes</label><textarea name="notes" id="notes" value={currentAsset.notes || ''} onChange={(e) => setCurrentAsset({...currentAsset, notes: e.target.value})} rows={3} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}></textarea></div>
          <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={handleCloseAssetModal} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm" disabled={isSaving}>Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm disabled:opacity-50" disabled={isSaving}> {isSaving ? <LoadingSpinner className="w-5 h-5 inline-block" /> : (currentAsset.id ? 'Save Changes' : 'Add Asset')} </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMaintenanceModalOpen} onClose={handleCloseMaintenanceModal} title={`Maintenance Log: ${selectedAssetForMaintenance?.name || ''}`} size="2xl" contentRef={maintenanceModalContentRef}>
          <ErrorMessage message={isMaintenanceModalOpen ? error : null} />
          <form onSubmit={(e) => { e.preventDefault(); handleSaveMaintenanceRecord(); }} className="space-y-4 p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-secondary-50 dark:bg-secondary-800/30 mb-6">
            <h4 className="text-lg font-medium text-secondary-800 dark:text-secondary-200">{currentMaintenanceRecord.id ? 'Edit Record' : 'Add New Record'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div> <label htmlFor="maintenanceDate" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Date</label> <input type="date" name="maintenanceDate" id="maintenanceDate" value={currentMaintenanceRecord.date || ''} onChange={(e) => setCurrentMaintenanceRecord({...currentMaintenanceRecord, date: e.target.value})} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
              <div> <label htmlFor="maintenanceType" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Type</label> <select name="maintenanceType" id="maintenanceType" value={currentMaintenanceRecord.type || ''} onChange={(e) => setCurrentMaintenanceRecord({...currentMaintenanceRecord, type: e.target.value as MaintenanceType})} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}> {Object.values(MaintenanceType).map(type => (<option key={type} value={type}>{type}</option>))} </select> </div>
            </div>
            <div> <label htmlFor="maintenanceDescription" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Description</label> <textarea name="maintenanceDescription" id="maintenanceDescription" value={currentMaintenanceRecord.description || ''} onChange={(e) => setCurrentMaintenanceRecord({...currentMaintenanceRecord, description: e.target.value})} rows={3} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}></textarea></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div> <label htmlFor="performedBy" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Performed By (Optional)</label> <input type="text" name="performedBy" id="performedBy" value={currentMaintenanceRecord.performedBy || ''} onChange={(e) => setCurrentMaintenanceRecord({...currentMaintenanceRecord, performedBy: e.target.value})} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
              <div> <label htmlFor="maintenanceCost" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Cost (Optional)</label> <input type="number" step="0.01" name="maintenanceCost" id="maintenanceCost" value={currentMaintenanceRecord.cost ?? ''} onChange={(e) => setCurrentMaintenanceRecord({...currentMaintenanceRecord, cost: parseFloat(e.target.value)})} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
              <div> <label htmlFor="downtimeHours" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Downtime Hours (Optional)</label> <input type="number" step="0.1" name="downtimeHours" id="downtimeHours" value={currentMaintenanceRecord.downtimeHours ?? ''} onChange={(e) => setCurrentMaintenanceRecord({...currentMaintenanceRecord, downtimeHours: parseFloat(e.target.value)})} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} /> </div>
            </div>
            <div className="flex justify-end space-x-3">
                <button type="button" onClick={handleClearMaintenanceForm} className="px-3 py-1.5 text-xs font-medium text-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded-md" disabled={isSaving}>Clear Form</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm disabled:opacity-50" disabled={isSaving}> {isSaving ? <LoadingSpinner className="w-5 h-5 inline-block" /> : (currentMaintenanceRecord.id ? 'Update Record' : 'Add Record')} </button>
            </div>
          </form>

          {isMaintenanceLoading ? <div className="flex justify-center p-8"><LoadingSpinner className="w-8 h-8 text-primary-500"/></div> : (
              selectedAssetLogs.length > 0 ? (
                  <Table<MaintenanceRecord> columns={maintenanceColumns} data={selectedAssetLogs} actions={renderMaintenanceTableActions}/>
              ) : <p className="text-center text-secondary-500 dark:text-secondary-400 py-4">No maintenance records found for this asset.</p>
          )}

          <div className="flex justify-end pt-4 mt-4 border-t border-secondary-200 dark:border-secondary-700">
            <button onClick={handleCloseMaintenanceModal} className="px-4 py-2 text-sm font-medium text-white bg-secondary-600 hover:bg-secondary-700 rounded-md shadow-sm">Close Log</button>
          </div>
      </Modal>
    </PageContainer>
  );
};

export default AssetManagementPage;