# Firebase Firestore Setup Guide

This guide will help you set up Firebase Firestore for your coupon app.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** or select an existing project
3. Follow the setup wizard:
   - Enter project name
   - Enable/disable Google Analytics (optional)
   - Click **Create project**

## Step 2: Create Firestore Database

1. In your Firebase project, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development) or **Start in production mode** (for production)
4. Select a location for your database
5. Click **Enable**

## Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "Coupon App")
5. Copy the Firebase configuration object

## Step 4: Configure Your App

Create a `.env` file in the root directory and add your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Admin Dashboard Password
VITE_ADMIN_PASSWORD=your_secure_password_here
```

Or update `src/config/firebaseConfig.ts` directly with your values.

## Step 5: Set Up Firestore Security Rules

1. Go to **Firestore Database** → **Rules**
2. Update the rules to allow read/write access (for development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to all coupons
    match /coupons/{couponId} {
      allow read: if true;
      // Allow write only for authenticated users or with proper validation
      allow write: if request.auth != null || 
                     request.resource.data.code is string &&
                     request.resource.data.validFrom is string &&
                     request.resource.data.validTo is string;
    }
  }
}
```

**For production**, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /coupons/{couponId} {
      // Allow read for everyone
      allow read: if true;
      // Allow write only for authenticated admin users
      allow write: if request.auth != null && 
                     request.auth.token.admin == true;
    }
  }
}
```

## Step 6: Import Initial Data (Optional)

If you have existing coupons, you can import them:

1. Use the admin dashboard (access via `#admin` in URL) to upload an Excel file
2. Or use Firebase Console to manually add documents to the `coupons` collection

## Step 7: Test the App

1. Start your development server: `npm run dev`
2. Access the main app at `http://localhost:5173`
3. Access admin dashboard at `http://localhost:5173#admin`
4. Default admin password is `admin123` (or set via `VITE_ADMIN_PASSWORD`)

## Firestore Collection Structure

The app uses a collection named `coupons` with the following document structure:

```javascript
{
  code: "TrH0fl",           // String (uppercase)
  used: false,              // Boolean
  usedBy: "",               // String
  usedDate: "",             // String
  note: "",                 // String
  validFrom: "01/01/2025",  // String (mm/dd/yyyy format)
  validTo: "02/10/2025",    // String (mm/dd/yyyy format)
  createdAt: Timestamp,     // Auto-generated
  updatedAt: Timestamp      // Auto-generated
}
```

## Admin Dashboard Features

- **View all coupons** in a table
- **Add new coupons** with form
- **Edit existing coupons**
- **Delete coupons**
- **View statistics**:
  - Total coupons
  - Used coupons
  - Unused coupons
  - Active coupons (not expired)
  - Expired coupons

## Security Notes

- The admin password is stored in environment variables
- For production, consider using Firebase Authentication instead
- Firestore security rules should be properly configured
- Never commit `.env` file to version control

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure you've added your Firebase config to `.env` or `firebaseConfig.ts`

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure rules allow read/write operations

### Admin dashboard not loading
- Check that `AdminDashboard.tsx` is in `src/components/` directory
- Verify the import path in `App.tsx`

