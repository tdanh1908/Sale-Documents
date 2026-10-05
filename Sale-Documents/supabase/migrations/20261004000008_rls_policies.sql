-- =============================================================================
-- 0008 · ROW LEVEL SECURITY (RLS) CHO TẤT CẢ BẢNG
-- -----------------------------------------------------------------------------
-- CÁCH ĐỌC FILE NÀY
--   * Bật RLS = mặc định CHẶN HẾT. Chỉ những gì có policy mới được phép.
--   * Bảng không có policy cho anon/authenticated => trình duyệt không đọc/ghi được gì,
--     chỉ server (service_role, luôn vượt RLS) mới thao tác được.
--   * Vai trò:
--       anon          : khách chưa đăng nhập
--       authenticated : người đã đăng nhập (học sinh hoặc admin)
--       service_role  : server Next.js (key bí mật, KHÔNG BAO GIỜ gửi xuống trình duyệt)
--   * Admin = profiles.role = 'admin', kiểm tra bằng hàm public.is_admin().
--   * Viết (select auth.uid()) / (select public.is_admin()) thay vì gọi trực tiếp để
--     Postgres tính 1 lần cho cả câu truy vấn (nhanh hơn nhiều khi bảng lớn).
--   * RLS lọc theo HÀNG. Việc chặn sửa từng CỘT nhạy cảm (role, status, điểm...) do các
--     trigger *_guard ở các migration trước đảm nhiệm.
--
-- NGUYÊN TẮC CHUNG
--   1. Người dùng chỉ đọc dữ liệu của chính mình.
--   2. Người dùng chỉ tự GHI ở những chỗ an toàn (hồ sơ, bình luận, đánh giá, chat,
--      đánh dấu đã đọc thông báo). Mọi thứ liên quan TIỀN / QUYỀN / ĐIỂM (đơn hàng,
--      quyền truy cập, lượt thi, mã giảm giá...) chỉ server ghi, nếu không người dùng có
--      thể tự đặt đơn "đã thanh toán" hoặc tự sửa điểm.
--   3. Dữ liệu công khai (tài liệu đang bán, đề đã xuất bản...) chỉ cho ĐỌC metadata.
--      File đầy đủ không bao giờ đọc được qua bảng; server cấp signed URL vài phút.
--   4. Admin được ghi các bảng quản trị.
-- =============================================================================


-- =============================================================================
-- BẬT RLS CHO MỌI BẢNG
-- =============================================================================
alter table public.profiles                         enable row level security;
alter table public.documents                        enable row level security;
alter table public.document_files                   enable row level security;
alter table public.document_price_history           enable row level security;
alter table public.bundles                          enable row level security;
alter table public.bundle_items                     enable row level security;
alter table public.flash_sales                      enable row level security;
alter table public.flash_sale_items                 enable row level security;
alter table public.topic_documents                  enable row level security;
alter table public.combos                           enable row level security;
alter table public.exams                            enable row level security;
alter table public.exam_private                     enable row level security;
alter table public.questions                        enable row level security;
alter table public.exam_events                      enable row level security;
alter table public.exam_event_items                 enable row level security;
alter table public.event_coupon_templates           enable row level security;
alter table public.event_coupon_template_documents  enable row level security;
alter table public.attempts                         enable row level security;
alter table public.coupons                          enable row level security;
alter table public.coupon_documents                 enable row level security;
alter table public.referrals                        enable row level security;
alter table public.user_coupons                     enable row level security;
alter table public.orders                           enable row level security;
alter table public.order_items                      enable row level security;
alter table public.payment_transactions             enable row level security;
alter table public.entitlements                     enable row level security;
alter table public.coupon_redemptions               enable row level security;
alter table public.premium_subscriptions            enable row level security;
alter table public.premium_download_slots           enable row level security;
alter table public.download_logs                    enable row level security;
alter table public.comments                         enable row level security;
alter table public.comment_reports                  enable row level security;
alter table public.reviews                          enable row level security;
alter table public.chat_rooms                       enable row level security;
alter table public.chat_room_members                enable row level security;
alter table public.chat_messages                    enable row level security;
alter table public.notifications                    enable row level security;
alter table public.site_settings                    enable row level security;
alter table public.analytics_events                 enable row level security;
alter table public.audit_logs                       enable row level security;
alter table public.email_outbox                     enable row level security;
alter table public.banned_words                     enable row level security;


-- =============================================================================
-- NHÓM 1 · HỒ SƠ NGƯỜI DÙNG
-- =============================================================================

-- Học sinh chỉ xem được hồ sơ của chính mình (có SĐT, email -> tuyệt đối không cho xem
-- hồ sơ người khác). Thông tin công khai lấy qua view public_profiles.
create policy "profiles: xem hồ sơ của mình"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- Học sinh tự sửa hồ sơ của mình. Trigger profiles_guard chặn tự đổi role, trạng thái
-- duyệt, khóa tài khoản; sửa biệt danh/trường tự về 'pending'.
create policy "profiles: sửa hồ sơ của mình"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Admin xem/sửa mọi hồ sơ (duyệt biệt danh, khóa tài khoản...).
-- Không có policy INSERT/DELETE cho học sinh: hồ sơ do trigger tạo khi đăng ký và
-- tự xóa theo tài khoản Auth.
create policy "profiles: admin toàn quyền"
  on public.profiles for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- NHÓM 2 · CỬA HÀNG (tài liệu, combo, flash sale)
-- =============================================================================

-- Ai cũng xem được METADATA tài liệu đang bán (tên, mô tả, giá, ảnh bìa...).
-- Bảng documents không chứa đường dẫn file đầy đủ nên an toàn để công khai.
create policy "documents: công khai xem tài liệu đang bán"
  on public.documents for select
  to anon, authenticated
  using (status = 'published');

-- Người đã mua vẫn thấy metadata tài liệu dù tài liệu đã bị gỡ (hidden) — để hiện trong
-- "Tài liệu của tôi" và đọc tiếp.
create policy "documents: người đã mua xem tài liệu đã gỡ"
  on public.documents for select
  to authenticated
  using (
    exists (
      select 1 from public.entitlements e
      where e.document_id = documents.id
        and e.user_id = (select auth.uid())
    )
  );

-- Chỉ admin tạo/sửa/gỡ/xóa tài liệu. (Xóa vĩnh viễn bị khóa ngoại chặn nếu đã có người mua.)
create policy "documents: admin toàn quyền"
  on public.documents for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()))
;

-- Chỉ lộ thông tin FILE DEMO (vốn nằm ở bucket public) của tài liệu đang bán.
-- Dòng file đầy đủ (kind = 'full') KHÔNG có policy đọc -> chỉ server biết đường dẫn.
create policy "document_files: công khai xem file demo"
  on public.document_files for select
  to anon, authenticated
  using (
    kind = 'demo'
    and is_current
    and exists (
      select 1 from public.documents d
      where d.id = document_files.document_id and d.status = 'published'
    )
  );

create policy "document_files: admin toàn quyền"
  on public.document_files for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Lịch sử giá chỉ admin xem. Không ai ghi trực tiếp: trigger tự ghi.
create policy "document_price_history: admin xem"
  on public.document_price_history for select
  to authenticated
  using ((select public.is_admin()));

-- Combo đang bật: ai cũng xem được để hiện ở cửa hàng.
create policy "bundles: công khai xem combo đang bật"
  on public.bundles for select
  to anon, authenticated
  using (is_active);

create policy "bundles: admin toàn quyền"
  on public.bundles for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Danh sách tài liệu trong combo đang bật.
create policy "bundle_items: công khai xem tài liệu trong combo đang bật"
  on public.bundle_items for select
  to anon, authenticated
  using (
    exists (select 1 from public.bundles b where b.id = bundle_items.bundle_id and b.is_active)
  );

create policy "bundle_items: admin toàn quyền"
  on public.bundle_items for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Flash sale đang bật (kể cả sắp diễn ra, để hiện đồng hồ đếm ngược).
create policy "flash_sales: công khai xem flash sale đang bật"
  on public.flash_sales for select
  to anon, authenticated
  using (is_active);

create policy "flash_sales: admin toàn quyền"
  on public.flash_sales for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "flash_sale_items: công khai xem tài liệu trong flash sale đang bật"
  on public.flash_sale_items for select
  to anon, authenticated
  using (
    exists (select 1 from public.flash_sales f where f.id = flash_sale_items.flash_sale_id and f.is_active)
  );

create policy "flash_sale_items: admin toàn quyền"
  on public.flash_sale_items for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Gán chủ đề -> tài liệu gợi ý: không nhạy cảm, công khai để trang kết quả thi đọc.
create policy "topic_documents: công khai xem"
  on public.topic_documents for select
  to anon, authenticated
  using (true);

create policy "topic_documents: admin toàn quyền"
  on public.topic_documents for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- NHÓM 3 · THI THỬ
-- =============================================================================

-- Khối thi đang bật: công khai (bộ lọc, BXH theo khối).
create policy "combos: công khai xem khối đang bật"
  on public.combos for select
  to anon, authenticated
  using (is_active);

create policy "combos: admin toàn quyền"
  on public.combos for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Metadata đề đã xuất bản: công khai. Không chứa đáp án (ở questions) hay link Azota
-- (ở exam_private).
create policy "exams: công khai xem đề đã xuất bản"
  on public.exams for select
  to anon, authenticated
  using (status = 'published');

create policy "exams: admin toàn quyền"
  on public.exams for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Link Azota: CHỈ admin. Học sinh nhận link qua server sau khi server kiểm tra quyền.
create policy "exam_private: admin toàn quyền"
  on public.exam_private for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Câu hỏi có đáp án đúng: CHỈ admin. Học sinh nhận đề (đã bỏ đáp án) qua server,
-- bài làm cũng chấm ở server.
create policy "questions: admin toàn quyền"
  on public.questions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Kỳ thi không còn ở trạng thái Nháp: công khai (trang chủ hiện kỳ thi đang/sắp diễn ra).
create policy "exam_events: công khai xem kỳ thi đã công bố"
  on public.exam_events for select
  to anon, authenticated
  using (status <> 'draft');

create policy "exam_events: admin toàn quyền"
  on public.exam_events for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Danh sách đề của kỳ thi đã công bố.
create policy "exam_event_items: công khai xem đề của kỳ thi đã công bố"
  on public.exam_event_items for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.exam_events ev
      where ev.id = exam_event_items.exam_event_id and ev.status <> 'draft'
    )
  );

create policy "exam_event_items: admin toàn quyền"
  on public.exam_event_items for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Cấu hình mã tặng sau khi thi: chỉ admin (tránh lộ % giảm, số lượt...).
create policy "event_coupon_templates: admin toàn quyền"
  on public.event_coupon_templates for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "event_coupon_template_documents: admin toàn quyền"
  on public.event_coupon_template_documents for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem lại các lượt thi của mình. KHÔNG có policy ghi: bắt đầu thi, nộp bài,
-- chấm điểm đều do server làm (tránh tự sửa điểm). BXH lấy qua server/view riêng.
create policy "attempts: xem lượt thi của mình"
  on public.attempts for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "attempts: admin toàn quyền"
  on public.attempts for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- NHÓM 4 · BÁN HÀNG (chỉ đọc dữ liệu của mình, mọi thao tác ghi do server)
-- =============================================================================

-- Mã giảm giá công khai: KHÔNG cho học sinh liệt kê (tránh lộ toàn bộ mã). Học sinh nhập
-- mã -> server kiểm tra.
create policy "coupons: admin toàn quyền"
  on public.coupons for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "coupon_documents: admin toàn quyền"
  on public.coupon_documents for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem các lượt mình đã dùng mã.
create policy "coupon_redemptions: xem lượt dùng mã của mình"
  on public.coupon_redemptions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "coupon_redemptions: admin toàn quyền"
  on public.coupon_redemptions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem mã giảm giá riêng được tặng (hiện trong tài khoản, có đếm ngược).
create policy "user_coupons: xem mã riêng của mình"
  on public.user_coupons for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "user_coupons: admin toàn quyền"
  on public.user_coupons for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem các lượt giới thiệu liên quan đến mình (mình giới thiệu ai, ai giới thiệu mình).
create policy "referrals: xem giới thiệu liên quan đến mình"
  on public.referrals for select
  to authenticated
  using (referrer_id = (select auth.uid()) or referred_id = (select auth.uid()));

create policy "referrals: admin toàn quyền"
  on public.referrals for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem đơn hàng của mình. Tạo đơn / đổi trạng thái chỉ server làm
-- (tính giá ở server, xác nhận thanh toán qua webhook SePay).
create policy "orders: xem đơn của mình"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "orders: admin toàn quyền"
  on public.orders for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem chi tiết các dòng trong đơn của mình.
create policy "order_items: xem dòng đơn của mình"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = (select auth.uid())
    )
  );

create policy "order_items: admin toàn quyền"
  on public.order_items for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Giao dịch ngân hàng thô: chỉ admin xem để đối soát. Webhook ghi bằng service_role.
create policy "payment_transactions: admin toàn quyền"
  on public.payment_transactions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem quyền truy cập tài liệu mình đã mua (để hiện nút Đọc / Tải).
create policy "entitlements: xem quyền của mình"
  on public.entitlements for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "entitlements: admin toàn quyền"
  on public.entitlements for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem các kỳ Premium của mình (hạn dùng).
create policy "premium_subscriptions: xem Premium của mình"
  on public.premium_subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "premium_subscriptions: admin toàn quyền"
  on public.premium_subscriptions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem các suất tải Premium đã dùng ("Đã dùng 2/5 suất tải").
create policy "premium_download_slots: xem suất tải của mình"
  on public.premium_download_slots for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "premium_download_slots: admin toàn quyền"
  on public.premium_download_slots for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh xem lịch sử xem/tải của mình. Ghi log do server làm khi cấp signed URL.
create policy "download_logs: xem lịch sử của mình"
  on public.download_logs for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Admin chỉ ĐỌC nhật ký (không sửa/xóa để giữ tính toàn vẹn).
create policy "download_logs: admin xem"
  on public.download_logs for select
  to authenticated
  using ((select public.is_admin()));


-- =============================================================================
-- NHÓM 5 · TƯƠNG TÁC
-- =============================================================================

-- Ai cũng xem được bình luận đang hiện.
create policy "comments: công khai xem bình luận đang hiện"
  on public.comments for select
  to anon, authenticated
  using (status = 'visible');

-- Tác giả vẫn thấy bình luận của mình kể cả khi bị ẩn (biết để sửa lại).
create policy "comments: xem bình luận của mình"
  on public.comments for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Học sinh đăng bình luận dưới tên CHÍNH MÌNH, tài khoản không bị khóa.
-- Trigger comments_guard ép status và tự ẩn nếu dính từ cấm.
create policy "comments: đăng bình luận"
  on public.comments for insert
  to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_active_user()));

-- Học sinh sửa / xóa bình luận của mình.
create policy "comments: sửa bình luận của mình"
  on public.comments for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select public.is_active_user()));

create policy "comments: xóa bình luận của mình"
  on public.comments for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "comments: admin toàn quyền"
  on public.comments for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Học sinh báo cáo bình luận (dưới tên mình) và xem báo cáo của mình.
create policy "comment_reports: gửi báo cáo"
  on public.comment_reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()) and (select public.is_active_user()));

create policy "comment_reports: xem báo cáo của mình"
  on public.comment_reports for select
  to authenticated
  using (reporter_id = (select auth.uid()));

create policy "comment_reports: admin toàn quyền"
  on public.comment_reports for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Ai cũng xem được đánh giá đang hiện.
create policy "reviews: công khai xem đánh giá đang hiện"
  on public.reviews for select
  to anon, authenticated
  using (status = 'visible');

create policy "reviews: xem đánh giá của mình"
  on public.reviews for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Chỉ người XEM ĐƯỢC tài liệu mới được đánh giá: tài liệu miễn phí (đã đăng nhập),
-- đã mua, hoặc đang Premium. Mỗi người 1 lần / tài liệu (unique constraint).
create policy "reviews: đánh giá tài liệu đã xem được"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_active_user())
    and public.can_access_document(document_id)
  );

create policy "reviews: sửa đánh giá của mình"
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "reviews: xóa đánh giá của mình"
  on public.reviews for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "reviews: admin toàn quyền"
  on public.reviews for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Phòng chat: người đã đăng nhập thấy phòng nhóm công khai + các phòng mình tham gia
-- (gồm phòng hỗ trợ của chính mình). Khách chưa đăng nhập không thấy chat.
create policy "chat_rooms: xem phòng nhóm công khai và phòng của mình"
  on public.chat_rooms for select
  to authenticated
  using (
    (type = 'group' and is_public)
    or owner_id = (select auth.uid())
    or public.is_chat_room_member(id)
  );

-- Học sinh tạo phòng hỗ trợ (chat với admin) hoặc phòng nhóm, owner luôn là mình.
-- Trigger chat_rooms_guard giới hạn 3 phòng nhóm / 24h và tự thêm owner làm thành viên.
create policy "chat_rooms: tạo phòng"
  on public.chat_rooms for insert
  to authenticated
  with check (owner_id = (select auth.uid()) and (select public.is_active_user()));

