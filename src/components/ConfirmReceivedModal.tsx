import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { ASN, AlertSeverity } from '@/types';
import { asnService } from '@/services/asnService';
import { alertingService } from '@/services/alertingService';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { CheckBadgeIcon, BellIcon } from '@/constants';

interface ConfirmReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: ASN | null;
  onConfirmComplete: () => void;
}

const ConfirmReceivedModal: React.FC<ConfirmReceivedModalProps> = ({ 
  isOpen, 
  onClose, 
  shipment, 
  onConfirmComplete 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipmentDetails, setShipmentDetails] = useState<ASN | null>(null);
  const [notificationSent, setNotificationSent] = useState(false);

  useEffect(() => {
    if (isOpen && shipment) {
      const fetchShipmentDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const details = await asnService.getASNById(shipment.id);
          setShipmentDetails(details);
        } catch (err: any) {
          setError(`Failed to fetch shipment details: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchShipmentDetails();
    }
  }, [isOpen, shipment]);

  const handleSendNotification = async () => {
    if (!shipment) return;
    
    setIsSendingNotification(true);
    setError(null);
    try {
      await alertingService.addAlert(
        AlertSeverity.Info,
        `Shipment #${shipment.id} (P.O. #${shipment.poNumber}) has been received and processed by the warehouse team.`,
        'Shipment Received',
        `/incoming-shipments#${shipment.id}`
      );
      setNotificationSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send notification.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleCompleteReceive = async () => {
    if (!shipment) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Update status to 'Arrived' to complete the receive process
      await asnService.updateASN(shipment.id, { status: 'At the Warehouse' });
      onConfirmComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete receive process.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!shipment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review & Confirm - Shipment #${shipment.id}`} size="2xl">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-800/30 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Review Shipment Processing
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            All items have been processed and added to inventory. Review the items below and confirm the receive process. You can optionally send a notification to stakeholders.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <LoadingSpinner className="w-8 h-8 text-primary-500" />
            <p className="ml-3">Loading shipment details...</p>
          </div>
        ) : shipmentDetails ? (
          <div className="space-y-4">
            <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <h4 className="font-semibold text-secondary-800 dark:text-secondary-200 mb-3">
                Recently Added Items
              </h4>
              
              <div className="space-y-3">
                {shipmentDetails.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-secondary-800 dark:text-secondary-200">
                        {item.itemName || `Item ${item.inventoryItemId}`}
                      </p>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        SKU: {item.itemSku || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600 dark:text-primary-400">
                        {item.quantity} units
                      </p>
                      {item.newSerials && item.newSerials.length > 0 && (
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                          {item.newSerials.length} serial numbers
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Processing Summary
              </h4>
              <ul className="text-green-700 dark:text-green-300 text-sm space-y-1">
                <li>✓ All items have been added to inventory</li>
                <li>✓ Serial numbers have been recorded (where applicable)</li>
                <li>✓ Stock levels have been updated</li>
                <li>✓ Processing discrepancies have been resolved</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-secondary-600 dark:text-secondary-400">
            No shipment details available
          </div>
        )}

        <div className="flex justify-between space-x-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 rounded-md"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSendNotification}
              disabled={isLoading || isSendingNotification || notificationSent}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSendingNotification ? (
                <div className="flex items-center">
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Sending...
                </div>
              ) : notificationSent ? (
                <div className="flex items-center">
                  <CheckBadgeIcon className="w-4 h-4 mr-2" />
                  Notification Sent
                </div>
              ) : (
                <div className="flex items-center">
                  <BellIcon className="w-4 h-4 mr-2" />
                  Send Notification
                </div>
              )}
            </button>
            
            <button
              onClick={handleCompleteReceive}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Completing...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckBadgeIcon className="w-4 h-4 mr-2" />
                  Confirm Complete
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmReceivedModal; 