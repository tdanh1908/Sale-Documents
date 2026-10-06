import { createHash } from 'node:crypto';
import { CommerceSystemError } from './commerce';
import { isBusinessError } from './types';

export const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Lỗi nghiệp vụ -> 422 kèm thông báo tiếng Việt; thành công -> 200. */
export function respond(result: unknown, extra?: Record<string, unknown>) {
  if (isBusinessError(result)) return json(result, 422);
  return json({ ...(result as object), ...extra });
}

/** Lỗi hệ thống: ghi log đầy đủ ở server, khách chỉ thấy câu chung chung (không lộ chi tiết kỹ thuật). */
export function systemError(e: unknown) {
  console.error('[commerce]', e instanceof CommerceSystemError ? e.message : e);
  return json({ ok: false, error: 'SYSTEM_ERROR', message: 'Có lỗi hệ thống, bạn thử lại sau ít phút nhé.' }, 500);
}

/** Băm IP (không lưu IP gốc). Cần biến môi trường IP_HASH_SALT. */
export function hashIp(req: Request): string | undefined {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? '';
  if (!ip) return undefined;
  return createHash('sha256').update(`${process.env.IP_HASH_SALT ?? ''}|${ip}`).digest('hex').slice(0, 32);
}
