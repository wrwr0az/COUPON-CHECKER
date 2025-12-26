/**
 * Date utility functions for coupon validation
 */

/**
 * Format date string to dd/mm/yyyy format
 */
export const formatToDDMMYYYY = (dateString: string): string => {
  if (!dateString || dateString.trim() === '') {
    return 'غير معروف';
  }
  
  try {
    // Try to parse the date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If parsing fails, try to parse as mm/dd/yyyy
      const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = dateString.trim().match(mmddyyyyPattern);
      if (match) {
        const month = parseInt(match[1], 10);
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
      return dateString; // Return as-is if can't parse
    }
    
    // Format as dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString; // Return as-is if error
  }
};

/**
 * Parse date string from dd/mm/yyyy format (or other formats) to Date object
 */
export const parseDDMMYYYY = (dateString: string): Date => {
  if (!dateString || dateString.trim() === '') {
    throw new Error('تاريخ غير صالح: تاريخ فارغ');
  }
  
  // Check if it's in dd/mm/yyyy format (priority)
  const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.trim().match(ddmmyyyyPattern);
  
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Month is 0-indexed in Date
    const year = parseInt(match[3], 10);
    
    // Validate date
    if (month < 0 || month > 11 || day < 1 || day > 31 || year < 1900 || year > 2100) {
      throw new Error(`تاريخ غير صالح: ${dateString}`);
    }
    
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      throw new Error(`تاريخ غير صالح: ${dateString}`);
    }
    
    return date;
  }
  
  // Try to parse as mm/dd/yyyy format (fallback for old data)
  const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const mmddMatch = dateString.trim().match(mmddyyyyPattern);
  if (mmddMatch) {
    const month = parseInt(mmddMatch[1], 10) - 1;
    const day = parseInt(mmddMatch[2], 10);
    const year = parseInt(mmddMatch[3], 10);
    
    if (month < 0 || month > 11 || day < 1 || day > 31 || year < 1900 || year > 2100) {
      throw new Error(`تاريخ غير صالح: ${dateString}`);
    }
    
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      throw new Error(`تاريخ غير صالح: ${dateString}`);
    }
    
    return date;
  }
  
  // Try to parse as yyyy-mm-dd format
  const yyyymmddPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const match2 = dateString.trim().match(yyyymmddPattern);
  if (match2) {
    const year = parseInt(match2[1], 10);
    const month = parseInt(match2[2], 10) - 1;
    const day = parseInt(match2[3], 10);
    return new Date(year, month, day);
  }
  
  // Fallback to standard Date parsing
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`تاريخ غير صالح: ${dateString}`);
  }
  
  return date;
};

