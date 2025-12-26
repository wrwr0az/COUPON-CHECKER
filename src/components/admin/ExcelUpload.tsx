import React, { useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { fetchCoupons, addCouponsBulk } from '../../services/firestoreService';
import { parseExcelFile } from './excelUtils';

interface ExcelUploadProps {
  onUploadComplete: () => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      // Notify parent component
      onUploadComplete();
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

  return (
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
  );
};

export default ExcelUpload;

