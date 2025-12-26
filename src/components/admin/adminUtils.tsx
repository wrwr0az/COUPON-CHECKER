import React from 'react';
import { type Coupon } from '../../services/firestoreService';

/**
 * Convert dd/mm/yyyy to yyyy-mm-dd for date input
 */
export const convertToDateInputFormat = (dateStr: string): string => {
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

/**
 * Convert yyyy-mm-dd to dd/mm/yyyy
 */
export const convertFromDateInputFormat = (dateStr: string): string => {
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

/**
 * Get sort icon for a column
 */
export const getSortIcon = (
  field: keyof Coupon,
  sortField: keyof Coupon | null,
  sortDirection: 'asc' | 'desc'
): React.ReactElement => {
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

