-- =============================================================================
-- 0010 · REALTIME: phát sự kiện thay đổi cho chat và thông báo
-- -----------------------------------------------------------------------------
-- Supabase Realtime chỉ gửi thay đổi của các bảng nằm trong publication
-- `supabase_realtime`. Realtime TÔN TRỌNG RLS: người dùng chỉ nhận tin của phòng
-- mình là thành viên và thông báo của chính mình.
-- Viết dạng kiểm tra trước để chạy lại nhiều lần không lỗi.
-- =============================================================================

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'Không có publication supabase_realtime (không phải môi trường Supabase) - bỏ qua';
    return;
  end if;

  foreach t in array array['chat_messages', 'notifications'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
