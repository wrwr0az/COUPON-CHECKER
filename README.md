# Coupon Verification App

A React-based coupon verification application with Firebase Firestore backend and admin dashboard.

## Features

- ✅ Verify coupon codes
- ✅ Check coupon validity dates
- ✅ Track used coupons in real-time
- ✅ Firebase Firestore integration
- ✅ Admin dashboard for managing coupons
- ✅ Statistics and analytics
- ✅ Arabic language support

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase Firestore

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Get your Firebase configuration from Project Settings
4. Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_ADMIN_PASSWORD=your_admin_password
   ```

For detailed setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### 3. Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Admin Dashboard

Access the admin dashboard by:
- Clicking "لوحة التحكم" link in the app, or
- Navigating to `http://localhost:5173#admin`

**Features:**
- View all coupons
- Add new coupons
- Edit existing coupons
- Delete coupons
- View statistics (total, used, unused, active, expired)

**Default Password:** `admin123` (or set via `VITE_ADMIN_PASSWORD`)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Notes

- All data is stored in Firebase Firestore
- Real-time updates when coupons are used
- Admin dashboard requires password authentication
- For production, consider using Firebase Authentication for better security

