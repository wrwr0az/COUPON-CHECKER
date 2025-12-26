import { useState, useEffect, lazy, Suspense } from 'react';
import CouponVerification from './src/components/CouponVerification';

// Lazy load AdminDashboard to split the bundle
const AdminDashboard = lazy(() => import('./src/components/AdminDashboard'));

/**
 * Main App Component - Handles routing between Coupon Verification and Admin Dashboard
 */
const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user wants to access admin dashboard via URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    // Listen for hash changes
    const handleHashChange = () => {
      setIsAdmin(window.location.hash === '#admin');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleBack = () => {
    setIsAdmin(false);
    // Remove hash and navigate to root
    window.history.pushState(null, '', window.location.pathname);
    window.location.hash = '';
  };

  // Route to admin dashboard or main coupon verification
  if (isAdmin) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      }>
        <AdminDashboard onBack={handleBack} />
      </Suspense>
    );
  }

  return <CouponVerification />;
};

export default App;

