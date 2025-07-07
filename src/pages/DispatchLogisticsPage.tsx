import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import PickingModal from '@/components/PickingModal';
import BrokerFeeModal from '@/components/BrokerFeeModal';
import FinanceApprovalModal from '@/components/FinanceApprovalModal';
import PaymentConfirmationModal from '@/components/PaymentConfirmationModal';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { OutboundShipment, ColumnDefinition, WarehouseOrder, OrderStatus, AlertSeverity, OrderItem, FeeStatus, UserSummary } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, CheckBadgeIcon, PaperAirplaneIcon, ClipboardDocumentCheckIcon, CurrencyDollarIcon, ShipmentIcon } from '@/constants';
import { dispatchService } from '@/services/dispatchService';
import { orderService } from '@/services/orderService';
import { aiInsightService } from '@/services/aiInsightService'; 
import { alertingService } from '@/services/alertingService';
import { userService } from '@/services/userService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

interface ShipmentItemWithSerials extends OrderItem {
  shippedSerialNumbersString?: string;
}

interface CurrentShipmentFormState extends Partial<OutboundShipment> {
    itemsForDispatch?: ShipmentItemWithSerials[];
}

const DispatchLogisticsPage: React.FC = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<OutboundShipment[]>([]);
  const [warehouseOrders, setWarehouseOrders] = useState<WarehouseOrder[]>([]);
  const [brokers, setBrokers] = useState<UserSummary[]>([]);
  const { inventoryMap, fetchInventory: refetchInventory } = useInventory();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);
  const [isBrokerFeeModalOpen, setIsBrokerFeeModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [searchTermShipments, setSearchTermShipments] = useState('');
  const [searchTermOrders, setSearchTermOrders] = useState('');
  
  const [currentShipment, setCurrentShipment] = useState<CurrentShipmentFormState>({});
  const [currentOrderForStatus, setCurrentOrderForStatus] = useState<WarehouseOrder | null>(null);
  const [orderForPicking, setOrderForPicking] = useState<WarehouseOrder | null>(null);
  const [shipmentForAction, setShipmentForAction] = useState<OutboundShipment | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<{ type: 'order' | 'shipment', id: number } | null>(null);
  
  const { isModalOpen: isConfirmDeleteOpen, confirmButtonText: deleteButtonText, showConfirmation: showDeleteConfirmation, handleConfirm: handleConfirmDelete, handleClose: handleCloseDeleteConfirm } = useConfirmationModal();
  const { isModalOpen: isConfirmReceiptOpen, confirmButtonText: receiptButtonText, showConfirmation: showConfirmReceipt, handleConfirm: handleConfirmReceiptAction, handleClose: handleCloseReceiptConfirm } = useConfirmationModal();
  const { isModalOpen: isConfirmDeliveryOpen, confirmButtonText: deliveryButtonText, showConfirmation: showDeliveryConfirmation, handleConfirm: handleConfirmDeliveryAction, handleClose: handleCloseDeliveryConfirm } = useConfirmationModal();


  const [isRouteOptimizationModalOpen, setIsRouteOptimizationModalOpen] = useState(false);
  const [confirmationModalMessage, setConfirmationModalMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [routeOptimizationSuggestion, setRouteOptimizationSuggestion] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [shipmentsData, ordersData, brokersData] = await Promise.all([
        dispatchService.getDispatches(),
        orderService.getOrders(),
        userService.getUsers({ role: 'Broker' }),
      ]);
      setShipments(shipmentsData);
      setWarehouseOrders(ordersData);
      setBrokers(brokersData);
    } catch (err: any) {
      console.error("Failed to load dispatch page data:", err);
      let userFriendlyError = "An unexpected error occurred while fetching page data. Please try again.";
      if (err.message.toLowerCase().includes("failed to fetch")) {
        userFriendlyError = "Could not connect to the server. Please check your network or server status.";
      } else {
        userFriendlyError = `Error fetching data: ${err.message}.`;
      }
      setError(userFriendlyError);
      setShipments([]); setWarehouseOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
      fetchData();
  }, [fetchData]);

    // --- Real-time updates ---
    const showHighlight = useCallback((type: 'order' | 'shipment', id: number) => {
        setHighlightedRow({ type, id });
        setTimeout(() => setHighlightedRow(null), 2000);
    }, []);

    const handleOrderUpdate = useCallback((updatedOrder: WarehouseOrder) => {
        setWarehouseOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        showHighlight('order', updatedOrder.id);
    }, [showHighlight]);

    const handleDispatchCreate = useCallback((newDispatch: OutboundShipment) => {
        setShipments(prev => [newDispatch, ...prev]);
        showHighlight('shipment', newDispatch.id);
    }, [showHighlight]);

     const handleDispatchUpdate = useCallback((updatedDispatch: OutboundShipment) => {
        setShipments(prev => prev.map(s => s.id === updatedDispatch.id ? updatedDispatch : s));
        showHighlight('shipment', updatedDispatch.id);
    }, [showHighlight]);

    const handleDispatchDelete = useCallback(({ id }: { id: number }) => {
        setShipments(prev => prev.filter(s => s.id !== id));
    }, []);

    const realtimeHandlers = useMemo(() => ({
        'order_updated': handleOrderUpdate,
        'dispatch_created': handleDispatchCreate,
        'dispatch_updated': handleDispatchUpdate,
        'dispatch_deleted': handleDispatchDelete,
    }), [handleOrderUpdate, handleDispatchCreate, handleDispatchUpdate, handleDispatchDelete]);

    useRealtimeUpdates(realtimeHandlers);
  // --- End of real-time updates ---

  useEffect(() => {
    const fetchAiSuggestion = async () => {
        if (shipments.length > 0) {
            try {
                const suggestion = await aiInsightService.getRouteOptimizationSuggestion(shipments);
                setRouteOptimizationSuggestion(suggestion);
            } catch(e: any) {
                console.error("Failed to fetch AI suggestion", e);
                setRouteOptimizationSuggestion("AI suggestion unavailable due to an error.");
            }
        } else {
            setRouteOptimizationSuggestion("No active shipments to analyze for route optimization.");
        }
    };
    fetchAiSuggestion();
  }, [shipments]);

  // --- Modal Handlers ---
  const handleOpenShipmentModal = (order?: WarehouseOrder) => {
    setError(null);
    if (order) {
        setCurrentShipment({
            orderId: order.id,
            itemsForDispatch: order.items.map(item => ({...item, shippedSerialNumbersString: item.pickedSerialNumbers?.join(', ') || ''})),
            carrier: 'FedEx', status: 'Preparing', 
            dispatchDate: new Date().toISOString().split('T')[0],
            feeStatus: FeeStatus.PendingSubmission,
        });
    } else { 
        setCurrentShipment({ carrier: 'FedEx', status: 'Preparing', dispatchDate: new Date().toISOString().split('T')[0], feeStatus: FeeStatus.PendingSubmission, });
    }
    setIsShipmentModalOpen(true);
  };
  
  const handleCloseShipmentModal = () => { setIsShipmentModalOpen(false); setCurrentShipment({}); setError(null); };

  const handleSaveShipment = async () => {
    setError(null); setIsSaving(true);
    try {
      const { trackingNumber, destinationAddress, estimatedDeliveryDate, dispatchDate, brokerId } = currentShipment;
      if (!trackingNumber || !destinationAddress || !estimatedDeliveryDate || !dispatchDate || !brokerId) {
        throw new Error("Tracking #, Destination, Est. Delivery, Dispatch Date, and Broker are required.");
      }
      
      const shippedSerialNumbers: Record<number, string[]> = {};
      if (Array.isArray(currentShipment.itemsForDispatch)) {
          for(const item of currentShipment.itemsForDispatch) {
              const invItem = inventoryMap[item.itemId];
              if(invItem?.isSerialized){
                  const serials = item.shippedSerialNumbersString?.split(',').map(s => s.trim()).filter(Boolean) || [];
                  if (serials.length > 0) shippedSerialNumbers[item.itemId] = serials;
              }
          }
      }
      
      const brokerName = brokers.find(b => b.id === brokerId)?.name;
      const payload = { ...currentShipment, shippedSerialNumbers, brokerName };
      delete payload.itemsForDispatch;

      if (currentShipment.id) {
          await dispatchService.updateDispatch(currentShipment.id, payload);
      } else {
        await dispatchService.createDispatch(payload as Omit<OutboundShipment, 'id'>);
      }
      // No need to fetch data, SSE will update the UI
      await refetchInventory();
      handleCloseShipmentModal();
    } catch (err: any) { 
        console.error("Failed to save dispatch:", err); 
        let userFriendlyError = "Failed to save dispatch. Please try again.";
        if (err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server.";
        } else { userFriendlyError = err.message; }
        setError(userFriendlyError);
    } finally { setIsSaving(false); }
  };
  
  const handleOpenStatusModal = (order: WarehouseOrder) => {
    setCurrentOrderForStatus(order); setIsStatusModalOpen(true); setError(null);
  };
  const handleCloseStatusModal = () => { setIsStatusModalOpen(false); setCurrentOrderForStatus(null); setError(null); };
  
  const handleSaveStatusUpdate = async () => {
    if (!currentOrderForStatus) return;
    setIsSaving(true); setError(null);
    try {
        await orderService.updateOrder(currentOrderForStatus.id, { status: currentOrderForStatus.status });
        handleCloseStatusModal();
    } catch (err: any) {
        setError(err.message || "Failed to update status.");
    } finally { setIsSaving(false); }
  };

  const handleOpenPickingModal = (order: WarehouseOrder) => {
    setOrderForPicking(order); setIsPickingModalOpen(true);
  };
  const handlePickComplete = async () => {
    setIsPickingModalOpen(false); setOrderForPicking(null);
    await refetchInventory(); 
  };
  
  const handleOpenBrokerFeeModal = (shipment: OutboundShipment) => {
    setShipmentForAction(shipment); setIsBrokerFeeModalOpen(true);
  };
  
  const handleOpenPaymentModal = (shipment: OutboundShipment) => {
    setShipmentForAction(shipment); setIsPaymentModalOpen(true);
  };

  const handleOpenFinanceModal = (shipment: OutboundShipment) => {
    setShipmentForAction(shipment); setIsFinanceModalOpen(true);
  };
  
  const handleConfirmOrderReceipt = (orderId: number) => {
    showConfirmReceipt(async () => {
      try {
        await orderService.confirmReceipt(orderId);
      } catch (err: any) {
        setError(err.message || 'Failed to confirm receipt.');
      }
    }, { confirmText: 'Confirm Receipt' });
  };
  
  const handleMarkAsDelivered = async (shipment: OutboundShipment) => {
    showDeliveryConfirmation(async () => {
        try {
            await dispatchService.updateDispatch(shipment.id, { status: 'Delivered', actualDeliveryDate: new Date().toISOString().split('T')[0] });
        } catch (err: any) {
            setError(err.message || 'Failed to mark as delivered.');
        }
    }, { confirmText: "Confirm Delivery" });
  };


  const handleDeleteShipment = (id: number) => {
    showDeleteConfirmation(async () => {
        setError(null);
        try { await dispatchService.deleteDispatch(id); } catch (err: any) { setError(err.message || "Failed to delete dispatch."); }
    }, { confirmText: "Confirm Delete" });
  };

  const handleApplyOptimizedRoute = () => {
    if (!routeOptimizationSuggestion || !routeOptimizationSuggestion.toLowerCase().includes('suggestion')) return;
    alertingService.addAlert(
        AlertSeverity.Info, `AI Route Optimization applied: "${routeOptimizationSuggestion}"`, 'Route Optimization', '/dispatch'
    ).then(() => {
        setConfirmationModalMessage('AI route optimization has been logged and sent to the logistics team for implementation.');
        setIsRouteOptimizationModalOpen(true);
    });
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    const statusColors: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200',
      [OrderStatus.Acknowledged]: 'bg-cyan-100 dark:bg-cyan-700 text-cyan-800 dark:text-cyan-200',
      [OrderStatus.Picking]: 'bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200',
      [OrderStatus.Packed]: 'bg-indigo-100 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200',
      [OrderStatus.ReadyForPickup]: 'bg-purple-100 dark:bg-purple-700 text-purple-800 dark:text-purple-200',
      [OrderStatus.PickedUp]: 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200',
      [OrderStatus.Completed]: 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200',
      [OrderStatus.Cancelled]: 'bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const getShipmentStatusBadge = (status: OutboundShipment['status']) => {
    const statusClasses: Record<OutboundShipment['status'], string> = {
        'Preparing': 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200',
        'In Transit': 'bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200',
        'Delivered': 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200',
        'Delayed': 'bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-200',
        'Returned': 'bg-orange-100 dark:bg-orange-700 text-orange-800 dark:text-orange-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
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

  const renderOrderTableActions = useCallback((order: WarehouseOrder) => {
    if (user && ['Warehouse', 'admin', 'manager'].includes(user.role)) {
      return (
      <div className="flex space-x-2">
        {(order.status === OrderStatus.Acknowledged || order.status === OrderStatus.Picking) && (
          <button onClick={() => handleOpenPickingModal(order)} className="text-purple-600 hover:text-purple-800 p-1" title="Pick Items"> <ClipboardDocumentCheckIcon className="h-5 w-5" /> </button>
        )}
        {(order.status === OrderStatus.Packed || order.status === OrderStatus.ReadyForPickup) && (
          <button onClick={() => handleOpenShipmentModal(order)} className="text-green-600 hover:text-green-800 p-1" title="Create Dispatch"> <PaperAirplaneIcon className="h-5 w-5" /> </button>
        )}
        <button onClick={() => handleOpenStatusModal(order)} className="text-primary-600 hover:text-primary-800 p-1" title="Update Status"> <EditIcon className="h-5 w-5" /> </button>
      </div>
      );
    }
    if (user && ['Warehouse', 'admin'].includes(user.role) && order.status === 'Picked Up') {
       return (
          <button onClick={() => handleConfirmOrderReceipt(order.id)} className="text-teal-600 hover:text-teal-800 p-1" title="Confirm Item Receipt"> <CheckBadgeIcon className="h-5 w-5" /> </button>
       );
    }
    return null;
  }, [user]);

  const renderShipmentTableActions = useCallback((shipment: OutboundShipment) => {
    return (
      <div className="flex space-x-2">
          {user?.role === 'Broker' && shipment.feeStatus === FeeStatus.PendingSubmission && (
              <button onClick={() => handleOpenBrokerFeeModal(shipment)} className="text-orange-600 hover:text-orange-800 p-1" title="Enter Fees"><CurrencyDollarIcon className="h-5 w-5" /></button>
          )}
          {user?.role === 'Finance' && shipment.feeStatus === FeeStatus.PendingApproval && (
               <button onClick={() => handleOpenFinanceModal(shipment)} className="text-green-600 hover:text-green-800 p-1" title="Approve Fees"><CheckBadgeIcon className="h-5 w-5" /></button>
          )}
          {user?.role === 'Broker' && shipment.feeStatus === FeeStatus.Approved && (
               <button onClick={() => handleOpenPaymentModal(shipment)} className="text-teal-600 hover:text-teal-800 p-1" title="Confirm Payment"><CheckBadgeIcon className="h-5 w-5" /></button>
          )}
          {(user?.role === 'Warehouse' || user?.role === 'admin' || user?.role === 'manager') && shipment.status === 'In Transit' && (
               <button onClick={() => handleMarkAsDelivered(shipment)} className="text-blue-600 hover:text-blue-800 p-1" title="Mark as Delivered"><ShipmentIcon className="h-5 w-5" /></button>
          )}
           {(user?.role === 'admin' || user?.role === 'manager') && (
              <button onClick={() => handleDeleteShipment(shipment.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete Shipment" disabled={isSaving || isLoading}> <DeleteIcon className="h-5 w-5" /> </button>
           )}
      </div>
    );
  }, [user, isSaving, isLoading]);

  const activeOrders = useMemo(() => warehouseOrders.filter(o => 
    ![OrderStatus.Completed, OrderStatus.Cancelled].includes(o.status) && (
        o.department.toLowerCase().includes(searchTermOrders.toLowerCase()) ||
        String(o.id).includes(searchTermOrders.toLowerCase()) ||
        (o.picker || '').toLowerCase().includes(searchTermOrders.toLowerCase())
    )
  ), [warehouseOrders, searchTermOrders]);
  
  const filteredShipments = useMemo(() => shipments.filter(shipment => 
    Object.values(shipment).some(value => String(value).toLowerCase().includes(searchTermShipments.toLowerCase()))
  ), [shipments, searchTermShipments]);


  const orderColumns: ColumnDefinition<WarehouseOrder, keyof WarehouseOrder>[] = [
    { key: 'id', header: 'Order ID' }, { key: 'department', header: 'Department' },
    { key: 'status', header: 'Status', render: item => getOrderStatusBadge(item.status) },
    { key: 'picker', header: 'Technician', render: item => item.picker || 'N/A' },
  ];

  const shipmentColumns: ColumnDefinition<OutboundShipment, keyof OutboundShipment>[] = [
    { key: 'id', header: 'Dispatch ID', sortable: true }, { key: 'orderId', header: 'Order ID', render: item => item.orderId || 'N/A', sortable: true },
    { key: 'brokerName', header: 'Broker', sortable: true, render: item => item.brokerName || 'N/A' },
    { key: 'fees', header: 'Fees (Total)', sortable: true, render: item => `$${((item.fees?.duties || 0) + (item.fees?.shipping || 0) + (item.fees?.storage || 0)).toFixed(2)}` },
    { key: 'feeStatus', header: 'Fee Status', render: item => getFeeStatusBadge(item.feeStatus) },
    { key: 'status', header: 'Shipment Status', render: (item) => getShipmentStatusBadge(item.status), sortable: true },
    { key: 'dispatchDate', header: 'Dispatch Date', sortable: true },
  ];

  if (isLoading) return <PageContainer title="Dispatch & Logistics"> <div className="flex justify-center items-center h-64"> <LoadingSpinner className="w-12 h-12 text-primary-500" /> <p className="ml-4 text-lg">Loading dispatch data...</p> </div> </PageContainer>;

  return (
    <PageContainer title="Dispatch & Logistics" actions={ (user?.role === 'admin' || user?.role === 'manager') && <button onClick={() => handleOpenShipmentModal()} className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md" > <PlusIcon className="h-5 w-5 mr-2" /> Create Shipment </button> }>
      <ErrorMessage message={error} />
      
      { (user && ['Warehouse', 'admin', 'manager'].includes(user.role)) && (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-3">Warehouse Order Processing Queue</h2>
            <div className="mb-4">
                <label htmlFor="search-orders" className="sr-only">Search orders</label>
                <input 
                    id="search-orders"
                    type="text" 
                    placeholder="Search orders..." 
                    value={searchTermOrders} 
                    onChange={(e) => setSearchTermOrders(e.target.value)} 
                    className={`block w-full md:w-1/3 pl-4 pr-3 py-2 ${TAILWIND_INPUT_CLASSES}`}
                    autoComplete="off"
                />
            </div>
            <Table<WarehouseOrder> columns={orderColumns} data={activeOrders} actions={renderOrderTableActions} rowClassName={(item) => highlightedRow?.type === 'order' && highlightedRow.id === item.id ? 'animate-row-highlight' : ''} />
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 mb-3">Outbound Shipments Log</h2>
         <div className="mb-4">
            <label htmlFor="search-shipments" className="sr-only">Search shipments</label>
            <input 
                id="search-shipments"
                type="text" 
                placeholder="Search shipments..." 
                value={searchTermShipments} 
                onChange={(e) => setSearchTermShipments(e.target.value)} 
                className={`block w-full md:w-1/3 pl-4 pr-3 py-2 ${TAILWIND_INPUT_CLASSES}`}
                autoComplete="off"
            />
        </div>
        <Table<OutboundShipment> columns={shipmentColumns} data={filteredShipments} actions={renderShipmentTableActions} rowClassName={(item) => highlightedRow?.type === 'shipment' && highlightedRow.id === item.id ? 'animate-row-highlight' : ''} />
      </div>

      {/* Modals */}
      <PickingModal isOpen={isPickingModalOpen} onClose={() => setIsPickingModalOpen(false)} order={orderForPicking} onPickComplete={handlePickComplete}/>
      <BrokerFeeModal isOpen={isBrokerFeeModalOpen} onClose={() => setIsBrokerFeeModalOpen(false)} shipment={shipmentForAction} onActionComplete={fetchData} onSubmitFees={dispatchService.submitFees}/>
              <FinanceApprovalModal 
                isOpen={isFinanceModalOpen} 
                onClose={() => setIsFinanceModalOpen(false)} 
                shipment={shipmentForAction} 
                onActionComplete={fetchData} 
                onApproveFees={dispatchService.approveFees}
              />
      <PaymentConfirmationModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} shipment={shipmentForAction} onActionComplete={fetchData} onConfirmPayment={dispatchService.confirmPayment} />
      
      <Modal isOpen={isStatusModalOpen} onClose={handleCloseStatusModal} title={`Update Status for Order #${currentOrderForStatus?.id}`}>
        <ErrorMessage message={error} />
        <div className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">New Status</label>
            <select 
              id="status" 
              value={currentOrderForStatus?.status || ''} 
              onChange={e => setCurrentOrderForStatus(prev => prev ? {...prev, status: e.target.value as OrderStatus} : null)} 
              className={`block w-full pl-3 pr-10 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            >
              {Object.values(OrderStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={handleCloseStatusModal} 
              className="px-4 py-2 text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveStatusUpdate} 
              disabled={isSaving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isShipmentModalOpen} onClose={handleCloseShipmentModal} title="Create New Shipment">
        <ErrorMessage message={error} />
        <div className="space-y-4">
          <div>
            <label htmlFor="brokerName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Broker Name</label>
            <input 
              type="text" 
              id="brokerName" 
              value={currentShipment.brokerName || ''} 
              onChange={e => setCurrentShipment(prev => ({...prev, brokerName: e.target.value}))} 
              className={TAILWIND_INPUT_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="dispatchDate" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Dispatch Date</label>
            <input 
              type="date" 
              id="dispatchDate" 
              value={currentShipment.dispatchDate || ''} 
              onChange={e => setCurrentShipment(prev => ({...prev, dispatchDate: e.target.value}))} 
              className={TAILWIND_INPUT_CLASSES}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={handleCloseShipmentModal} 
              className="px-4 py-2 text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveShipment} 
              disabled={isSaving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Creating...' : 'Create Shipment'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal 
        isOpen={isRouteOptimizationModalOpen} 
        onClose={() => setIsRouteOptimizationModalOpen(false)} 
        title="Route Optimization Applied" 
        message={confirmationModalMessage}
        confirmButtonText="OK"
        onConfirm={() => setIsRouteOptimizationModalOpen(false)}
      />
    </PageContainer>
  );
};

export default DispatchLogisticsPage;