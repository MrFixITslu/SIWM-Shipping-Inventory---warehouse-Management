import React, { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';
import QRCodeGenerator from './QRCodeGenerator';
import BarcodeGenerator from './BarcodeGenerator';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem } from '@/types';

interface BarcodeManagerProps {
  onClose?: () => void;
  isOpen: boolean;
}

interface ScannedResult {
  data: string;
  timestamp: Date;
  type: 'barcode' | 'qr';
}

const BarcodeManager: React.FC<BarcodeManagerProps> = ({
  onClose,
  isOpen
}) => {
  const { inventory } = useInventory();
  const [activeTab, setActiveTab] = useState<'scan' | 'generate' | 'history'>('scan');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isQRGeneratorOpen, setIsQRGeneratorOpen] = useState(false);
  const [isBarcodeGeneratorOpen, setIsBarcodeGeneratorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [scannedResults, setScannedResults] = useState<ScannedResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);

  const handleScan = (result: string) => {
    const newResult: ScannedResult = {
      data: result,
      timestamp: new Date(),
      type: 'barcode' // Default to barcode, could be enhanced to detect QR vs barcode
    };
    
    setScannedResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
    
    // Try to find item in inventory
    const item = inventory.find(inv => 
      inv.sku === result || 
      inv.id.toString() === result ||
      inv.name.toLowerCase().includes(result.toLowerCase())
    );
    
    setFoundItem(item || null);
    setIsScannerOpen(false);
  };

  const handleGenerateQR = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsQRGeneratorOpen(true);
  };

  const handleGenerateBarcode = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsBarcodeGeneratorOpen(true);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearHistory = () => {
    setScannedResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            Barcode & QR Code Manager
          </h3>
          <button
            onClick={onClose}
            className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'scan'
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300'
            }`}
          >
            Scan
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'generate'
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300'
            }`}
          >
            History
          </button>
        </div>

        {/* Scan Tab */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
                Open Scanner
              </button>
            </div>

            {foundItem && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Item Found!</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {foundItem.name}
                  </div>
                  <div>
                    <span className="font-medium">SKU:</span> {foundItem.sku}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {foundItem.category}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {foundItem.location}
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span> {foundItem.quantity}
                  </div>
                  <div>
                    <span className="font-medium">Reorder Point:</span> {foundItem.reorderPoint}
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleGenerateQR(foundItem)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Generate QR Code
                  </button>
                  <button
                    onClick={() => handleGenerateBarcode(foundItem)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                  >
                    Generate Barcode
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-secondary-300 rounded-lg px-4 py-2 bg-white dark:bg-secondary-700 dark:border-secondary-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredInventory.map(item => (
                <div key={item.id} className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                    {item.name}
                  </h4>
                  <div className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                    <p><strong>SKU:</strong> {item.sku}</p>
                    <p><strong>Category:</strong> {item.category}</p>
                    <p><strong>Location:</strong> {item.location}</p>
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleGenerateQR(item)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      QR Code
                    </button>
                    <button
                      onClick={() => handleGenerateBarcode(item)}
                      className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      Barcode
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
                Scan History
              </h4>
              <button
                onClick={clearHistory}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scannedResults.map((result, index) => (
                <div key={index} className="border border-secondary-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-secondary-900 dark:text-secondary-100">
                        {result.data}
                      </p>
                      <p className="text-sm text-secondary-500">
                        {result.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.type === 'qr' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {result.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
              
              {scannedResults.length === 0 && (
                <p className="text-secondary-500 text-center py-8">
                  No scan history yet. Start scanning to see results here.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Scanner Modal */}
        <BarcodeScanner
          isOpen={isScannerOpen}
          onScan={handleScan}
          onClose={() => setIsScannerOpen(false)}
        />

        {/* QR Code Generator Modal */}
        <QRCodeGenerator
          isOpen={isQRGeneratorOpen}
          item={selectedItem || undefined}
          onClose={() => {
            setIsQRGeneratorOpen(false);
            setSelectedItem(null);
          }}
        />

        {/* Barcode Generator Modal */}
        <BarcodeGenerator
          isOpen={isBarcodeGeneratorOpen}
          item={selectedItem || undefined}
          onClose={() => {
            setIsBarcodeGeneratorOpen(false);
            setSelectedItem(null);
          }}
        />
      </div>
    </div>
  );
};

export default BarcodeManager; 