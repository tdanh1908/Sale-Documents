-- =============================================================================
-- 0002 · HỒ SƠ NGƯỜI DÙNG (profiles)
-- -----------------------------------------------------------------------------
-- Mỗi tài khoản Supabase Auth (auth.users) có đúng 1 dòng profiles, tạo tự động
-- bằng trigger khi đăng ký. Chỉ thu thập: họ tên, biệt danh, tên trường, SĐT, email.
-- KHÔNG có cột địa chỉ (theo yêu cầu quyền riêng tư cho học sinh dưới 18 tuổi).
-- =============================================================================

create table public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  role                    public.user_role not null default 'student',
  email                   text,                       -- sao chép từ auth.users để admin tra cứu nhanh
  full_name               text check (char_length(full_name) <= 100),
  phone                   text check (phone ~ '^\+?[0-9]{9,15}$'),

  -- Biệt danh + tên trường: chỉ hiện công khai khi đã duyệt VÀ người dùng đã đồng ý.
  nickname                text check (char_length(nickname) between 2 and 30),
  nickname_status         public.moderation_status,   -- null khi chưa nhập
  nickname_flagged        boolean not null default false, -- bộ lọc tự động nghi có từ cấm
  school_name             text check (char_length(school_name) between 2 and 120),
  school_status           public.moderation_status,
  school_flagged          boolean not null default false,

  -- Đồng ý hiển thị tên/trường công khai (BXH, chia sẻ kết quả).
  public_display_consent    boolean not null default false,
  public_display_consent_at timestamptz,

  -- Đồng ý nhận email marketing (khác email giao dịch). Có thể hủy bất cứ lúc nào.
  marketing_consent         boolean not null default false,
  marketing_consent_at      timestamptz,
  marketing_unsubscribed_at timestamptz,

  -- Mã giới thiệu bạn bè của chính người này (in hoa, 8 ký tự).
  referral_code           text not null unique
                            default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
                            check (referral_code ~ '^[A-Z0-9]{6,16}$'),

  -- Nguồn khách lần đầu (UTM) để thống kê facebook/tiktok/youtube.
  first_utm_source        text check (char_length(first_utm_source) <= 100),
  first_utm_medium        text check (char_length(first_utm_medium) <= 100),
  first_utm_campaign      text check (char_length(first_utm_campaign) <= 100),

  -- Kiểm soát spam: admin khóa tài khoản / cấm chat tạm thời.
  is_banned               boolean not null default false,
  chat_muted_until        timestamptz,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.profiles is 'Hồ sơ người dùng, 1-1 với auth.users. Không lưu địa chỉ.';

create index profiles_role_idx on public.profiles (role) where role = 'admin';
-- Hàng đợi duyệt biệt danh / tên trường của admin.
create index profiles_nickname_pending_idx on public.profiles (updated_at) where nickname_status = 'pending';
create index profiles_school_pending_idx on public.profiles (updated_at) where school_status = 'pending';
create index profiles_email_idx on public.profiles (lower(email));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ---------- is_admin(): dùng trong mọi policy RLS ----------
-- SECURITY DEFINER: chạy với quyền chủ sở hữu hàm, KHÔNG bị RLS của profiles chặn,
-- nhờ đó tránh vòng lặp "policy của profiles gọi lại profiles".
-- set search_path = '' để chống tấn công chèn schema giả.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Người dùng hiện tại không bị khóa (dùng cho policy đăng bình luận, chat...).
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_banned = false
  );
$$;


-- ---------- Tự tạo profile khi có tài khoản mới ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 100), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Đồng bộ email khi người dùng đổi email trong Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();


-- ---------- Bảo vệ cột nhạy cảm của profiles ----------
-- RLS chỉ lọc theo HÀNG, không chặn được từng CỘT. Trigger này đảm bảo khi học sinh
-- tự sửa hồ sơ qua API thì:
--   * không thể tự nâng quyền (role), tự gỡ khóa, tự đổi trạng thái duyệt;
--   * sửa biệt danh / tên trường -> tự về 'pending' chờ admin duyệt lại;
--   * tự động gắn cờ nếu nghi có từ cấm (hàm contains_banned_words ở 0007).
-- Server (service_role) và admin không bị giới hạn.
create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_end_user_request() and not public.is_admin() then
    new.id                := old.id;
    new.role              := old.role;
    new.email             := old.email;
    new.referral_code     := old.referral_code;
    new.is_banned         := old.is_banned;
    new.chat_muted_until  := old.chat_muted_until;
    new.first_utm_source  := old.first_utm_source;
    new.first_utm_medium  := old.first_utm_medium;
    new.first_utm_campaign:= old.first_utm_campaign;
    new.nickname_status   := old.nickname_status;
    new.nickname_flagged  := old.nickname_flagged;
    new.school_status     := old.school_status;
    new.school_flagged    := old.school_flagged;
    new.created_at        := old.created_at;
  end if;

  -- Biệt danh mới hoặc vừa sửa -> chờ duyệt (áp dụng cho mọi nguồn trừ admin).
  if new.nickname is distinct from old.nickname and not public.is_admin() then
    new.nickname_status  := case when new.nickname is null then null else 'pending'::public.moderation_status end;
    new.nickname_flagged := coalesce(public.contains_banned_words(new.nickname), false);
  end if;

  if new.school_name is distinct from old.school_name and not public.is_admin() then
    new.school_status  := case when new.school_name is null then null else 'pending'::public.moderation_status end;
    new.school_flagged := coalesce(public.contains_banned_words(new.school_name), false);
  end if;

  -- Ghi lại thời điểm đồng ý / hủy đồng ý.
  if new.public_display_consent and not old.public_display_consent then
    new.public_display_consent_at := now();
  elsif not new.public_display_consent then
    new.public_display_consent_at := null;
  end if;

  if new.marketing_consent and not old.marketing_consent then
    new.marketing_consent_at := now();
    new.marketing_unsubscribed_at := null;
  elsif not new.marketing_consent and old.marketing_consent then
    new.marketing_unsubscribed_at := now();
  end if;

  return new;
end;
$$;
-- Lưu ý: hàm contains_banned_words được tạo ở migration 0007; plpgsql chỉ phân giải
-- tên hàm lúc chạy nên tạo trigger ở đây vẫn hợp lệ.

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();
