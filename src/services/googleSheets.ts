interface Coupon {
  code: string;
  used: boolean;
  usedBy: string;
  usedDate: string;
  note: string;
  validFrom: string;
  validTo: string;
}

/**
 * Fetch coupons from Google Sheets using public CSV export
 * This is the simplest method - no authentication required
 * 
 * @param sheetId - The Google Sheet ID from the URL
 * @param sheetName - The name of the sheet tab (default: 'Sheet1')
 * @returns Promise<Coupon[]>
 */
export async function fetchCouponsFromGoogleSheets(
  sheetId: string = '13SMhN1Pk4HAsbG0S0v_QzA42v_5lja0mLyWgor57r7M',
  sheetName: string = 'Sheet1',
  gid?: string
): Promise<Coupon[]> {
  try {
    // Use gid if provided (more reliable than sheet name), otherwise use sheet name
    const sheetParam = gid ? `gid=${gid}` : `sheet=${encodeURIComponent(sheetName)}`;
    
    // Try multiple CSV export URL formats
    const csvUrls = [
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&${sheetParam}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&${sheetParam}`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`,
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`
    ];

    let lastError: Error | null = null;
    
    for (const csvUrl of csvUrls) {
      try {
        console.log('Trying CSV URL:', csvUrl);
        
        // Try with CORS first
        let response: Response;
        try {
          response = await fetch(csvUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
          });
        } catch (corsError) {
          // If CORS fails, try without mode (some browsers handle this differently)
          console.warn('CORS error, trying without mode:', corsError);
          response = await fetch(csvUrl, {
            method: 'GET',
            cache: 'no-cache',
          });
        }
        
        console.log('Response status:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText.substring(0, 200)}`);
        }
        
        const csvText = await response.text();
        console.log('CSV text received, length:', csvText.length);
        console.log('CSV preview (first 500 chars):', csvText.substring(0, 500));
        
        if (!csvText || csvText.trim().length === 0) {
          throw new Error('Empty response from Google Sheets');
        }
        
        const coupons = parseCSVToCoupons(csvText);
        console.log('Parsed coupons:', coupons.length, coupons);
        return coupons;
      } catch (err) {
        console.warn('Failed with URL:', csvUrl, err);
        lastError = err as Error;
        // Try next URL
        continue;
      }
    }
    
    // If all URLs failed, throw the last error
    throw lastError || new Error('All CSV export methods failed');
  } catch (error) {
    console.error('Error fetching from Google Sheets CSV:', error);
    throw error;
  }
}

/**
 * Fetch coupons using Google Sheets API v4
 * Requires API key (for public sheets) or OAuth (for private sheets)
 * 
 * @param sheetId - The Google Sheet ID from the URL
 * @param range - The range to read (e.g., 'Sheet1!A1:G100')
 * @param apiKey - Google Sheets API key (optional for public sheets)
 * @returns Promise<Coupon[]>
 */
