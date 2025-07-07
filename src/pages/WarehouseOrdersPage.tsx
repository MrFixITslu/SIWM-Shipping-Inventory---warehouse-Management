import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PageContainer from '@/components/PageContainer';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ErrorMessage from '@/components/ErrorMessage';
import useConfirmationModal from '@/hooks/useConfirmationModal';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WarehouseOrder, OrderItem, OrderStatus, ColumnDefinition, UserSummary, AlertSeverity } from '@/types';
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon, SerialIcon, CheckBadgeIcon } from '@/constants';
import { orderService } from '@/services/orderService';
import { userService } from '@/services/userService';
import { alertingService } from '@/services/alertingService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";
type Tab = 'myOrders' | 'awaitingPickup';

interface OrderItemFormState extends Omit<OrderItem, 'itemId'> {
  itemId?: number;
  pickedSerialNumbersString?: string;
  itemSearchTerm?: string;
}

interface CurrentOrderFormState extends Partial<Omit<WarehouseOrder, 'items'>> { 
    items?: OrderItemFormState[]; 
}


const WarehouseOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('myOrders');
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const { inventory: inventoryForSelect, fetchInventory: refetchInventory } = useInventory(); // Use global inventory state
  const [technicians, setTechnicians] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState<CurrentOrderFormState>({ items: [] });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  const { isModalOpen: isConfirmDeleteOpen, confirmButtonText: deleteConfirmText, showConfirmation, handleConfirm: handleConfirmDelete, handleClose: handleCloseDeleteConfirm } = useConfirmationModal();
  const { isModalOpen: isConfirmPickupOpen, confirmButtonText: pickupConfirmText, showConfirmation: showConfirmPickup, handleConfirm: handleConfirmPickupAction, handleClose: handleClosePickupConfirm } = useConfirmationModal();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersData, techniciansData] = await Promise.all([
        orderService.getOrders(),
        userService.getUsers({ role: 'Technician' })
      ]);
      setOrders(ordersData);
      setTechnicians(techniciansData);
    } catch (err: any) {
      console.error("Failed to load warehouse orders page data:", err);
      let userFriendlyError = "An unexpected error occurred while fetching page data. Please try again.";
      if (err.message.toLowerCase().includes("failed to fetch")) {
        userFriendlyError = "Could not connect to the server to fetch page data. Please check your network or server status.";
      } else {
        userFriendlyError = `Error fetching data: ${err.message}.`;
      }
      setError(userFriendlyError);
      setOrders([]);
      setTechnicians([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Real-time updates ---
    const handleOrderUpdate = useCallback((updatedOrder: WarehouseOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setHighlightedRow(updatedOrder.id);
        setTimeout(() => setHighlightedRow(null), 2000);
    }, []);

    const handleOrderCreate = useCallback((newOrder: WarehouseOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        setHighlightedRow(newOrder.id);
        setTimeout(() => setHighlightedRow(null), 2000);
    }, []);

    const handleOrderDelete = useCallback(({ id }: { id: number }) => {
        setOrders(prev => prev.filter(o => o.id !== id));
    }, []);

    const realtimeHandlers = useMemo(() => ({
        'order_created': handleOrderCreate,
        'order_updated': handleOrderUpdate,
        'order_deleted': handleOrderDelete,
    }), [handleOrderCreate, handleOrderUpdate, handleOrderDelete]);

    useRealtimeUpdates(realtimeHandlers);
  // --- End of real-time updates ---

  const handleOpenModal = (order?: WarehouseOrder) => {
    setError(null);
    if (order) {
        const orderFormState: CurrentOrderFormState = {
            ...order,
            items: order.items.map(item => ({
                ...item,
                pickedSerialNumbersString: item.pickedSerialNumbers?.join(', ') || ''
            }))
        };
        setCurrentOrder(orderFormState);
    } else {
        setCurrentOrder({ items: [{itemId: undefined, quantity: 1, pickedSerialNumbersString: '', itemSearchTerm: ''}], priority: 'Medium', status: OrderStatus.Pending, createdAt: new Date().toISOString().split('T')[0], technicianId: user?.id });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentOrder({ items: [] });
    setError(null);
  };

  const handleSaveOrder = async () => {
    setError(null);
    setIsSaving(true);
    try {
      if (!currentOrder.department || !currentOrder.items || currentOrder.items.length === 0) {
        throw new Error("Department and at least one item are required.");
      }
      
      const validItems = currentOrder.items.filter(itemFS => itemFS && typeof itemFS.itemId === 'number');
      if (validItems.length === 0) {
        throw new Error("Please select at least one valid item for the order.");
      }

      if (validItems.length < currentOrder.items.length) {
          throw new Error("One or more item rows are incomplete. Please select an inventory item for each row before saving.");
      }

      const itemsToSave: OrderItem[] = validItems.map(itemFS => {
        if (!itemFS.itemId) throw new Error("An item in the order is missing its ID."); // Should not happen due to filter
        const inventoryItem = inventoryForSelect.find(invItem => invItem.id === itemFS.itemId);
        if (!inventoryItem) throw new Error(`Invalid item ID ${itemFS.itemId} selected.`);
        const pickedSerials = itemFS.pickedSerialNumbersString?.split(',').map(s => s.trim()).filter(s => s) || [];
        
        if (inventoryItem.isSerialized && pickedSerials.length > 0) {
            throw new Error(`Serial numbers cannot be pre-assigned during order creation for: ${inventoryItem.name}. They are entered during the picking phase.`);
        }
        return { 
            itemId: itemFS.itemId, 
            quantity: itemFS.quantity, 
            name: inventoryItem.name,
        };
      });

      const orderPayload: Omit<WarehouseOrder, 'id' | 'createdAt'> & { id?: number } = {
        department: currentOrder.department!,
        items: itemsToSave,
        status: currentOrder.status || OrderStatus.Pending,
        priority: currentOrder.priority || 'Medium',
        technicianId: currentOrder.technicianId,
        picker: technicians.find(t => t.id === currentOrder.technicianId)?.name,
      };
      if (currentOrder.id) orderPayload.id = currentOrder.id;

      let savedOrder: WarehouseOrder;
      const isNewOrder = !currentOrder.id;
      if (currentOrder.id) {
        savedOrder = await orderService.updateOrder(currentOrder.id, orderPayload as WarehouseOrder);
      } else {
        savedOrder = await orderService.createOrder(orderPayload as Omit<WarehouseOrder, 'id' | 'createdAt'>);
      }
      
      if (isNewOrder) {
        alertingService.addAlert(
          AlertSeverity.Info,
          `New order #${savedOrder.id} created for department: ${savedOrder.department}.`,
          'New Warehouse Order',
          `/dispatch`
        );
      }
      
      await refetchInventory();
      handleCloseModal();
    } catch (err: any) {
      console.error("Failed to save order:", err);
      let userFriendlyError = "Failed to save order. Please try again.";
      if (err.message) {
        if (err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server to save the order. Please check your network or server status.";
        } else {
            userFriendlyError = err.message;
        }
      }
      setError(userFriendlyError);
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = (id: number) => {
    showConfirmation(async () => {
      setError(null);
      setIsSaving(true);
      try {
        await orderService.deleteOrder(id);
        await refetchInventory();
      } catch (err: any) {
        console.error("Failed to delete order:", err);
        let userFriendlyError = "Failed to delete order. Please try again.";
        if (err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server to delete the order. Please check your network or server status.";
        } else {
            userFriendlyError = err.message;
        }
        setError(userFriendlyError);
      } finally {
        setIsSaving(false);
      }
    }, { confirmText: "Confirm Delete"});
  };
  
  const handleConfirmPickup = (orderId: number) => {
      showConfirmPickup(async () => {
          try {
              await orderService.confirmPickup(orderId);
              // No fetch needed, handled by real-time update
          } catch(err: any) {
              setError(err.message || 'Failed to confirm pickup');
          }
      }, { confirmText: 'Confirm Pickup'});
  };

  const handleItemChange = (index: number, field: keyof OrderItemFormState, value: any) => {
    const updatedItems = [...(currentOrder.items || [])];
    const currentItemState = { ...updatedItems[index] };

    if (field === 'itemId') {
        const itemId = Number(value);
        currentItemState.itemId = itemId;
        currentItemState.pickedSerialNumbersString = ''; 
        currentItemState.itemSearchTerm = ''; // Clear search on select
        const selectedInvItem = inventoryForSelect.find(inv => inv.id === itemId);
        if (selectedInvItem?.isSerialized) {
            currentItemState.quantity = 1; 
        } else {
             currentItemState.quantity = 1; 
        }
    } else if (field === 'quantity') {
        currentItemState.quantity = Math.max(1, Number(value));
    } else {
        (currentItemState as any)[field] = value;
    }
    updatedItems[index] = currentItemState;
    setCurrentOrder({ ...currentOrder, items: updatedItems });
  };

  const addItemToOrder = () => {
    setCurrentOrder({ ...currentOrder, items: [...(currentOrder.items || []), { itemId: undefined, quantity: 1, pickedSerialNumbersString: '', itemSearchTerm: '' }] });
  };

  const removeItemFromOrder = (index: number) => {
    setCurrentOrder({ ...currentOrder, items: currentOrder.items?.filter((_, i) => i !== index) });
  };
  
  const myOrders = useMemo(() => orders.filter(o => {
      const isMyOrder = o.technicianId === user?.id;
      const matchesSearch = searchTerm ? (
        String(o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.items.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      ) : true;
      return isMyOrder && matchesSearch && ![OrderStatus.PickedUp, OrderStatus.Completed, OrderStatus.Cancelled].includes(o.status);
  }), [orders, searchTerm, user]);

  const awaitingPickupOrders = useMemo(() => orders.filter(o => {
       const matchesSearch = searchTerm ? (
        String(o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.picker || '').toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;
      return o.status === OrderStatus.ReadyForPickup && matchesSearch;
  }), [orders, searchTerm]);


  const getStatusBadge = (status: OrderStatus) => {
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
  
  const getPriorityBadge = (priority: 'Low' | 'Medium' | 'High') => {
    const priorityColors = {
      Low: 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200',
      Medium: 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200',
      High: 'bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-200',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[priority]}`}>{priority}</span>;
  };

  const renderOrderItems = (order: WarehouseOrder) => {
    return (
      <div>
        {order.items.map((oi, index) => {
          const invItem = inventoryForSelect.find(i => i.id === oi.itemId);
          return (
            <div key={index} className="text-xs mb-1">
              {oi.name} (x{oi.quantity})
              {invItem?.isSerialized && oi.pickedSerialNumbers && oi.pickedSerialNumbers.length > 0 && (
                <div className="flex items-center text-blue-600 dark:text-blue-400 ml-2">
                  <SerialIcon className="h-3 w-3 mr-1" /> SNs: {oi.pickedSerialNumbers.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderTableActions = useCallback((order: WarehouseOrder) => {
    if (activeTab === 'awaitingPickup') {
        return (
            <button onClick={() => handleConfirmPickup(order.id)} className="flex items-center text-sm bg-purple-500 hover:bg-purple-600 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm" disabled={isSaving}>
                <CheckBadgeIcon className="h-4 w-4 mr-1.5" /> Confirm Pickup
            </button>
        )
    }
    // Only allow editing/deleting pending orders
    if(order.status === OrderStatus.Pending) {
      return (
        <>
          <button onClick={() => handleOpenModal(order)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 p-1" title="Edit Order" disabled={isSaving}>
            <EditIcon className="h-5 w-5" />
          </button>
          <button onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1" title="Delete Order" disabled={isSaving || isLoading}>
            <DeleteIcon className="h-5 w-5" />
          </button>
        </>
      )
    }
    return null;
  }, [isSaving, isLoading, activeTab]);

  const columns: ColumnDefinition<WarehouseOrder, keyof WarehouseOrder>[] = [
    { key: 'id', header: 'Order ID', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'items', header: 'Items & Serials', render: renderOrderItems, sortable: false },
    { key: 'status', header: 'Status', render: (item) => getStatusBadge(item.status), sortable: true },
    { key: 'picker', header: 'Technician', sortable: true, render: item => item.picker || 'N/A'},
    { key: 'priority', header: 'Priority', render: (item) => getPriorityBadge(item.priority), sortable: true },
    { key: 'createdAt', header: 'Created At', sortable: true, render: item => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A' },
  ];

  const dataForCurrentTab = activeTab === 'myOrders' ? myOrders : awaitingPickupOrders;

  return (
    <PageContainer
      title="Warehouse Item Orders"
      actions={
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          disabled={isSaving || isLoading}
        >
          <PlusIcon className="h-5 w-5 mr-2" /> Create Order
        </button>
      }
    >
      {isLoading && <div className="absolute top-4 right-4"><LoadingSpinner className="w-6 h-6 text-primary-500" /></div>}
      <ErrorMessage message={!isModalOpen ? error : null} />

      <div className="mb-4 border-b border-secondary-300 dark:border-secondary-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('myOrders')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'myOrders' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}>
                My Active Orders
            </button>
            <button onClick={() => setActiveTab('awaitingPickup')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'awaitingPickup' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}>
                Awaiting Pickup
            </button>
        </nav>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <label htmlFor="orderSearch" className="sr-only">Search orders</label>
          <input
            type="text"
            name="orderSearch"
            id="orderSearch"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`block w-full pl-10 pr-3 py-2 ${TAILWIND_INPUT_CLASSES}`}
            autoComplete="off"
          />
        </div>
      </div>
      
      {isLoading && dataForCurrentTab.length === 0 && <div className="flex justify-center items-center h-48"><LoadingSpinner className="w-8 h-8 text-primary-500" /></div>}

      {!isLoading && dataForCurrentTab.length === 0 && (
        <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">
            {activeTab === 'myOrders' ? 'You have no active orders.' : 'There are no orders awaiting pickup.'}
        </p>
      )}
      {!isLoading && dataForCurrentTab.length > 0 && (
        <Table<WarehouseOrder>
            columns={columns}
            data={dataForCurrentTab}
            actions={renderTableActions}
            rowClassName={(item) => highlightedRow === item.id ? 'animate-row-highlight' : ''}
        />
      )}

      <ConfirmationModal isOpen={isConfirmDeleteOpen} onClose={handleCloseDeleteConfirm} onConfirm={handleConfirmDelete} title="Delete Warehouse Order" message="Are you sure you want to delete this order? This action cannot be undone." confirmButtonText={deleteConfirmText} />
      <ConfirmationModal isOpen={isConfirmPickupOpen} onClose={handleClosePickupConfirm} onConfirm={handleConfirmPickupAction} title="Confirm Order Pickup" message="Are you sure you have picked up all items for this order? This will update the status to 'Picked Up'." confirmButtonText={pickupConfirmText} />
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentOrder.id ? 'Edit Warehouse Order' : 'Create New Order'} size="xl" contentRef={modalContentRef}>
        <form onSubmit={(e) => { e.preventDefault(); handleSaveOrder(); }} className="space-y-4">
          <ErrorMessage message={isModalOpen ? error : null} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Department</label>
              <input 
                type="text" 
                name="department" 
                id="department" 
                value={currentOrder.department || ''} 
                onChange={(e) => setCurrentOrder({...currentOrder, department: e.target.value})} 
                required 
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="technicianId" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Technician (For)</label>
              <select 
                name="technicianId" 
                id="technicianId" 
                value={currentOrder.technicianId || ''} 
                onChange={(e) => setCurrentOrder({...currentOrder, technicianId: Number(e.target.value)})} 
                className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
              >
                  <option value="">Select Technician</option>
                  {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
              </select>
            </div>
          </div>
          
          <fieldset className="border border-secondary-300 dark:border-secondary-600 p-4 rounded-md">
            <legend className="text-sm font-medium text-secondary-700 dark:text-secondary-300 px-1">Items</legend>
            {currentOrder.items?.map((item, index) => {
              const selectedInvItem = inventoryForSelect.find(invItem => invItem.id === item.itemId);
              const filteredInventoryForSearch = item.itemSearchTerm 
                ? inventoryForSelect.filter(inv => inv.name.toLowerCase().includes(item.itemSearchTerm!.toLowerCase()) || inv.sku.toLowerCase().includes(item.itemSearchTerm!.toLowerCase()))
                : inventoryForSelect;

              return (
              <div key={index} className="space-y-2 mb-3 pb-3 border-b border-secondary-200 dark:border-secondary-700 last:border-b-0 last:mb-0 last:pb-0">
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-12 sm:col-span-5 relative">
                    <label htmlFor={`item-search-${index}`} className="block text-xs font-medium text-secondary-600 dark:text-secondary-400">Item</label>
                    <input
                      type="text"
                      id={`item-search-${index}`}
                      name={`item-search-${index}`}
                      value={selectedInvItem ? `${selectedInvItem.name} (${selectedInvItem.sku})` : (item.itemSearchTerm || '')}
                      onChange={(e) => handleItemChange(index, 'itemSearchTerm', e.target.value)}
                      placeholder="Search for an item..."
                      className={`w-full mt-1 ${TAILWIND_INPUT_CLASSES}`}
                      disabled={!!selectedInvItem}
                      autoComplete="off"
                    />
                    {!selectedInvItem && item.itemSearchTerm && (
                      <ul className="absolute z-10 w-full bg-white dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                        {filteredInventoryForSearch.map(invItem => (
                          <li
                            key={invItem.id}
                            onClick={() => handleItemChange(index, 'itemId', invItem.id)}
                            className="cursor-pointer px-3 py-2 hover:bg-primary-100 dark:hover:bg-primary-700"
                          >
                            {invItem.name} ({invItem.sku}) - {invItem.isSerialized ? `Serialized` : `Stock: ${invItem.quantity}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="col-span-10 sm:col-span-2">
                    <label htmlFor={`qty-${index}`} className="block text-xs font-medium text-secondary-600 dark:text-secondary-400">Quantity</label>
                    <input
                        type="number"
                        id={`qty-${index}`}
                        name={`qty-${index}`}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="1"
                        max={selectedInvItem && !selectedInvItem.isSerialized ? selectedInvItem.quantity : undefined}
                        className={`w-full mt-1 ${TAILWIND_INPUT_CLASSES}`}
                        disabled={!selectedInvItem || selectedInvItem.isSerialized}
                        autoComplete="off"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex items-end">
                      <button type="button" onClick={() => removeItemFromOrder(index)} className="text-red-500 hover:text-red-700 p-1.5" title="Remove Item">
                      <DeleteIcon className="h-5 w-5" />
                      </button>
                  </div>
                </div>
              </div>
              );
            })}
             <button type="button" onClick={addItemToOrder} className="text-sm mt-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center">
                <PlusIcon className="h-4 w-4 mr-1" /> Add Item
            </button>
          </fieldset>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Priority</label>
              <select name="priority" id="priority" value={currentOrder.priority || 'Medium'} onChange={(e) => setCurrentOrder({...currentOrder, priority: e.target.value as 'Low' | 'Medium' | 'High'})} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            {currentOrder.id && (
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Status</label>
                    <select name="status" id="status" value={currentOrder.status || ''} onChange={(e) => setCurrentOrder({...currentOrder, status: e.target.value as OrderStatus})} className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}>
                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm" disabled={isSaving}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm disabled:opacity-50" disabled={isSaving}>
              {isSaving ? <LoadingSpinner className="w-5 h-5 inline-block" /> : (currentOrder.id ? 'Save Changes' : 'Create Order')}
            </button>
          </div>
        </form>
      </Modal>

    </PageContainer>
  );
};

export default WarehouseOrdersPage;
