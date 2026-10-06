import { getAdminClient } from '@/lib/commerce/adapters';
import { processSepayPayment } from '@/lib/commerce/commerce';
import { json } from '@/lib/commerce/http';
import { sepayPayloadSchema, verifySepayAuthorization } from '@/lib/commerce/sepay';
import { formatPaymentNotification, sendTelegram } from '@/lib/commerce/telegram';
import type { PaymentResult } from '@/lib/commerce/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // SePay chỉ chờ tối đa 8 giây

/**
 * Webhook SePay. Quy ước SePay: trả HTTP 200/201 + {"success": true} thì coi là thành công;
 * mã khác 2xx thì SePay GỌI LẠI. Vì hàm SQL idempotent nên gọi lại luôn an toàn.
 */
export async function POST(req: Request) {
  if (!verifySepayAuthorization(req.headers.get('authorization'), process.env.SEPAY_WEBHOOK_API_KEY ?? '')) {
    return json({ success: false, message: 'Unauthorized' }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON' }, 400);
  }

  const parsed = sepayPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.error('[sepay] payload không hợp lệ', parsed.error.flatten());
    return json({ success: false, message: 'Invalid payload' }, 400);
  }

  let result: PaymentResult | { ok: false; error: string };
  try {
    // Gửi nguyên payload gốc (kể cả trường lạ) để lưu raw_payload phục vụ đối soát.
    result = (await processSepayPayment(getAdminClient(), body)) as typeof result;
  } catch (e) {
    console.error('[sepay] lỗi database, SePay sẽ gọi lại', e);
    return json({ success: false, message: 'Temporary error' }, 500);
  }

  if (!result.ok) {
    console.error('[sepay] hàm SQL từ chối', result);
    return json({ success: false, message: 'Rejected' }, 400);
  }

  // Báo admin qua Telegram (không để lỗi Telegram làm hỏng việc xác nhận thanh toán).
  const text = formatPaymentNotification(result);
  if (text) await sendTelegram(text);

  return json({ success: true });
}
