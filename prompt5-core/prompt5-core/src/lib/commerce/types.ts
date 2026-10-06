// Kiểu dữ liệu trả về từ các hàm SQL của migration 0012.

export type CartItem =
  | { type: 'document'; document_id: string; access: 'view' | 'download' }
  | { type: 'upgrade'; document_id: string }
  | { type: 'bundle'; bundle_id: string }
  | { type: 'premium' };

/** Lỗi nghiệp vụ (khách gặp được): luôn kèm `message` tiếng Việt để hiện thẳng cho khách. */
export interface BusinessError {
  ok: false;
  error: string;
  message: string;
  [extra: string]: unknown;
}

export interface QuoteLine {
  item_type: 'document' | 'upgrade' | 'premium';
  document_id: string | null;
  bundle_id: string | null;
  flash_sale_id: string | null;
  access_level: 'view' | 'download' | null;
  premium_days: number | null;
  title: string;
  unit_price: number;
  promo_discount: number;
  coupon_discount: number;
  discount_amount: number;
  final_price: number;
}

export interface Quote {
  ok: true;
  lines: QuoteLine[];
  subtotal: number;
  discount_amount: number;
  promo_discount: number;
  coupon_discount: number;
  surcharge_amount: number;
  total_amount: number;
  is_free: boolean;
  coupon: { kind: 'public' | 'private'; id: string; code: string; percent: number } | null;
  min_amount: number;
}

export interface CreatedOrder {
  ok: true;
  order: {
    id: string;
    payment_code: string;
    status: 'pending' | 'paid';
    total_amount: number;
    is_free: boolean;
    expires_at: string;
    bank_name: string;
  };
  quote: Quote;
}

export type PaymentStatus =
  | 'paid'
  | 'review'
  | 'double_payment'
  | 'unmatched'
  | 'ignored'
  | 'duplicate';

export interface PaymentResult {
  ok: true;
  status: PaymentStatus;
  reason?: 'underpaid' | 'late_payment' | 'paid_after_cancel';
  transaction_id?: string;
  order_id?: string;
  user_id?: string;
  payment_code?: string;
  amount?: number;
  expected?: number;
  overpaid?: boolean;
  content?: string;
}

export interface FileAccessGranted {
  ok: true;
  via: 'free' | 'entitlement' | 'premium';
  action: 'view' | 'download';
  bucket: string;
  storage_path: string;
  document_file_id: string;
  signed_url_ttl_seconds: number;
  slots_claimed_now: boolean;
  slots_used: number | null;
  slots_limit: number | null;
}

export type Result<T> = T | BusinessError;

export function isBusinessError(r: unknown): r is BusinessError {
  return typeof r === 'object' && r !== null && (r as { ok?: unknown }).ok === false;
}
