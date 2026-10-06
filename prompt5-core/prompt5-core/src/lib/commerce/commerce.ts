import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BusinessError,
  CartItem,
  CreatedOrder,
  FileAccessGranted,
  PaymentResult,
  Quote,
  Result,
} from './types';

/** Lỗi hệ thống (database/mạng) — khác với lỗi nghiệp vụ. Server trả 500 và ghi log. */
export class CommerceSystemError extends Error {
  constructor(
    public readonly fn: string,
    message: string,
  ) {
    super(`[${fn}] ${message}`);
    this.name = 'CommerceSystemError';
  }
}

async function rpc<T>(sb: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new CommerceSystemError(fn, error.message);
  return data as T;
}

/** `sb` PHẢI là client service_role (chỉ server). Các hàm SQL không cho trình duyệt gọi. */
export const quoteCart = (sb: SupabaseClient, userId: string, items: CartItem[], coupon?: string | null) =>
  rpc<Result<Quote>>(sb, 'quote_cart', { p_user_id: userId, p_items: items, p_coupon_code: coupon ?? null });

export const createOrder = (
  sb: SupabaseClient,
  userId: string,
  items: CartItem[],
  opts: { coupon?: string | null; utm?: Record<string, string>; examEventId?: string | null } = {},
) =>
  rpc<Result<CreatedOrder>>(sb, 'create_order', {
    p_user_id: userId,
    p_items: items,
    p_coupon_code: opts.coupon ?? null,
    p_utm: opts.utm ?? {},
    p_exam_event_id: opts.examEventId ?? null,
  });

export const processSepayPayment = (sb: SupabaseClient, payload: unknown) =>
  rpc<PaymentResult | BusinessError>(sb, 'process_sepay_payment', { p_payload: payload });

export const expirePendingOrders = (sb: SupabaseClient) => rpc<number>(sb, 'expire_pending_orders', {});

export const premiumStatus = (sb: SupabaseClient, userId: string) =>
  rpc<{
    active: boolean;
    ends_at?: string;
    days_left?: number;
    slots_used?: number;
    slots_limit?: number;
    claimed_documents?: { document_id: string; title: string }[];
  }>(sb, 'premium_status', { p_user_id: userId });

export const adminApproveOrder = (sb: SupabaseClient, orderId: string, adminId: string, note?: string) =>
  rpc<{ ok: true } | BusinessError>(sb, 'admin_approve_order', { p_order_id: orderId, p_admin_id: adminId, p_note: note ?? null });
export const adminRejectOrder = (sb: SupabaseClient, orderId: string, adminId: string, note?: string) =>
  rpc<{ ok: true } | BusinessError>(sb, 'admin_reject_order', { p_order_id: orderId, p_admin_id: adminId, p_note: note ?? null });
export const adminResolveReview = (sb: SupabaseClient, orderId: string, adminId: string, note?: string) =>
  rpc<{ ok: true } | BusinessError>(sb, 'admin_resolve_review', { p_order_id: orderId, p_admin_id: adminId, p_note: note ?? null });

/**
 * Cấp link XEM/TẢI file đầy đủ:
 *   1) hàm SQL kiểm tra quyền (đã mua / Premium / miễn phí), chiếm suất Premium nếu cần, ghi nhật ký;
 *   2) nếu được phép, tạo signed URL hết hạn sau vài phút (đường dẫn gốc không bao giờ lộ).
 */
export async function getFileAccessUrl(
  sb: SupabaseClient,
  args: { userId: string; documentId: string; action: 'view' | 'download'; ipHash?: string; userAgent?: string; downloadFileName?: string },
): Promise<Result<{ ok: true; url: string; expiresInSeconds: number; via: FileAccessGranted['via']; slotsUsed: number | null; slotsLimit: number | null }>> {
  const auth = await rpc<Result<FileAccessGranted>>(sb, 'authorize_file_access', {
    p_user_id: args.userId,
    p_document_id: args.documentId,
    p_action: args.action,
    p_ip_hash: args.ipHash ?? null,
    p_user_agent: args.userAgent ?? null,
  });
  if (!auth.ok) return auth;

  const ttl = auth.signed_url_ttl_seconds;
  const { data, error } = await sb.storage
    .from(auth.bucket)
    .createSignedUrl(auth.storage_path, ttl, args.action === 'download' ? { download: args.downloadFileName ?? true } : undefined);
  if (error || !data?.signedUrl) throw new CommerceSystemError('createSignedUrl', error?.message ?? 'không tạo được link');

  return { ok: true, url: data.signedUrl, expiresInSeconds: ttl, via: auth.via, slotsUsed: auth.slots_used, slotsLimit: auth.slots_limit };
}
