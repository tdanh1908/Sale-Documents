-- =============================================================================
-- 0006 · TƯƠNG TÁC: bình luận, báo cáo, đánh giá sao, chat, thông báo
-- =============================================================================

-- ---------- comments: bình luận (hiện ngay khi đăng, tự ẩn nếu dính từ cấm) ----------
create table public.comments (
  id               uuid primary key default gen_random_uuid(),
  -- Bình luận gắn với đúng 1 đối tượng: tài liệu HOẶC đề thi.
  document_id      uuid references public.documents (id) on delete cascade,
  exam_id          uuid references public.exams (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  parent_id        uuid references public.comments (id) on delete cascade, -- trả lời bình luận khác
  content          text not null check (char_length(btrim(content)) between 1 and 1000),
  status           public.content_status not null default 'visible',
  flagged_reason   text,
  report_count     integer not null default 0 check (report_count >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (num_nonnulls(document_id, exam_id) = 1)
);

create index comments_document_idx on public.comments (document_id, created_at desc) where status = 'visible';
create index comments_exam_idx on public.comments (exam_id, created_at desc) where status = 'visible';
create index comments_user_idx on public.comments (user_id, created_at desc);
create index comments_moderation_idx on public.comments (created_at desc) where status <> 'visible' or report_count > 0;

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- Bảo vệ cột + lọc từ cấm khi học sinh đăng/sửa bình luận.
--   * Học sinh không tự đặt status / report_count / user_id khác mình.
--   * Nội dung dính từ cấm -> status = 'auto_hidden' (admin nhận thông báo qua Telegram ở server).
create or replace function public.comments_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'visible';
      new.report_count := 0;
      new.flagged_reason := null;
    else
      new.user_id      := old.user_id;
      new.document_id  := old.document_id;
      new.exam_id      := old.exam_id;
      new.parent_id    := old.parent_id;
      new.report_count := old.report_count;
      new.created_at   := old.created_at;
      -- Admin đã ẩn thì học sinh sửa nội dung cũng không tự hiện lại được.
      new.status       := case when old.status = 'admin_hidden' then old.status else 'visible' end;
      new.flagged_reason := old.flagged_reason;
    end if;

    if new.status = 'visible' and public.contains_banned_words(new.content) then
      new.status := 'auto_hidden';
      new.flagged_reason := 'banned_word';
    end if;
  end if;
  return new;
end;
$$;

create trigger comments_guard
  before insert or update on public.comments
  for each row execute function public.comments_guard();


-- ---------- comment_reports: nút "Báo cáo" bình luận ----------
create table public.comment_reports (
  id           uuid primary key default gen_random_uuid(),
  comment_id   uuid not null references public.comments (id) on delete cascade,
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  reason       text check (char_length(reason) <= 500),
  status       public.report_status not null default 'open',
  created_at   timestamptz not null default now(),
  unique (comment_id, reporter_id)  -- mỗi người báo cáo 1 bình luận 1 lần
);

create index comment_reports_open_idx on public.comment_reports (created_at desc) where status = 'open';

-- Tăng report_count của bình luận khi có báo cáo mới.
-- SECURITY DEFINER vì người báo cáo không có quyền sửa bình luận của người khác.
create or replace function public.comment_reports_bump_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.comments
     set report_count = report_count + 1
   where id = new.comment_id;
  return new;
end;
$$;

create trigger comment_reports_bump_count
  after insert on public.comment_reports
  for each row execute function public.comment_reports_bump_count();

-- Học sinh tạo báo cáo luôn ở trạng thái 'open'.
create or replace function public.comment_reports_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin() then
    new.status := 'open';
  end if;
  return new;
end;
$$;

create trigger comment_reports_guard
  before insert on public.comment_reports
  for each row execute function public.comment_reports_guard();


-- ---------- reviews: đánh giá sao 1-5, mỗi người 1 lần / tài liệu ----------
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  content      text check (char_length(content) <= 1000),
  status       public.content_status not null default 'visible',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, document_id)
);

create index reviews_document_idx on public.reviews (document_id, created_at desc) where status = 'visible';

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Bảo vệ cột + lọc từ cấm cho phần nhận xét.
create or replace function public.reviews_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin() then
    if tg_op = 'UPDATE' then
      new.user_id     := old.user_id;
      new.document_id := old.document_id;
      new.created_at  := old.created_at;
      new.status      := case when old.status = 'admin_hidden' then old.status else 'visible' end;
    else
      new.status := 'visible';
    end if;

    if new.status = 'visible' and public.contains_banned_words(new.content) then
      new.status := 'auto_hidden';
    end if;
  end if;
  return new;
