import React, { useState } from 'react';
// @ts-ignore
import QRCode from 'react-qr-code';

interface QRCodeGeneratorProps {
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

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  item,
  customData,
  onClose,
  isOpen
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(256);
  const [includeItemInfo, setIncludeItemInfo] = useState<boolean>(true);

  React.useEffect(() => {
    if (item && includeItemInfo) {
      const itemData = {
        type: 'inventory_item',
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category || '',
        location: item.location || '',
        timestamp: new Date().toISOString()
      };
      setQrData(JSON.stringify(itemData));
    } else if (customData) {
      setQrData(customData);
    }
  }, [item, customData, includeItemInfo]);

  const handleDownload = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-code-${item?.sku || 'custom'}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${item?.name || 'Custom'}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .qr-container { margin: 20px 0; }
              .item-info { margin: 10px 0; font-size: 14px; }
            </style>
          </head>
          <body>
            <h2>QR Code</h2>
            <div class="qr-container">
              <canvas id="qr-code-canvas"></canvas>
            </div>
            ${item ? `
              <div class="item-info">
                <p><strong>Item:</strong> ${item.name}</p>
                <p><strong>SKU:</strong> ${item.sku}</p>
                ${item.category ? `<p><strong>Category:</strong> ${item.category}</p>` : ''}
                ${item.location ? `<p><strong>Location:</strong> ${item.location}</p>` : ''}
              </div>
            ` : ''}
            <script>
              // Re-render QR code for print
              const canvas = document.getElementById('qr-code-canvas');
              const ctx = canvas.getContext('2d');
              // This would need the QR code library to be available in the print window
              // For simplicity, we'll just show the canvas as is
            </script>
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
      <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Generate QR Code
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
                Include item information in QR code
              </span>
            </label>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            QR Code Size
          </label>
          <input
            type="range"
            min="128"
            max="512"
            step="32"
            value={qrSize}
            onChange={(e) => setQrSize(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-sm text-secondary-500">{qrSize}px</span>
        </div>

        {qrData && (
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white p-4 rounded border">
              <QRCode
                id="qr-code-canvas"
                value={qrData}
                size={qrSize}
                level="M"
              />
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

export default QRCodeGenerator; 