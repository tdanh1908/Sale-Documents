import { describe, expect, it } from 'vitest';
import { formatVND } from '../money';
import { buildPaymentQrUrl, sepayPayloadSchema, verifySepayAuthorization } from '../sepay';

const KEY = 'khoa-bi-mat-test-0123456789';

describe('verifySepayAuthorization', () => {
  it('chấp nhận đúng "Apikey <khóa>"', () => {
    expect(verifySepayAuthorization(`Apikey ${KEY}`, KEY)).toBe(true);
    expect(verifySepayAuthorization(`apikey   ${KEY}  `, KEY)).toBe(true); // không phân biệt hoa thường tiền tố, bỏ khoảng trắng thừa
  });
  it('từ chối thiếu header, sai khóa, sai kiểu xác thực', () => {
    expect(verifySepayAuthorization(null, KEY)).toBe(false);
    expect(verifySepayAuthorization('', KEY)).toBe(false);
    expect(verifySepayAuthorization(`Apikey ${KEY}x`, KEY)).toBe(false);
    expect(verifySepayAuthorization('Apikey sai', KEY)).toBe(false);
    expect(verifySepayAuthorization(`Bearer ${KEY}`, KEY)).toBe(false);
    expect(verifySepayAuthorization(KEY, KEY)).toBe(false);
  });
  it('từ chối mọi yêu cầu khi chưa cấu hình khóa hoặc khóa quá yếu', () => {
    expect(verifySepayAuthorization('Apikey ', '')).toBe(false);
    expect(verifySepayAuthorization('Apikey abc', 'abc')).toBe(false);
    expect(verifySepayAuthorization('Apikey undefined', '')).toBe(false);
  });
});

describe('sepayPayloadSchema', () => {
  // Mẫu theo tài liệu SePay: code có thể null, transferAmount là số nguyên.
  const sample = {
    id: 92704,
    gateway: 'MBBank',
    transactionDate: '2026-10-05 14:02:05',
    accountNumber: '0123499999',
    code: null,
    content: 'TLAB12CD34 chuyen tien',
    transferType: 'in',
    transferAmount: 20000,
    accumulated: 19077000,
    subAccount: null,
    referenceCode: 'MBVCB.3278907687',
    description: '',
  };
  it('đọc được payload mẫu', () => {
    expect(sepayPayloadSchema.safeParse(sample).success).toBe(true);
  });
  it('chuẩn hóa transferType viết hoa', () => {
    const r = sepayPayloadSchema.parse({ ...sample, transferType: 'IN' });
    expect(r.transferType).toBe('in');
  });
  it('giữ nguyên trường lạ để lưu raw_payload', () => {
    const r = sepayPayloadSchema.parse({ ...sample, truongMoi: 'x' }) as Record<string, unknown>;
    expect(r.truongMoi).toBe('x');
  });
  it('từ chối thiếu id, số tiền âm/lẻ, loại giao dịch lạ', () => {
    const { id: _id, ...noId } = sample;
    expect(sepayPayloadSchema.safeParse(noId).success).toBe(false);
    expect(sepayPayloadSchema.safeParse({ ...sample, transferAmount: -1 }).success).toBe(false);
    expect(sepayPayloadSchema.safeParse({ ...sample, transferAmount: 10.5 }).success).toBe(false);
    expect(sepayPayloadSchema.safeParse({ ...sample, transferType: 'refund' }).success).toBe(false);
  });
});

describe('buildPaymentQrUrl', () => {
  it('tạo link đúng định dạng qr.sepay.vn', () => {
    const url = new URL(buildPaymentQrUrl({ accountNumber: '0123456789', bank: 'MBBank', amount: 59000, description: 'TLAB12CD34' }));
    expect(url.origin + url.pathname).toBe('https://qr.sepay.vn/img');
    expect(url.searchParams.get('acc')).toBe('0123456789');
    expect(url.searchParams.get('bank')).toBe('MBBank');
    expect(url.searchParams.get('amount')).toBe('59000');
    expect(url.searchParams.get('des')).toBe('TLAB12CD34');
  });
  it('mã hóa ký tự đặc biệt, không để chèn tham số', () => {
    const url = new URL(buildPaymentQrUrl({ accountNumber: '1&bank=X', bank: 'MB Bank', amount: 1000.4, description: 'a b&amount=1' }));
    expect(url.searchParams.get('acc')).toBe('1&bank=X');
    expect(url.searchParams.get('bank')).toBe('MB Bank');
    expect(url.searchParams.get('amount')).toBe('1000');
    expect(url.searchParams.get('des')).toBe('a b&amount=1');
  });
});

describe('formatVND', () => {
  it('chèn dấu chấm ngăn cách hàng nghìn', () => {
    expect(formatVND(0)).toBe('0đ');
    expect(formatVND(2000)).toBe('2.000đ');
    expect(formatVND(59000)).toBe('59.000đ');
    expect(formatVND(1234567)).toBe('1.234.567đ');
  });
});
