import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import { ASN, ReceivedItem } from '@/types';
import { useInventory } from '@/hooks/useInventory';
import { asnService } from '@/services/asnService';
import LoadingSpinner from './icons/LoadingSpinner';


interface ReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: ASN | null;
  onReceiveComplete: () => void;
}

interface ReceivingItemState {
    itemId: number;
    itemName?: string;
    sku?: string;
    expectedQuantity: number;
    isSerialized: boolean;
    receivedQuantity: string; // Use string for input
    receivedSerials: string; // Textarea input for serials
}

interface ItemStatus {
    isLoading: boolean;
    error: string | null;
}

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const ReceivingModal: React.FC<ReceivingModalProps> = ({ isOpen, onClose, shipment, onReceiveComplete }) => {
    const { inventoryMap } = useInventory();
    const [receivingItems, setReceivingItems] = useState<ReceivingItemState[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const modalContentRef = useRef<HTMLDivElement>(null);
    const [itemStatuses, setItemStatuses] = useState<Record<number, ItemStatus>>({});


    useEffect(() => {
        if (isOpen && shipment && Object.keys(inventoryMap).length > 0) {
            const fetchFullAsn = async () => {
                setIsLoadingDetails(true);
                setError(null);
                try {
                    const fullAsn = await asnService.getASNById(shipment.id);
                    if (!fullAsn || !fullAsn.items) {
                        setError(`Could not load item details for shipment #${shipment.id}.`);
                        setReceivingItems([]);
                        return;
                    }
                    const initialStatuses: Record<number, ItemStatus> = {};
                    const itemsToReceive: ReceivingItemState[] = fullAsn.items.map((item: any) => {
                        const inventoryItem = inventoryMap[item.inventoryItemId];
                        initialStatuses[item.inventoryItemId] = { isLoading: false, error: null };
                        return {
                            itemId: item.inventoryItemId,
                            itemName: inventoryItem?.name || 'Unknown Item',
                            sku: inventoryItem?.sku || 'N/A',
                            expectedQuantity: item.quantity,
                            isSerialized: inventoryItem?.isSerialized || false,
                            receivedQuantity: String(item.quantity),
                            receivedSerials: '',
                        };
                    });
                    setReceivingItems(itemsToReceive);
                    setItemStatuses(initialStatuses);
                } catch (e: any) {
                     setError(`Failed to fetch shipment details: ${e.message}`);
                } finally {
                    setIsLoadingDetails(false);
                }
            };
            fetchFullAsn();
            setIsSaving(false);
        }
    }, [shipment, isOpen, inventoryMap]);

    if (!shipment) return null;

    const handleItemChange = (index: number, field: 'receivedQuantity' | 'receivedSerials', value: string) => {
        const newItems = [...receivingItems];
        newItems[index][field] = value;
        if (field === 'receivedSerials' && newItems[index].isSerialized) {
            const serials = value.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
            newItems[index].receivedQuantity = serials.length.toString();
        }
        setReceivingItems(newItems);
    };

    const handleReceive = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const receivedItemsPayload: ReceivedItem[] = receivingItems.map(item => {
                const receivedQuantity = parseInt(item.receivedQuantity, 10);
                if (isNaN(receivedQuantity) || receivedQuantity < 0) {
                    throw new Error(`Invalid received quantity for item '${item.itemName}'.`);
                }
                
                let receivedSerials: string[] | undefined = undefined;
                if (item.isSerialized) {
                    receivedSerials = item.receivedSerials.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
                    if (receivedSerials.length !== receivedQuantity) {
                        throw new Error(`Quantity (${receivedQuantity}) does not match number of serials (${receivedSerials.length}) for '${item.itemName}'. Adjust quantity or serials.`);
                    }
                }
                
                return {
                    itemId: item.itemId,
                    receivedQuantity,
                    receivedSerials,
                };
            });
            
            await asnService.receiveShipment(shipment.id, receivedItemsPayload);
            
            onReceiveComplete();
            onClose();

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Receive Items for Shipment #${shipment.id}`} size="2xl" contentRef={modalContentRef}>
            <div className="space-y-4">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-800/30 dark:text-red-300 text-sm">{error}</div>}
                
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Enter received quantities for each item. Scan or enter serial numbers for serialized products. Items will be added to inventory and any discrepancies will be logged for review.
                </p>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {isLoadingDetails ? (
                        <div className="flex justify-center items-center p-8">
                            <LoadingSpinner className="w-8 h-8 text-primary-500" />
                            <p className="ml-3">Loading shipment items...</p>
                        </div>
                    ) : receivingItems.map((item, index) => (
                        <div key={item.itemId} className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-secondary-800 dark:text-secondary-200">{item.itemName}</p>
                                    <p className="text-sm text-secondary-500">SKU: {item.sku}</p>
                                </div>
                                <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                                    Expected: <span className="text-lg text-primary-600 dark:text-primary-400">{item.expectedQuantity}</span>
                                </p>
                            </div>
                            
                            {item.isSerialized ? (
                                <div className="mt-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor={`serials-${item.itemId}`} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                                            Serial Numbers ({item.receivedQuantity} received)
                                        </label>
                                    </div>
                                    <textarea
                                        id={`serials-${item.itemId}`}
                                        rows={3}
                                        value={item.receivedSerials}
                                        onChange={(e) => handleItemChange(index, 'receivedSerials', e.target.value)}
                                        className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                                        placeholder="Type serials, separated by comma or new line"
                                    />
                                    {itemStatuses[item.itemId]?.isLoading && <div className="flex items-center mt-1"><LoadingSpinner className="h-4 w-4 mr-2" /><span className="text-xs text-secondary-500">Processing file...</span></div>}
                                    {itemStatuses[item.itemId]?.error && <p className="text-xs text-red-500 mt-1">{itemStatuses[item.itemId].error}</p>}
                                    <p className="text-xs text-secondary-500 mt-1">Received quantity will be automatically updated based on the number of serials entered.</p>
                                </div>
                            ) : (
                                <div className="mt-3">
                                    <label htmlFor={`quantity-${item.itemId}`} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                                        Received Quantity
                                    </label>
                                    <input
                                        type="number"
                                        id={`quantity-${item.itemId}`}
                                        value={item.receivedQuantity}
                                        onChange={(e) => handleItemChange(index, 'receivedQuantity', e.target.value)}
                                        min="0"
                                        className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReceive}
                        disabled={isSaving}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-primary-500 dark:bg-primary-700 dark:hover:bg-primary-800 dark:focus:ring-primary-600 dark:focus:ring-offset-primary-600"
                    >
                        {isSaving ? (
                            <>
                                <LoadingSpinner className="h-4 w-4 mr-2" />
                                Receiving...
                            </>
                        ) : (
                            'Receive Items'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReceivingModal;