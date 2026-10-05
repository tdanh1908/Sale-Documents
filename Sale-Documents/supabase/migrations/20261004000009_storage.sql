-- =============================================================================
-- 0009 · SUPABASE STORAGE: 3 bucket + policy
-- -----------------------------------------------------------------------------
--   previews  (PUBLIC)  : file demo 3 trang, ai cũng xem được qua URL công khai
--   covers    (PUBLIC)  : ảnh bìa tài liệu, banner kỳ thi
--   documents (PRIVATE) : FILE ĐẦY ĐỦ. Không ai đọc trực tiếp được; server kiểm tra
--                         quyền rồi tạo signed URL hết hạn sau vài phút.
--
-- Lưu ý:
--   * Bảng storage.objects đã được Supabase bật RLS sẵn, không cần (và không nên)
--     ALTER TABLE ở đây.
--   * Bucket public phục vụ file qua đường dẫn /storage/v1/object/public/... mà KHÔNG cần
--     policy SELECT. Vì vậy ta cố ý KHÔNG tạo policy SELECT cho khách -> khách không
--     "liệt kê" được toàn bộ file trong bucket qua API, chỉ mở được file khi biết đường dẫn.
--   * Gói Supabase Free giới hạn mỗi file tối đa 50 MB (toàn project). Nếu nâng gói,
--     có thể tăng file_size_limit của bucket documents.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('previews',  'previews',  true,  20971520, array['application/pdf']),                       -- 20 MB
  ('covers',    'covers',    true,  5242880,  array['image/webp', 'image/jpeg', 'image/png']), -- 5 MB
  ('documents', 'documents', false, 52428800, array['application/pdf'])                        -- 50 MB
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- Admin xem/liệt kê file ở cả 3 bucket (trang quản trị tài liệu).
create policy "storage: admin xem file"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('previews', 'covers', 'documents') and (select public.is_admin()));

-- Chỉ admin upload file (kéo thả trong trang admin). Học sinh không upload được gì.
create policy "storage: admin upload file"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('previews', 'covers', 'documents') and (select public.is_admin()));

-- Chỉ admin thay file (upsert khi "Thay file PDF").
create policy "storage: admin sửa file"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('previews', 'covers', 'documents') and (select public.is_admin()))
  with check (bucket_id in ('previews', 'covers', 'documents') and (select public.is_admin()));

-- Chỉ admin xóa file.
create policy "storage: admin xóa file"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('previews', 'covers', 'documents') and (select public.is_admin()));

-- KHÔNG có policy nào cho học sinh/khách ở bucket `documents`:
-- file đầy đủ chỉ đến tay người dùng qua signed URL do server (service_role) tạo
-- sau khi kiểm tra quyền (đã mua / Premium / tài liệu miễn phí + đã đăng nhập).
