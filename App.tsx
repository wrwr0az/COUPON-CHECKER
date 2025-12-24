import React, { useState, useEffect } from 'react';
import { fetchCouponByCode, markCouponAsUsed } from './src/services/firestoreService';
import AdminDashboard from './src/components/AdminDashboard';

const App = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user wants to access admin dashboard
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#admin') {
      setIsAdmin(true);
    }
  }, []);

  // Helper function to format date to dd/mm/yyyy
  const formatToDDMMYYYY = (dateString: string): string => {
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

  // Helper function to parse dd/mm/yyyy format (or other formats)
  const parseDDMMYYYY = (dateString: string): Date => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const couponCode = code.trim().toUpperCase();
      
      if (!couponCode) {
        setResult({
          success: false,
          message: 'يرجى إدخال رمز الكوبون',
        });
        setLoading(false);
        return;
      }
      
      // Step 1: Get coupon where code equals the entered code
      const coupon = await fetchCouponByCode(couponCode);

      // Check if coupon exists
      if (!coupon) {
        setResult({
          success: false,
          message: 'الكوبون غير موجود. يرجى التحقق من الرمز وإعادة المحاولة.',
        });
        setLoading(false);
        return;
      }

      // Step 2: Check if coupon is already used
      if (coupon.used) {
        const formattedDate = formatToDDMMYYYY(coupon.usedDate || '');
        setResult({
          success: false,
          message: `هذا الكوبون مستخدم بالفعل بواسطة: ${coupon.usedBy || 'غير معروف'} في تاريخ: ${formattedDate}`,
        });
        setLoading(false);
        return;
      }

      // Step 3: Check validFrom and validTo dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!coupon.validFrom || !coupon.validTo) {
        setResult({
          success: false,
          message: 'تاريخ الصلاحية غير محدد في بيانات الكوبون',
        });
        setLoading(false);
        return;
      }
      
        const validFrom = parseDDMMYYYY(coupon.validFrom);
        validFrom.setHours(0, 0, 0, 0);
        const validTo = parseDDMMYYYY(coupon.validTo);
        validTo.setHours(23, 59, 59, 999);

      // Check if coupon is not yet valid
      if (today < validFrom) {
        const day = String(validFrom.getDate()).padStart(2, '0');
        const month = String(validFrom.getMonth() + 1).padStart(2, '0');
        const year = validFrom.getFullYear();
        const fromDate = `${day}/${month}/${year}`;
        setResult({
          success: false,
          message: `الكوبون غير صالح بعد. تاريخ بدء الصلاحية: ${fromDate}`,
        });
        setLoading(false);
        return;
      }

      // Check if coupon has expired
      if (today > validTo) {
        const day = String(validTo.getDate()).padStart(2, '0');
        const month = String(validTo.getMonth() + 1).padStart(2, '0');
        const year = validTo.getFullYear();
        const toDate = `${day}/${month}/${year}`;
        setResult({
          success: false,
          message: `الكوبون منتهي الصلاحية. تاريخ انتهاء الصلاحية: ${toDate}`,
        });
        setLoading(false);
        return;
      }

      // Step 4: All checks passed - update coupon's used to true
      if (!coupon.id) {
        throw new Error('معرف الكوبون غير موجود');
      }
      
      await markCouponAsUsed(coupon.id);
      
      // Return success message
      setResult({
        success: true,
        message: 'تم تفعيل الكوبون بنجاح! شكراً لاستخدامك.',
      });
      setCode('');

      setLoading(false);
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      setResult({
        success: false,
        message: error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      });
      setLoading(false);
    }
  };

  // Show admin dashboard if admin mode
  if (isAdmin) {
    return <AdminDashboard onBack={() => setIsAdmin(false)} />;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/40 max-w-md w-full">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-50 text-yellow-800 border-2 border-yellow-100 text-sm">
            {error}
          </div>
        )}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">تحقق من الكوبون</h1>
          <p className="text-gray-500 mt-2 font-medium">أدخل تفاصيل الكود الخاص بك أدناه</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 px-1">رمز الكوبون *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثال: TrH0fI"
              required
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-bold text-white text-lg transition-all transform shadow-xl ${
              loading
                ? 'bg-gray-300 cursor-not-allowed translate-y-0'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 shadow-indigo-200'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 ml-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                جاري المعالجة...
              </span>
            ) : (
              'تفعيل الكوبون'
            )}
          </button>
        </form>

        {result && (
          <div
            className={`mt-8 p-5 rounded-2xl flex items-start space-x-3 space-x-reverse animate-in slide-in-from-top-4 duration-300 border-2 ${
              result.success
                ? 'bg-green-50 text-green-800 border-green-100 shadow-sm'
                : 'bg-red-50 text-red-800 border-red-100 shadow-sm'
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {result.success ? (
                <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="text-sm font-bold leading-relaxed">{result.message}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

