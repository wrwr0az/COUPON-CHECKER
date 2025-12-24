/**
 * Google Sheets Configuration
 * 
 * To use this app with Google Sheets:
 * 
 * 1. Create a Google Sheet with the following columns (in order):
 *    - code (Coupon Code)
 *    - used (true/false or 1/0)
 *    - usedBy (User name)
 *    - usedDate (Date used)
 *    - note (Optional note)
 *    - validFrom (Start date: YYYY-MM-DD)
 *    - validTo (End date: YYYY-MM-DD)
 * 
 * 2. Make the sheet public (for CSV method) OR get an API key (for API method)
 * 
 * 3. Get your Sheet ID from the URL:
 *    https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
 * 
 * 4. Set the SHEET_ID in your environment variables or update this file
 */

// Get Sheet ID from environment variable or use default
export const GOOGLE_SHEET_ID = '13SMhN1Pk4HAsbG0S0v_QzA42v_5lja0mLyWgor57r7M';

// Get API Key from environment variable (optional, only needed for private sheets)
export const GOOGLE_SHEETS_API_KEY = 'AIzaSyC5GjXDjK1e3mY4n2VXD-hZ_wG4BqFmY9s';

// Sheet name/tab name (default: 'Sheet1')
export const SHEET_NAME = 'Sheet1';

// Sheet GID (tab ID) - get from URL: gid=499860257
// This is more reliable than sheet name for CSV export
export const SHEET_GID = '499860257';

// Use API method instead of CSV (set to true if you have API key)
// API method is more reliable and doesn't have CORS issues
// Set to false to use CSV export (requires public sheet)
export const USE_API_METHOD = false;

// Google Apps Script Web App URL for updating sheets
// Get this URL after deploying your Apps Script (see googleSheets.ts for setup instructions)
// Leave empty if you don't want to update Google Sheets (updates will only be saved locally)
export const GOOGLE_APPS_SCRIPT_URL = (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbySOENoph-w-IwRqhaAfWp51pSZMpMS-YFi5kKiCLR6ztUesIZ04sCqI7Kn7Gy0O-ze/exec';

