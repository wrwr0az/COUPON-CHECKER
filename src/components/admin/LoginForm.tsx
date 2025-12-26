import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

interface LoginFormProps {
  onBack: () => void;
  adminEmail: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onBack, adminEmail }) => {
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'تحذير',
        text: 'يرجى إدخال كلمة المرور',
        confirmButtonText: 'حسناً'
      });
      return;
    }

    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, adminEmail, password);
      setPassword('');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'كلمة المرور غير صحيحة';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'المستخدم غير موجود';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: errorMessage,
        confirmButtonText: 'حسناً'
      });
    } finally {
      setLoginLoading(false);
    }
  };

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
              disabled={loginLoading}
              placeholder="أدخل كلمة المرور"
            />
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
              loginLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loginLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 ml-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                جاري تسجيل الدخول...
              </span>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={loginLoading}
            className="w-full py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            العودة
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

