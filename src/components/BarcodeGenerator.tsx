import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorProps {
  item?: {
    id: number;
    name: string;
    sku: string;
    category?: string;
    location?: string;
  };
  customData?: string;
  onClose?: () => void;
  isOpen: boolean;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  item,
  customData,
  onClose,
  isOpen
}) => {
  const [barcodeData, setBarcodeData] = useState<string>('');
  const [barcodeType, setBarcodeType] = useState<string>('CODE128');
  const [barcodeWidth, setBarcodeWidth] = useState<number>(2);
  const [barcodeHeight, setBarcodeHeight] = useState<number>(100);
  const [includeItemInfo, setIncludeItemInfo] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const barcodeTypes = [
    { value: 'CODE128', label: 'Code 128' },
    { value: 'CODE39', label: 'Code 39' },
    { value: 'EAN13', label: 'EAN-13' },
    { value: 'EAN8', label: 'EAN-8' },
    { value: 'UPC', label: 'UPC' },
    { value: 'ITF14', label: 'ITF-14' },
    { value: 'MSI', label: 'MSI' },
    { value: 'PHARMACODE', label: 'Pharmacode' }
  ];

  useEffect(() => {
    if (item && includeItemInfo) {
      setBarcodeData(item.sku);
    } else if (customData) {
      setBarcodeData(customData);
    }
  }, [item, customData, includeItemInfo]);

  useEffect(() => {
    if (canvasRef.current && barcodeData) {
      try {
        JsBarcode(canvasRef.current, barcodeData, {
          format: barcodeType,
          width: barcodeWidth,
          height: barcodeHeight,
          displayValue: true,
          fontSize: 14,
          margin: 10
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [barcodeData, barcodeType, barcodeWidth, barcodeHeight]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `barcode-${item?.sku || 'custom'}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && canvasRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode - ${item?.name || 'Custom'}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .barcode-container { margin: 20px 0; }
              .item-info { margin: 10px 0; font-size: 14px; }
            </style>
          </head>
          <body>
            <h2>Barcode</h2>
            <div class="barcode-container">
              <canvas id="barcode-canvas"></canvas>
            </div>
            ${item ? `
              <div class="item-info">
                <p><strong>Item:</strong> ${item.name}</p>
                <p><strong>SKU:</strong> ${item.sku}</p>
                ${item.category ? `<p><strong>Category:</strong> ${item.category}</p>` : ''}
                ${item.location ? `<p><strong>Location:</strong> ${item.location}</p>` : ''}
              </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Generate Barcode
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

        {item && (
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeItemInfo}
                onChange={(e) => setIncludeItemInfo(e.target.checked)}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">
                Use item SKU for barcode
              </span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Barcode Type
            </label>
            <select
              value={barcodeType}
              onChange={(e) => setBarcodeType(e.target.value)}
              className="w-full border border-secondary-300 rounded-md px-3 py-2 bg-white dark:bg-secondary-700 dark:border-secondary-600"
            >
              {barcodeTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Barcode Data
            </label>
            <input
              type="text"
              value={barcodeData}
              onChange={(e) => setBarcodeData(e.target.value)}
              className="w-full border border-secondary-300 rounded-md px-3 py-2 bg-white dark:bg-secondary-700 dark:border-secondary-600"
              placeholder="Enter barcode data"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Width
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={barcodeWidth}
              onChange={(e) => setBarcodeWidth(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-secondary-500">{barcodeWidth}px</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Height
            </label>
            <input
              type="range"
              min="50"
              max="200"
              step="10"
              value={barcodeHeight}
              onChange={(e) => setBarcodeHeight(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-secondary-500">{barcodeHeight}px</span>
          </div>
        </div>

        {barcodeData && (
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white p-4 rounded border">
              <canvas ref={canvasRef} />
            </div>
          </div>
        )}

        {item && includeItemInfo && (
          <div className="mb-4 p-3 bg-secondary-50 dark:bg-secondary-700 rounded">
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Item Information
            </h4>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              <p><strong>Name:</strong> {item.name}</p>
              <p><strong>SKU:</strong> {item.sku}</p>
              {item.category && <p><strong>Category:</strong> {item.category}</p>}
              {item.location && <p><strong>Location:</strong> {item.location}</p>}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={handleDownload}
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
          >
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-secondary-600 text-white px-4 py-2 rounded hover:bg-secondary-700 transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator; 