end;
$$;

create trigger reviews_guard
  before insert or update on public.reviews
  for each row execute function public.reviews_guard();

-- Cập nhật điểm trung bình + số lượt đánh giá trên documents (chỉ tính đánh giá đang hiện).
create or replace function public.reviews_refresh_document_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc uuid := coalesce(new.document_id, old.document_id);
begin
  update public.documents d
     set rating_avg   = coalesce(r.avg_rating, 0),
         rating_count = coalesce(r.cnt, 0)
    from (
      select round(avg(rating)::numeric, 2) as avg_rating, count(*)::integer as cnt
      from public.reviews
      where document_id = v_doc and status = 'visible'
    ) r
   where d.id = v_doc;
  return null;
end;
$$;

create trigger reviews_refresh_document_rating
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_refresh_document_rating();


-- ---------- chat_rooms ----------
--   support : học sinh <-> admin, có thể gắn với 1 tài liệu (mỗi học sinh 1 phòng / tài liệu)
--   group   : phòng nhóm do học sinh tạo; admin khóa/xóa được
create table public.chat_rooms (
  id               uuid primary key default gen_random_uuid(),
  type             public.chat_room_type not null,
  name             text check (char_length(btrim(name)) between 2 and 80),
  description      text check (char_length(description) <= 500),
  document_id      uuid references public.documents (id) on delete set null,
  owner_id         uuid references public.profiles (id) on delete set null,
  is_public        boolean not null default true,   -- phòng nhóm có hiện trong danh sách không
  is_locked        boolean not null default false,  -- admin khóa: không ai gửi tin được
  locked_reason    text,
  max_members      integer not null default 200 check (max_members between 2 and 1000),
  last_message_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (type <> 'group' or name is not null)
);

