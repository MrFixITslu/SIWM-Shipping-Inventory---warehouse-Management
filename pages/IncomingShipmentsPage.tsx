

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import BrokerFeeModal from '@/components/BrokerFeeModal';
import FinanceApprovalModal from '@/components/FinanceApprovalModal';
import PaymentConfirmationModal from '@/components/PaymentConfirmationModal';
import ReceivingModal from '@/components/ReceivingModal';
import ErrorMessage from '@/components/ErrorMessage';
import ASNDetailView from '@/components/ASNDetailView';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { ASN, ColumnDefinition, AlertSeverity, Vendor, UserSummary, FeeStatus } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon, CheckBadgeIcon, AiIcon } from '@/constants';
import { asnService } from '@/services/asnService';
import { vendorService } from '@/services/vendorService';
import { userService } from '@/services/userService';
import { aiInsightService } from '@/services/aiInsightService'; 
import { alertingService } from '@/services/alertingService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';


const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";
const departmentOptions = ["Digicel+", "Digicel Business", "Commercial", "Marketing", "Outside Plant (OSP)", "Field Force & HVAC"];

const IncomingShipmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [asns, setAsns] = useState<ASN[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [brokers, setBrokers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentAsn, setCurrentAsn] = useState<Partial<ASN>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const { isModalOpen: isConfirmDeleteOpen, showConfirmation: showDeleteConfirmation, handleConfirm: handleConfirmDelete, handleClose: handleCloseDeleteConfirm } = useConfirmationModal();
  
  const [selectedAsn, setSelectedAsn] = useState<ASN | null>(null);
  const [aiDelayPrediction, setAiDelayPrediction] = useState<string | null>(null);
  const [isAiPredictionLoading, setIsAiPredictionLoading] = useState(false);
  
  const [isBrokerFeeModalOpen, setIsBrokerFeeModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [asnForReceiving, setAsnForReceiving] = useState<ASN | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);


  const modalContentRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [asnData, vendorData, brokersData] = await Promise.all([
        asnService.getASNs(),
        vendorService.getVendors(),
        userService.getUsers({ role: 'Broker' }),
      ]);
      setAsns(asnData);
      setVendors(vendorData);
      setBrokers(brokersData);

      if (selectedAsn) {
        const updatedSelectedAsn = asnData.find(a => a.id === selectedAsn.id);
        setSelectedAsn(updatedSelectedAsn || null);
      }

    } catch (err: any) {
      console.error("Failed to fetch page data:", err);
      let userFriendlyError = "An unexpected error occurred while fetching page data. Please try again.";
      if (err.message) {
        if (err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server to fetch data. Please check your network connection or if the backend service is running.";
        } else {
            userFriendlyError = `Error fetching data: ${err.message}.`;
        }
      }
      setError(userFriendlyError);
      setAsns([]);
      setVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAsn?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const supplierFromQuery = searchParams.get('supplier');
    if (supplierFromQuery) {
      setSearchTerm(supplierFromQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on initial mount

  // --- Real-time updates ---
    const handleRealtimeUpdate = useCallback((updatedAsn: ASN) => {
        setAsns(prev => prev.map(asn => asn.id === updatedAsn.id ? updatedAsn : asn));
        setSelectedAsn(prevSelected => prevSelected?.id === updatedAsn.id ? updatedAsn : prevSelected);
        setHighlightedRow(updatedAsn.id);
        setTimeout(() => setHighlightedRow(null), 2000);
    }, []);

    const handleRealtimeCreate = useCallback((newAsn: ASN) => {
        setAsns(prev => [newAsn, ...prev]);
        setHighlightedRow(newAsn.id);
        setTimeout(() => setHighlightedRow(null), 2000);
    }, []);

    const handleRealtimeDelete = useCallback(({ id }: { id: number }) => {
        setAsns(prev => prev.filter(asn => asn.id !== id));
        setSelectedAsn(prevSelected => prevSelected?.id === id ? null : prevSelected);
    }, []);

    const realtimeHandlers = useMemo(() => ({
        'asn_created': handleRealtimeCreate,
        'asn_updated': handleRealtimeUpdate,
        'asn_deleted': handleRealtimeDelete,
    }), [handleRealtimeCreate, handleRealtimeUpdate, handleRealtimeDelete]);

    useRealtimeUpdates(realtimeHandlers);
  // --- End of real-time updates ---


  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPrediction = async () => {
      if (selectedAsn) {
        setIsAiPredictionLoading(true);
        setAiDelayPrediction(null);
        try {
          const prediction = await aiInsightService.getASNDelayPrediction(selectedAsn, signal);
          if (!signal.aborted) {
            setAiDelayPrediction(prediction);
          }
        } catch (predError: any) {
          if (predError.name !== 'AbortError') {
            setAiDelayPrediction(predError.message || "AI prediction failed.");
          }
        } finally {
          if (!signal.aborted) {
            setIsAiPredictionLoading(false);
          }
        }
      }
    };
    fetchPrediction();

    return () => {
      controller.abort();
    };
  }, [selectedAsn?.id]);

  const handleOpenModal = (asn?: ASN) => {
    setError(null);
    setCurrentAsn(asn || { status: 'On Time', expectedArrival: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAsn({});
    setError(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentAsn(prev => {
      const updatedAsn = { ...prev, [name]: value };
      if (name === 'brokerId' && value) {
        const selectedBroker = brokers.find(b => b.id === Number(value));
        updatedAsn.brokerName = selectedBroker?.name;
      }
      return updatedAsn;
    });
  };

  const handleSaveAsn = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const asnToSave: Partial<ASN> = { ...currentAsn };
      
      // Validate required fields
      if (!asnToSave.poNumber || !asnToSave.supplier || !asnToSave.expectedArrival || !asnToSave.carrier || !asnToSave.department) {
        throw new Error('PO Number, Supplier, Department, Expected Arrival, and Carrier are required fields.');
      }
      
      // Convert itemCount to number if it's a string
      if (asnToSave.itemCount !== undefined) {
        if (typeof asnToSave.itemCount === 'string') {
          const parsedItemCount = parseInt(asnToSave.itemCount, 10);
          if (isNaN(parsedItemCount) || parsedItemCount < 0) {
            throw new Error('Item count must be a valid non-negative number.');
          }
          asnToSave.itemCount = parsedItemCount;
        } else if (typeof asnToSave.itemCount !== 'number' || asnToSave.itemCount < 0) {
          throw new Error('Item count must be a valid non-negative number.');
        }
      }
      
      // Convert brokerId to number if it's a string
      if (asnToSave.brokerId && typeof asnToSave.brokerId === 'string') {
        const parsedBrokerId = parseInt(asnToSave.brokerId, 10);
        if (isNaN(parsedBrokerId)) {
          throw new Error('Invalid broker ID format.');
        }
        asnToSave.brokerId = parsedBrokerId;
      }
      
      // If no brokers are available, set a default broker or make it optional
      if (!asnToSave.brokerId && brokers.length > 0) {
        asnToSave.brokerId = brokers[0].id;
        asnToSave.brokerName = brokers[0].name;
      }
      
      if (asnToSave.id) {
        await asnService.updateASN(asnToSave.id, asnToSave);
      } else {
        await asnService.createASN(asnToSave as Omit<ASN, 'id'>);
      }
      // No need to call fetchData() here, as real-time update will handle it.
      handleCloseModal();
    } catch (err: any) {
      let userFriendlyError = "An unexpected error occurred.";
      if (err.message) {
        userFriendlyError = err.message;
      }
      setError(userFriendlyError);
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAsn = (id: number) => {
    showDeleteConfirmation(async () => {
      try {
        await asnService.deleteASN(id);
        // No need to call fetchData() here, as real-time update will handle it.
        // setSelectedAsn(null) is handled by the delete event handler.
      } catch (err: any) {
        setError(err.message || "Failed to delete ASN.");
      }
    });
  };
  
  const filteredAsns = useMemo(() => {
    if (!searchTerm.trim()) return asns;
    const lower = searchTerm.toLowerCase();
    return asns.filter(asn =>
      asn.poNumber?.toLowerCase().includes(lower) ||
      asn.supplier.toLowerCase().includes(lower) ||
      asn.status.toLowerCase().includes(lower) ||
      asn.carrier.toLowerCase().includes(lower)
    );
  }, [asns, searchTerm]);

  const getStatusBadge = (status: ASN['status']) => {
    const statusColors: Record<ASN['status'], string> = {
      'On Time': 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
      'Delayed': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
      'Arrived': 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
      'Processing': 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>{status}</span>;
  };

  const getFeeStatusBadge = (status?: FeeStatus) => {
    if (!status) return null;
    const statusColors: Record<FeeStatus, string> = {
        [FeeStatus.PendingSubmission]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        [FeeStatus.PendingApproval]: 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200',
        [FeeStatus.Approved]: 'bg-teal-100 dark:bg-teal-700 text-teal-800 dark:text-teal-200',
        [FeeStatus.PaymentConfirmed]: 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200',
        [FeeStatus.Rejected]: 'bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>{status}</span>;
  };
  
  const tableActions = (item: ASN) => (
    <div className="flex space-x-1">
      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(item);}} className="text-primary-600 hover:text-primary-800 p-1" title="Edit Shipment">
        <EditIcon className="h-5 w-5" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); handleDeleteAsn(item.id);}} className="text-red-600 hover:text-red-800 p-1" title="Delete Shipment">
        <DeleteIcon className="h-5 w-5" />
      </button>
    </div>
  );

  const columns: ColumnDefinition<ASN, keyof ASN>[] = [
    { key: 'poNumber', header: 'P.O. #', sortable: true },
    { key: 'supplier', header: 'Supplier', sortable: true },
    { key: 'expectedArrival', header: 'Expected Arrival', sortable: true },
    { key: 'status', header: 'Status', sortable: true, render: (item) => getStatusBadge(item.status) },
    { key: 'feeStatus', header: 'Fee Status', render: item => getFeeStatusBadge(item.feeStatus), sortable: true },
  ];
  
  const handleOpenBrokerFeeModal = (asn: ASN) => {
    setSelectedAsn(asn);
    setIsBrokerFeeModalOpen(true);
  };

  const handleOpenFinanceModal = (asn: ASN) => {
    setSelectedAsn(asn);
    setIsFinanceModalOpen(true);
  };
  
  const handleOpenPaymentModal = (asn: ASN) => {
    setSelectedAsn(asn);
    setIsPaymentModalOpen(true);
  };
  
  const handleOpenReceivingModal = (asn: ASN) => {
    setAsnForReceiving(asn);
    setIsReceivingModalOpen(true);
  };
  
  if (isLoading && asns.length === 0) {
    return (
      <PageContainer title="Incoming Shipments">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="w-12 h-12 text-primary-500" />
          <p className="ml-4 text-lg">Loading shipments...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Incoming Shipments (ASNs)"
      actions={
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Incoming Shipment
        </button>
      }
    >
      <ErrorMessage message={error} />
      <div className="mb-4">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
            type="text"
            placeholder="Search by PO#, supplier, status, carrier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md leading-5 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            {isLoading && asns.length > 0 && <div className="absolute top-4 right-4"><LoadingSpinner className="w-6 h-6 text-primary-500" /></div>}
            
            {!isLoading && filteredAsns.length === 0 && !error && (
                <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">
                {searchTerm ? 'No shipments found matching your search.' : 'No incoming shipments available.'}
                </p>
            )}
            {!isLoading && filteredAsns.length > 0 && (
                <Table<ASN>
                columns={columns}
                data={filteredAsns}
                onRowClick={(asn) => setSelectedAsn(asn)}
                actions={tableActions}
                rowClassName={(item) => highlightedRow === item.id ? 'animate-row-highlight' : ''}
                />
            )}
        </div>
        <div className="lg:col-span-1">
            {selectedAsn ? (
                <ASNDetailView
                    asn={selectedAsn}
                    user={user}
                    onClose={() => setSelectedAsn(null)}
                    onEnterFees={handleOpenBrokerFeeModal}
                    onApproveFees={handleOpenFinanceModal}
                    onConfirmPayment={handleOpenPaymentModal}
                    onConfirmArrival={handleOpenReceivingModal}
                />
            ) : (
                <div className="flex items-center justify-center h-full bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-6 text-center">
                    <p className="text-secondary-500 dark:text-secondary-400">Select a shipment to view its details and workflow actions.</p>
                </div>
            )}
             {selectedAsn && (
                <div className="mt-4 bg-white dark:bg-secondary-800 p-4 rounded-xl shadow-lg">
                    <h4 className="text-md font-semibold text-secondary-800 dark:text-secondary-200 mb-2 flex items-center">
                        <AiIcon className="h-5 w-5 mr-2 text-purple-500" /> AI Delay Prediction
                    </h4>
                    {isAiPredictionLoading ? (
                        <div className="flex items-center">
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                            <p className="text-sm text-secondary-500">Analyzing...</p>
                        </div>
                    ) : (
                        <p className="text-sm text-secondary-700 dark:text-secondary-300">{aiDelayPrediction || "No prediction available."}</p>
                    )}
                </div>
            )}
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentAsn.id ? 'Edit Shipment' : 'Add Incoming Shipment'} size="lg" contentRef={modalContentRef}>
        <form onSubmit={(e) => { e.preventDefault(); handleSaveAsn(); }} className="space-y-4">
            {error && <ErrorMessage message={error}/>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="poNumber" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">P.O. Number</label>
                  <input type="text" name="poNumber" id="poNumber" value={currentAsn.poNumber || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} />
              </div>
              <div>
                  <label htmlFor="department" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Department</label>
                  <select name="department" id="department" value={currentAsn.department || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}>
                      <option value="">Select Department</option>
                      {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Supplier</label>
                  <select name="supplier" id="supplier" value={currentAsn.supplier || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}>
                    <option value="">Select a vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="expectedArrival" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Expected Arrival Date</label>
                  <input type="date" name="expectedArrival" id="expectedArrival" value={currentAsn.expectedArrival || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="carrier" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Carrier</label>
                  <input type="text" name="carrier" id="carrier" value={currentAsn.carrier || ''} onChange={handleInputChange} required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} />
              </div>
               <div>
                  <label htmlFor="itemCount" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Total Item Count</label>
                  <input type="number" name="itemCount" id="itemCount" value={currentAsn.itemCount ?? ''} onChange={handleInputChange} min="0" required className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`} />
              </div>
            </div>
             <div>
                <label htmlFor="brokerId" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Assign Broker (Optional)</label>
                <select name="brokerId" id="brokerId" value={currentAsn.brokerId || ''} onChange={handleInputChange} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}>
                    <option value="">Select a Broker</option>
                    {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {brokers.length === 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    No brokers available. You can create a broker user in the User Management section.
                  </p>
                )}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm" disabled={isSaving}>Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm disabled:opacity-50" disabled={isSaving}>
                {isSaving ? <LoadingSpinner className="w-5 h-5" /> : (currentAsn.id ? 'Save Changes' : 'Add Shipment')}
              </button>
            </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Incoming Shipment"
        message="Are you sure you want to delete this shipment record? This action cannot be undone."
      />

       <BrokerFeeModal
        isOpen={isBrokerFeeModalOpen}
        onClose={() => setIsBrokerFeeModalOpen(false)}
        shipment={selectedAsn}
        onActionComplete={() => { /* Real-time update will handle it */ }}
        onSubmitFees={asnService.submitFees}
      />

      <FinanceApprovalModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        shipment={selectedAsn}
        onActionComplete={() => { /* Real-time update will handle it */ }}
        onApproveFees={asnService.approveFees}
      />

       <PaymentConfirmationModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        shipment={selectedAsn}
        onActionComplete={() => { /* Real-time update will handle it */ }}
        onConfirmPayment={asnService.confirmPayment}
      />

      <ReceivingModal
        isOpen={isReceivingModalOpen}
        onClose={() => setIsReceivingModalOpen(false)}
        shipment={asnForReceiving}
        onReceiveComplete={fetchData}
      />
      
    </PageContainer>
  );
};

export default IncomingShipmentsPage;