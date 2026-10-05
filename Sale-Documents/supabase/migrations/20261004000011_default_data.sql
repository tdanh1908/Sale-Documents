-- =============================================================================
-- 0011 · DỮ LIỆU MẶC ĐỊNH (bắt buộc để web chạy)
-- -----------------------------------------------------------------------------
-- Đặt trong migration (thay vì seed.sql) vì `supabase db push` lên project thật
-- không chạy seed.sql. Dùng ON CONFLICT DO NOTHING: chạy lại không ghi đè những gì
-- admin đã chỉnh trong trang quản trị.
-- =============================================================================

-- ---------- Khối thi (theo PROJECT_SPEC). Không có khối nào chứa Văn. ----------
insert into public.combos (code, name, subjects, position) values
  ('A00', 'Toán - Lý - Hóa',  array['toan', 'ly',   'hoa' ]::public.subject[], 1),
  ('A01', 'Toán - Lý - Anh',  array['toan', 'ly',   'anh' ]::public.subject[], 2),
  ('A02', 'Toán - Lý - Sinh', array['toan', 'ly',   'sinh']::public.subject[], 3),
  ('B00', 'Toán - Hóa - Sinh',array['toan', 'hoa',  'sinh']::public.subject[], 4),
  ('D07', 'Toán - Hóa - Anh', array['toan', 'hoa',  'anh' ]::public.subject[], 5),
  ('D08', 'Toán - Sinh - Anh',array['toan', 'sinh', 'anh' ]::public.subject[], 6)
on conflict (code) do nothing;


-- ---------- Cài đặt mặc định (admin chỉnh trong trang quản trị) ----------
insert into public.site_settings (key, value, is_public, description) values
  -- Giá
  ('pricing.price_per_page_default', '500',  true,  'Đơn giá mặc định mỗi trang (đ) khi đăng tài liệu mới'),
  ('pricing.price_per_page_min',     '500',  false, 'Đơn giá/trang tối thiểu admin được chọn'),
  ('pricing.price_per_page_max',     '750',  false, 'Đơn giá/trang tối đa admin được chọn'),
  ('pricing.download_multiplier',    '1.2',  false, 'Giá tải về = giá xem x hệ số này'),
  ('pricing.round_to',               '500',  false, 'Làm tròn giá tải về tới bội số này (đ)'),
  -- Đơn hàng
  ('order.min_amount',               '2000', true,  'Đơn tối thiểu (đ). Tổng sau giảm 1-1.999đ thì thu bằng mức này'),
  ('order.upgrade_min_amount',       '2000', true,  'Phụ phí nâng cấp từ Xem lên Tải tối thiểu (đ)'),
  ('order.pending_expiry_minutes',   '30',   false, 'Đơn chờ chuyển khoản tự hết hạn sau số phút này'),
  -- Premium
  ('premium.price',                  '59000', true, 'Giá gói Premium (đ)'),
  ('premium.duration_days',          '30',    true, 'Số ngày của một kỳ Premium'),
  ('premium.download_slots',         '5',     true, 'Số tài liệu khác nhau được tải trong một kỳ Premium'),
  -- File
  ('files.signed_url_ttl_seconds',   '300',  false, 'Thời gian sống của link xem/tải file (giây)'),
  -- Liên hệ (nút cố định trên web)
  ('contact.zalo_group_url',         '""',   true,  'Link "Tham gia nhóm Zalo"'),
  ('contact.zalo_url',               '""',   true,  'Link chat Zalo với admin'),
  ('contact.messenger_url',          '""',   true,  'Link chat Messenger fanpage')
on conflict (key) do nothing;


-- ---------- Danh sách từ cấm cơ bản (admin tự bổ sung trong trang quản trị) ----------
-- match_ascii = false: so trên chữ CÒN dấu (tránh bắt nhầm "các", "lớn", "buổi"...)
-- match_ascii = true : so trên chữ ĐÃ bỏ dấu (từ viết tắt). Không đưa "vl" vào vì học
--                      sinh hay viết tắt "Vật lý".
insert into public.banned_words (word, match_ascii) values
  ('địt',  false),
  ('lồn',  false),
  ('cặc',  false),
  ('buồi', false),
  ('đụ',   false),
  ('đéo',  false),
  ('dit',  true),   -- bắt cả "đ1t", "djt", "dit"
  ('dm',   true),
  ('dmm',  true),
  ('dcm',  true),
  ('dkm',  true),
  ('vcl',  true),
  ('vkl',  true),
  ('clm',  true),
  ('cmm',  true),
  ('fuck', true),
  ('shit', true)
on conflict (word) do nothing;
