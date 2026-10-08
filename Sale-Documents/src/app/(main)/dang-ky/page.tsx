'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Turnstile } from '@marsidev/react-turnstile';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải từ 8 ký tự trở lên"),
  full_name: z.string().min(1, "Họ tên không được để trống"),
  nickname: z.string().min(1, "Biệt danh không được để trống"),
  school: z.string().min(1, "Tên trường không được để trống"),
  phone: z.string().optional(),
  agree_policy: z.boolean().refine(val => val === true, "Bạn phải đồng ý với chính sách"),
  agree_public: z.boolean().refine(val => val === true, "Bạn phải đồng ý hiển thị công khai"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient());

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      }
    };
    checkSession();
  }, [supabase, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { agree_policy: false, agree_public: false }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    if (!turnstileToken) {
      setErrorMsg("Vui lòng xác nhận bạn không phải là robot");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const utm_source = localStorage.getItem('utm_source') || '';
    const utm_medium = localStorage.getItem('utm_medium') || '';
    const utm_campaign = localStorage.getItem('utm_campaign') || '';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          turnstileToken,
          utm_source,
          utm_medium,
          utm_campaign
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Đăng ký thất bại');
      
      setSuccessMsg("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 pt-20">
      <div className="max-w-xl w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Đăng ký tài khoản</h2>
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">{errorMsg}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-lg text-sm">{successMsg}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Họ tên</label>
              <input {...register("full_name")} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Nguyễn Văn A" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Biệt danh</label>
              <input {...register("nickname")} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="nickname123" />
              {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Email</label>
              <input {...register("email")} type="email" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="email@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Mật khẩu</label>
              <input {...register("password")} type="password" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••••" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Tên trường</label>
              <input {...register("school")} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="THPT Chuyên..." />
              {errors.school && <p className="text-red-500 text-xs mt-1">{errors.school.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Số điện thoại <span className="text-gray-400 text-xs font-normal">(tùy chọn)</span></label>
              <input {...register("phone")} type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="0987654321" />
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3 border border-gray-100 dark:border-gray-600">
            <div className="flex items-start">
              <input {...register("agree_policy")} type="checkbox" className="mt-1 cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" id="policy" />
              <label htmlFor="policy" className="ml-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer leading-tight">Tôi đồng ý với chính sách bảo mật và điều khoản sử dụng</label>
            </div>
            {errors.agree_policy && <p className="text-red-500 text-xs ml-6">{errors.agree_policy.message}</p>}

            <div className="flex items-start">
              <input {...register("agree_public")} type="checkbox" className="mt-1 cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" id="public" />
              <label htmlFor="public" className="ml-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer leading-tight">Tôi đồng ý hiển thị thông tin công khai trên bảng xếp hạng</label>
            </div>
            {errors.agree_public && <p className="text-red-500 text-xs ml-6">{errors.agree_public.message}</p>}
          </div>

          <div className="flex justify-center py-2">
            <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={setTurnstileToken} />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Đã có tài khoản? <Link href="/dang-nhap" className="text-blue-600 font-medium hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
