import React, { useEffect, useState } from 'react';
import { ASN, User, FeeStatus } from '@/types';
import { CloseIcon, CurrencyDollarIcon, CheckBadgeIcon, ShipmentIcon, DocumentTextIcon } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '@/services/inventoryService';

// Helper to get file icon by extension
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return <DocumentTextIcon className="w-5 h-5 text-secondary-400 inline-block mr-1" />;
  if (["pdf"].includes(ext)) return <DocumentTextIcon className="w-5 h-5 text-red-500 inline-block mr-1" />;
  if (["doc", "docx"].includes(ext)) return <DocumentTextIcon className="w-5 h-5 text-blue-500 inline-block mr-1" />;
  if (["jpg", "jpeg", "png"].includes(ext)) return <DocumentTextIcon className="w-5 h-5 text-green-500 inline-block mr-1" />;
  return <DocumentTextIcon className="w-5 h-5 text-secondary-400 inline-block mr-1" />;
};

// Helper to check if file is PDF
const isPdf = (fileName: string) => fileName.toLowerCase().endsWith('.pdf');
// Helper to get base64 size in bytes
const base64Size = (base64: string) => Math.ceil((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);

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
  onCompleteShipment?: (asn: ASN) => void;
}

const ASNDetailView: React.FC<ASNDetailViewProps> = ({ asn, user, onClose, onEnterFees, onApproveFees, onConfirmPayment, onConfirmArrival, onConfirmProcessed, onConfirmReceived, onCompleteShipment }) => {
    const navigate = useNavigate();
    const [inventoryTotals, setInventoryTotals] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchTotals = async () => {
            if (asn.items && asn.items.length > 0) {
                const inventory = await inventoryService.getInventoryItems();
                const totals: Record<number, number> = {};
                asn.items.forEach(item => {
                    if (item.inventoryItemId) {
                        const inv = inventory.find(i => i.id === item.inventoryItemId);
                        if (inv) totals[item.inventoryItemId] = inv.quantity;
                    }
                });
                setInventoryTotals(totals);
            }
        };
        fetchTotals();
    }, [asn.items]);
    
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

        // New: Complete Shipment logic
        const canCompleteShipment = user && ['Warehouse', 'admin', 'manager', 'Manager', 'Admin', 'Warehouse'].includes(user.role) && asn.items && asn.items.length > 0 && (asn.status === 'Processing' || asn.status === 'Discrepancy Review');
        if (asn.status === 'Complete') {
            return <p className="text-xs text-center text-teal-600 dark:text-teal-400 font-semibold">✅ Shipment completed.</p>;
        }
        if (canCompleteShipment && onCompleteShipment) {
            return (
                <button
                    onClick={() => onCompleteShipment(asn)}
                    className={`${commonButtonClasses} bg-teal-600 hover:bg-teal-700 text-white`}
                >
                    <CheckBadgeIcon className="h-5 w-5 mr-2" /> Mark as Complete
                </button>
            );
        }

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
                // If status is 'At the Warehouse', warehouse can begin processing
                if (asn.status === 'At the Warehouse') {
                    const canWarehouseProcess = user && ['Warehouse', 'admin', 'manager'].includes(user.role);
                    return (
                        <div>
                            <button
                                onClick={() => navigate(`/inventory?asnId=${asn.id}`)}
                                disabled={!canWarehouseProcess}
                                className={`${commonButtonClasses} bg-blue-500 hover:bg-blue-600 text-white`}
                            >
                                <ShipmentIcon className="h-5 w-5 mr-2" /> Begin Processing
                            </button>
                            {!canWarehouseProcess && <p className={helperTextClasses}>Waiting for Warehouse team to begin processing.</p>}
                        </div>
                    );
                }
                // If status is 'Processing', warehouse can add items to inventory or move to discrepancy review
                if (asn.status === 'Processing') {
                    const canWarehouseDiscrepancy = user && ['Warehouse', 'admin', 'manager'].includes(user.role);
                    return (
                        <div>
                            <button
                                onClick={() => onConfirmReceived?.(asn)}
                                disabled={!canWarehouseDiscrepancy}
                                className={`${commonButtonClasses} bg-orange-500 hover:bg-orange-600 text-white`}
                            >
                                <ShipmentIcon className="h-5 w-5 mr-2" /> Move to Discrepancy Review
                            </button>
                            {!canWarehouseDiscrepancy && <p className={helperTextClasses}>Processing in progress. Move to discrepancy review if needed.</p>}
                        </div>
                    );
                }
                // If status is 'Discrepancy Review', warehouse can resolve and return to processing or complete
                if (asn.status === 'Discrepancy Review') {
                    const canWarehouseResolve = user && ['Warehouse', 'admin', 'manager'].includes(user.role);
                    return (
                        <div>
                            <button
                                onClick={() => onConfirmProcessed?.(asn)}
                                disabled={!canWarehouseResolve}
                                className={`${commonButtonClasses} bg-teal-500 hover:bg-teal-600 text-white`}
                            >
                                <CheckBadgeIcon className="h-5 w-5 mr-2" /> Resolve & Return to Processing
                            </button>
                            {!canWarehouseResolve && <p className={helperTextClasses}>Resolve discrepancies to continue processing or complete.</p>}
                        </div>
                    );
                }
                // Default: After payment confirmed, warehouse marks as 'At the Warehouse'
                const canWarehouseMarkAtWarehouse = user && ['Warehouse', 'admin', 'manager'].includes(user.role);
                if (asn.status === 'On Time' || asn.status === 'Delayed') {
                    return (
                        <div>
                            <button
                                onClick={() => onConfirmArrival(asn)}
                                disabled={!canWarehouseMarkAtWarehouse}
                                className={`${commonButtonClasses} bg-indigo-500 hover:bg-indigo-600 text-white`}
                            >
                                <ShipmentIcon className="h-5 w-5 mr-2" /> Mark as At the Warehouse
                            </button>
                            {!canWarehouseMarkAtWarehouse && <p className={helperTextClasses}>Waiting for Warehouse team to mark as at the warehouse.</p>}
                        </div>
                    );
                }
                return <p className={helperTextClasses}>Awaiting warehouse action.</p>;

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
                <button 
                    onClick={onClose} 
                    className="p-1 rounded-full text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700"
                    title="Close details"
                    aria-label="Close shipment details"
                >
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
                </div>
            </div>

            {/* File Downloads Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* P.O. */}
              {asn.poFileData && asn.poFileName && (
                <div>
                  <span className="block text-xs text-secondary-500 mb-1">P.O.</span>
                  <a
                    href={`data:application/octet-stream;base64,${asn.poFileData}`}
                    download={asn.poFileName}
                    className="text-primary-600 hover:underline text-sm flex items-center"
                    title="Download file"
                    aria-label="Download file"
                  >
                    {getFileIcon(asn.poFileName)}{asn.poFileName}
                  </a>
                  {/* PDF Preview */}
                  {isPdf(asn.poFileName) && base64Size(asn.poFileData) < 2 * 1024 * 1024 && (
                    <div className="mt-2 border rounded overflow-hidden">
                      <embed
                        src={`data:application/pdf;base64,${asn.poFileData}`}
                        type="application/pdf"
                        width="100%"
                        height="300px"
                        className="rounded"
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Invoice: use vendorInvoiceData/vendorInvoiceName */}
              {asn.vendorInvoiceData && asn.vendorInvoiceName && (
                <div>
                  <span className="block text-xs text-secondary-500 mb-1">Invoice</span>
                  <a
                    href={`data:application/octet-stream;base64,${asn.vendorInvoiceData}`}
                    download={asn.vendorInvoiceName}
                    className="text-primary-600 hover:underline text-sm flex items-center"
                    title="Download file"
                    aria-label="Download file"
                  >
                    {getFileIcon(asn.vendorInvoiceName)}{asn.vendorInvoiceName}
                  </a>
                  {/* PDF Preview */}
                  {isPdf(asn.vendorInvoiceName) && base64Size(asn.vendorInvoiceData) < 2 * 1024 * 1024 && (
                    <div className="mt-2 border rounded overflow-hidden">
                      <embed
                        src={`data:application/pdf;base64,${asn.vendorInvoiceData}`}
                        type="application/pdf"
                        width="100%"
                        height="300px"
                        className="rounded"
                      />
                    </div>
                  )}
                </div>
              )}
              {/* Bill of Lading */}
              {asn.billOfLadingData && asn.billOfLadingName && (
                <div>
                  <span className="block text-xs text-secondary-500 mb-1">Bill of Lading</span>
                  <a
                    href={`data:application/octet-stream;base64,${asn.billOfLadingData}`}
                    download={asn.billOfLadingName}
                    className="text-primary-600 hover:underline text-sm flex items-center"
                    title="Download file"
                    aria-label="Download file"
                  >
                    {getFileIcon(asn.billOfLadingName)}{asn.billOfLadingName}
                  </a>
                  {/* PDF Preview */}
                  {isPdf(asn.billOfLadingName) && base64Size(asn.billOfLadingData) < 2 * 1024 * 1024 && (
                    <div className="mt-2 border rounded overflow-hidden">
                      <embed
                        src={`data:application/pdf;base64,${asn.billOfLadingData}`}
                        type="application/pdf"
                        width="100%"
                        height="300px"
                        className="rounded"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Received Items Section - Show when items have been added to inventory */}
            {asn.items && asn.items.length > 0 && (
                <div className="mt-6 border-t border-secondary-200 dark:border-secondary-700 pt-4">
                    <h4 className="font-semibold text-secondary-700 dark:text-secondary-300 mb-3">
                        📦 Items Received & Added to Inventory
                    </h4>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {asn.items.map((item, index) => (
                                <div key={index} className="bg-white dark:bg-secondary-700 rounded-md p-3 border border-green-200 dark:border-green-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-medium text-secondary-900 dark:text-secondary-100 text-sm">
                                            {item.itemName || `Item ${index + 1}`}
                                        </h5>
                                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                            {item.quantity} received
                                        </span>
                                    </div>
                                    {item.itemSku && (
                                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                                            SKU: {item.itemSku}
                                        </p>
                                    )}
                                    {typeof item.inventoryItemId === 'number' && inventoryTotals[item.inventoryItemId] !== undefined && (
                                        <p className="text-xs text-secondary-700 dark:text-secondary-200 mb-1">
                                            New Total in Stock: <span className="font-semibold">{inventoryTotals[item.inventoryItemId]}</span>
                                        </p>
                                    )}
                                    {item.newSerials && item.newSerials.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-1">
                                                Serial Numbers:
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {item.newSerials.map((serial, serialIndex) => (
                                                    <span 
                                                        key={serialIndex}
                                                        className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                                                    >
                                                        {serial}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-sm text-green-700 dark:text-green-300">
                            ✅ All items have been successfully added to inventory and are now available for use.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ASNDetailView;
