import * as XLSX from 'xlsx';
import { type Coupon } from '../../services/firestoreService';

/**
 * Parse Excel file and extract coupons
 */
export const parseExcelFile = (file: File): Promise<Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Try to get Sheet1, otherwise use first sheet
        let sheetName = 'Sheet1';
        if (!workbook.SheetNames.includes('Sheet1')) {
          sheetName = workbook.SheetNames[0];
        }
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          reject(new Error(`Sheet "${sheetName}" not found in the file`));
          return;
        }
        
        // Convert to JSON array format (array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '', // Default value for empty cells
          raw: false // Convert dates to strings
        }) as any[][];
        
        if (!jsonData || jsonData.length === 0) {
          reject(new Error('The file appears to be empty'));
          return;
        }
        
        // Try to detect header row
        let startRow = 0;
        const firstRow = jsonData[0] || [];
        
        // Check if first row looks like headers (contains text like "code", "type", etc.)
        const firstRowLower = firstRow.map((cell: any) => String(cell).toLowerCase().trim());
        const hasHeaderKeywords = firstRowLower.some((cell: string) => 
          ['code', 'type', 'validfrom', 'validto', 'valid_from', 'valid_to', 'from', 'to'].includes(cell)
        );
        
        if (hasHeaderKeywords) {
          startRow = 1; // Skip header row
        }
        
        const coupons: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        
        // Expected columns: code (A/0), type (B/1), validFrom (C/2), validTo (D/3)
        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          // Get values from columns A, B, C, D (indices 0, 1, 2, 3)
          const code = String(row[0] || '').trim().toUpperCase();
          const type = String(row[1] || '').trim();
          const validFrom = String(row[2] || '').trim(); // Column C (index 2)
          const validTo = String(row[3] || '').trim();   // Column D (index 3)
          
          // Skip empty rows (must have at least code and dates)
          if (!code || !validFrom || !validTo) {
            continue;
          }
          
          // Helper function to convert Excel date or string date to dd/mm/yyyy format
          const parseDate = (dateValue: string | number): string => {
            // If it's a number (Excel date serial number)
            if (typeof dateValue === 'number' && dateValue > 25569) {
              // Excel date (days since 1900-01-01)
              const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
              return `${String(excelDate.getDate()).padStart(2, '0')}/${String(excelDate.getMonth() + 1).padStart(2, '0')}/${excelDate.getFullYear()}`;
            }
            
            // If it's a string that looks like a number (Excel date serial as string)
            const numValue = Number(dateValue);
            if (!isNaN(numValue) && numValue > 25569) {
              const excelDate = new Date((numValue - 25569) * 86400 * 1000);
              return `${String(excelDate.getDate()).padStart(2, '0')}/${String(excelDate.getMonth() + 1).padStart(2, '0')}/${excelDate.getFullYear()}`;
            }
            
            // Try to parse as Date object
            const dateObj = new Date(dateValue);
            if (!isNaN(dateObj.getTime())) {
              return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
            }
            
            // If it's already in dd/mm/yyyy format, return as-is
            const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            if (ddmmyyyyPattern.test(String(dateValue).trim())) {
              return String(dateValue).trim();
            }
            
            // If it's in mm/dd/yyyy format, convert to dd/mm/yyyy
            const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            const mmddMatch = String(dateValue).trim().match(mmddyyyyPattern);
            if (mmddMatch) {
              return `${mmddMatch[2]}/${mmddMatch[1]}/${mmddMatch[3]}`;
            }
            
            // Return as-is if it's already in a string format
            return String(dateValue).trim();
          };
          
          const validFromStr = parseDate(validFrom);
          const validToStr = parseDate(validTo);
          
          coupons.push({
            code,
            type: type || '',
            validFrom: validFromStr,
            validTo: validToStr,
            used: false,
            usedBy: '',
            usedDate: '',
            note: '',
          });
        }
        
        if (coupons.length === 0) {
          reject(new Error('No valid coupon data found in the file. Please check that the file contains columns: code, type, validFrom, validTo'));
          return;
        }
        
        resolve(coupons);
      } catch (error: any) {
        console.error('Error parsing Excel file:', error);
        reject(new Error(`Error parsing file: ${error.message || 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

