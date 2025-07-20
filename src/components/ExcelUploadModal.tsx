import React, { useState, useRef, useCallback } from 'react';
import Modal from './Modal';
import LoadingSpinner from './icons/LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
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
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  // 1. Add state for success and backend error messages
  const [success, setSuccess] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setCurrentStep('processing');
    setProgress(0);

    try {
      // Check file type
      const isCSV = file.name.endsWith('.csv');
      const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      if (!isCSV && !isXLSX) {
        throw new Error('Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
      }

      let rawRows: any[] = [];
      if (isCSV) {
        // Read file content as text and parse as CSV
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        if (!parsed.data || parsed.data.length === 0) {
          throw new Error('No inventory items found in the file');
        }
        rawRows = parsed.data as any[];
      } else if (isXLSX) {
        // Read file as ArrayBuffer and parse as ExcelJS workbook
        const data = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error('No worksheet found in the Excel file');
        }
        // Convert worksheet to array of objects using header row
        const rows: any[] = [];
        let headers: string[] = [];
        worksheet.eachRow((row, rowNumber) => {
          const values = row.values as any[];
          // ExcelJS row.values is 1-based, values[0] is undefined
          if (rowNumber === 1) {
            headers = values.slice(1).map((h: any) => (h ? h.toString() : ''));
          } else {
            const obj: Record<string, any> = {};
            headers.forEach((header, i) => {
              obj[header] = values[i + 1] !== undefined ? values[i + 1] : '';
            });
            rows.push(obj);
          }
        });
        rawRows = rows;
        if (!rawRows || rawRows.length === 0) {
          throw new Error('No inventory items found in the Excel file');
        }
      }

      // Normalize all header keys to lowercase and trim spaces for robust field extraction
      const normalizeKeys = (row: any) => {
        const normalized: Record<string, string> = {};
        Object.keys(row).forEach(key => {
          normalized[key.trim().toLowerCase()] = row[key];
        });
        return normalized;
      };
      // Map and validate rows
      const mappedRows = rawRows
        .map((row, idx) => {
          const norm = normalizeKeys(row);
          // Accept common variants for item name
          const itemName = norm['item name'] || norm['itemname'] || norm['name'] || '';
          if (!itemName) return null; // Ignore rows without item name
          const department = norm['department'] || '';
          // Accept both 'quantity' and 'Quantity' (case-insensitive)
          const quantityStr = norm['quantity'] || norm['Quantity'] || '';
          const quantity = parseInt(quantityStr, 10);
          const category = norm['category'] || '';
          const location = norm['location'] || '';
          const reorderPoint = parseInt(norm['reorder point'] || norm['reorderpoint'] || '', 10) || undefined;
          const safetyStock = parseInt(norm['safety stock'] || norm['safetystock'] || '', 10) || undefined;
          let status: 'success' | 'error' = 'success';
          let error: string | undefined = undefined;
          if (!department) {
            status = 'error';
            error = 'Missing required fields: Department';
          } else if (!quantityStr || isNaN(quantity)) {
            status = 'error';
            error = 'Missing or invalid Quantity';
          } else if (quantity <= 0) {
            // Ignore items with quantity 0 or less (do not add to inventory or review)
            return null;
          }
          return {
            itemName,
            department,
            quantity: isNaN(quantity) ? 0 : quantity,
            category,
            location,
            reorderPoint,
            safetyStock,
            status,
            error,
          };
        })
        // Only keep items with quantity > 0 or errors (nulls are filtered out)
        .filter(row => row !== null) as ProcessedInventoryItem[];
      // Debug: log all mapped rows to verify filtering
      console.log('Mapped rows (should only include quantity > 0):', mappedRows);
      if (mappedRows.length === 0) {
        throw new Error('No valid inventory items found. Please check your file headers and data.');
      }
      // Separate valid and invalid rows
      const validRows = mappedRows.filter(row => row.status === 'success');
      const invalidRows = mappedRows.filter(row => row.status === 'error');
      // Perform async SKU lookup for valid rows
      let processed: ProcessedInventoryItem[] = [];
      if (validRows.length > 0) {
        const skuResults = await skuGeneratorService.processExcelInventory(validRows);
        processed = skuResults.map((item, idx) => ({
          ...item,
          status: validRows[idx].status,
          error: validRows[idx].error,
        }));
      }
      // Add invalid rows (with no SKU)
      // When mapping invalid rows, ensure all required fields are present
      const processedInvalid = invalidRows.map(row => ({
        itemName: row.itemName || '',
        department: row.department || '',
        quantity: typeof row.quantity === 'number' ? row.quantity : 0,
        category: row.category || '',
        location: row.location || '',
        reorderPoint: row.reorderPoint,
        safetyStock: row.safetyStock,
        sku: 'not found',
        skuSource: 'none',
        status: 'error' as const,
        error: row.error,
      }));
      setProcessedItems([...processed, ...processedInvalid]);
      setCurrentStep('review');
      setProgress(0);
      setSuccess('Inventory uploaded successfully!');
      setBackendError(null);
    } catch (err) {
      setBackendError(err instanceof Error ? err.message : 'Upload failed.');
      setSuccess(null);
      setCurrentStep('upload');
      setProgress(0);
    }
  }, []);

  const handleConfirmUpload = () => {
    // Upload all items, not just those with status 'success'
    if (processedItems.length > 0) {
      onUploadComplete(processedItems);
      setCurrentStep('complete');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const template = `Item Name,Department,Quantity,Category,Location,Reorder Point,Safety Stock,Unit Cost
"Network Cable Cat6","Digicel+",50,"Cables","Warehouse A",10,5,2.50
"Router TP-Link","Digicel Business",25,"Networking","Warehouse B",5,2,45.00
"Antenna 5GHz","Outside Plant (OSP)",30,"Antennas","Warehouse C",8,3,18.75
"Laptop Dell","Commercial",15,"Computers","Warehouse A",3,1,650.00
"Printer HP","Marketing",8,"Printers","Warehouse B",2,1,120.00
"HVAC Filter","Field Force & HVAC",40,"HVAC","Warehouse C",12,6,7.80`;
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = url;
        downloadLinkRef.current.download = 'inventory_template.csv';
        downloadLinkRef.current.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 200);
      }
    } catch (error) {
      console.error('Error downloading template:', error);
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

  const handleDownloadErrorReport = () => {
    const errorRows = processedItems.filter(row => row.status === 'error');
    const csv = [
      'Item Name,Department,Quantity,Category,Location,Reorder Point,Safety Stock,SKU,SKU Source,Status,Error',
      ...errorRows.map(row =>
        [row.itemName, row.department, row.quantity, row.category, row.location, row.reorderPoint, row.safetyStock, row.sku, row.skuSource, row.status, row.error].map(v => `"${v ?? ''}"`).join(',')
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_upload_errors.csv';
    a.click();
    URL.revokeObjectURL(url);
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
          SKU codes will be generated automatically (no online lookup).
        </p>
      </div>

      <div className="space-y-4">
        {/* Move Select Excel File button above Download Template button */}
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

        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-primary-600 text-primary-700 bg-white hover:bg-primary-50 rounded-md shadow-sm transition-colors font-medium text-sm"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Download Template
          </button>
          {/* Hidden anchor for download */}
          <a ref={downloadLinkRef} className="hidden" />
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
            <li>• <strong>Unit Cost:</strong> Cost per unit (e.g., 2.50)</li>
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
        Generating SKU codes...
      </p>
      <div className="w-full max-w-md mx-auto mt-4">
        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
          <div
            className="bg-primary-600 h-4 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-secondary-700 dark:text-secondary-300">{progress}% complete</div>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
            Review Uploaded Items
          </h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {processedItems.length} items processed
          </p>
        </div>
        <div>
          <table className="min-w-full text-xs border">
            <thead>
              <tr>
                <th className="px-2 py-1 border">Item Name</th>
                <th className="px-2 py-1 border">Department</th>
                <th className="px-2 py-1 border">Quantity</th>
                <th className="px-2 py-1 border">Category</th>
                <th className="px-2 py-1 border">Location</th>
                <th className="px-2 py-1 border">Reorder Point</th>
                <th className="px-2 py-1 border">Safety Stock</th>
                <th className="px-2 py-1 border">SKU</th>
                <th className="px-2 py-1 border">SKU Source</th>
                <th className="px-2 py-1 border">Status</th>
                <th className="px-2 py-1 border">Error/Warning</th>
              </tr>
            </thead>
            <tbody>
              {processedItems.map((item, index) => (
                <tr key={index} className={item.status === 'error' ? 'bg-red-100 dark:bg-red-900/20' : item.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'}>
                  <td className="px-2 py-1 border">{item.itemName}</td>
                  <td className="px-2 py-1 border">{item.department}</td>
                  <td className="px-2 py-1 border">{item.quantity}</td>
                  <td className="px-2 py-1 border">{item.category}</td>
                  <td className="px-2 py-1 border">{item.location}</td>
                  <td className="px-2 py-1 border">{item.reorderPoint ?? ''}</td>
                  <td className="px-2 py-1 border">{item.safetyStock ?? ''}</td>
                  <td className="px-2 py-1 border">{item.sku}</td>
                  <td className="px-2 py-1 border">{item.skuSource}</td>
                  <td className="px-2 py-1 border font-bold">
                    {item.status === 'success' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Success</span>}
                    {item.status === 'warning' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Warning</span>}
                    {item.status === 'error' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Error</span>}
                  </td>
                  <td className="px-2 py-1 border text-red-600 dark:text-red-400">
                    {item.error && <span className="text-red-600">{item.error}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            disabled={processedItems.length === 0}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            Upload {processedItems.length} Items
          </button>
          {processedItems.some(row => row.status === 'error') && (
            <button
              onClick={handleDownloadErrorReport}
              className="bg-red-500 text-white px-3 py-1 rounded ml-2"
            >
              Download Error Report
            </button>
          )}
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Inventory from Excel" size="full">
      <div className="p-6">
        {error && <ErrorMessage message={error} />}
        {backendError && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
            <strong>Error:</strong> {backendError}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-2">
            <strong>Success:</strong> {success}
          </div>
        )}
        {renderContent()}
      </div>
    </Modal>
  );
};

export default ExcelUploadModal; 