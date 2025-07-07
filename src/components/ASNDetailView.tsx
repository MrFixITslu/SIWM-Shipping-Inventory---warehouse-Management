import React from 'react';
import { ASN, User, FeeStatus } from '@/types';
import { CloseIcon, CurrencyDollarIcon, CheckBadgeIcon, ShipmentIcon } from '@/constants';
import { useNavigate } from 'react-router-dom';

interface ASNDetailViewProps {
  asn: ASN; 
  user: User | null; 
  onClose: () => void;
  onEnterFees: (asn: ASN) => void;
  onApproveFees: (asn: ASN) => void;
  onConfirmPayment: (asn: ASN) => void;
  onConfirmArrival: (asn: ASN) => void;
  onConfirmProcessed?: (asn: ASN) => void;
  onConfirmReceived?: (asn: ASN) => void;
}

const ASNDetailView: React.FC<ASNDetailViewProps> = ({ asn, user, onClose, onEnterFees, onApproveFees, onConfirmPayment, onConfirmArrival, onConfirmProcessed, onConfirmReceived }) => {
    const navigate = useNavigate();
    
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

    const totalFee = (asn.fees?.duties || 0) + (asn.fees?.shipping || 0) + (asn.fees?.storage || 0);

    const WorkflowActions: React.FC = () => {
        const commonButtonClasses = "w-full flex items-center justify-center font-semibold px-4 py-2 rounded-lg shadow-md text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
        const helperTextClasses = "text-xs text-secondary-500 dark:text-secondary-400 text-center mt-1";

        switch (asn.feeStatus) {
            case FeeStatus.PendingSubmission:
                const canBrokerEnterFees = user?.role === 'Broker';
                return (
                    <div>
                        <button
                            onClick={() => onEnterFees(asn)}
                            disabled={!canBrokerEnterFees}
                            className={`${commonButtonClasses} bg-orange-500 hover:bg-orange-600 text-white`}
                        >
                            <CurrencyDollarIcon className="h-5 w-5 mr-2" /> Enter Fees
                        </button>
                        {!canBrokerEnterFees && <p className={helperTextClasses}>Waiting for Broker ({asn.brokerName}) to submit fees.</p>}
                    </div>
                );

            case FeeStatus.PendingApproval:
                const canFinanceApprove = user?.role === 'Finance';
                return (
                     <div>
                        <button
                            onClick={() => onApproveFees(asn)}
                            disabled={!canFinanceApprove}
                            className={`${commonButtonClasses} bg-green-500 hover:bg-green-600 text-white`}
                        >
                            <CheckBadgeIcon className="h-5 w-5 mr-2" /> Approve Funds
                        </button>
                        {!canFinanceApprove && <p className={helperTextClasses}>Waiting for Finance team to approve submitted fees.</p>}
                    </div>
                );
            
            case FeeStatus.Approved:
                const canBrokerConfirmPayment = user?.role === 'Broker';
                return (
                     <div>
                        <button
                            onClick={() => onConfirmPayment(asn)}
                            disabled={!canBrokerConfirmPayment}
                            className={`${commonButtonClasses} bg-teal-500 hover:bg-teal-600 text-white`}
                        >
                            <CheckBadgeIcon className="h-5 w-5 mr-2" /> Confirm Payment
                        </button>
                         {!canBrokerConfirmPayment && <p className={helperTextClasses}>Waiting for Broker ({asn.brokerName}) to confirm payment.</p>}
                    </div>
                );
            
            case FeeStatus.Rejected:
                const canBrokerResubmit = user?.role === 'Broker';
                return (
                     <div>
                        <p className="text-sm font-semibold text-center text-red-500 mb-2">Fees were rejected.</p>
                        <button
                            onClick={() => onEnterFees(asn)}
                            disabled={!canBrokerResubmit}
                            className={`${commonButtonClasses} bg-orange-500 hover:bg-orange-600 text-white`}
                        >
                            <CurrencyDollarIcon className="h-5 w-5 mr-2" /> Resubmit Fees
                        </button>
                        {!canBrokerResubmit && <p className={helperTextClasses}>Waiting for Broker ({asn.brokerName}) to resubmit fees.</p>}
                    </div>
                );
                
            case FeeStatus.PaymentConfirmed:
                if (asn.status === 'Processing') {
                    const canWarehouseConfirm = user && ['Warehouse', 'admin', 'manager'].includes(user.role);
                    return (
                        <div>
                            <button
                                onClick={() => onConfirmReceived?.(asn)}
                                disabled={!canWarehouseConfirm}
                                className={`${commonButtonClasses} bg-green-500 hover:bg-green-600 text-white`}
                            >
                                <ShipmentIcon className="h-5 w-5 mr-2" /> Confirm Received
                            </button>
                            {!canWarehouseConfirm && <p className={helperTextClasses}>Waiting for Warehouse team to confirm received items.</p>}
                        </div>
                    );
                }
                if (asn.status === 'Arrived') {
                    return <p className="text-xs text-center text-green-600 dark:text-green-400">Shipment has been received and processed.</p>;
                }
                const canWarehouseReceive = user && ['Warehouse', 'admin', 'manager'].includes(user.role);
                return (
                     <div>
                        <button
                            onClick={() => navigate(`/inventory?asnId=${asn.id}`)}
                            disabled={!canWarehouseReceive}
                            className={`${commonButtonClasses} bg-blue-500 hover:bg-blue-600 text-white`}
                        >
                            <ShipmentIcon className="h-5 w-5 mr-2" /> Process Items
                        </button>
                        {!canWarehouseReceive && <p className={helperTextClasses}>Cleared for arrival. Waiting for Warehouse team to process items.</p>}
                    </div>
                );

            default:
                return <p className={helperTextClasses}>No pending financial actions for this shipment.</p>;
        }
    };

    return (
        <div className="mt-6 p-5 bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-primary-200 dark:border-primary-700/50 animate-modal-appear">
            <div className="flex justify-between items-center pb-3 border-b border-secondary-200 dark:border-secondary-700">
                <h3 className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                    Details for Shipment #{asn.id}
                </h3>
                <button onClick={onClose} className="p-1 rounded-full text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700">
                    <CloseIcon className="h-5 w-5" />
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Column 1: Core Details */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-secondary-700 dark:text-secondary-300">Shipment Info</h4>
                    <p className="text-sm"><strong className="text-secondary-500">PO Number:</strong> {asn.poNumber || 'N/A'}</p>
                    <p className="text-sm"><strong className="text-secondary-500">Supplier:</strong> {asn.supplier}</p>
                    <p className="text-sm"><strong className="text-secondary-500">Department:</strong> {asn.department || 'N/A'}</p>
                    <p className="text-sm"><strong className="text-secondary-500">Carrier:</strong> {asn.carrier}</p>
                    <p className="text-sm"><strong className="text-secondary-500">Item Count:</strong> {asn.itemCount}</p>
                    <p className="text-sm"><strong className="text-secondary-500">Expected Arrival:</strong> {asn.expectedArrival}</p>
                </div>

                {/* Column 2: Workflow & Fees */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-secondary-700 dark:text-secondary-300">Broker &amp; Finance Workflow</h4>
                    <p className="text-sm"><strong className="text-secondary-500">Broker:</strong> {asn.brokerName || 'N/A'}</p>
                    <div className="text-sm flex items-center gap-2">
                        <strong className="text-secondary-500">Fee Status:</strong> 
                        {getFeeStatusBadge(asn.feeStatus)}
                    </div>
                    {asn.fees && (
                         <div className="text-sm p-2 bg-secondary-50 dark:bg-secondary-700/50 rounded-md space-y-1">
                            <div className="flex justify-between"><span className="text-secondary-500">Duties:</span> <span>${(asn.fees.duties || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-secondary-500">Shipping:</span> <span>${(asn.fees.shipping || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-secondary-500">Storage:</span> <span>${(asn.fees.storage || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold border-t border-secondary-200 dark:border-secondary-600 mt-1 pt-1"><span >Total:</span> <span>${totalFee.toFixed(2)}</span></div>
                        </div>
                    )}
                    {asn.paymentConfirmationName && (
                         <p className="text-sm"><strong className="text-secondary-500">Payment Proof:</strong> <span className="text-green-600 dark:text-green-400">{asn.paymentConfirmationName}</span></p>
                    )}
                </div>

                {/* Column 3: Next Step */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-secondary-700 dark:text-secondary-300">Next Step</h4>
                    <WorkflowActions />
                    {/* Confirm Processed button for warehouse team */}
                    {asn.status === 'Arrived' && user?.role === 'Warehouse' && onConfirmProcessed && (
                      <button
                        onClick={() => onConfirmProcessed(asn)}
                        className="w-full mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md shadow-sm font-medium"
                      >
                        Confirm Processed
                      </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ASNDetailView;
