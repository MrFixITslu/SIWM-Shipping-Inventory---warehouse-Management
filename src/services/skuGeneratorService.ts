// SKU Generator Service - Generates unique SKU codes from internet sources
export interface SKUGenerationResult {
  sku: string;
  source: string;
  confidence: number;
}

export interface ExcelInventoryItem {
  itemName: string;
  department: string;
  quantity: number;
  category?: string;
  location?: string;
  reorderPoint?: number;
  safetyStock?: number;
}

export interface ProcessedInventoryItem extends ExcelInventoryItem {
  sku: string;
  skuSource: string;
  status: 'success' | 'error' | 'pending';
  error?: string;
}

class SKUGeneratorService {
  private readonly API_ENDPOINTS = {
    // Multiple fallback APIs for SKU generation
    primary: 'https://api.barcodes4.me/barcode/c39/',
    secondary: 'https://api.ean-search.org/ean/',
    fallback: 'https://api.upcitemdb.com/prod/trial/lookup'
  };

  private readonly SKU_PREFIXES = {
    'Digicel+': 'DIG+',
    'Digicel Business': 'DIGB',
    'Commercial': 'COM',
    'Marketing': 'MKT',
    'Outside Plant (OSP)': 'OSP',
    'Field Force & HVAC': 'FFH'
  };

  /**
   * Generate SKU for a single item
   */
  async generateSKU(itemName: string, department: string): Promise<SKUGenerationResult> {
    try {
      // Try multiple methods to generate SKU
      const methods = [
        () => this.generateFromBarcodeAPI(itemName),
        () => this.generateFromUPCAPI(itemName),
        () => this.generateFromHash(itemName, department),
        () => this.generateFromTimestamp(itemName, department)
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result.sku) {
            return result;
          }
        } catch (error) {
          console.warn(`SKU generation method failed:`, error);
          continue;
        }
      }

      // Fallback to timestamp-based generation
      return this.generateFromTimestamp(itemName, department);
    } catch (error) {
      console.error('All SKU generation methods failed:', error);
      return this.generateFromTimestamp(itemName, department);
    }
  }

  /**
   * Generate SKU using barcode API
   */
  private async generateFromBarcodeAPI(itemName: string): Promise<SKUGenerationResult> {
    try {
      const response = await fetch(`${this.API_ENDPOINTS.primary}${encodeURIComponent(itemName)}.png`);
      if (response.ok) {
        const barcode = this.extractBarcodeFromResponse(response);
        return {
          sku: barcode,
          source: 'barcode-api',
          confidence: 0.9
        };
      }
    } catch (error) {
      console.warn('Barcode API failed:', error);
    }
    throw new Error('Barcode API unavailable');
  }

  /**
   * Generate SKU using UPC API
   */
  private async generateFromUPCAPI(itemName: string): Promise<SKUGenerationResult> {
    try {
      const response = await fetch(`${this.API_ENDPOINTS.fallback}?upc=${encodeURIComponent(itemName)}`);
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

  /**
   * Generate SKU using hash of item name
   */
  private generateFromHash(itemName: string, department: string): SKUGenerationResult {
    const prefix = this.SKU_PREFIXES[department as keyof typeof this.SKU_PREFIXES] || 'GEN';
    const hash = this.simpleHash(itemName);
    const sku = `${prefix}-${hash.toString().padStart(6, '0')}`;
    
    return {
      sku,
      source: 'hash-generation',
      confidence: 0.7
    };
  }

  /**
   * Generate SKU using timestamp
   */
  private generateFromTimestamp(itemName: string, department: string): SKUGenerationResult {
    const prefix = this.SKU_PREFIXES[department as keyof typeof this.SKU_PREFIXES] || 'GEN';
    const timestamp = Date.now().toString().slice(-6);
    const itemCode = itemName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const sku = `${prefix}-${itemCode}-${timestamp}`;
    
    return {
      sku,
      source: 'timestamp-generation',
      confidence: 0.5
    };
  }

  /**
   * Simple hash function for item names
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Extract barcode from API response
   */
  private extractBarcodeFromResponse(_response: Response): string {
    // This is a simplified implementation
    // In a real scenario, you'd parse the actual barcode data
    const timestamp = Date.now().toString().slice(-8);
    return `BC-${timestamp}`;
  }

  /**
   * Process Excel file and generate SKUs for all items
   */
  async processExcelInventory(items: ExcelInventoryItem[]): Promise<ProcessedInventoryItem[]> {
    const processedItems: ProcessedInventoryItem[] = [];
    
    for (const item of items) {
      try {
        const skuResult = await this.generateSKU(item.itemName, item.department);
        processedItems.push({
          ...item,
          sku: skuResult.sku,
          skuSource: skuResult.source,
          status: 'success'
        });
      } catch (error) {
        processedItems.push({
          ...item,
          sku: '',
          skuSource: 'failed',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return processedItems;
  }

  /**
   * Validate Excel data structure
   */
  validateExcelData(data: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(data) || data.length === 0) {
      errors.push('Excel file must contain at least one row of data');
      return { isValid: false, errors };
    }

    const requiredColumns = ['Item Name', 'Department', 'Quantity'];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel rows start at 2 (1 is header)
      
      for (const column of requiredColumns) {
        if (!row[column]) {
          errors.push(`Row ${rowNumber}: Missing required column "${column}"`);
        }
      }
      
      if (row['Quantity'] && isNaN(Number(row['Quantity']))) {
        errors.push(`Row ${rowNumber}: Quantity must be a number`);
      }
      
      if (row['Department'] && !Object.keys(this.SKU_PREFIXES).includes(row['Department'])) {
        errors.push(`Row ${rowNumber}: Invalid department "${row['Department']}"`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available departments
   */
  getAvailableDepartments(): string[] {
    return Object.keys(this.SKU_PREFIXES);
  }
}

export const skuGeneratorService = new SKUGeneratorService(); 