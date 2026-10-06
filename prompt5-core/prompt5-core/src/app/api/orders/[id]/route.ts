import { z } from 'zod';
import { getAdminClient, getSessionUserId } from '@/lib/commerce/adapters';
import { json, systemError } from '@/lib/commerce/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Trạng thái đơn để trang thanh toán hỏi lại mỗi vài giây ("Đang chờ..." -> "Thành công"). Chỉ chủ đơn xem được. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return json({ ok: false, error: 'LOGIN_REQUIRED', message: 'Bạn cần đăng nhập.' }, 401);

  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return json({ ok: false, error: 'NOT_FOUND', message: 'Không tìm thấy đơn.' }, 404);

  const { data, error } = await getAdminClient()
    .from('orders')
    .select('id, status, payment_code, total_amount, paid_at, expires_at, review_reason')
    .eq('id', id)
    .eq('user_id', userId) // chỉ chủ đơn
    .maybeSingle();
  if (error) return systemError(error);
  if (!data) return json({ ok: false, error: 'NOT_FOUND', message: 'Không tìm thấy đơn.' }, 404);

  const { review_reason, ...order } = data;
  // Khách chỉ cần biết "đang được kiểm tra thủ công", không lộ chi tiết nội bộ.
  return json({ ok: true, order: { ...order, under_review: review_reason !== null && order.status !== 'paid' } });
}
