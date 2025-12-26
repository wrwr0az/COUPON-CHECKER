import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface Coupon {
  id?: string;
  code: string;
  type?: string;
  used: boolean;
  usedBy: string;
  usedDate: string;
  note: string;
  validFrom: string;
  validTo: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const COUPONS_COLLECTION = 'coupons';

/**
 * Fetch all coupons from Firestore (one-time)
 */
export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const couponsRef = collection(db, COUPONS_COLLECTION);
    const snapshot = await getDocs(couponsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Coupon[];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for all coupons
 * Returns an unsubscribe function to stop listening
 * 
 * @param callback - Function called whenever coupons change
 * @returns Unsubscribe function
 */
export function subscribeToCoupons(
  callback: (coupons: Coupon[]) => void
): Unsubscribe {
  try {
    const couponsRef = collection(db, COUPONS_COLLECTION);
    
    const unsubscribe = onSnapshot(
      couponsRef,
      (snapshot) => {
        const coupons = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Coupon[];
        callback(coupons);
      },
      (error) => {
        console.error('Error in coupons subscription:', error);
        // Still call callback with empty array on error to prevent UI breaking
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up coupons subscription:', error);
    // Return a no-op unsubscribe function on error
    return () => {};
  }
}

/**
 * Fetch a single coupon by code
 */
export async function fetchCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const couponsRef = collection(db, COUPONS_COLLECTION);
    const q = query(couponsRef, where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as Coupon;
  } catch (error) {
    console.error('Error fetching coupon by code:', error);
    throw error;
  }
}

/**
 * Add a new coupon
 */
export async function addCoupon(coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const couponsRef = collection(db, COUPONS_COLLECTION);
    const docRef = await addDoc(couponsRef, {
      ...coupon,
      code: coupon.code.toUpperCase(),
      type: coupon.type || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding coupon:', error);
    throw error;
  }
}

/**
 * Update a coupon
 */
export async function updateCoupon(couponId: string, updates: Partial<Coupon>): Promise<void> {
  try {
    const couponRef = doc(db, COUPONS_COLLECTION, couponId);
    
    // Build update object, only including defined fields
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    // Only add fields that are actually provided (not undefined)
    if (updates.code !== undefined) {
      updateData.code = updates.code.toUpperCase();
    }
    if (updates.type !== undefined) {
      updateData.type = updates.type;
    }
    if (updates.used !== undefined) {
      updateData.used = updates.used;
    }
    if (updates.usedBy !== undefined) {
      updateData.usedBy = updates.usedBy;
    }
    if (updates.usedDate !== undefined) {
      updateData.usedDate = updates.usedDate;
    }
    if (updates.note !== undefined) {
      updateData.note = updates.note;
    }
    if (updates.validFrom !== undefined) {
      updateData.validFrom = updates.validFrom;
    }
    if (updates.validTo !== undefined) {
      updateData.validTo = updates.validTo;
    }
    
    await updateDoc(couponRef, updateData);
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(couponId: string): Promise<void> {
  try {
    const couponRef = doc(db, COUPONS_COLLECTION, couponId);
    await deleteDoc(couponRef);
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
}

/**
 * Delete all coupons
 */
export async function deleteAllCoupons(): Promise<number> {
  try {
    const couponsRef = collection(db, COUPONS_COLLECTION);
    const snapshot = await getDocs(couponsRef);
    
    if (snapshot.empty) {
      return 0;
    }
    
    // Firestore batch limit is 500, so we need to process in batches
    const batchSize = 500;
    let deletedCount = 0;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + batchSize);
      
      batchDocs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      
      await batch.commit();
      deletedCount += batchDocs.length;
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting all coupons:', error);
    throw error;
  }
}

/**
 * Mark a coupon as used
 */
export async function markCouponAsUsed(
  couponId: string, 
  usedBy: string = 'غير معروف',
  usedDate: string = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  note: string = ''
): Promise<void> {
  try {
    await updateCoupon(couponId, {
      used: true,
      usedBy,
      usedDate,
      note,
    });
  } catch (error) {
    console.error('Error marking coupon as used:', error);
    throw error;
  }
}

/**
 * Add multiple coupons in bulk
 */
export async function addCouponsBulk(coupons: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
  try {
    let successCount = 0;
    const batchSize = 500; // Firestore batch limit
    
    // Process in batches
    for (let i = 0; i < coupons.length; i += batchSize) {
      const batch = coupons.slice(i, i + batchSize);
      const promises = batch.map(coupon => 
        addCoupon({
          ...coupon,
          code: coupon.code.toUpperCase(),
          used: false, // All imported coupons are unused
          usedBy: '',
          usedDate: '',
          note: '',
        })
      );
      
      await Promise.all(promises);
      successCount += batch.length;
    }
    
    return successCount;
  } catch (error) {
    console.error('Error adding coupons in bulk:', error);
    throw error;
  }
}

/**
 * Get coupon statistics
 */
export async function getCouponStatistics(): Promise<{
  total: number;
  used: number;
  unused: number;
  expired: number;
  active: number;
}> {
  try {
    const coupons = await fetchCoupons();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let used = 0;
    let unused = 0;
    let expired = 0;
    let active = 0;
    
    coupons.forEach(coupon => {
      if (coupon.used) {
        used++;
      } else {
        unused++;
        
        // Check if expired
        const validTo = new Date(coupon.validTo);
        validTo.setHours(23, 59, 59, 999);
        
        if (today > validTo) {
          expired++;
        } else {
          active++;
        }
      }
    });
    
    return {
      total: coupons.length,
      used,
      unused,
      expired,
      active,
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
}

