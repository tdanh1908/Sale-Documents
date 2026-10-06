/**
 * ADAPTER: chỗ DUY NHẤT nối module thanh toán với phần còn lại của dự án.
 * ANTIGRAVITY: nếu dự án đã có sẵn helper tương đương (client service_role, lấy người đang đăng nhập)
 * từ Prompt 1/3 thì thay thân hai hàm dưới bằng helper đó, đừng tạo thêm bản trùng.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

let admin: SupabaseClient | null = null;

/** Client service_role: CHỈ dùng ở server (route handler / server action). Tuyệt đối không import vào component phía trình duyệt. */
export function getAdminClient(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}

/** Id người đang đăng nhập (xác thực lại với Supabase, không tin cookie thô). Null nếu chưa đăng nhập. */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: () => {
        /* route handler chỉ đọc phiên, không ghi cookie */
      },
    },
  });
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}
