import { describe, expect, it } from 'vitest';
import { formatPaymentNotification } from '../telegram';

describe('formatPaymentNotification', () => {
  it('đơn thanh toán thường', () => {
    const t = formatPaymentNotification({ ok: true, status: 'paid', payment_code: 'TL1', amount: 20000, expected: 20000 });
    expect(t).toContain('TL1');
    expect(t).toContain('20.000đ');
    expect(t).not.toContain('THỪA');
  });
  it('đơn thừa tiền nhắc hoàn tiền', () => {
    const t = formatPaymentNotification({ ok: true, status: 'paid', payment_code: 'TL1', amount: 22000, expected: 20000, overpaid: true });
    expect(t).toContain('THỪA');
  });
  it('thiếu tiền / chuyển muộn / chuyển vào đơn đã hủy', () => {
    expect(formatPaymentNotification({ ok: true, status: 'review', reason: 'underpaid', payment_code: 'TL1', amount: 1000, expected: 2000 })).toContain('THIẾU');
    expect(formatPaymentNotification({ ok: true, status: 'review', reason: 'late_payment', payment_code: 'TL1', amount: 2000, expected: 2000 })).toContain('MUỘN');
    expect(formatPaymentNotification({ ok: true, status: 'review', reason: 'paid_after_cancel', payment_code: 'TL1', amount: 2000, expected: 2000 })).toContain('đã hủy');
  });
  it('chuyển trùng và không khớp đơn', () => {
    expect(formatPaymentNotification({ ok: true, status: 'double_payment', payment_code: 'TL1', amount: 5000 })).toContain('TRÙNG');
    const t = formatPaymentNotification({ ok: true, status: 'unmatched', amount: 5000, content: 'x'.repeat(500) });
    expect(t).toContain('KHÔNG khớp');
    expect(t!.length).toBeLessThan(300); // cắt nội dung dài
  });
  it('không làm phiền admin khi webhook gọi lặp hoặc tiền ra', () => {
    expect(formatPaymentNotification({ ok: true, status: 'duplicate' })).toBeNull();
    expect(formatPaymentNotification({ ok: true, status: 'ignored' })).toBeNull();
  });
});
