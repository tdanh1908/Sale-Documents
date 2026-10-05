/**
 * Supabase Server Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Dùng cho Server Components, Server Actions, và Route Handlers.
 * Đọc/ghi cookie thông qua Next.js cookies() API (chỉ dùng được ở server).
 *
 * Có 2 loại client:
 *
 * 1. createServerClient()  — dùng anon key, tôn trọng RLS.
 *    Dùng khi thao tác dưới danh nghĩa người dùng đang đăng nhập.
 *    Ví dụ: hiển thị trang, lấy dữ liệu cần quyền đăng nhập.
 *
 * 2. createServiceClient() — dùng service_role key, BỎ QUA RLS.
 *    Chỉ dùng ở server cho các tác vụ hệ thống cần quyền admin:
 *      - Tạo signed URL cho file đầy đủ sau khi đã kiểm tra quyền mua
 *      - Webhook SePay: cập nhật trạng thái đơn hàng
 *      - Cron job, email queue
 *    TUYỆT ĐỐI không truyền client này sang client-side code.
 *
 * Cách dùng:
 *   import { createServerClient, createServiceClient } from '@/lib/supabase/server'
 */

import 'server-only'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

// ── 1. Server Client (anon key + RLS) ────────────────────────────────────────
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component không set được cookie — middleware đã xử lý việc này.
          }
        },
      },
    },
  )
}

// ── 2. Service Client (service_role key, BỎ QUA RLS) ─────────────────────────
// Tạo một lần duy nhất cho toàn ứng dụng (singleton) để tránh kết nối thừa.
// Biến này CHỈ tồn tại trong Node.js process, không bao giờ ra trình duyệt.
let _serviceClient: ReturnType<typeof createClient<Database>> | null = null

export function createServiceClient() {
  if (_serviceClient) return _serviceClient

  _serviceClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        // Service client không cần quản lý session người dùng.
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  return _serviceClient
}
