/**
 * Next.js Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * Chạy trước mỗi request đến server. Nhiệm vụ:
 *   1. Refresh Supabase session token (updateSession)
 *   2. Bảo vệ route cần đăng nhập (logic trong updateSession)
 *
 * Xem chi tiết: src/lib/supabase/middleware.ts
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Áp dụng cho mọi path, TRỪ:
     *   - _next/static  : file tĩnh Next.js
     *   - _next/image   : Image Optimization API
     *   - favicon.ico, sitemap.xml, robots.txt
     *   - public/       : file public (ảnh, manifest PWA...)
     *   - api/webhooks/ : webhook SePay không cần session (tự xác thực bằng chữ ký)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)',
  ],
}
