import React from 'react';

interface Statistics {
  total: number;
  used: number;
  unused: number;
  expired: number;
  active: number;
}

interface StatisticsCardsProps {
  statistics: Statistics;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ statistics }) => {
  return (
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
  );
};

export default StatisticsCards;

