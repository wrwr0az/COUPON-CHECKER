import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { 
  fetchCoupons,
  subscribeToCoupons,
  addCoupon, 
  updateCoupon, 
  deleteCoupon, 
  deleteAllCoupons,
  getCouponStatistics,
  type Coupon 
} from '../services/firestoreService';
import LoginForm from './admin/LoginForm';
import StatisticsCards from './admin/StatisticsCards';
import CouponsTable from './admin/CouponsTable';
import CouponForm from './admin/CouponForm';
import ExcelUpload from './admin/ExcelUpload';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    used: 0,
    unused: 0,
    expired: 0,
    active: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: '',
    validFrom: '',
    validTo: '',
    used: false,
    usedBy: '',
    usedDate: '',
    note: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Coupon | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fixed admin email - read from environment variable or use default
  const ADMIN_EMAIL = (import.meta as any).env?.VITE_ADMIN_EMAIL;

  // Check authentication state on mount and when auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time coupon updates when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Set up real-time subscription
    const unsubscribeCoupons = subscribeToCoupons((couponsData) => {
      setCoupons(couponsData);
      // Also update statistics when coupons change
      getCouponStatistics()
        .then(stats => setStatistics(stats))
        .catch(error => {
          console.error('Error getting statistics:', error);
        });
    });

    // Cleanup subscription on unmount or when not authenticated
    return () => {
      unsubscribeCoupons();
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'تأكيد تسجيل الخروج',
      text: 'هل أنت متأكد من تسجيل الخروج؟',
      showCancelButton: true,
      confirmButtonText: 'نعم، تسجيل الخروج',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    });

    if (!result.isConfirmed) return;

    try {
      await signOut(auth);
      Swal.fire({
        icon: 'success',
        title: 'تم تسجيل الخروج',
        text: 'تم تسجيل الخروج بنجاح',
        confirmButtonText: 'حسناً'
      });
    } catch (error) {
      console.error('Logout error:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ أثناء تسجيل الخروج',
        confirmButtonText: 'حسناً'
      });
    }
  };

  // Load initial data and statistics (used for manual refresh)
  const loadData = async () => {
    setLoading(true);
    try {
      const [couponsData, stats] = await Promise.all([
        fetchCoupons(),
        getCouponStatistics(),
      ]);
      setCoupons(couponsData);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading data:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ أثناء تحميل البيانات',
        confirmButtonText: 'حسناً'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: '',
      validFrom: '',
      validTo: '',
      used: false,
      usedBy: '',
      usedDate: '',
      note: '',
    });
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCoupon({
        code: formData.code,
        type: formData.type,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        used: formData.used,
        usedBy: formData.usedBy,
        usedDate: formData.usedDate,
        note: formData.note,
      });
      setShowAddForm(false);
      resetForm();
      Swal.fire({
        icon: 'success',
        title: 'نجح',
        text: 'تم إضافة الكوبون بنجاح',
        confirmButtonText: 'حسناً'
      });
    } catch (error) {
      console.error('Error adding coupon:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ أثناء إضافة الكوبون',
        confirmButtonText: 'حسناً'
      });
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.id) return;
    
    try {
      await updateCoupon(editingCoupon.id, formData);
      setEditingCoupon(null);
      resetForm();
      setShowAddForm(false);
      Swal.fire({
        icon: 'success',
        title: 'نجح',
        text: 'تم تحديث الكوبون بنجاح',
        confirmButtonText: 'حسناً'
      });
    } catch (error) {
      console.error('Error updating coupon:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ أثناء تحديث الكوبون',
        confirmButtonText: 'حسناً'
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'تأكيد الحذف',
      text: 'هل أنت متأكد من حذف هذا الكوبون؟',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      await deleteCoupon(couponId);
      Swal.fire({
        icon: 'success',
        title: 'نجح',
        text: 'تم حذف الكوبون بنجاح',
        confirmButtonText: 'حسناً'
      });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ أثناء حذف الكوبون',
        confirmButtonText: 'حسناً'
      });
    }
  };

  const handleDeleteAllCoupons = async () => {
    if (coupons.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'معلومات',
        text: 'لا توجد كوبونات للحذف',
        confirmButtonText: 'حسناً'
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'تحذير!',
      html: `هل أنت متأكد من حذف <strong>جميع</strong> الكوبونات؟<br><br>سيتم حذف <strong>${coupons.length}</strong> كوبون ولا يمكن التراجع عن هذا الإجراء!`,
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف الكل',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      input: 'text',
      inputPlaceholder: 'اكتب "حذف الكل" للتأكيد',
      inputValidator: (value) => {
        if (value !== 'حذف الكل') {
          return 'يجب كتابة "حذف الكل" للتأكيد';
        }
      }
    });
    
    if (!result.isConfirmed) return;
    
    try {
      setLoading(true);
      const deletedCount = await deleteAllCoupons();
      Swal.fire({
        icon: 'success',
        title: 'نجح',
        text: `تم حذف ${deletedCount} كوبون بنجاح`,
        confirmButtonText: 'حسناً'
      });
    } catch (error) {
      console.error('Error deleting all coupons:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ أثناء حذف الكوبونات',
        confirmButtonText: 'حسناً'
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type || '',
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
      used: coupon.used,
      usedBy: coupon.usedBy,
      usedDate: coupon.usedDate,
      note: coupon.note,
    });
    setShowAddForm(true);
  };

  const handleSort = (field: keyof Coupon) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingCoupon(null);
    resetForm();
  };

  // Login screen
  if (!isAuthenticated) {
    return <LoginForm onBack={onBack} adminEmail={ADMIN_EMAIL} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم - إدارة الكوبونات</h1>
            <div className="flex gap-3 items-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all"
              >
                تسجيل الخروج
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                العودة للتطبيق
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <StatisticsCards statistics={statistics} />

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                resetForm();
                setEditingCoupon(null);
                setShowAddForm(!showAddForm);
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              {showAddForm ? 'إلغاء' : 'إضافة كوبون جديد'}
            </button>
            <button
              onClick={loadData}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              تحديث البيانات
            </button>
            <button
              onClick={handleDeleteAllCoupons}
              disabled={loading || coupons.length === 0}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              حذف جميع الكوبونات
            </button>
          </div>
        </div>

        {/* Excel Upload */}
        <ExcelUpload onUploadComplete={loadData} />

        {/* Add/Edit Form */}
        {showAddForm && (
          <CouponForm
            editingCoupon={editingCoupon}
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={editingCoupon ? handleUpdateCoupon : handleAddCoupon}
            onCancel={handleFormCancel}
          />
        )}

        {/* Coupons Table */}
        <CouponsTable
          coupons={coupons}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEdit={startEdit}
          onDelete={handleDeleteCoupon}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
