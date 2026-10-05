/**
 * Supabase Browser Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Dùng cho Client Components ('use client') — chạy trong trình duyệt.
 * Tự động đọc và cập nhật cookie xác thực thông qua @supabase/ssr.
 *
 * QUAN TRỌNG: Chỉ dùng NEXT_PUBLIC_* ở đây. KHÔNG dùng service_role key.
 * service_role key CHỈ dùng trong server-side code (src/lib/supabase/server.ts).
 *
 * Cách dùng:
 *   import { createBrowserClient } from '@/lib/supabase/client'
 *   const supabase = createBrowserClient()
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
