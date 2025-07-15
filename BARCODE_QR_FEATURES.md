# Barcode & QR Code Features

This document describes the barcode and QR code functionality that has been added to the inventory management system.

## Overview

The system now includes comprehensive barcode and QR code support for:
- **Scanning**: Scan barcodes and QR codes using device cameras
- **Generation**: Generate QR codes and barcodes for inventory items
- **Integration**: Seamless integration with inventory management and receiving processes

## Features

### 1. Barcode/QR Code Scanner

**Location**: Inventory Management Page → "Barcode/QR" button

**Capabilities**:
- Scan barcodes and QR codes using device camera
- Automatic inventory lookup for scanned codes
- Support for various barcode formats (Code 128, Code 39, EAN-13, etc.)
- QR code scanning with JSON data parsing

**Usage**:
1. Click the "Barcode/QR" button on the Inventory Management page
2. Select the "Scan" tab
3. Click "Open Scanner" to activate the camera
4. Position the barcode or QR code within the scanning area
5. The system will automatically look up the item in inventory

### 2. QR Code Generator

**Features**:
- Generate QR codes for individual inventory items
- Include item information (name, SKU, category, location) in QR code
- Customizable QR code size (128px to 512px)
- Download QR codes as PNG images
- Print QR codes with item information

**Usage**:
1. Open the Barcode Manager
2. Go to the "Generate" tab
3. Search for an inventory item
4. Click "QR Code" button
5. Customize settings and download/print

### 3. Barcode Generator

**Features**:
- Generate various barcode types:
  - Code 128 (most common)
  - Code 39
  - EAN-13
  - EAN-8
  - UPC
  - ITF-14
  - MSI
  - Pharmacode
- Customizable width and height
- Use item SKU as barcode data
- Download and print functionality

**Usage**:
1. Open the Barcode Manager
2. Go to the "Generate" tab
3. Search for an inventory item
4. Click "Barcode" button
5. Select barcode type and customize settings

### 4. Receiving Integration

**Location**: Incoming Shipments → Receive Items

**Features**:
- Scan serial numbers during receiving process
- Automatic quantity calculation based on scanned serials
- Integration with existing serial number management
- Support for both manual entry and scanning

**Usage**:
1. Open a shipment for receiving
2. For serialized items, click the "Scan" button next to serial numbers
3. Scan each serial number
4. Quantities are automatically updated

## Technical Implementation

### Dependencies Added

```json
{
  "react-qr-reader": "^3.0.0-beta-1",
  "qrcode.react": "^3.1.0",
  "jsbarcode": "^3.11.5",
  "html5-qrcode": "^2.3.8"
}
```

### Components Created

1. **BarcodeScanner.tsx**
   - Camera-based barcode/QR code scanner
   - Uses html5-qrcode library
   - Modal interface with error handling

2. **QRCodeGenerator.tsx**
   - QR code generation with item data
   - Download and print functionality
   - Customizable size and settings

3. **BarcodeGenerator.tsx**
   - Multiple barcode format support
   - Customizable dimensions
   - Download and print functionality

4. **BarcodeManager.tsx**
   - Main interface combining all features
   - Tabbed interface (Scan, Generate, History)
   - Inventory integration

### Integration Points

1. **Inventory Management Page**
   - Added "Barcode/QR" button next to "Add Item"
   - Integrated BarcodeManager modal

2. **Receiving Modal**
   - Added scan functionality for serial numbers
   - Integrated BarcodeScanner for receiving process

## Data Format

### QR Code Data Structure

QR codes contain JSON data with the following structure:

```json
{
  "type": "inventory_item",
  "id": 123,
  "name": "Item Name",
  "sku": "ITEM001",
  "category": "Electronics",
  "location": "A1",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Barcode Data

- **Code 128**: Item SKU (e.g., "ITEM001")
- **Code 39**: Item SKU with asterisk delimiters (e.g., "*ITEM001*")
- **EAN-13**: 13-digit product code
- **UPC**: 12-digit universal product code

## Browser Compatibility

### Camera Access
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

### Requirements
- HTTPS connection (required for camera access)
- User permission for camera access
- Modern browser with WebRTC support

## Security Considerations

1. **Camera Permissions**: Users must grant camera access
2. **Data Privacy**: Scanned data is processed locally
3. **HTTPS Required**: Camera access requires secure connection
4. **User Consent**: Clear indication when camera is active

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure HTTPS connection
   - Check browser permissions
   - Try refreshing the page

2. **Scanner not detecting codes**
   - Ensure good lighting
   - Hold device steady
   - Check code quality and format

3. **QR codes not generating**
   - Check item data completeness
   - Verify browser compatibility
   - Clear browser cache

### Error Messages

- "Failed to start scanner": Camera access denied or unavailable
- "No QR code found": No valid code detected in camera view
- "Invalid barcode format": Unsupported barcode type

## Future Enhancements

1. **Batch Operations**: Generate multiple codes at once
2. **Custom Formats**: User-defined QR code data structures
3. **Mobile Optimization**: Enhanced mobile scanning experience
4. **Offline Support**: Local code generation without internet
5. **Analytics**: Track scanning and generation usage
6. **Integration**: Connect with external barcode systems

## Support

For technical support or feature requests related to barcode/QR code functionality, please refer to the development team or create an issue in the project repository. 