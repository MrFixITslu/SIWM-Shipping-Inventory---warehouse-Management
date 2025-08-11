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
  status: 'success' | 'error' | 'pending' | 'warning';
  error?: string;
}

class SKUGeneratorService {
  private readonly SKU_PREFIXES = {
    'Digicel+': 'DIG+',
    'Digicel Business': 'DIGB',
    'Commercial': 'COM',
    'Marketing': 'MKT',
    'Outside Plant (OSP)': 'OSP',
    'Field Force & HVAC': 'FFH'
  };

  /**
   * Generate SKU for a single item (frontend: only use hash/timestamp, no internet lookup)
   */
  async generateSKU(itemName: string, department: string): Promise<SKUGenerationResult> {
    // Only use hash and timestamp methods in the frontend
    try {
      const hashResult = this.generateFromHash(itemName, department);
      if (hashResult && hashResult.sku) {
        return hashResult;
      }
    } catch (e) {}
    // Fallback to timestamp
    return this.generateFromTimestamp(itemName, department);
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
   * Process Excel file and generate SKUs for all items
   */
  async processExcelInventory(items: ExcelInventoryItem[]): Promise<ProcessedInventoryItem[]> {
    const processedItems: ProcessedInventoryItem[] = [];
    
    for (const item of items) {
      try {
        const skuResult = await this.generateSKU(item.itemName, item.department);
        processedItems.push({
          ...item,
          sku: skuResult.sku || 'update',
          skuSource: skuResult.source,
          status: 'success'
        });
      } catch (error) {
        // If SKU generation fails, still add the item as success with sku = 'update'
        processedItems.push({
          ...item,
          sku: 'update',
          skuSource: 'not found',
          status: 'success'
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