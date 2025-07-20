import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/Modal';
import { InventoryItem } from '@/types';
import { PlusIcon, DeleteIcon, SerialIcon, UploadIcon } from '@/constants';
import LoadingSpinner from '@/components/icons/LoadingSpinner';
import { geminiService } from '@/services/geminiService';
import Papa from 'papaparse';

interface SerialManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSaveSerials: (itemId: number, serials: string[]) => void;
  showNotification?: boolean;
}

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

const SerialManagementModal: React.FC<SerialManagementModalProps> = ({ isOpen, onClose, item, onSaveSerials, showNotification = false }) => {
  const [currentSerials, setCurrentSerials] = useState<string[]>([]);
  const [newSerial, setNewSerial] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item && item.isSerialized) {
      // For new items (id === -1), start with empty list
      // For existing items, start with empty list for additional serials
      if (item.id === -1) {
        setCurrentSerials([]);
      } else {
        // For existing items, we're adding additional serials, so start empty
        setCurrentSerials([]);
      }
    } else {
      setCurrentSerials([]);
    }
    setNewSerial('');
    setError('');
    setUploadMessage('');
    setIsUploading(false);
  }, [item, isOpen]);

  if (!item) return null;

  const handleAddSerial = () => {
    if (!newSerial.trim()) {
      setError('Serial number cannot be empty.');
      return;
    }
    
    // Split by spaces and filter out empty strings
    const serialsToAdd = newSerial.trim().split(/\s+/).filter(serial => serial.length > 0);
    
    if (serialsToAdd.length === 0) {
      setError('Serial number cannot be empty.');
      return;
    }
    
    // Check for all types of duplicates and separate valid ones
    const inputDuplicates = serialsToAdd.filter((serial, index) => serialsToAdd.indexOf(serial) !== index);
    const existingDuplicates = serialsToAdd.filter(serial => currentSerials.includes(serial));
    const uniqueInputSerials = [...new Set(serialsToAdd)];
    const validSerials = uniqueInputSerials.filter(serial => !currentSerials.includes(serial));
    
    // Collect all duplicate messages
    const duplicateMessages = [];
    if (inputDuplicates.length > 0) {
      duplicateMessages.push(`Duplicate serial numbers in input: ${[...new Set(inputDuplicates)].join(', ')}`);
    }
    if (existingDuplicates.length > 0) {
      duplicateMessages.push(`These serial numbers already exist: ${existingDuplicates.join(', ')}`);
    }
    
    if (duplicateMessages.length > 0) {
      // Add valid serials and show error for duplicates
      if (validSerials.length > 0) {
        setCurrentSerials([...currentSerials, ...validSerials]);
        setError(duplicateMessages.join('. '));
      } else {
        setError(duplicateMessages.join('. '));
      }
      setNewSerial('');
      return;
    }
    
    // Add all serials (no duplicates found)
    setCurrentSerials([...currentSerials, ...serialsToAdd]);
    setNewSerial('');
    setError('');
  };

  const handleDeleteSerial = (serialToDelete: string) => {
    setCurrentSerials(currentSerials.filter(s => s !== serialToDelete));
  };
  
  const handleSaveChanges = () => {
    onSaveSerials(item.id, currentSerials);
    onClose();
  };

  const parseCsv = (file: File): Promise<{ serials: string[], duplicates: string[], newSerials: string[], debug: { totalRows: number, emptyCells: number, validSerials: number } }> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            complete: (results) => {
                // Read from cell A1 down - get all values from first column
                const allRows = results.data;
                const totalRows = allRows.length;
                
                const allSerials = allRows
                    .map((row: any) => {
                        // Get the first column (A1, A2, A3, etc.)
                        const firstCell = Array.isArray(row) ? row[0] : row;
                        return String(firstCell || '').trim();
                    });

                const emptyCells = allSerials.filter(s => !s).length;
                const validSerials = allSerials.filter(Boolean); // Remove empty cells

                // Find duplicates and new serials
                const existingSerials = new Set(currentSerials);
                const newSerials: string[] = [];
                const duplicates: string[] = [];

                validSerials.forEach(serial => {
                    if (existingSerials.has(serial)) {
                        duplicates.push(serial);
                    } else {
                        newSerials.push(serial);
                        existingSerials.add(serial);
                    }
                });

                resolve({
                    serials: validSerials,
                    duplicates,
                    newSerials,
                    debug: {
                        totalRows,
                        emptyCells,
                        validSerials: validSerials.length
                    }
                });
            },
            error: (error: any) => reject(new Error(`CSV parsing error: ${error.message}`)),
        });
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
        let serials: string[] = [];
        let duplicates: string[] = [];
        let newSerials: string[] = [];
        let debugInfo: { totalRows: number, emptyCells: number, validSerials: number } | null = null;

        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const result = await parseCsv(file);
            serials = result.serials;
            duplicates = result.duplicates;
            newSerials = result.newSerials;
            debugInfo = result.debug;
        } else if (file.type === 'application/pdf') {
            serials = await geminiService.extractTextFromPdf(file);
            // For PDF, we'll treat all as new since we can't easily detect duplicates
            newSerials = serials;
        } else {
            throw new Error('Unsupported file type. Please upload a .csv or .pdf file.');
        }

        // Add only new serials to the current list
        const updatedSerials = [...currentSerials, ...newSerials];
        setCurrentSerials(updatedSerials);

        // Provide detailed feedback about the upload
        let feedbackMessage = `Uploaded ${newSerials.length} new serial number(s).`;
        if (duplicates.length > 0) {
            feedbackMessage += ` ${duplicates.length} duplicate(s) were ignored.`;
        }
        if (serials.length === 0) {
            feedbackMessage = 'No valid serial numbers found in the file.';
        }

        // Add debug information for CSV files
        if (debugInfo) {
            feedbackMessage += `\nFile analysis: ${debugInfo.totalRows} total rows, ${debugInfo.emptyCells} empty cells, ${debugInfo.validSerials} valid serials.`;
            if (debugInfo.emptyCells > 0) {
                feedbackMessage += `\nNote: ${debugInfo.emptyCells} empty cell(s) were automatically skipped.`;
            }
        }

        // Show success message
        setUploadMessage(feedbackMessage);
        if (duplicates.length > 0) {
            console.log('Duplicates ignored:', duplicates);
        }
        if (debugInfo) {
            console.log('CSV Debug Info:', debugInfo);
        }

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${item.id === -1 ? 'Add Serial Numbers' : 'Add Additional Serial Numbers'} for ${item.name} (SKU: ${item.sku})`} size="lg">
      <div className="space-y-4">
        {showNotification && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Serial Numbers Required
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    {item.id === -1 
                      ? `This serialized item will be added to inventory once you add the serial numbers. Please add the serial numbers for the ${item.quantity || 0} units.`
                      : `Please add the additional serial numbers for the ${item.quantity || 0} new units.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
          <label htmlFor="newSerial" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Add New Serial Numbers
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <label htmlFor="serial-input-268" className="sr-only">Serial number</label>
            <input
              type="text"
              name="newSerial"
              id="serial-input-268"
              value={newSerial}
              onChange={(e) => { setNewSerial(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSerial())}
              placeholder="Enter serial number"
              className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md ${TAILWIND_INPUT_CLASSES} focus:z-10 sm:text-sm`}
            />
            <button
              type="button"
              onClick={handleAddSerial}
              className="inline-flex items-center px-4 py-2 border border-l-0 border-primary-500 bg-primary-500 text-white rounded-r-md text-sm font-medium hover:bg-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <PlusIcon className="h-5 w-5 mr-1 sm:mr-2" /> Add
            </button>
          </div>
          <div className="mt-4">
              <label htmlFor="serial-upload" className="sr-only">Upload Serials</label>
              <input type="file" id="serial-upload" ref={fileInputRef} className="hidden" accept=".csv,.pdf" onChange={handleFileSelect} title="Upload Serials" placeholder="Select CSV or PDF file" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-dashed border-secondary-400 dark:border-secondary-600 text-sm font-medium rounded-md text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50"
                title="Upload Serials"
              >
                  <UploadIcon className="h-5 w-5 mr-2" />
                  {isUploading ? 'Processing...' : 'Batch Upload from CSV or PDF'}
              </button>
              <p className="text-xs text-secondary-500 mt-1">
                CSV files: Reads from cell A1 down. Duplicates are automatically ignored.
              </p>
          </div>
           {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
           {uploadMessage && <p className="mt-2 text-sm text-green-600 dark:text-green-400">{uploadMessage}</p>}
        </div>

        {currentSerials.length > 0 ? (
          <div>
            <h4 className="text-md font-medium text-secondary-800 dark:text-secondary-200 mb-2">Registered Serial Numbers ({currentSerials.length})</h4>
            <div className="max-h-60 overflow-y-auto border border-secondary-200 dark:border-secondary-700 rounded-md p-2 space-y-2 bg-secondary-50 dark:bg-secondary-700/30">
              {currentSerials.map((serial) => (
                <div key={serial} className="flex items-center justify-between p-2 bg-white dark:bg-secondary-800 rounded-md">
                  <span className="flex items-center font-mono text-xs">
                    <SerialIcon className="h-4 w-4 mr-2 text-blue-500" />
                    {serial}
                  </span>
                  <button onClick={() => handleDeleteSerial(serial)} className="text-red-500 hover:text-red-700 p-1 rounded-full" title="Remove serial">
                    <DeleteIcon className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !isUploading && <p className="text-center text-secondary-500 dark:text-secondary-400 py-4">No serial numbers registered for this item yet.</p>
        )}
        {isUploading && <div className="flex justify-center py-4"><LoadingSpinner className="h-6 w-6" /></div>}

        <div className="flex justify-end space-x-3 pt-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md shadow-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SerialManagementModal;
