import { formatVND } from './money';
import type { PaymentResult } from './types';

/** Soạn tin báo cho admin theo kết quả xử lý webhook. Trả null nếu không cần báo. */
export function formatPaymentNotification(r: PaymentResult): string | null {
  const code = r.payment_code ?? '(không rõ mã)';
  switch (r.status) {
    case 'paid':
      return (
        `✅ Đơn ${code} đã thanh toán: ${formatVND(r.amount ?? 0)}` +
        (r.overpaid ? `\n⚠️ Khách chuyển THỪA (cần ${formatVND(r.expected ?? 0)}). Hãy hoàn phần dư rồi bấm "Đã xử lý" trong Admin.` : '')
      );
    case 'review': {
      const why =
        r.reason === 'underpaid'
          ? 'chuyển THIẾU tiền'
          : r.reason === 'late_payment'
            ? 'chuyển MUỘN (đơn đã hết hạn)'
            : 'chuyển vào đơn đã hủy';
      return `⚠️ Đơn ${code} cần kiểm tra: ${why}. Nhận ${formatVND(r.amount ?? 0)} / cần ${formatVND(r.expected ?? 0)}. Vào Admin > Vận hành > Cần kiểm tra.`;
    }
    case 'double_payment':
      return `⚠️ Đơn ${code} bị chuyển TRÙNG thêm ${formatVND(r.amount ?? 0)}. Cần hoàn tiền cho khách.`;
    case 'unmatched':
      return `❓ Nhận ${formatVND(r.amount ?? 0)} nhưng KHÔNG khớp đơn nào. Nội dung: "${(r.content ?? '').slice(0, 120)}"`;
    default:
      return null; // paid lặp (duplicate) / tiền ra (ignored): không làm phiền admin
  }
}

/** Gửi tin Telegram. Không bao giờ ném lỗi và tối đa ~3 giây (SePay chỉ chờ 8 giây). */
export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
