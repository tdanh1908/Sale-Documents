import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

/**
 * Dữ liệu SePay gửi qua webhook (theo tài liệu developer.sepay.vn/vi/sepay-webhooks).
 * Chỉ bắt buộc những trường ta cần; các trường lạ giữ nguyên (passthrough) để lưu vào raw_payload.
 */
export const sepayPayloadSchema = z
  .object({
    id: z.union([z.number().int(), z.string().min(1)]),
    gateway: z.string().nullish(),
    transactionDate: z.string().nullish(),
    accountNumber: z.string().nullish(),
    subAccount: z.string().nullish(),
    code: z.string().nullish(),
    content: z.string().nullish(),
    transferType: z.string().transform((s) => s.toLowerCase()).pipe(z.enum(['in', 'out'])),
    description: z.string().nullish(),
    transferAmount: z.number().int().nonnegative(),
    referenceCode: z.string().nullish(),
    accumulated: z.number().nullish(),
  })
  .passthrough();

export type SepayPayload = z.infer<typeof sepayPayloadSchema>;

/**
 * Kiểm tra header `Authorization: Apikey <KEY>` mà SePay gửi.
 * So sánh bằng băm + timingSafeEqual: không lộ độ dài khóa, không bị đoán dần qua thời gian phản hồi.
 */
export function verifySepayAuthorization(header: string | null | undefined, expectedKey: string): boolean {
  if (!expectedKey || expectedKey.length < 16) return false; // chưa cấu hình / khóa quá yếu: từ chối tất cả
  if (!header) return false;
  const match = /^Apikey\s+(\S+)$/i.exec(header.trim());
  const provided = match?.[1];
  if (!provided) return false;
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expectedKey).digest();
  return timingSafeEqual(a, b);
}

/**
 * Link ảnh QR chuyển khoản của SePay (đã đối chiếu tài liệu chính thức):
 *   https://qr.sepay.vn/img?acc=...&bank=...&amount=...&des=...
 * `bank` là tên ngắn trong https://qr.sepay.vn/banks.json (ví dụ "MBBank").
 */
export function buildPaymentQrUrl(p: {
  accountNumber: string;
  bank: string;
  amount: number;
  description: string;
}): string {
  const q = new URLSearchParams({
    acc: p.accountNumber,
    bank: p.bank,
    amount: String(Math.round(p.amount)),
    des: p.description,
  });
  return `https://qr.sepay.vn/img?${q.toString()}`;
}
