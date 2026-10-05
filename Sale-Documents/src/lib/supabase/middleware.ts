/**
 * Supabase Middleware Helper
 * ─────────────────────────────────────────────────────────────────────────────
 * Tạo Supabase client dùng trong Next.js middleware (src/middleware.ts).
 * Middleware chạy ở Edge Runtime nên KHÔNG dùng được cookies() của Next.js —
 * phải đọc/ghi cookie trực tiếp từ Request/Response.
 *
 * Nhiệm vụ chính: refresh session token trước khi request đến server,
 * đảm bảo Server Components luôn nhận session mới nhất.
 *
 * Không gọi file này từ nơi khác ngoài src/middleware.ts.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function updateSession(request: NextRequest) {
  // Bắt đầu với response mặc định (tiếp tục request).
  let supabaseResponse = NextResponse.next({ request })

  // Tạo client đọc/ghi cookie từ request/response.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Ghi cookie vào cả request (để các middleware sau đọc được)
          // và response (để trình duyệt nhận cookie mới).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // QUAN TRỌNG: Gọi getUser() để middleware refresh access token nếu đã hết hạn.
  // Không dùng getSession() vì nó không verify token với Supabase Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Bảo vệ các route cần đăng nhập ─────────────────────────────────────────
  // Điều chỉnh danh sách path này theo cấu trúc route thực tế của dự án.
  const pathname = request.nextUrl.pathname

  const isProtectedRoute =
    pathname.startsWith('/tai-khoan') || // Trang tài khoản
    pathname.startsWith('/doc/') || // Đọc tài liệu
    pathname.startsWith('/admin') || // Trang admin
    pathname.startsWith('/gio-hang') // Giỏ hàng & thanh toán

  if (!user && isProtectedRoute) {
    // Chưa đăng nhập → redirect về trang đăng nhập, giữ lại URL để redirect ngược lại sau.
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/dang-nhap'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // QUAN TRỌNG: Luôn trả về supabaseResponse (không trả về NextResponse.next() khác)
  // để cookie được ghi vào response đúng cách.
  return supabaseResponse
}
