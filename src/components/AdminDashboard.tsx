import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { 
  fetchCoupons, 
  addCoupon, 
  updateCoupon, 
  deleteCoupon, 
  deleteAllCoupons,
  getCouponStatistics,
  addCouponsBulk,
  type Coupon 
} from '../services/firestoreService';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
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
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Coupon | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Simple password authentication (you can replace this with Firebase Auth)
  const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'naruto++';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      loadData();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'كلمة المرور غير صحيحة',
        confirmButtonText: 'حسناً'
      });
    }
  };

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

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCoupon({
        code: formData.code,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        used: formData.used,
        usedBy: formData.usedBy,
        usedDate: formData.usedDate,
        note: formData.note,
      });
      setShowAddForm(false);
      resetForm();
      loadData();
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
      loadData();
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
      loadData();
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
      await loadData();
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

  // Parse Excel file and extract coupons
  const parseExcelFile = (file: File): Promise<Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Try to get Sheet1, otherwise use first sheet
          let sheetName = 'Sheet1';
          if (!workbook.SheetNames.includes('Sheet1')) {
            sheetName = workbook.SheetNames[0];
          }
          const worksheet = workbook.Sheets[sheetName];
          
          if (!worksheet) {
            reject(new Error(`Sheet "${sheetName}" not found in the file`));
            return;
          }
          
          // Convert to JSON array format (array of arrays)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // Default value for empty cells
            raw: false // Convert dates to strings
          }) as any[][];
          
          if (!jsonData || jsonData.length === 0) {
            reject(new Error('The file appears to be empty'));
            return;
          }
          
          // Try to detect header row
          let startRow = 0;
          const firstRow = jsonData[0] || [];
          
          // Check if first row looks like headers (contains text like "code", "type", etc.)
          const firstRowLower = firstRow.map((cell: any) => String(cell).toLowerCase().trim());
          const hasHeaderKeywords = firstRowLower.some((cell: string) => 
            ['code', 'type', 'validfrom', 'validto', 'valid_from', 'valid_to', 'from', 'to'].includes(cell)
          );
          
          if (hasHeaderKeywords) {
            startRow = 1; // Skip header row
          }
          
          const coupons: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>[] = [];
          
          // Expected columns: code (A/0), type (B/1), validFrom (C/2), validTo (D/3)
          for (let i = startRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            // Get values from columns A, B, C, D (indices 0, 1, 2, 3)
            const code = String(row[0] || '').trim().toUpperCase();
            const type = String(row[1] || '').trim();
            const validFrom = String(row[2] || '').trim(); // Column C (index 2)
            const validTo = String(row[3] || '').trim();   // Column D (index 3)
            
            // Skip empty rows (must have at least code and dates)
            if (!code || !validFrom || !validTo) {
              continue;
            }
            
            // Helper function to convert Excel date or string date to dd/mm/yyyy format
            const parseDate = (dateValue: string | number): string => {
              // If it's a number (Excel date serial number)
              if (typeof dateValue === 'number' && dateValue > 25569) {
                // Excel date (days since 1900-01-01)
                const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
                return `${String(excelDate.getDate()).padStart(2, '0')}/${String(excelDate.getMonth() + 1).padStart(2, '0')}/${excelDate.getFullYear()}`;
              }
              
              // If it's a string that looks like a number (Excel date serial as string)
              const numValue = Number(dateValue);
              if (!isNaN(numValue) && numValue > 25569) {
                const excelDate = new Date((numValue - 25569) * 86400 * 1000);
                return `${String(excelDate.getDate()).padStart(2, '0')}/${String(excelDate.getMonth() + 1).padStart(2, '0')}/${excelDate.getFullYear()}`;
              }
              
              // Try to parse as Date object
              const dateObj = new Date(dateValue);
              if (!isNaN(dateObj.getTime())) {
                return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
              }
              
              // If it's already in dd/mm/yyyy format, return as-is
              const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
              if (ddmmyyyyPattern.test(String(dateValue).trim())) {
                return String(dateValue).trim();
              }
              
              // If it's in mm/dd/yyyy format, convert to dd/mm/yyyy
              const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
              const mmddMatch = String(dateValue).trim().match(mmddyyyyPattern);
              if (mmddMatch) {
                return `${mmddMatch[2]}/${mmddMatch[1]}/${mmddMatch[3]}`;
              }
              
              // Return as-is if it's already in a string format
              return String(dateValue).trim();
            };
            
            const validFromStr = parseDate(validFrom);
            const validToStr = parseDate(validTo);
            
            coupons.push({
              code,
              type: type || '',
              validFrom: validFromStr,
              validTo: validToStr,
              used: false,
              usedBy: '',
              usedDate: '',
              note: '',
            });
          }
          
          if (coupons.length === 0) {
            reject(new Error('No valid coupon data found in the file. Please check that the file contains columns: code, type, validFrom, validTo'));
            return;
          }
          
          resolve(coupons);
        } catch (error: any) {
          console.error('Error parsing Excel file:', error);
          reject(new Error(`Error parsing file: ${error.message || 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      Swal.fire({
        icon: 'warning',
        title: 'نوع ملف غير مدعوم',
        text: 'يرجى رفع ملف Excel (.xlsx, .xls) أو CSV',
        confirmButtonText: 'حسناً'
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress('جاري قراءة الملف...');
    
    try {
      const coupons = await parseExcelFile(file);
      
      if (coupons.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'لا توجد بيانات',
          text: 'لم يتم العثور على بيانات في الملف',
          confirmButtonText: 'حسناً'
        });
        setUploading(false);
        return;
      }
      
      setUploadProgress(`تم العثور على ${coupons.length} كوبون. جاري الإضافة...`);
      
      // Check for duplicates
      const existingCoupons = await fetchCoupons();
      const existingCodes = new Set(existingCoupons.map(c => c.code.toUpperCase()));
      const newCoupons = coupons.filter(c => !existingCodes.has(c.code.toUpperCase()));
      
      if (newCoupons.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'معلومات',
          text: 'جميع الكوبونات موجودة بالفعل في النظام',
          confirmButtonText: 'حسناً'
        });
        setUploading(false);
        return;
      }
      
      if (newCoupons.length < coupons.length) {
        const duplicateCount = coupons.length - newCoupons.length;
        const result = await Swal.fire({
          icon: 'warning',
          title: 'كوبونات مكررة',
          html: `تم العثور على ${duplicateCount} كوبون مكرر.<br>سيتم إضافة ${newCoupons.length} كوبون جديد فقط.<br>هل تريد المتابعة؟`,
          showCancelButton: true,
          confirmButtonText: 'نعم، متابعة',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#4f46e5',
          cancelButtonColor: '#6b7280'
        });
        
        if (!result.isConfirmed) {
          setUploading(false);
          return;
        }
      }
      
      setUploadProgress(`جاري إضافة ${newCoupons.length} كوبون...`);
      
      const addedCount = await addCouponsBulk(newCoupons);
      
      setUploadProgress('');
      Swal.fire({
        icon: 'success',
        title: 'نجح',
        text: `تم إضافة ${addedCount} كوبون بنجاح!`,
        confirmButtonText: 'حسناً'
      });
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'حدث خطأ أثناء رفع الملف. يرجى التحقق من تنسيق الملف.',
        confirmButtonText: 'حسناً'
      });
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper function to convert dd/mm/yyyy to yyyy-mm-dd for date input
  const convertToDateInputFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    // Try to parse dd/mm/yyyy format
    const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateStr.match(ddmmyyyyPattern);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    // Try to parse mm/dd/yyyy format (fallback for old data)
    const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const mmddMatch = dateStr.match(mmddyyyyPattern);
    if (mmddMatch) {
      const month = mmddMatch[1].padStart(2, '0');
      const day = mmddMatch[2].padStart(2, '0');
      const year = mmddMatch[3];
      return `${year}-${month}-${day}`;
    }
    // Try to parse as Date object
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return '';
  };

  // Helper function to convert yyyy-mm-dd to dd/mm/yyyy
  const convertFromDateInputFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    // Parse yyyy-mm-dd format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return dateStr;
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
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also scroll to form if ref is available
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handle sorting
  const handleSort = (field: keyof Coupon) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort coupons
  const filteredAndSortedCoupons = React.useMemo(() => {
    let filtered = coupons;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.trim().toUpperCase();
      filtered = coupons.filter(coupon =>
        coupon.code.toUpperCase().includes(search)
      );
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        // Handle different data types
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        // Handle boolean values
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortDirection === 'asc' 
            ? (aValue === bValue ? 0 : aValue ? 1 : -1)
            : (aValue === bValue ? 0 : aValue ? -1 : 1);
        }

        // Handle string values
        const aStr = String(aValue).toUpperCase();
        const bStr = String(bValue).toUpperCase();

        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return filtered;
  }, [coupons, searchTerm, sortField, sortDirection]);

  // Get sort icon for a column
  const getSortIcon = (field: keyof Coupon) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 inline-block mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 inline-block mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 inline-block mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/40 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
            <p className="text-gray-600">أدخل كلمة المرور للدخول</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2 text-gray-600 hover:text-gray-800"
            >
              العودة
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم - إدارة الكوبونات</h1>
            <button
              onClick={onBack}
              className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              العودة للتطبيق
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">إجمالي الكوبونات</div>
            <div className="text-3xl font-bold text-gray-900">{statistics.total}</div>
          </div>
          <div className="bg-green-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="text-green-700 text-sm mb-1">المستخدمة</div>
            <div className="text-3xl font-bold text-green-800">{statistics.used}</div>
          </div>
          <div className="bg-blue-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="text-blue-700 text-sm mb-1">غير المستخدمة</div>
            <div className="text-3xl font-bold text-blue-800">{statistics.unused}</div>
          </div>
          <div className="bg-yellow-50 rounded-2xl shadow-lg p-6 border-2 border-yellow-200">
            <div className="text-yellow-700 text-sm mb-1">النشطة</div>
            <div className="text-3xl font-bold text-yellow-800">{statistics.active}</div>
          </div>
          <div className="bg-red-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
            <div className="text-red-700 text-sm mb-1">المنتهية</div>
            <div className="text-3xl font-bold text-red-800">{statistics.expired}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                resetForm();
                setEditingCoupon(null);
                setShowAddForm(!showAddForm);
                if (!showAddForm) {
                  // Scroll to top when opening add form
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    if (formRef.current) {
                      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
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

        {/* Excel Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">رفع ملف Excel</h2>
          <p className="text-gray-600 mb-4 text-sm">
            يمكنك رفع ملف Excel يحتوي على: code, type, validFrom, validTo
          </p>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />
            
            {uploading ? (
              <div>
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-indigo-600 font-bold">{uploadProgress}</p>
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-gray-700 font-bold mb-2">
                  اسحب الملف هنا أو انقر للاختيار
                </p>
                <p className="text-gray-500 text-sm">
                  يدعم ملفات Excel (.xlsx, .xls) و CSV
                </p>
              </>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div ref={formRef} className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}
            </h2>
            <form onSubmit={editingCoupon ? handleUpdateCoupon : handleAddCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">رمز الكوبون *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">النوع</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="مثال: Launch"
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">تاريخ البداية *</label>
                  <input
                    type="date"
                    value={convertToDateInputFormat(formData.validFrom)}
                    onChange={(e) => {
                      const convertedDate = convertFromDateInputFormat(e.target.value);
                      setFormData({ ...formData, validFrom: convertedDate });
                    }}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">تاريخ النهاية *</label>
                  <input
                    type="date"
                    value={convertToDateInputFormat(formData.validTo)}
                    onChange={(e) => {
                      const convertedDate = convertFromDateInputFormat(e.target.value);
                      setFormData({ ...formData, validTo: convertedDate });
                    }}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.used}
                    onChange={(e) => setFormData({ ...formData, used: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <label className="ml-2 text-sm font-semibold text-gray-700">مستخدم</label>
                </div>
                {formData.used && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">المستخدم</label>
                      <input
                        type="text"
                        value={formData.usedBy}
                        onChange={(e) => setFormData({ ...formData, usedBy: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">تاريخ الاستخدام</label>
                      <input
                        type="date"
                        value={convertToDateInputFormat(formData.usedDate)}
                        onChange={(e) => {
                          const convertedDate = convertFromDateInputFormat(e.target.value);
                          setFormData({ ...formData, usedDate: convertedDate });
                        }}
                        className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">ملاحظة</label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  {editingCoupon ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCoupon(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">قائمة الكوبونات</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="البحث عن الكوبون..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 pr-10 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none w-64"
                />
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  مسح البحث
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th 
                      className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('code')}
                    >
                      <div className="flex items-center justify-end">
                        {getSortIcon('code')}
                        <span>الرمز</span>
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center justify-end">
                        {getSortIcon('type')}
                        <span>النوع</span>
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('validFrom')}
                    >
                      <div className="flex items-center justify-end">
                        {getSortIcon('validFrom')}
                        <span>من</span>
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('validTo')}
                    >
                      <div className="flex items-center justify-end">
                        {getSortIcon('validTo')}
                        <span>إلى</span>
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('used')}
                    >
                      <div className="flex items-center justify-end">
                        {getSortIcon('used')}
                        <span>الحالة</span>
                      </div>
                    </th>
                    <th 
                      className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort('usedBy')}
                    >
                      <div className="flex items-center justify-end">
                        {getSortIcon('usedBy')}
                        <span>المستخدم</span>
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 font-bold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-bold">{coupon.code}</td>
                      <td className="py-3 px-4">{coupon.type || '-'}</td>
                      <td className="py-3 px-4">{coupon.validFrom}</td>
                      <td className="py-3 px-4">{coupon.validTo}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          coupon.used 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {coupon.used ? 'مستخدم' : 'غير مستخدم'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{coupon.usedBy || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(coupon)}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-bold"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => coupon.id && handleDeleteCoupon(coupon.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-bold"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAndSortedCoupons.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'لم يتم العثور على كوبونات تطابق البحث' : 'لا توجد كوبونات'}
                </div>
              )}
              {searchTerm && filteredAndSortedCoupons.length > 0 && (
                <div className="text-center py-4 text-sm text-gray-600">
                  تم العثور على {filteredAndSortedCoupons.length} من {coupons.length} كوبون
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

