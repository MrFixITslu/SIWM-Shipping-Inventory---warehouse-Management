import { render, screen, fireEvent } from '@testing-library/react';
import BarcodeManager from '../BarcodeManager';
import { useInventory } from '@/hooks/useInventory';

// Mock the useInventory hook
jest.mock('@/hooks/useInventory', () => ({
  useInventory: jest.fn(),
}));

// Mock the barcode scanner components
jest.mock('../BarcodeScanner', () => {
  return function MockBarcodeScanner({ isOpen, onScan, onClose, title }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="barcode-scanner">
        <h3>{title}</h3>
        <button onClick={() => onScan('TEST123')}>Simulate Scan</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../QRCodeGenerator', () => {
  return function MockQRCodeGenerator({ isOpen, item, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="qr-generator">
        <h3>QR Generator for {item?.name}</h3>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../BarcodeGenerator', () => {
  return function MockBarcodeGenerator({ isOpen, item, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="barcode-generator">
        <h3>Barcode Generator for {item?.name}</h3>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

describe('BarcodeManager', () => {
  const mockInventory = [
    {
      id: 1,
      name: 'Test Item 1',
      sku: 'TEST001',
      category: 'Electronics',
      location: 'A1',
      quantity: 10,
      reorderPoint: 5,
    },
    {
      id: 2,
      name: 'Test Item 2',
      sku: 'TEST002',
      category: 'Tools',
      location: 'B2',
      quantity: 5,
      reorderPoint: 2,
    },
  ];

  beforeEach(() => {
    (useInventory as jest.Mock).mockReturnValue({
      inventory: mockInventory,
    });
  });

  it('renders the barcode manager when open', () => {
    render(<BarcodeManager isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('Barcode & QR Code Manager')).toBeInTheDocument();
    expect(screen.getByText('Scan')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<BarcodeManager isOpen={false} onClose={() => {}} />);
    
    expect(screen.queryByText('Barcode & QR Code Manager')).not.toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    render(<BarcodeManager isOpen={true} onClose={() => {}} />);
    
    // Initially on scan tab
    expect(screen.getByText('Open Scanner')).toBeInTheDocument();
    
    // Switch to generate tab
    fireEvent.click(screen.getByText('Generate'));
    expect(screen.getByPlaceholderText('Search inventory items...')).toBeInTheDocument();
    
    // Switch to history tab
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Scan History')).toBeInTheDocument();
  });

  it('opens scanner when scan button is clicked', () => {
    render(<BarcodeManager isOpen={true} onClose={() => {}} />);
    
    fireEvent.click(screen.getByText('Open Scanner'));
    expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument();
  });

  it('displays inventory items in generate tab', () => {
    render(<BarcodeManager isOpen={true} onClose={() => {}} />);
    
    fireEvent.click(screen.getByText('Generate'));
    
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('SKU: TEST001')).toBeInTheDocument();
    expect(screen.getByText('SKU: TEST002')).toBeInTheDocument();
  });

  it('filters inventory items when searching', () => {
    render(<BarcodeManager isOpen={true} onClose={() => {}} />);
    
    fireEvent.click(screen.getByText('Generate'));
    
    const searchInput = screen.getByPlaceholderText('Search inventory items...');
    fireEvent.change(searchInput, { target: { value: 'Test Item 1' } });
    
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Item 2')).not.toBeInTheDocument();
  });
}); 