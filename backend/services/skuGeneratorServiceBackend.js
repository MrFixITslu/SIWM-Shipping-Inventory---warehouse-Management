// backend/services/skuGeneratorServiceBackend.js

const SKU_PREFIXES = {
  'Digicel+': 'DIG+',
  'Digicel Business': 'DIGB',
  'Commercial': 'COM',
  'Marketing': 'MKT',
  'Outside Plant (OSP)': 'OSP',
  'Field Force & HVAC': 'FFH'
};

const fetch = require('node-fetch');

const API_ENDPOINTS = {
  primary: 'https://api.barcodes4.me/barcode/c39/',
  secondary: 'https://api.ean-search.org/ean/',
  fallback: 'https://api.upcitemdb.com/prod/trial/lookup'
};

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function generateFromHash(itemName, department) {
  const prefix = SKU_PREFIXES[department] || 'GEN';
  const hash = simpleHash(itemName);
  const sku = `${prefix}-${hash.toString().padStart(6, '0')}`;
  return {
    sku,
    source: 'hash-generation',
    confidence: 0.7
  };
}

function generateFromTimestamp(itemName, department) {
  const prefix = SKU_PREFIXES[department] || 'GEN';
  const timestamp = Date.now().toString().slice(-6);
  const itemCode = itemName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const sku = `${prefix}-${itemCode}-${timestamp}`;
  return {
    sku,
    source: 'timestamp-generation',
    confidence: 0.5
  };
}

async function generateFromBarcodeAPI(itemName) {
  try {
    const response = await fetch(`${API_ENDPOINTS.primary}${encodeURIComponent(itemName)}.png`);
    if (response.ok) {
      // Simulate barcode extraction (real API would need parsing)
      const timestamp = Date.now().toString().slice(-8);
      return {
        sku: `BC-${timestamp}`,
        source: 'barcode-api',
        confidence: 0.9
      };
    }
  } catch (error) {
    console.warn('Barcode API failed:', error);
  }
  throw new Error('Barcode API unavailable');
}

async function generateFromUPCAPI(itemName) {
  try {
    const response = await fetch(`${API_ENDPOINTS.fallback}?upc=${encodeURIComponent(itemName)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const upc = data.items[0].ean || data.items[0].upc;
        return {
          sku: upc,
          source: 'upc-api',
          confidence: 0.8
        };
      }
    }
  } catch (error) {
    console.warn('UPC API failed:', error);
  }
  throw new Error('UPC API unavailable');
}

async function generateSKU(itemName, department) {
  // Try barcode API first
  try {
    const barcodeResult = await generateFromBarcodeAPI(itemName);
    if (barcodeResult && barcodeResult.sku) return barcodeResult;
  } catch (e) {}
  // Try UPC API next
  try {
    const upcResult = await generateFromUPCAPI(itemName);
    if (upcResult && upcResult.sku) return upcResult;
  } catch (e) {}
  // Fallback to hash/timestamp
  try {
    const hashResult = generateFromHash(itemName, department);
    if (hashResult && hashResult.sku) return hashResult;
  } catch (e) {}
  return generateFromTimestamp(itemName, department);
}

module.exports = {
  generateSKU
}; 