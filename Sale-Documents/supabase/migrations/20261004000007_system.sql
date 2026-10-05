-- =============================================================================
-- 0007 · HỆ THỐNG: cài đặt, thống kê, nhật ký admin, hàng đợi email, từ cấm,
--        hàm kiểm tra quyền dùng chung, view hồ sơ công khai
-- =============================================================================

-- ---------- site_settings: cài đặt admin chỉnh được không cần sửa code ----------
-- value dạng jsonb để chứa số, chuỗi hoặc object.
-- is_public = true: trình duyệt được đọc (vd link nhóm Zalo); false: chỉ server/admin.
create table public.site_settings (
  key          text primary key check (key ~ '^[a-z0-9_.]{2,64}$'),
  value        jsonb not null,
  is_public    boolean not null default false,
  description  text check (char_length(description) <= 500),
  updated_by   uuid references public.profiles (id) on delete set null,
  updated_at   timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();


-- ---------- analytics_events: sự kiện thống kê (UTM, xem trang, thêm giỏ...) ----------
-- Ghi qua server (route API có giới hạn tần suất), không cho trình duyệt ghi thẳng.
create table public.analytics_events (
  id             bigint generated always as identity primary key,
  event_name     text not null check (event_name ~ '^[a-z0-9_.]{2,64}$'), -- vd: page_view, add_to_cart, purchase
  user_id        uuid references public.profiles (id) on delete set null,
  anonymous_id   text check (char_length(anonymous_id) <= 64),            -- id ngẫu nhiên lưu ở cookie
  session_id     text check (char_length(session_id) <= 64),
  path           text check (char_length(path) <= 500),
  document_id    uuid references public.documents (id) on delete set null,
  exam_id        uuid references public.exams (id) on delete set null,
  exam_event_id  uuid references public.exam_events (id) on delete set null,
  utm_source     text check (char_length(utm_source) <= 100),
  utm_medium     text check (char_length(utm_medium) <= 100),
  utm_campaign   text check (char_length(utm_campaign) <= 100),
  referrer       text check (char_length(referrer) <= 500),
  properties     jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_name_idx on public.analytics_events (event_name, created_at desc);
create index analytics_events_utm_idx on public.analytics_events (utm_source, created_at desc) where utm_source is not null;
create index analytics_events_document_idx on public.analytics_events (document_id, created_at desc) where document_id is not null;
create index analytics_events_event_idx on public.analytics_events (exam_event_id) where exam_event_id is not null;


-- ---------- audit_logs: nhật ký mọi thao tác của admin ----------
-- Chỉ ghi thêm (append-only): không ai sửa/xóa qua API, kể cả admin.
create table public.audit_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid references public.profiles (id) on delete set null,
  action       text not null check (char_length(action) between 2 and 100), -- vd: document.update_price
  entity_type  text not null check (char_length(entity_type) between 2 and 64),
  entity_id    text,
  before_data  jsonb,
  after_data   jsonb,
  ip_hash      text,
  user_agent   text check (char_length(user_agent) <= 500),
  created_at   timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);


-- ---------- email_outbox: hàng đợi email gửi nền ----------
-- Webhook thanh toán chỉ cần INSERT 1 dòng rồi trả lời ngay; cron/worker gửi sau,
-- tự thử lại khi lỗi. dedupe_key UNIQUE (vd 'order_paid:<order_id>') -> webhook gọi
-- lặp cũng không sinh email trùng.
create table public.email_outbox (
  id                   uuid primary key default gen_random_uuid(),
  dedupe_key           text not null unique check (char_length(dedupe_key) <= 200),
  to_email             text not null check (to_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  user_id              uuid references public.profiles (id) on delete set null,
  template             text not null check (template ~ '^[a-z0-9_.]{2,64}$'), -- vd: order_confirmation
  payload              jsonb not null default '{}'::jsonb,
  status               public.email_status not null default 'pending',
  attempts             integer not null default 0 check (attempts >= 0),
  max_attempts         integer not null default 5 check (max_attempts between 1 and 20),
  next_attempt_at      timestamptz not null default now(),
  last_error           text,
  provider_message_id  text,
  sent_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index email_outbox_queue_idx on public.email_outbox (next_attempt_at) where status in ('pending', 'failed');

create trigger email_outbox_set_updated_at
  before update on public.email_outbox
  for each row execute function public.set_updated_at();


-- ---------- banned_words: danh sách từ cấm (admin tự thêm/bớt) ----------
--   match_ascii = false : so khớp trên chuỗi CÒN dấu (từ có dấu như "địt" — tránh bắt nhầm
--                          các từ thường khi bỏ dấu như "các", "lớn").
--   match_ascii = true  : so khớp trên chuỗi ĐÃ bỏ dấu (từ viết tắt / không dấu như "vcl", "dm").
-- Từ được so theo NGUYÊN TỪ (có ranh giới khoảng trắng), không bắt chuỗi con
-- (vd "dm" không bắt nhầm "admin").
create table public.banned_words (
  id           uuid primary key default gen_random_uuid(),
  word         text not null unique check (char_length(word) between 1 and 60),
  match_ascii  boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Trả về true nếu chuỗi chứa từ cấm. SECURITY DEFINER: bảng banned_words chỉ admin
-- đọc được, nhưng mọi trigger kiểm duyệt cần dùng.
create or replace function public.contains_banned_words(p_text text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_plain  text;  -- còn dấu
  v_ascii  text;  -- bỏ dấu
begin
  if p_text is null or btrim(p_text) = '' then
    return false;
  end if;

  v_plain := ' ' || public.normalize_vi_text(p_text, false) || ' ';
  v_ascii := ' ' || public.normalize_vi_text(p_text, true) || ' ';

  return exists (
    select 1
    from public.banned_words b
    where b.is_active
      and position(
            ' ' || public.normalize_vi_text(b.word, b.match_ascii) || ' '
            in case when b.match_ascii then v_ascii else v_plain end
          ) > 0
  );
end;
$$;


-- ---------- Hàm kiểm tra quyền dùng chung (cho RLS và server) ----------

-- Người dùng hiện tại có kỳ Premium còn hạn không.
create or replace function public.has_active_premium()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.premium_subscriptions s
    where s.user_id = auth.uid()
      and now() >= s.starts_at
      and now() <  s.ends_at
  );
$$;

-- Người dùng hiện tại có được XEM đầy đủ tài liệu này không:
--   * tài liệu miễn phí đang bán: chỉ cần đăng nhập
--   * đã mua (entitlements): luôn được, kể cả khi tài liệu đã bị gỡ
--   * Premium còn hạn: mọi tài liệu có phí đang bán
-- Lưu ý: việc cấp signed URL vẫn kiểm tra lại ở server; hàm này dùng cho RLS
-- (vd chỉ người đã xem được tài liệu mới được đánh giá).
create or replace function public.can_access_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (
      select 1 from public.documents d
      where d.id = p_document_id and d.status = 'published' and d.is_free
    )
    or exists (
      select 1 from public.entitlements e
      where e.document_id = p_document_id and e.user_id = auth.uid()
    )
    or (
      public.has_active_premium()
      and exists (
        select 1 from public.documents d
        where d.id = p_document_id and d.status = 'published' and not d.is_free
      )
    )
  );
$$;


-- ---------- public_profiles: thông tin được phép hiện công khai ----------
-- View này CỐ Ý chạy với quyền chủ sở hữu (không security_invoker) để đọc được
-- profiles vượt RLS, nhưng CHỈ lộ các cột an toàn:
--   * biệt danh / tên trường đã duyệt ('approved'), hoặc '****' nếu admin chọn che;
--   * chỉ của người đã tick đồng ý hiển thị công khai.
-- KHÔNG có họ tên thật, SĐT, email. Dùng cho BXH, thẻ chia sẻ kết quả, bình luận.
create view public.public_profiles as
select
  p.id,
  case p.nickname_status
    when 'approved' then p.nickname
    when 'masked'   then '****'
  end as nickname,
  case p.school_status
    when 'approved' then p.school_name
    when 'masked'   then '****'
  end as school_name
from public.profiles p
where p.public_display_consent
  and not p.is_banned;

comment on view public.public_profiles is
  'Hồ sơ công khai: chỉ biệt danh/trường đã duyệt của người đã đồng ý. Không lộ tên thật, SĐT, email.';

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
