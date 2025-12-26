# 🎫 Coupon Verification App

A modern, real-time coupon verification and management system built with React, TypeScript, and Firebase. Features a beautiful Arabic-language interface with an admin dashboard for comprehensive coupon management.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.7.0-orange)
![Vite](https://img.shields.io/badge/Vite-4.3.0-purple)

## ✨ Features

### User Features
- ✅ **Coupon Verification** - Quick and easy coupon code validation
- ✅ **Real-time Validation** - Instant feedback on coupon status
- ✅ **Date Validation** - Automatic checking of coupon validity periods
- ✅ **Beautiful UI** - Modern, responsive design with Arabic language support
- ✅ **Mobile Friendly** - Works seamlessly on all devices

### Admin Dashboard
- 🔐 **Firebase Authentication** - Secure email/password login
- 📊 **Real-time Statistics** - Live updates of coupon metrics
- 📝 **CRUD Operations** - Create, read, update, and delete coupons
- 📤 **Excel Import** - Bulk upload coupons via Excel/CSV files
- 🔍 **Search & Sort** - Advanced filtering and sorting capabilities
- 📈 **Analytics Dashboard** - Track total, used, unused, active, and expired coupons
- 🔄 **Real-time Sync** - Automatic updates when data changes

## 🚀 Tech Stack

- **Frontend**: React 18.2, TypeScript 5.0
- **Build Tool**: Vite 4.3
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **UI**: Tailwind CSS
- **Icons**: Heroicons (SVG)
- **Notifications**: SweetAlert2
- **Excel Processing**: XLSX

## 📋 Prerequisites

- Node.js 16+ and npm
- Firebase account
- Git

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/coupon-app.git
cd coupon-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database** and **Authentication**
3. Get your Firebase configuration from **Project Settings → General → Your apps**

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Admin Configuration
VITE_ADMIN_EMAIL=your_email
```

### 5. Configure Firestore Security Rules

Update your Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /coupons/{couponId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

For detailed setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### 6. Create Admin User

1. Go to Firebase Console → Authentication
2. Enable Email/Password authentication
3. Add a user with the email specified in `VITE_ADMIN_EMAIL`

## 🎯 Usage

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📱 Access Points

### Main App
- **URL**: `http://localhost:5173`
- **Purpose**: Coupon verification for end users

### Admin Dashboard
- **URL**: `http://localhost:5173#admin`
- **Purpose**: Admin panel for managing coupons
- **Authentication**: Email/Password (Firebase Auth)

## 📁 Project Structure

```
coupon-app/
├── src/
│   ├── components/
│   │   ├── admin/              # Admin dashboard components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── StatisticsCards.tsx
│   │   │   ├── CouponsTable.tsx
│   │   │   ├── CouponForm.tsx
│   │   │   ├── ExcelUpload.tsx
│   │   │   ├── adminUtils.tsx
│   │   │   └── excelUtils.ts
│   │   ├── AdminDashboard.tsx  # Main admin component
│   │   └── CouponVerification.tsx
│   ├── config/
│   │   └── firebaseConfig.ts   # Firebase configuration
│   ├── services/
│   │   └── firestoreService.ts # Firestore operations
│   └── utils/
│       └── dateUtils.ts        # Date formatting utilities
├── App.tsx                      # Main app router
├── main.tsx                     # Entry point
├── vite.config.ts              # Vite configuration
├── firebase.json               # Firebase hosting config
└── firestore.rules            # Firestore security rules
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_ADMIN_EMAIL` | Admin email for authentication | Yes |

## 🚀 Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (if not already done):
```bash
firebase init
```

4. Build and deploy:
```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

## 📊 Features in Detail

### Real-time Updates
- Admin dashboard automatically updates when coupons are added, modified, or deleted
- No manual refresh needed
- Multiple admin users see changes instantly

### Excel Import
- Supports `.xlsx`, `.xls`, and `.csv` formats
- Automatic duplicate detection
- Date format conversion (Excel dates → dd/mm/yyyy)
- Header row detection

### Code Splitting
- Admin dashboard loads on-demand (lazy loading)
- Smaller initial bundle size
- Faster page load times
- Separate chunks for vendors

## 🔒 Security

- Firebase Authentication for admin access
- Firestore security rules for data protection
- Environment variables for sensitive configuration
- Input validation and sanitization

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email almuflehi.abdulaziz@gmail.com or open an issue in the repository.

## 🙏 Acknowledgments

- Firebase for backend services
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework

---

Made with ❤️ using React and Firebase