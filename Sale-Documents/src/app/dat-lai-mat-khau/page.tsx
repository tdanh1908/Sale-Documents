'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const resetSchema = z.object({ 
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  confirm: z.string()
}).refine(data => data.password === data.confirm, { 
  message: "Mật khẩu xác nhận không khớp", 
  path: ["confirm"] 
});

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetSchema)
  });

  const onSubmit = (data: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMsg('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">Đặt lại mật khẩu</h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
        
        {msg ? (
          <div className="text-center">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{msg}</div>
            <Link href="/dang-nhap" className="inline-block bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition">Đi đến Đăng nhập</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Mật khẩu mới</label>
              <input type="password" {...register("password")} className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••••" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Xác nhận mật khẩu</label>
              <input type="password" {...register("confirm")} className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••••" />
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message as string}</p>}
            </div>
            
            <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50 mt-4">
              {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
