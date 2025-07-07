
import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { OutboundShipment, FeeStatus, ASN } from '@/types';
import LoadingSpinner from './icons/LoadingSpinner';
import { CheckBadgeIcon, XCircleIcon } from '@/constants';

interface FinanceApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: (OutboundShipment | ASN) | null;
  onActionComplete: () => void;
  onApproveFees: (id: number, status: FeeStatus.Approved | FeeStatus.Rejected) => Promise<any>;
}

const FinanceApprovalModal: React.FC<FinanceApprovalModalProps> = ({ isOpen, onClose, shipment, onActionComplete, onApproveFees }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!shipment) return null;

    const handleApprovalAction = async (approved: boolean) => {
        setIsSaving(true);
        setError(null);
        try {
            const newFeeStatus = approved ? FeeStatus.Approved : FeeStatus.Rejected;
            await onApproveFees(shipment.id, newFeeStatus);
            onActionComplete();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during the approval process.');
        } finally {
            setIsSaving(false);
        }
    };

    const fees = shipment.fees || {};
    const totalFee = (fees.duties || 0) + (fees.shipping || 0) + (fees.storage || 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Approve Fees for Shipment #${shipment.id}`} size="lg">
            <div className="space-y-4">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-800/30 dark:text-red-300 text-sm">{error}</div>}
                
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Review the fees submitted by broker <span className="font-semibold">{shipment.brokerName || 'N/A'}</span>.
                </p>

                <div className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                        <span className="text-secondary-700 dark:text-secondary-300">Duties:</span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">${(fees.duties || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-secondary-700 dark:text-secondary-300">Shipping:</span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">${(fees.shipping || 0).toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-secondary-700 dark:text-secondary-300">Storage:</span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">${(fees.storage || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-secondary-200 dark:border-secondary-600 pt-2 mt-2">
                        <span className="font-bold text-secondary-800 dark:text-secondary-200">Total:</span>
                        <span className="font-bold text-lg text-secondary-900 dark:text-secondary-100">${totalFee.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => handleApprovalAction(false)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:opacity-50 flex items-center"
                        disabled={isSaving}
                    >
                        {isSaving ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <XCircleIcon className="w-5 h-5 mr-2" />}
                        Reject
                    </button>
                    <button
                        type="button"
                        onClick={() => handleApprovalAction(true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:opacity-50 flex items-center"
                        disabled={isSaving}
                    >
                        {isSaving ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <CheckBadgeIcon className="w-5 h-5 mr-2" />}
                        Approve Funds
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FinanceApprovalModal;