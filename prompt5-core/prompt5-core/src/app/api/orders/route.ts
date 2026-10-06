import { getAdminClient, getSessionUserId } from '@/lib/commerce/adapters';
import { createOrder } from '@/lib/commerce/commerce';
import { json, respond, systemError } from '@/lib/commerce/http';
import { createOrderRequestSchema } from '@/lib/commerce/schemas';
import { buildPaymentQrUrl } from '@/lib/commerce/sepay';
import { isBusinessError } from '@/lib/commerce/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Tạo đơn. Đơn 0đ (mã 100%) được mở khóa ngay, không có QR.
 * Biến môi trường (server): BANK_ACCOUNT_NUMBER, BANK_ACCOUNT_NAME. Tên ngân hàng lấy từ cài đặt payment.bank_name.
 */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return json({ ok: false, error: 'LOGIN_REQUIRED', message: 'Bạn cần đăng nhập để mua hàng.' }, 401);

  const parsed = createOrderRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: 'INVALID_REQUEST', message: 'Dữ liệu đơn hàng không hợp lệ.' }, 400);

  try {
    const result = await createOrder(getAdminClient(), userId, parsed.data.items, {
      coupon: parsed.data.coupon,
      utm: parsed.data.utm,
      examEventId: parsed.data.examEventId,
    });
    if (isBusinessError(result) || result.order.is_free) return respond(result);

    const account = process.env.BANK_ACCOUNT_NUMBER ?? '';
    if (!account) throw new Error('Thiếu BANK_ACCOUNT_NUMBER');
    return respond(result, {
      payment: {
        bank_name: result.order.bank_name,
        account_number: account,
        account_name: process.env.BANK_ACCOUNT_NAME ?? '',
        amount: result.order.total_amount,
        transfer_content: result.order.payment_code,
        qr_url: buildPaymentQrUrl({
          accountNumber: account,
          bank: result.order.bank_name,
          amount: result.order.total_amount,
          description: result.order.payment_code,
        }),
      },
    });
  } catch (e) {
    return systemError(e);
  }
}
