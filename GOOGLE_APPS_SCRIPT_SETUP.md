# Google Apps Script Setup for Updating Sheets

This guide will help you set up Google Apps Script to update your Google Sheet when coupons are used.

## Step 1: Open Apps Script

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. A new tab will open with the Apps Script editor

## Step 2: Paste the Code

Delete any existing code and paste this:

```javascript
// Handle GET requests (for testing/debugging)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'ok', 
    message: 'Google Apps Script is running. Use POST to update coupons.',
    method: 'GET'
  }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests (for updating coupons)
function doPost(e) {
  try {
    // Parse data - support both JSON and form data
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (e) {
        // Try form data from POST body
        data = {
          action: e.parameter.action,
          sheetId: e.parameter.sheetId,
          rowIndex: parseInt(e.parameter.rowIndex),
          couponCode: e.parameter.couponCode,
          updates: JSON.parse(e.parameter.updates || '{}')
        };
      }
    } else {
      // Form data from URL parameters
      data = {
        action: e.parameter.action,
        sheetId: e.parameter.sheetId,
        rowIndex: parseInt(e.parameter.rowIndex),
        couponCode: e.parameter.couponCode,
        updates: JSON.parse(e.parameter.updates || '{}')
      };
    }
    
    if (!data.sheetId || !data.action) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters: sheetId and action are required' 
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheetId = data.sheetId;
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getActiveSheet();
    
    if (data.action === 'updateCoupon') {
      const rowIndex = data.rowIndex;
      const updates = data.updates;
      
      if (!rowIndex || rowIndex < 2) {
        return ContentService.createTextOutput(JSON.stringify({ 
          success: false, 
          error: 'Invalid rowIndex. Must be >= 2' 
        }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Update columns: B=used, C=usedBy, D=usedDate, E=note
      if (updates.used !== undefined) {
        const usedValue = updates.used === 'true' || updates.used === true || updates.used === 'TRUE';
        sheet.getRange(rowIndex, 2).setValue(usedValue);
      }
      if (updates.usedBy !== undefined) {
        sheet.getRange(rowIndex, 3).setValue(updates.usedBy);
      }
      if (updates.usedDate !== undefined) {
        sheet.getRange(rowIndex, 4).setValue(updates.usedDate);
      }
      if (updates.note !== undefined) {
        sheet.getRange(rowIndex, 5).setValue(updates.note);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true,
        message: 'Coupon updated successfully',
        rowIndex: rowIndex
      }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: 'Unknown action: ' + data.action 
    }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString(),
      stack: error.stack
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Step 3: Save the Script

1. Click **Save** (or press Ctrl+S / Cmd+S)
2. Give your project a name (e.g., "Coupon Updater")

## Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Coupon Updater Web App" (optional)
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone** (this allows your app to call it)
4. Click **Deploy**
5. **Authorize access** when prompted:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)" if you see a warning
   - Click "Allow" to grant permissions
6. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

## Step 5: Configure Your App

Add the Web App URL to your app configuration:

### Option A: Using Environment Variable (Recommended)

Create or update your `.env` file:

```env
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Option B: Direct Configuration

Update `src/config/sheetsConfig.ts`:

```typescript
export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

## Step 6: Test

1. Restart your development server
2. Try using a coupon in your app
3. Check your Google Sheet - the "used" column should change from `FALSE` to `TRUE`
4. Check the browser console for any errors

## Troubleshooting

### "Failed to update Google Sheet" Error

- Make sure the Web App URL is correct
- Verify the deployment settings (Execute as: Me, Who has access: Anyone)
- Check that you authorized the script when deploying
- Look at the Apps Script execution log (View → Executions)

### Updates Not Appearing

- The app will continue to work even if Google Sheet update fails (updates are saved locally)
- Check the browser console for error messages
- Verify the row index is correct (should match the row number in your sheet)

### Permission Errors

- Make sure "Who has access" is set to "Anyone" (not "Only myself")
- Re-deploy the script if you changed permissions

## Notes

- The app will work even without Google Apps Script (updates will only be saved in localStorage)
- Google Apps Script has daily execution limits (free tier: 20,000 requests/day)
- The script updates columns: B (used), C (usedBy), D (usedDate), E (note)

