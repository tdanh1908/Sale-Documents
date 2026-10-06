import { getAdminClient, getSessionUserId } from '@/lib/commerce/adapters';
import { quoteCart } from '@/lib/commerce/commerce';
import { json, respond, systemError } from '@/lib/commerce/http';
import { quoteRequestSchema } from '@/lib/commerce/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Báo giá giỏ hàng (xem trước tổng tiền, mã giảm giá). Giá luôn do SERVER tính, không tin giá từ trình duyệt. */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return json({ ok: false, error: 'LOGIN_REQUIRED', message: 'Bạn cần đăng nhập để mua hàng.' }, 401);

  const parsed = quoteRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: 'INVALID_REQUEST', message: 'Dữ liệu giỏ hàng không hợp lệ.' }, 400);

  try {
    return respond(await quoteCart(getAdminClient(), userId, parsed.data.items, parsed.data.coupon));
  } catch (e) {
    return systemError(e);
  }
}
