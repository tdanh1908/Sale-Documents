import { describe, expect, it } from 'vitest';
import { createOrderRequestSchema, fileAccessRequestSchema, quoteRequestSchema } from '../schemas';

const uuid = '123e4567-e89b-42d3-a456-426614174000';

describe('quoteRequestSchema', () => {
  it('nhận 4 loại mục giỏ hàng', () => {
    const r = quoteRequestSchema.safeParse({
      items: [
        { type: 'document', document_id: uuid, access: 'download' },
        { type: 'upgrade', document_id: uuid },
        { type: 'bundle', bundle_id: uuid },
        { type: 'premium' },
      ],
      coupon: ' GIAM20 ',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.coupon).toBe('GIAM20'); // tự cắt khoảng trắng
  });
  it('từ chối giỏ trống, quá 50 mục, id không phải uuid, quyền lạ, loại lạ', () => {
    expect(quoteRequestSchema.safeParse({ items: [] }).success).toBe(false);
    expect(quoteRequestSchema.safeParse({ items: Array(51).fill({ type: 'premium' }) }).success).toBe(false);
    expect(quoteRequestSchema.safeParse({ items: [{ type: 'document', document_id: 'abc', access: 'view' }] }).success).toBe(false);
    expect(quoteRequestSchema.safeParse({ items: [{ type: 'document', document_id: uuid, access: 'admin' }] }).success).toBe(false);
    expect(quoteRequestSchema.safeParse({ items: [{ type: 'free_gift' }] }).success).toBe(false);
  });
  it('không cho khách gửi giá lên (trường lạ bị bỏ)', () => {
    const r = quoteRequestSchema.parse({ items: [{ type: 'premium', price: 1 }] });
    expect(r.items[0]).toEqual({ type: 'premium' });
  });
});

describe('createOrderRequestSchema / fileAccessRequestSchema', () => {
  it('nhận utm và kỳ thi', () => {
    expect(createOrderRequestSchema.safeParse({ items: [{ type: 'premium' }], utm: { utm_source: 'facebook' }, examEventId: uuid }).success).toBe(true);
  });
  it('yêu cầu truy cập file chỉ nhận view/download', () => {
    expect(fileAccessRequestSchema.safeParse({ documentId: uuid, action: 'view' }).success).toBe(true);
    expect(fileAccessRequestSchema.safeParse({ documentId: uuid, action: 'delete' }).success).toBe(false);
  });
});
