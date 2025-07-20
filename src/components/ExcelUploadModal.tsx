import React, { useState, useRef, useCallback } from 'react';
import Modal from './Modal';
import LoadingSpinner from './icons/LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { 
  ExcelInventoryItem, 
  ProcessedInventoryItem, 
  skuGeneratorService 
} from '@/services/skuGeneratorService';
import { 
  UploadIcon, 
  SuccessIcon, 
  WarningIcon,
  ArrowPathIcon
} from '@/constants';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (items: ProcessedInventoryItem[]) => void;
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete
}) => {
  const [error, setError] = useState<string | null>(null);
  const [processedItems, setProcessedItems] = useState<ProcessedInventoryItem[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'review' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setCurrentStep('processing');

    try {
      // Check file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        throw new Error('Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
      }

      // Read file content
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      // Parse CSV/Excel data
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data: ExcelInventoryItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Map to our expected format
        const item: ExcelInventoryItem = {
          itemName: row['Item Name'] || row['ItemName'] || row['Name'] || '',
          department: row['Department'] || '',
          quantity: parseInt(row['Quantity'] || '0', 10),
          category: row['Category'] || '',
          location: row['Location'] || '',
          reorderPoint: parseInt(row['Reorder Point'] || row['ReorderPoint'] || '0', 10),
          safetyStock: parseInt(row['Safety Stock'] || row['SafetyStock'] || '0', 10)
        };

        if (item.itemName && item.department && item.quantity > 0) {
          data.push(item);
        }
      }

      if (data.length === 0) {
        throw new Error('No valid inventory items found in the file');
      }

      // Validate data
      const validation = skuGeneratorService.validateExcelData(data);
      if (!validation.isValid) {
        throw new Error(`Validation errors:\n${validation.errors.join('\n')}`);
      }

      // Generate SKUs
      const processed = await skuGeneratorService.processExcelInventory(data);
      setProcessedItems(processed);
      setCurrentStep('review');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process Excel file');
      setCurrentStep('upload');
    }
  }, []);

  const handleConfirmUpload = () => {
    const successfulItems = processedItems.filter(item => item.status === 'success');
    if (successfulItems.length > 0) {
      onUploadComplete(successfulItems);
      setCurrentStep('complete');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // Enhanced template with more comprehensive examples and better formatting
      const template = `Item Name,Department,Quantity,Category,Location,Reorder Point,Safety Stock
"Network Cable Cat6","Digicel+",50,"Cables","Warehouse A",10,5
"Router TP-Link","Digicel Business",25,"Networking","Warehouse B",5,2
"Antenna 5GHz","Outside Plant (OSP)",30,"Antennas","Warehouse C",8,3
"Laptop Dell","Commercial",15,"Computers","Warehouse A",3,1
"Printer HP","Marketing",8,"Printers","Warehouse B",2,1
"HVAC Filter","Field Force & HVAC",40,"HVAC","Warehouse C",12,6`;
      
      // Create blob with proper encoding
      const blob = new Blob([template], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory_template.csv';
      a.style.display = 'none';
      
      // Add to DOM, click, and cleanup
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading template:', error);
      // Fallback: create a simple text download
      const fallbackTemplate = `Item Name,Department,Quantity
"Network Cable","Digicel+",10
"Router","Digicel Business",5
"Antenna","Outside Plant (OSP)",15`;
      
      const blob = new Blob([fallbackTemplate], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClose = () => {
    setCurrentStep('upload');
    setProcessedItems([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <UploadIcon className="mx-auto h-12 w-12 text-primary-500" />
        <h3 className="mt-2 text-lg font-medium text-secondary-900 dark:text-secondary-100">
          Upload Inventory Excel File
        </h3>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          Upload an Excel file with Item Name, Department, and Quantity columns.
          SKU codes will be automatically generated from the internet.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
          >
            Select Excel File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select Excel file for inventory upload"
          />
        </div>

        <div className="text-center">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center mx-auto text-primary-600 hover:text-primary-700 text-sm"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Download Template
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Required Format:</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• <strong>Item Name:</strong> Product name (e.g., "Network Cable Cat6")</li>
            <li>• <strong>Department:</strong> One of: Digicel+, Digicel Business, Commercial, Marketing, Outside Plant (OSP), Field Force &amp; HVAC</li>
            <li>• <strong>Quantity:</strong> Number of items (must be &gt; 0)</li>
            <li>• <strong>Category:</strong> Product category (e.g., "Cables", "Networking", "Computers")</li>
            <li>• <strong>Location:</strong> Storage location (e.g., "Warehouse A", "Warehouse B")</li>
            <li>• <strong>Reorder Point:</strong> Minimum stock level before reordering</li>
            <li>• <strong>Safety Stock:</strong> Extra stock for emergencies</li>
          </ul>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Note: Only Item Name, Department, and Quantity are required. Other fields are optional.
          </p>
        </div>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-4">
      <LoadingSpinner className="mx-auto h-12 w-12 text-primary-500" />
      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
        Processing Excel File
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400">
        Generating SKU codes from internet sources...
      </p>
    </div>
  );

  const renderReviewStep = () => {
    const successfulItems = processedItems.filter(item => item.status === 'success');
    const failedItems = processedItems.filter(item => item.status === 'error');

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
            Review Generated SKUs
          </h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {successfulItems.length} items processed successfully, {failedItems.length} failed
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {processedItems.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  item.status === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {item.status === 'success' ? (
                        <SuccessIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <WarningIcon className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium text-secondary-900 dark:text-secondary-100">
                        {item.itemName}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                      <span>Department: {item.department}</span>
                      <span className="mx-2">•</span>
                      <span>Quantity: {item.quantity}</span>
                      {item.status === 'success' && (
                        <>
                          <span className="mx-2">•</span>
                          <span>SKU: {item.sku}</span>
                          <span className="mx-2">•</span>
                          <span className="text-xs">Source: {item.skuSource}</span>
                        </>
                      )}
                    </div>
                    {item.error && (
                      <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                        Error: {item.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmUpload}
            disabled={successfulItems.length === 0}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            Upload {successfulItems.length} Items
          </button>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="text-center space-y-4">
      <SuccessIcon className="mx-auto h-12 w-12 text-green-500" />
      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
        Upload Complete!
      </h3>
      <p className="text-sm text-secondary-500 dark:text-secondary-400">
        {processedItems.filter(item => item.status === 'success').length} items have been added to inventory.
      </p>
      <button
        onClick={handleClose}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
      >
        Close
      </button>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'processing':
        return renderProcessingStep();
      case 'review':
        return renderReviewStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderUploadStep();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Inventory from Excel">
      <div className="p-6">
        {error && <ErrorMessage message={error} />}
        {renderContent()}
      </div>
    </Modal>
  );
};

export default ExcelUploadModal; 