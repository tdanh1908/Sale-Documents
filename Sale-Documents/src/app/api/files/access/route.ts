import { getAdminClient, getSessionUserId } from '@/lib/commerce/adapters';
import { getFileAccessUrl } from '@/lib/commerce/commerce';
import { hashIp, json, respond, systemError } from '@/lib/commerce/http';
import { fileAccessRequestSchema } from '@/lib/commerce/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cấp link XEM hoặc TẢI file đầy đủ (hết hạn sau vài phút). Quyền kiểm tra hoàn toàn ở server/database. */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return json({ ok: false, error: 'LOGIN_REQUIRED', message: 'Bạn cần đăng nhập.' }, 401);

  const parsed = fileAccessRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: 'INVALID_REQUEST', message: 'Yêu cầu không hợp lệ.' }, 400);

  try {
    const result = await getFileAccessUrl(getAdminClient(), {
      userId,
      documentId: parsed.data.documentId,
      action: parsed.data.action,
      ipHash: hashIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
    return respond(result);
  } catch (e) {
    return systemError(e);
  }
}
