'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';
import Link from 'next/link';

const forgotSchema = z.object({
  email: z.string().email("Email không hợp lệ")
});

export default function ForgotPasswordPage() {
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema)
  });

  const onSubmit = (data: any) => {
    if (!turnstileToken) {
      setErrorMsg('Vui lòng xác nhận bạn không phải là robot');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setMsg('');
    
    setTimeout(() => {
      setLoading(false);
      setMsg('Đã gửi liên kết khôi phục mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư đến!');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">Quên mật khẩu</h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
        
        {msg && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center">{msg}</div>}
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center">{errorMsg}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Email đã đăng ký</label>
            <input {...register("email")} className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="email@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
          </div>

          <div className="flex justify-center py-2">
            <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={setTurnstileToken} />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu khôi phục'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/dang-nhap" className="text-blue-600 font-medium hover:underline text-sm flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
