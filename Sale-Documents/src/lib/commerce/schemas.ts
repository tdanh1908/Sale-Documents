import { z } from 'zod';

const uuid = z.string().uuid();

export const cartItemSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('document'), document_id: uuid, access: z.enum(['view', 'download']) }),
  z.object({ type: z.literal('upgrade'), document_id: uuid }),
  z.object({ type: z.literal('bundle'), bundle_id: uuid }),
  z.object({ type: z.literal('premium') }),
]);

export const quoteRequestSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  coupon: z.string().trim().max(40).optional().nullable(),
});

export const createOrderRequestSchema = quoteRequestSchema.extend({
  utm: z
    .object({
      utm_source: z.string().max(100).optional(),
      utm_medium: z.string().max(100).optional(),
      utm_campaign: z.string().max(100).optional(),
    })
    .optional(),
  examEventId: uuid.optional().nullable(),
});

export const fileAccessRequestSchema = z.object({
  documentId: uuid,
  action: z.enum(['view', 'download']),
});