-- Mỗi học sinh chỉ có 1 phòng hỗ trợ cho mỗi tài liệu (hoặc 1 phòng hỗ trợ chung khi document_id null).
create unique index chat_rooms_support_unique_idx
  on public.chat_rooms (owner_id, coalesce(document_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where type = 'support';
create index chat_rooms_public_groups_idx on public.chat_rooms (last_message_at desc nulls last)
  where type = 'group' and is_public;
create index chat_rooms_owner_idx on public.chat_rooms (owner_id);

create trigger chat_rooms_set_updated_at
  before update on public.chat_rooms
  for each row execute function public.set_updated_at();


-- ---------- chat_room_members: thành viên phòng nhóm ----------
create table public.chat_room_members (
  room_id    uuid not null references public.chat_rooms (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index chat_room_members_user_idx on public.chat_room_members (user_id);


-- ---------- Hàm hỗ trợ RLS cho chat (SECURITY DEFINER để tránh đệ quy policy) ----------

-- Đếm hoạt động gần đây của người dùng hiện tại (phục vụ chống spam).
-- SECURITY DEFINER để đếm đủ mọi dòng của người đó, không bị RLS che bớt
-- (vd tin nhắn ở phòng đã rời). Không thể đặt SECURITY DEFINER cho chính trigger
-- guard vì guard cần biết role thật của người gọi (is_end_user_request).
-- (plpgsql: thân hàm chỉ phân giải lúc chạy, vì bảng chat_messages tạo ở phía dưới.)
create or replace function public.recent_chat_activity_count(p_kind text, p_window interval)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_kind = 'message' then
    return (
      select count(*)::integer from public.chat_messages
      where user_id = auth.uid() and created_at > now() - p_window
    );
  elsif p_kind = 'group_room' then
    return (
      select count(*)::integer from public.chat_rooms
      where owner_id = auth.uid() and type = 'group' and created_at > now() - p_window
    );
  end if;
  return 0;
end;
$$;

-- Người dùng hiện tại có phải thành viên phòng không (owner phòng support cũng tính).
create or replace function public.is_chat_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.chat_room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  ) or exists (
    select 1 from public.chat_rooms r
    where r.id = p_room_id and r.owner_id = auth.uid()
  );
$$;

-- Người dùng hiện tại có được gửi tin vào phòng không:
-- là thành viên, phòng không bị khóa, tài khoản không bị khóa / không bị cấm chat.
create or replace function public.can_post_in_chat_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_chat_room_member(p_room_id)
     and exists (select 1 from public.chat_rooms r where r.id = p_room_id and not r.is_locked)
     and exists (
       select 1 from public.profiles p
       where p.id = auth.uid()
         and not p.is_banned
         and (p.chat_muted_until is null or p.chat_muted_until < now())
     );
$$;

-- Khi học sinh tạo phòng: ép owner = chính mình, không tự mở khóa; tự thêm owner làm thành viên.
-- Chống spam: tối đa 3 phòng nhóm mới / người / 24 giờ.
create or replace function public.chat_rooms_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.owner_id := auth.uid();
      new.is_locked := false;
      new.locked_reason := null;
      new.last_message_at := null;
      if new.type = 'group' and public.recent_chat_activity_count('group_room', interval '24 hours') >= 3 then
        raise exception 'Bạn đã tạo quá nhiều phòng chat hôm nay' using hint = 'chat_room_rate_limited';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger chat_rooms_guard
  before insert on public.chat_rooms
  for each row execute function public.chat_rooms_guard();

create or replace function public.chat_rooms_add_owner_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null then
    insert into public.chat_room_members (room_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict do nothing;
  end if;
  return null;
end;
$$;

create trigger chat_rooms_add_owner_member
  after insert on public.chat_rooms
  for each row execute function public.chat_rooms_add_owner_member();

-- Giới hạn số thành viên phòng nhóm.
create or replace function public.chat_room_members_enforce_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
begin
  select max_members into v_max from public.chat_rooms where id = new.room_id for update;
  if (select count(*) from public.chat_room_members where room_id = new.room_id) >= v_max then
    raise exception 'Phòng chat đã đủ thành viên' using hint = 'chat_room_full';
  end if;
  return new;
end;
$$;

create trigger chat_room_members_enforce_limit
  before insert on public.chat_room_members
  for each row execute function public.chat_room_members_enforce_limit();


-- ---------- chat_messages ----------
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.chat_rooms (id) on delete cascade,
  user_id     uuid references public.profiles (id) on delete set null,
  content     text not null check (char_length(btrim(content)) between 1 and 2000),
  is_hidden   boolean not null default false,   -- tự ẩn do từ cấm, hoặc admin ẩn
  deleted_at  timestamptz,                      -- admin xóa (giữ lại để đối chiếu)
  created_at  timestamptz not null default now()
);

create index chat_messages_room_idx on public.chat_messages (room_id, created_at desc);
create index chat_messages_user_idx on public.chat_messages (user_id, created_at desc);

-- Chống spam + lọc từ cấm khi học sinh gửi tin:
--   * user_id luôn là chính mình
--   * tối đa 5 tin / 10 giây / người
--   * dính từ cấm -> is_hidden = true
create or replace function public.chat_messages_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin() then
    new.user_id := auth.uid();
    new.deleted_at := null;
    new.created_at := now();
    new.is_hidden := coalesce(public.contains_banned_words(new.content), false);

    if public.recent_chat_activity_count('message', interval '10 seconds') >= 5 then
      raise exception 'Bạn gửi tin quá nhanh, vui lòng chờ một chút' using hint = 'chat_rate_limited';
    end if;
  end if;
  return new;
end;
$$;

create trigger chat_messages_guard
  before insert on public.chat_messages
  for each row execute function public.chat_messages_guard();

-- Cập nhật last_message_at của phòng để sắp xếp danh sách phòng.
create or replace function public.chat_messages_touch_room()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chat_rooms set last_message_at = new.created_at where id = new.room_id;
  return null;
end;
$$;

create trigger chat_messages_touch_room
  after insert on public.chat_messages
  for each row execute function public.chat_messages_touch_room();


-- ---------- notifications: thông báo trong web cho từng người ----------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type ~ '^[a-z0-9_.]{2,64}$'), -- vd: order.paid, coupon.gifted, exam_event.started
  title       text not null check (char_length(title) <= 200),
  body        text check (char_length(body) <= 2000),
  link        text check (char_length(link) <= 500),            -- đường dẫn nội bộ, vd /tai-khoan/don-hang
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- Học sinh chỉ được sửa đúng cột read_at (đánh dấu đã đọc).
create or replace function public.notifications_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin()
     and (to_jsonb(new) - 'read_at') is distinct from (to_jsonb(old) - 'read_at') then
    raise exception 'Chỉ được đánh dấu thông báo đã đọc';
  end if;
  return new;
end;
$$;

create trigger notifications_guard
  before update on public.notifications
  for each row execute function public.notifications_guard();
