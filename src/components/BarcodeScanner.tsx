import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  isOpen: boolean;
  title?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  onClose,
  isOpen,
  title = 'Scan Barcode/QR Code'
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    } else if (!isOpen && isScanning) {
      stopScanner();
    }
  }, [isOpen, isScanning]);

  const startScanner = () => {
    if (!containerRef.current) return;

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "barcode-scanner",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current.render(
        (decodedText: string) => {
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage: string) => {
          // Ignore errors during scanning, only show critical errors
          if (errorMessage.includes('NotFound') || errorMessage.includes('No QR code found')) {
            return;
          }
          setError(errorMessage);
          onError?.(errorMessage);
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start scanner');
      onError?.(err.message || 'Failed to start scanner');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            {title}
          </h3>
          <button
            onClick={handleClose}
            className="text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div 
          ref={containerRef}
          id="barcode-scanner"
          className="w-full"
        />

        <div className="mt-4 text-sm text-secondary-600 dark:text-secondary-400 text-center">
          Position the barcode or QR code within the scanning area
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 