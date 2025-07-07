

import React, { useState, useRef, useEffect } from 'react';
import Modal from '@/components/Modal';
import ErrorMessage from '@/components/ErrorMessage';
import { OutboundShipment, ASN } from '@/types';
import LoadingSpinner from './icons/LoadingSpinner';
import { CheckBadgeIcon } from '@/constants';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: (OutboundShipment | ASN) | null;
  onActionComplete: () => void;
  onConfirmPayment: (id: number, file: File | null) => Promise<any>;
}

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({ isOpen, onClose, shipment, onActionComplete, onConfirmPayment }) => {
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setReceiptFile(null);
            setError(null);
            setIsSaving(false);
        }
    }, [isOpen]);

    if (!shipment) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('File is too large. Maximum size is 10MB.');
            setReceiptFile(null);
            if (e.target) e.target.value = ''; // Clear the input
        } else {
            setReceiptFile(file);
            setError(null);
        }
    };

    const handleConfirm = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await onConfirmPayment(shipment.id, receiptFile);
            onActionComplete();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const fees = shipment.fees || {};
    const totalFee = (fees.duties || 0) + (fees.shipping || 0) + (fees.storage || 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Confirm Payment for Shipment #${shipment.id}`} size="lg" contentRef={modalContentRef}>
            <div className="space-y-4">
                <ErrorMessage message={error} />
                
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Confirm you have paid the approved fees totaling <strong className="text-secondary-800 dark:text-secondary-200">${totalFee.toFixed(2)}</strong>. You can optionally upload a receipt for proof of payment.
                </p>

                <div>
                    <label htmlFor="receiptFile" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">Upload Receipt (Optional)</label>
                    <input 
                        type="file" 
                        name="receiptFile" 
                        id="receiptFile" 
                        onChange={handleFileChange} 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                        className={`mt-1 block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-secondary-700 dark:file:text-secondary-200 dark:hover:file:bg-secondary-600 ${TAILWIND_INPUT_CLASSES}`}
                    />
                    {receiptFile && <p className="text-xs text-secondary-500 mt-1">File selected: {receiptFile.name}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm" disabled={isSaving}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:opacity-50 flex items-center"
                        disabled={isSaving}
                    >
                        {isSaving ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <CheckBadgeIcon className="w-5 h-5 mr-2" />}
                        {isSaving ? 'Confirming...' : 'Confirm Payment'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentConfirmationModal;