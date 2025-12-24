# Google Sheets Setup Guide

This guide will help you connect your coupon app to Google Sheets.

## Quick Start (CSV Method - Recommended for Beginners)

### Step 1: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name the first sheet tab (e.g., "Coupons")

### Step 2: Set Up Your Sheet Structure

Create the following columns in the first row (headers):

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| code | used | usedBy | usedDate | note | validFrom | validTo |

**Example data row:**
| TrH0fl | false | | | | 2026-01-01 | 2026-02-10 |

### Step 3: Make Your Sheet Public

1. Click **Share** button (top right)
2. Click **Change to anyone with the link**
3. Set permission to **Viewer**
4. Click **Done**

### Step 4: Get Your Sheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit#gid=0
```

Copy the part between `/d/` and `/edit` - that's your Sheet ID.

### Step 5: Configure the App

1. Create a `.env` file in the root directory of your project
2. Add the following:

```env
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
VITE_SHEET_NAME=Sheet1
VITE_USE_API_METHOD=false
```

Replace `your_sheet_id_here` with your actual Sheet ID, and `Sheet1` with your sheet tab name if different.

### Step 6: Restart the App

Stop the dev server (Ctrl+C) and restart it:

```bash
npm run dev
```

That's it! Your app should now load data from Google Sheets.

---

## Advanced Setup (API Method - For Private Sheets)

If you want to keep your sheet private or need more control:

### Step 1: Get Google Sheets API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

### Step 2: Configure the App

Update your `.env` file:

```env
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_SHEET_NAME=Sheet1
VITE_USE_API_METHOD=true
```

### Step 3: Restart the App

```bash
npm run dev
```

---

## Troubleshooting

### "Failed to fetch data" Error

- **CSV Method**: Make sure your sheet is public (anyone with link can view)
- **API Method**: Check that your API key is correct and Google Sheets API is enabled

### Data Not Loading

- Verify your Sheet ID is correct
- Check that your sheet name matches `VITE_SHEET_NAME`
- Ensure your data starts from row 2 (row 1 should be headers)
- Check browser console for detailed error messages

### Wrong Data Format

Make sure your columns are in this exact order:
1. code
2. used (true/false or 1/0)
3. usedBy
4. usedDate
5. note
6. validFrom (YYYY-MM-DD format)
7. validTo (YYYY-MM-DD format)

---

## Notes

- The app will fall back to `coupons.json` if Google Sheets is not configured or fails to load
- Used coupons are still tracked in localStorage (browser storage)
- To update coupons in Google Sheets, you'll need to implement a backend service or use Google Apps Script

