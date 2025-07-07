
import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import { OutboundShipment, ShipmentFees, ASN } from '@/types';
import LoadingSpinner from './icons/LoadingSpinner';
import { CurrencyDollarIcon } from '@/constants';

interface BrokerFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: (OutboundShipment | ASN) | null;
  onActionComplete: () => void;
  onSubmitFees: (id: number, fees: ShipmentFees) => Promise<any>;
}

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const BrokerFeeModal: React.FC<BrokerFeeModalProps> = ({ isOpen, onClose, shipment, onActionComplete, onSubmitFees }) => {
    const [fees, setFees] = useState<ShipmentFees>({ duties: 0, shipping: 0, storage: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && shipment) {
            setFees({
                duties: shipment.fees?.duties || 0,
                shipping: shipment.fees?.shipping || 0,
                storage: shipment.fees?.storage || 0,
            });
            setError(null);
            setIsSaving(false);
        }
    }, [shipment, isOpen]);

    if (!shipment) return null;

    const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFees(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleSubmitFees = async () => {
        setIsSaving(true);
        setError(null);
        try {
            if (!fees.duties && !fees.shipping && !fees.storage) {
                throw new Error("At least one fee type must have a value greater than zero.");
            }
            if (Object.values(fees).some(val => val < 0)) {
                 throw new Error("Fee values cannot be negative.");
            }
            
            await onSubmitFees(shipment.id, fees);
            onActionComplete();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };

    const totalFee = (fees.duties || 0) + (fees.shipping || 0) + (fees.storage || 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Enter Fees for Shipment #${shipment.id}`} size="lg" contentRef={modalContentRef}>
            <div className="space-y-4">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-800/30 dark:text-red-300 text-sm">{error}</div>}
                
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Submit the following fees for financial approval. Once approved, you will be notified to proceed with payment.
                </p>

                <div className="space-y-3">
                    <div>
                        <label htmlFor="duties" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Duties</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-secondary-500 sm:text-sm">$</span>
                            </div>
                            <input type="number" id="duties" name="duties" min="0" step="0.01" value={fees.duties} onChange={handleFeeChange} className={`pl-7 pr-4 ${TAILWIND_INPUT_CLASSES} w-full`} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="shipping" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Shipping</label>
                        <div className="relative mt-1">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-secondary-500 sm:text-sm">$</span>
                            </div>
                            <input type="number" id="shipping" name="shipping" min="0" step="0.01" value={fees.shipping} onChange={handleFeeChange} className={`pl-7 pr-4 ${TAILWIND_INPUT_CLASSES} w-full`} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="storage" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Storage</label>
                        <div className="relative mt-1">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-secondary-500 sm:text-sm">$</span>
                            </div>
                            <input type="number" id="storage" name="storage" min="0" step="0.01" value={fees.storage} onChange={handleFeeChange} className={`pl-7 pr-4 ${TAILWIND_INPUT_CLASSES} w-full`} />
                        </div>
                    </div>
                </div>

                <div className="pt-2 text-right">
                    <p className="text-lg font-semibold text-secondary-800 dark:text-secondary-200">
                        Total: ${totalFee.toFixed(2)}
                    </p>
                </div>


                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm" disabled={isSaving}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmitFees}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm disabled:opacity-50 flex items-center"
                        disabled={isSaving}
                    >
                        {isSaving ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <CurrencyDollarIcon className="w-5 h-5 mr-2" />}
                        {isSaving ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BrokerFeeModal;
