import React, { useMemo } from 'react';
import { type Coupon } from '../../services/firestoreService';
import { getSortIcon } from './adminUtils.tsx';

interface CouponsTableProps {
  coupons: Coupon[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortField: keyof Coupon | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Coupon) => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (couponId: string) => void;
}

const CouponsTable: React.FC<CouponsTableProps> = ({
  coupons,
  loading,
  searchTerm,
  onSearchChange,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
}) => {
  const filteredAndSortedCoupons = useMemo(() => {
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">قائمة الكوبونات</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="البحث عن الكوبون..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
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
              onClick={() => onSearchChange('')}
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
                  onClick={() => onSort('code')}
                >
                  <div className="flex items-center justify-end">
                    {getSortIcon('code', sortField, sortDirection)}
                    <span>الرمز</span>
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('type')}
                >
                  <div className="flex items-center justify-end">
                    {getSortIcon('type', sortField, sortDirection)}
                    <span>النوع</span>
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('validFrom')}
                >
                  <div className="flex items-center justify-end">
                    {getSortIcon('validFrom', sortField, sortDirection)}
                    <span>من</span>
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('validTo')}
                >
                  <div className="flex items-center justify-end">
                    {getSortIcon('validTo', sortField, sortDirection)}
                    <span>إلى</span>
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('used')}
                >
                  <div className="flex items-center justify-end">
                    {getSortIcon('used', sortField, sortDirection)}
                    <span>الحالة</span>
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => onSort('usedBy')}
                >
                  <div className="flex items-center justify-end">
                    {getSortIcon('usedBy', sortField, sortDirection)}
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
                        onClick={() => onEdit(coupon)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-bold"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => coupon.id && onDelete(coupon.id)}
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
  );
};

export default CouponsTable;

