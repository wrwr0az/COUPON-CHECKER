import React, { useRef, useEffect } from 'react';
import { type Coupon } from '../../services/firestoreService';
import { convertToDateInputFormat, convertFromDateInputFormat } from './adminUtils.tsx';

interface FormData {
  code: string;
  type: string;
  validFrom: string;
  validTo: string;
  used: boolean;
  usedBy: string;
  usedDate: string;
  note: string;
}

interface CouponFormProps {
  editingCoupon: Coupon | null;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const CouponForm: React.FC<CouponFormProps> = ({
  editingCoupon,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
}) => {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formRef.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  return (
    <div ref={formRef} className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">رمز الكوبون *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => onFormDataChange({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">النوع</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => onFormDataChange({ ...formData, type: e.target.value })}
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
                onFormDataChange({ ...formData, validFrom: convertedDate });
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
                onFormDataChange({ ...formData, validTo: convertedDate });
              }}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.used}
              onChange={(e) => onFormDataChange({ ...formData, used: e.target.checked })}
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
                  onChange={(e) => onFormDataChange({ ...formData, usedBy: e.target.value })}
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
                    onFormDataChange({ ...formData, usedDate: convertedDate });
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
              onChange={(e) => onFormDataChange({ ...formData, note: e.target.value })}
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
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

export default CouponForm;

