

import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import { WarehouseOrder, OrderItem, OrderStatus } from '@/types';
import { useInventory } from '@/hooks/useInventory';
import { orderService } from '@/services/orderService';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { SerialIcon } from '@/constants';

interface PickingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WarehouseOrder | null;
  onPickComplete: () => void;
}

interface PickingItemState extends OrderItem {
  location: string;
  isSerialized: boolean;
  availableSerials?: string[];
  pickedSerialsString: string; // For serialized
}

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const PickingModal: React.FC<PickingModalProps> = ({ isOpen, onClose, order, onPickComplete }) => {
    const { inventoryMap } = useInventory();
    const [pickingItems, setPickingItems] = useState<PickingItemState[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && order && Object.keys(inventoryMap).length > 0) {
            const itemsToPick: PickingItemState[] = order.items.map(item => {
                const inventoryItem = inventoryMap[item.itemId];
                return {
                    ...item,
                    location: inventoryItem?.location || 'N/A',
                    isSerialized: inventoryItem?.isSerialized || false,
                    availableSerials: inventoryItem?.serialNumbers || [],
                    pickedSerialsString: item.pickedSerialNumbers?.join(', ') || '',
                };
            });
            setPickingItems(itemsToPick);
            setError(null);
            setIsSaving(false);
        }
    }, [order, isOpen, inventoryMap]);

    if (!order) return null;

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...pickingItems];
        newItems[index].pickedSerialsString = value;
        setPickingItems(newItems);
    };

    const handleCompletePick = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const updatedItems: OrderItem[] = pickingItems.map(pItem => {
                let pickedSerialNumbers: string[] | undefined = undefined;

                if (pItem.isSerialized) {
                    pickedSerialNumbers = pItem.pickedSerialsString.split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
                    
                    if (pickedSerialNumbers.length !== pItem.quantity) {
                        throw new Error(`For item '${pItem.name}', you must pick exactly ${pItem.quantity} serial number(s). You entered ${pickedSerialNumbers.length}.`);
                    }

                    const availableSerialsUpper = pItem.availableSerials?.map(s => s.toUpperCase()) || [];
                    for (const sn of pickedSerialNumbers) {
                        if (!availableSerialsUpper.includes(sn)) {
                            throw new Error(`Serial number '${sn}' for item '${pItem.name}' is not available in stock.`);
                        }
                    }
                }
                
                return {
                    itemId: pItem.itemId,
                    quantity: pItem.quantity,
                    name: pItem.name,
                    pickedSerialNumbers: pItem.isSerialized ? pickedSerialNumbers : pItem.pickedSerialNumbers,
                };
            });
            
            await orderService.updateOrder(order.id, {
                items: updatedItems,
                status: OrderStatus.ReadyForPickup,
            });

            onPickComplete();
            onClose();

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Pick Items for Order #${order.id}`} size="2xl" contentRef={modalContentRef}>
            <div className="space-y-4">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-800/30 dark:text-red-300 text-sm">{error}</div>}
                
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Fulfill the order by confirming items and scanning/entering serial numbers for serialized products.
                </p>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {pickingItems.map((item, index) => (
                        <div key={item.itemId} className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-secondary-800 dark:text-secondary-200">{item.name}</p>
                                    <p className="text-sm text-secondary-500">SKU: {inventoryMap[item.itemId]?.sku} | Location: {item.location}</p>
                                </div>
                                <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                                    Requested Qty: <span className="text-lg text-primary-600 dark:text-primary-400">{item.quantity}</span>
                                </p>
                            </div>
                            
                            {item.isSerialized && (
                                <div className="mt-3">
                                    <label htmlFor={`serials-${item.itemId}`} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 flex items-center">
                                        <SerialIcon className="h-4 w-4 mr-1.5 text-blue-500" />
                                        Picked Serial Numbers
                                    </label>
                                    <textarea
                                        id={`serials-${item.itemId}`}
                                        rows={2}
                                        value={item.pickedSerialsString}
                                        onChange={(e) => handleItemChange(index, e.target.value)}
                                        className={`mt-1 block w-full ${TAILWIND_INPUT_CLASSES}`}
                                        placeholder="Scan or type serial numbers, separated by comma or new line"
                                    />
                                    {item.availableSerials && item.availableSerials.length > 0 && (
                                        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                                            Available in stock: {item.availableSerials.join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}
                            {!item.isSerialized && (
                                <div className="mt-3 p-2 bg-secondary-50 dark:bg-secondary-700/50 rounded-md text-sm text-secondary-600 dark:text-secondary-300">
                                    This is a non-serialized item. Please pick the requested quantity from the location above.
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm" disabled={isSaving}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleCompletePick}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm disabled:opacity-50 flex items-center"
                        disabled={isSaving}
                    >
                        {isSaving ? <LoadingSpinner className="w-5 h-5 mr-2" /> : null}
                        {isSaving ? 'Saving...' : 'Complete Pick & Mark as Ready'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PickingModal;