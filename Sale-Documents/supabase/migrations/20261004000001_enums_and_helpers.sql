-- =============================================================================
-- 0001 · ENUM VÀ HÀM TIỆN ÍCH DÙNG CHUNG
-- -----------------------------------------------------------------------------
-- Quy ước toàn bộ schema:
--   * Tiền lưu bằng integer, đơn vị VNĐ (không có số lẻ).
--   * Thời gian dùng timestamptz (lưu UTC, hiển thị theo giờ VN ở frontend).
--   * Khóa chính uuid (gen_random_uuid() có sẵn từ PostgreSQL 13).
--   * Tập giá trị cố định, ít đổi  -> ENUM.
--     Ràng buộc giá trị (khoảng, độ dài, định dạng) -> CHECK constraint.
-- =============================================================================

-- ---------- ENUM ----------

-- Vai trò người dùng. Web chỉ có 1 admin (chủ web), còn lại là học sinh.
create type public.user_role as enum ('student', 'admin');

-- Môn học. 'van' chỉ dùng cho tài liệu, KHÔNG có đề thi thử / xếp hạng.
create type public.subject as enum (
  'toan', 'ly', 'hoa', 'sinh', 'su', 'dia', 'ktpl', 'anh', 'tin', 'van'
);

-- Loại tài liệu: lý thuyết / bài tập / đề thi.
create type public.doc_type as enum ('ly_thuyet', 'bai_tap', 'de_thi');

-- Trạng thái tài liệu: nháp -> đang bán -> đã gỡ (ẩn, soft delete).
create type public.document_status as enum ('draft', 'published', 'hidden');

-- Loại file của tài liệu: file đầy đủ (private) hoặc file demo 3 trang (public).
create type public.file_kind as enum ('full', 'demo');

-- Quyền đã mua: chỉ xem online, hoặc xem + tải về.
create type public.access_level as enum ('view', 'download');

-- Trạng thái đơn hàng.
--   pending   : chờ chuyển khoản
--   paid      : đã thanh toán (hoặc đơn 0đ tự chuyển paid)
--   expired   : quá hạn chưa thanh toán
--   cancelled : khách/admin hủy
--   refunded  : admin hoàn tiền
create type public.order_status as enum ('pending', 'paid', 'expired', 'cancelled', 'refunded');

-- Loại dòng trong đơn: mua tài liệu / nâng cấp xem -> tải / mua Premium.
create type public.order_item_type as enum ('document', 'upgrade', 'premium');

-- Kết quả đối soát giao dịch SePay.
create type public.payment_tx_status as enum ('matched', 'unmatched', 'ignored');

-- Trạng thái kiểm duyệt biệt danh / tên trường.
--   pending  : chờ admin duyệt (KHÔNG hiện công khai)
--   approved : đã duyệt, hiện đúng nội dung
--   masked   : admin chọn "Che bằng ****"
--   rejected : từ chối
create type public.moderation_status as enum ('pending', 'approved', 'masked', 'rejected');

-- Hình thức đề thi: làm trên web (tính BXH) hoặc link Azota.
create type public.exam_mode as enum ('web', 'azota');

-- Đề "Luôn mở" hay "Chỉ mở trong kỳ thi".
create type public.exam_availability as enum ('always', 'event_only');

-- Trạng thái đề trong kho đề.
create type public.exam_status as enum ('draft', 'published', 'archived');

-- Trạng thái lượt làm bài.
create type public.attempt_status as enum ('in_progress', 'submitted', 'expired');

-- Trạng thái kỳ thi: Nháp / Đã hẹn giờ / Đang diễn ra / Đã kết thúc.
create type public.exam_event_status as enum ('draft', 'scheduled', 'live', 'ended');

-- Ai được tham gia kỳ thi.
create type public.event_eligibility as enum ('all', 'premium', 'purchased');

-- Kỳ thi tính vào BXH chung hay chỉ BXH riêng của kỳ thi.
create type public.event_ranking_scope as enum ('global', 'event_only');

-- Thời điểm hiện đáp án + giải thích.
create type public.answer_reveal as enum ('after_submit', 'after_event');

-- Phạm vi áp dụng của mã giảm giá tặng riêng.
create type public.coupon_scope as enum ('all', 'subject', 'documents');

-- Nguồn gốc mã giảm giá riêng của học sinh.
create type public.user_coupon_source as enum ('exam_event', 'referral', 'admin');

-- Trạng thái giới thiệu bạn bè.
create type public.referral_status as enum ('pending', 'rewarded', 'rejected');

-- Trạng thái hiển thị của bình luận / đánh giá.
--   visible      : đang hiện
--   auto_hidden  : tự ẩn do dính từ cấm
--   admin_hidden : admin ẩn
create type public.content_status as enum ('visible', 'auto_hidden', 'admin_hidden');

-- Trạng thái báo cáo bình luận.
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- Loại phòng chat: hỗ trợ (học sinh <-> admin, theo tài liệu) hoặc nhóm do học sinh tạo.
create type public.chat_room_type as enum ('support', 'group');

-- Trạng thái email trong hàng đợi gửi nền.
create type public.email_status as enum ('pending', 'sending', 'sent', 'failed');


-- ---------- HÀM TIỆN ÍCH ----------

-- Trigger tự cập nhật cột updated_at mỗi khi hàng bị sửa.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Trả về true nếu câu lệnh đến từ người dùng cuối qua API (role anon/authenticated),
-- false nếu đến từ server (service_role) hoặc từ SQL Editor/migration (postgres).
-- Dùng trong các trigger "bảo vệ cột": chặn người dùng tự sửa cột nhạy cảm,
-- nhưng vẫn cho server/admin sửa bình thường.
create or replace function public.is_end_user_request()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated');
$$;


-- ---------- LỌC TỪ CẤM CƠ BẢN ----------
-- Danh sách từ cấm do admin quản lý (bảng banned_words tạo ở migration 0007).
-- Ở đây chỉ định nghĩa hàm chuẩn hóa chuỗi; hàm kiểm tra nằm ở 0007.

-- Chuẩn hóa chuỗi tiếng Việt để bắt các kiểu lách luật:
--   * về chữ thường
--   * đổi ký tự "leet" thường gặp: 0->o, 1->i, 3->e, 4->a, @->a, $->s, j->i (vd "đ1t", "djt")
--   * bỏ dấu câu kẹp giữa chữ ("d.m" -> "dm", "v-c-l" -> "vcl")
--   * gộp khoảng trắng
-- p_strip_accents = true  : bỏ luôn dấu tiếng Việt (dùng cho từ viết tắt không dấu như "vcl").
-- p_strip_accents = false : giữ dấu (dùng cho từ có dấu, tránh bắt nhầm "các", "lớn"...).
create or replace function public.normalize_vi_text(p_text text, p_strip_accents boolean)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v text;
begin
  if p_text is null then
    return null;
  end if;

  -- NFC: gộp chữ + dấu tổ hợp (một số bàn phím gõ ra dạng tách rời) về 1 ký tự.
  v := lower(normalize(p_text, NFC));
  v := translate(v, '013@4$j', 'oieaasi');

  if p_strip_accents then
    v := translate(
      v,
      'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
      'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
    );
  end if;

  -- Bỏ mọi ký tự không phải chữ/số/khoảng trắng (giữ chữ có dấu tiếng Việt).
  v := regexp_replace(v, '[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]', '', 'g');
  v := btrim(regexp_replace(v, '\s+', ' ', 'g'));
  return v;
end;
$$;