-- Khóa / xóa / sửa phòng: chỉ admin.
create policy "chat_rooms: admin toàn quyền"
  on public.chat_rooms for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Thành viên phòng: chỉ người trong phòng thấy danh sách thành viên.
create policy "chat_room_members: thành viên xem danh sách"
  on public.chat_room_members for select
  to authenticated
  using (public.is_chat_room_member(room_id));

-- Tự tham gia phòng nhóm công khai, chưa bị khóa (chỉ thêm CHÍNH MÌNH, vai trò member).
create policy "chat_room_members: tham gia phòng nhóm công khai"
  on public.chat_room_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'member'
    and (select public.is_active_user())
    and exists (
      select 1 from public.chat_rooms r
      where r.id = chat_room_members.room_id
        and r.type = 'group' and r.is_public and not r.is_locked
    )
  );

-- Tự rời phòng.
create policy "chat_room_members: rời phòng"
  on public.chat_room_members for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "chat_room_members: admin toàn quyền"
  on public.chat_room_members for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Tin nhắn: chỉ thành viên phòng đọc được, và không thấy tin đã bị ẩn/xóa
-- (trừ tin của chính mình bị tự ẩn, để biết tin chưa được gửi công khai).
create policy "chat_messages: thành viên đọc tin trong phòng"
  on public.chat_messages for select
  to authenticated
  using (
    public.is_chat_room_member(room_id)
    and deleted_at is null
    and (not is_hidden or user_id = (select auth.uid()))
  );

-- Gửi tin: dưới tên mình, là thành viên, phòng không khóa, không bị cấm chat.
-- Trigger chat_messages_guard giới hạn 5 tin / 10 giây và tự ẩn tin dính từ cấm.
create policy "chat_messages: gửi tin"
  on public.chat_messages for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.can_post_in_chat_room(room_id));

-- Admin đọc mọi tin, ẩn/xóa tin, trả lời phòng hỗ trợ.
create policy "chat_messages: admin toàn quyền"
  on public.chat_messages for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Thông báo: học sinh xem thông báo của mình.
create policy "notifications: xem thông báo của mình"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Đánh dấu đã đọc. Trigger notifications_guard chỉ cho đổi cột read_at.
-- Tạo thông báo do server làm.
create policy "notifications: đánh dấu đã đọc"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications: admin toàn quyền"
  on public.notifications for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- NHÓM 6 · HỆ THỐNG
-- =============================================================================

-- Cài đặt có cờ is_public (link nhóm Zalo, Messenger, đơn tối thiểu...) ai cũng đọc được.
-- Cài đặt nội bộ (is_public = false) chỉ admin/server.
create policy "site_settings: công khai xem cài đặt public"
  on public.site_settings for select
  to anon, authenticated
  using (is_public);

create policy "site_settings: admin toàn quyền"
  on public.site_settings for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Thống kê: chỉ admin xem. Ghi do server (có giới hạn tần suất) — không cho trình duyệt
-- ghi thẳng để tránh bị bơm rác.
create policy "analytics_events: admin xem"
  on public.analytics_events for select
  to authenticated
  using ((select public.is_admin()));

-- Nhật ký admin: chỉ ĐỌC, kể cả admin cũng không sửa/xóa qua API. Server ghi thêm.
create policy "audit_logs: admin xem"
  on public.audit_logs for select
  to authenticated
  using ((select public.is_admin()));

-- Hàng đợi email: admin xem để kiểm tra email lỗi. Server ghi/gửi.
create policy "email_outbox: admin xem"
  on public.email_outbox for select
  to authenticated
  using ((select public.is_admin()));

-- Danh sách từ cấm: chỉ admin xem/sửa (trigger kiểm duyệt đọc qua hàm SECURITY DEFINER).
create policy "banned_words: admin toàn quyền"
  on public.banned_words for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));


-- =============================================================================
-- QUYỀN GỌI HÀM QUA API (RPC)
-- -----------------------------------------------------------------------------
-- Supabase cho phép gọi mọi hàm public qua /rest/v1/rpc. Thu hồi các hàm nội bộ
-- để người dùng không gọi trực tiếp; các hàm dùng trong policy vẫn giữ quyền
-- EXECUTE (policy chạy với quyền của người gọi nên cần quyền này).
-- =============================================================================
revoke execute on function public.normalize_vi_text(text, boolean) from public, anon, authenticated;
revoke execute on function public.contains_banned_words(text) from public, anon, authenticated;
revoke execute on function public.recent_chat_activity_count(text, interval) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