export async function fetchCouponsFromGoogleSheetsAPI(
  sheetId: string,
  range: string = 'Sheet1!A1:G1000',
  apiKey?: string
): Promise<Coupon[]> {
  try {
    if (!apiKey) {
      throw new Error('API key is required for Google Sheets API method');
    }
    
    const encodedRange = encodeURIComponent(range);
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}?key=${apiKey}`;
    
    console.log('Fetching from Google Sheets API:', apiUrl.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });
    
    console.log('API Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Data received:', data);
    
    if (!data.values || !Array.isArray(data.values)) {
      throw new Error('Invalid response format from Google Sheets API');
    }
    
    return parseSheetDataToCoupons(data.values);
  } catch (error) {
    console.error('Error fetching from Google Sheets API:', error);
    throw error;
  }
}

/**
 * Parse CSV text to Coupon array
 * Handles quoted values and proper CSV parsing
 */
function parseCSVToCoupons(csvText: string): Coupon[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.warn('CSV text is empty');
    return [];
  }
  
  // Skip header row if it exists
  const dataLines = lines.slice(1);
  
  return dataLines.map((line, index) => {
    try {
      // Better CSV parsing that handles quoted values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      // Add the last value
      values.push(current.trim());
      
      // Remove quotes from values
      const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));
      
      // Expected columns: code, used, usedBy, usedDate, note, validFrom, validTo
      return {
        code: cleanValues[0] || '',
        used: cleanValues[1]?.toLowerCase() === 'true' || cleanValues[1] === 'TRUE' || cleanValues[1] === '1' || false,
        usedBy: cleanValues[2] || '',
        usedDate: cleanValues[3] || '',
        note: cleanValues[4] || '',
        validFrom: cleanValues[5] || '',
        validTo: cleanValues[6] || '',
      };
    } catch (error) {
      console.error(`Error parsing CSV line ${index + 2}:`, line, error);
      return null;
    }
  }).filter((coupon): coupon is Coupon => coupon !== null && coupon.code !== ''); // Filter out null and empty rows
}

/**
 * Parse Google Sheets API response to Coupon array
 */
function parseSheetDataToCoupons(rows: string[][]): Coupon[] {
  if (!rows || rows.length === 0) return [];
  
  // Skip header row
  const dataRows = rows.slice(1);
  
  return dataRows.map((row) => {
    // Expected columns: code, used, usedBy, usedDate, note, validFrom, validTo
    return {
      code: row[0] || '',
      used: row[1]?.toLowerCase() === 'true' || row[1] === '1' || false,
      usedBy: row[2] || '',
      usedDate: row[3] || '',
      note: row[4] || '',
      validFrom: row[5] || '',
      validTo: row[6] || '',
    };
  }).filter(coupon => coupon.code); // Filter out empty rows
}

/**
 * Update coupon in Google Sheets using Google Apps Script Web App
 * 
 * To set up:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste the Apps Script code (see function below)
 * 4. Deploy as web app (Execute as: Me, Who has access: Anyone)
 * 5. Copy the web app URL and set it in sheetsConfig.ts as GOOGLE_APPS_SCRIPT_URL
 * 
 * @param sheetId - The Google Sheet ID
 * @param couponCode - The coupon code to update
 * @param rowIndex - The row number (1-based, including header)
 * @param updates - The fields to update
 * @param appsScriptUrl - The Google Apps Script web app URL (optional)
 */
export async function updateCouponInGoogleSheets(
  sheetId: string,
  couponCode: string,
  rowIndex: number,
  updates: Partial<Coupon>,
  appsScriptUrl?: string
): Promise<boolean> {
  try {
    // If no Apps Script URL is provided, try to use the one from config
    if (!appsScriptUrl) {
      console.warn('No Google Apps Script URL provided. Update will only be saved locally.');
      return false;
    }

    console.log('Updating coupon in Google Sheets:', { sheetId, couponCode, rowIndex, updates });

    // Prepare update data
    const updateData = {
      action: 'updateCoupon',
      sheetId: sheetId,
      rowIndex: rowIndex,
      couponCode: couponCode,
      updates: {
        used: updates.used !== undefined ? String(updates.used) : undefined,
        usedBy: updates.usedBy || '',
        usedDate: updates.usedDate || '',
        note: updates.note || '',
      },
    };

    // Try with form data first (works better with Google Apps Script)
    const formData = new URLSearchParams();
    formData.append('action', updateData.action);
    formData.append('sheetId', updateData.sheetId);
    formData.append('rowIndex', String(updateData.rowIndex));
    formData.append('couponCode', updateData.couponCode);
    formData.append('updates', JSON.stringify(updateData.updates));

    try {
      // Use fetch with form data
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Google Sheet updated successfully:', result);
        return result.success === true;
      } else {
        const errorText = await response.text();
        console.error('Failed to update Google Sheet:', errorText);
        return false;
      }
    } catch (error) {
      console.warn('CORS error, trying alternative method:', error);
      
      // Fallback: Use hidden form submission (works around CORS)
      try {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = appsScriptUrl;
        form.target = '_blank';
        form.style.display = 'none';
        
        Object.entries(updateData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = typeof value === 'object' ? JSON.stringify(value) : String(value);
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        
        // Remove form after a short delay
        setTimeout(() => {
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
        }, 1000);
        
        console.log('Update request sent via form submission (CORS workaround)');
        // Assume success since we can't verify with form submission
        return true;
      } catch (formError) {
        console.error('Form submission also failed:', formError);
        return false;
      }
    }
  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    return false;
  }
}

/**
 * Google Apps Script code to paste in your sheet:
 * 
 * // Handle GET requests (for testing/debugging)
 * function doGet(e) {
 *   return ContentService.createTextOutput(JSON.stringify({ 
 *     status: 'ok', 
 *     message: 'Google Apps Script is running. Use POST to update coupons.',
 *     method: 'GET'
 *   }))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * // Handle POST requests (for updating coupons)
 * function doPost(e) {
 *   try {
 *     // Parse data - support both JSON and form data
 *     let data;
 *     if (e.postData && e.postData.contents) {
 *       try {
 *         data = JSON.parse(e.postData.contents);
 *       } catch (e) {
 *         // Try form data from POST body
 *         data = {
 *           action: e.parameter.action,
 *           sheetId: e.parameter.sheetId,
 *           rowIndex: parseInt(e.parameter.rowIndex),
 *           couponCode: e.parameter.couponCode,
 *           updates: JSON.parse(e.parameter.updates || '{}')
 *         };
 *       }
 *     } else {
 *       // Form data from URL parameters
 *       data = {
 *         action: e.parameter.action,
 *         sheetId: e.parameter.sheetId,
 *         rowIndex: parseInt(e.parameter.rowIndex),
 *         couponCode: e.parameter.couponCode,
 *         updates: JSON.parse(e.parameter.updates || '{}')
 *       };
 *     }
 *     
 *     if (!data.sheetId || !data.action) {
 *       return ContentService.createTextOutput(JSON.stringify({ 
 *         success: false, 
 *         error: 'Missing required parameters: sheetId and action are required' 
 *       }))
 *         .setMimeType(ContentService.MimeType.JSON);
 *     }
 *     
 *     const sheetId = data.sheetId;
 *     const ss = SpreadsheetApp.openById(sheetId);
 *     const sheet = ss.getActiveSheet();
 *     
 *     if (data.action === 'updateCoupon') {
 *       const rowIndex = data.rowIndex;
 *       const updates = data.updates;
 *       
 *       if (!rowIndex || rowIndex < 2) {
 *         return ContentService.createTextOutput(JSON.stringify({ 
 *           success: false, 
 *           error: 'Invalid rowIndex. Must be >= 2' 
 *         }))
 *           .setMimeType(ContentService.MimeType.JSON);
 *       }
 *       
 *       // Update columns: B=used, C=usedBy, D=usedDate, E=note
 *       if (updates.used !== undefined) {
 *         const usedValue = updates.used === 'true' || updates.used === true || updates.used === 'TRUE';
 *         sheet.getRange(rowIndex, 2).setValue(usedValue);
 *       }
 *       if (updates.usedBy !== undefined) {
 *         sheet.getRange(rowIndex, 3).setValue(updates.usedBy);
 *       }
 *       if (updates.usedDate !== undefined) {
 *         sheet.getRange(rowIndex, 4).setValue(updates.usedDate);
 *       }
 *       if (updates.note !== undefined) {
 *         sheet.getRange(rowIndex, 5).setValue(updates.note);
 *       }
 *       
 *       return ContentService.createTextOutput(JSON.stringify({ 
 *         success: true,
 *         message: 'Coupon updated successfully',
 *         rowIndex: rowIndex
 *       }))
 *         .setMimeType(ContentService.MimeType.JSON);
 *     }
 *     
 *     return ContentService.createTextOutput(JSON.stringify({ 
 *       success: false, 
 *       error: 'Unknown action: ' + data.action 
 *     }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   } catch (error) {
 *     return ContentService.createTextOutput(JSON.stringify({ 
 *       success: false, 
 *       error: error.toString(),
 *       stack: error.stack
 *     }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 */

