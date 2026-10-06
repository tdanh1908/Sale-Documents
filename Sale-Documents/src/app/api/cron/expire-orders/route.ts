import { timingSafeEqual } from 'node:crypto';
import { getAdminClient } from '@/lib/commerce/adapters';
import { expirePendingOrders } from '@/lib/commerce/commerce';
import { json, systemError } from '@/lib/commerce/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Chạy mỗi 1-5 phút: hết hạn đơn chưa thanh toán và trả lại lượt mã giảm giá. Header: Authorization: Bearer <CRON_SECRET>. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? '';
  const got = req.headers.get('authorization') ?? '';
  const want = `Bearer ${secret}`;
  const ok = secret.length >= 16 && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
  if (!ok) return json({ ok: false }, 401);
  try {
    return json({ ok: true, expired: await expirePendingOrders(getAdminClient()) });
  } catch (e) {
    return systemError(e);
  }
}
