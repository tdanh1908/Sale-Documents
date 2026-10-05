-- =============================================================================
-- 0005 · BÁN HÀNG: mã giảm giá, đơn hàng, thanh toán SePay, quyền truy cập,
--        Premium, nhật ký tải, giới thiệu bạn bè
-- -----------------------------------------------------------------------------
-- Nguyên tắc: MỌI ghi vào các bảng này đều do server làm (service_role) sau khi
-- tính giá / kiểm tra mã / đối soát thanh toán. Client chỉ được đọc dữ liệu của mình.
-- =============================================================================

-- ---------- coupons: mã giảm giá công khai do admin tạo ----------
create table public.coupons (
  id                      uuid primary key default gen_random_uuid(),
  -- Luôn lưu IN HOA; server chuẩn hóa (trim + upper) trước khi tra cứu.
  code                    text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  description             text check (char_length(description) <= 500),
  percent                 integer not null check (percent between 1 and 100),
  starts_at               timestamptz not null,
  ends_at                 timestamptz not null,
  max_uses                integer check (max_uses > 0),
  used_count              integer not null default 0 check (used_count >= 0),
  require_verified_email  boolean not null default false,
  applies_to_all          boolean not null default true,  -- false: chỉ tài liệu trong coupon_documents
  applies_to_premium      boolean not null default false, -- có áp dụng cho gói Premium không
  is_active               boolean not null default true,
  created_by              uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  check (ends_at > starts_at),
  check (max_uses is null or used_count <= max_uses),
  -- Mã giảm 100% (đơn 0đ) BẮT BUỘC: giới hạn lượt dùng + chỉ tài khoản đã xác minh email.
  check (percent < 100 or (max_uses is not null and require_verified_email))
);

create index coupons_active_idx on public.coupons (starts_at, ends_at) where is_active;

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- Giới hạn mã cho một số tài liệu (khi applies_to_all = false).
create table public.coupon_documents (
  coupon_id    uuid not null references public.coupons (id) on delete cascade,
  document_id  uuid not null references public.documents (id) on delete cascade,
  primary key (coupon_id, document_id)
);

create index coupon_documents_document_idx on public.coupon_documents (document_id);


-- ---------- referrals: giới thiệu bạn bè ----------
create table public.referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.profiles (id) on delete cascade,
  referred_id  uuid not null unique references public.profiles (id) on delete cascade, -- mỗi người chỉ được giới thiệu 1 lần
  status       public.referral_status not null default 'pending',
  rewarded_at  timestamptz,
  created_at   timestamptz not null default now(),
  check (referrer_id <> referred_id)
);

create index referrals_referrer_idx on public.referrals (referrer_id, created_at desc);


-- ---------- user_coupons: mã giảm giá RIÊNG tặng cho từng học sinh ----------
-- Nguồn: thưởng sau lần thi đầu của kỳ thi, thưởng giới thiệu bạn bè, admin tặng.
-- Mỗi mã chỉ chủ sở hữu dùng được và chỉ dùng 1 lần.
create table public.user_coupons (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  code           text not null unique check (code ~ '^[A-Z0-9_-]{6,32}$'),
  percent        integer not null check (percent between 1 and 100),
  source         public.user_coupon_source not null,
  exam_event_id  uuid references public.exam_events (id) on delete set null,
  template_id    uuid references public.event_coupon_templates (id) on delete set null,
  attempt_id     uuid references public.attempts (id) on delete set null,
  referral_id    uuid references public.referrals (id) on delete set null,
  -- Phạm vi: 'documents' thì danh sách tài liệu lấy theo event_coupon_template_documents của template_id.
  scope          public.coupon_scope not null default 'all',
  scope_subject  public.subject,
  starts_at      timestamptz not null default now(),
  expires_at     timestamptz not null,
  used_at        timestamptz,
  created_at     timestamptz not null default now(),

  check (expires_at > starts_at),
  check (scope <> 'subject' or scope_subject is not null),
  check (scope <> 'documents' or template_id is not null),
  check (source <> 'exam_event' or exam_event_id is not null),
  check (source <> 'referral' or referral_id is not null)
);

-- Mỗi tài khoản chỉ nhận 1 mã cho mỗi kỳ thi.
create unique index user_coupons_one_per_event_idx
  on public.user_coupons (user_id, exam_event_id)
  where exam_event_id is not null;
-- Mỗi lượt giới thiệu chỉ thưởng 1 mã cho mỗi người.
create unique index user_coupons_one_per_referral_idx
  on public.user_coupons (user_id, referral_id)
  where referral_id is not null;
create index user_coupons_user_idx on public.user_coupons (user_id, expires_at desc);


-- ---------- orders: đơn hàng ----------
create table public.orders (
  id                    uuid primary key default gen_random_uuid(),
  -- Mã đơn ghi trong nội dung chuyển khoản (VD "TL7K2M9QXA"); webhook SePay dùng để khớp đơn.
  payment_code          text not null unique check (payment_code ~ '^[A-Z0-9]{6,20}$'),
  -- on delete set null: nếu học sinh xóa tài khoản, vẫn giữ đơn cho sổ sách doanh thu.
  user_id               uuid references public.profiles (id) on delete set null,
  status                public.order_status not null default 'pending',

  subtotal              integer not null check (subtotal >= 0),               -- tổng giá gốc
  discount_amount       integer not null default 0 check (discount_amount >= 0),
  surcharge_amount      integer not null default 0 check (surcharge_amount >= 0), -- bù lên 2.000đ khi tổng 1-1.999đ
  total_amount          integer not null check (total_amount >= 0),           -- số tiền phải chuyển
  check (total_amount = subtotal - discount_amount + surcharge_amount),
  -- Đơn 0đ (mã 100%) không tính doanh thu.
  is_free_order         boolean generated always as (total_amount = 0) stored,

  -- Mã giảm giá đã áp (tối đa 1 mã mỗi đơn): mã công khai HOẶC mã riêng.
  coupon_id             uuid references public.coupons (id) on delete set null,
  user_coupon_id        uuid references public.user_coupons (id) on delete set null,
  coupon_code           text,           -- lưu lại chuỗi mã tại thời điểm mua
  discount_percent      integer check (discount_percent between 1 and 100),
  check (coupon_id is null or user_coupon_id is null),

  -- Thanh toán
  sepay_transaction_id  text unique,    -- id giao dịch SePay đã khớp đơn này (chống xử lý lặp)
  paid_amount           integer check (paid_amount >= 0),
  paid_at               timestamptz,
  expires_at            timestamptz,    -- hạn chuyển khoản của đơn pending
  check (status <> 'paid' or paid_at is not null),

  -- Nguồn khách / chuyển đổi
  utm_source            text check (char_length(utm_source) <= 100),
  utm_medium            text check (char_length(utm_medium) <= 100),
  utm_campaign          text check (char_length(utm_campaign) <= 100),
  exam_event_id         uuid references public.exam_events (id) on delete set null, -- mua sau khi thi kỳ thi nào
  confirmation_email_sent_at timestamptz,
  telegram_notified_at  timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_pending_expiry_idx on public.orders (expires_at) where status = 'pending';
create index orders_paid_at_idx on public.orders (paid_at desc) where status = 'paid';
create index orders_event_idx on public.orders (exam_event_id) where exam_event_id is not null;
-- Một mã riêng chỉ được gắn vào 1 đơn đang chờ hoặc đã trả.
create unique index orders_user_coupon_once_idx
  on public.orders (user_coupon_id)
  where user_coupon_id is not null and status in ('pending', 'paid');

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();


-- ---------- order_items: từng dòng của đơn, LƯU GIÁ TẠI THỜI ĐIỂM MUA ----------
create table public.order_items (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references public.orders (id) on delete cascade,
  item_type            public.order_item_type not null,
  -- restrict: không cho xóa vĩnh viễn tài liệu đã có người mua.
  document_id          uuid references public.documents (id) on delete restrict,
  bundle_id            uuid references public.bundles (id) on delete set null,
  flash_sale_id        uuid references public.flash_sales (id) on delete set null,
  access_level         public.access_level,
  premium_days         integer check (premium_days > 0),
  title_snapshot       text not null check (char_length(title_snapshot) <= 300),
  page_count_snapshot  integer check (page_count_snapshot >= 0),
  unit_price           integer not null check (unit_price >= 0),     -- giá gốc lúc mua
  discount_amount      integer not null default 0 check (discount_amount >= 0),
  final_price          integer not null check (final_price >= 0),
  created_at           timestamptz not null default now(),

  check (final_price = unit_price - discount_amount),
  check (
       (item_type = 'document' and document_id is not null and access_level is not null and premium_days is null)
    or (item_type = 'upgrade'  and document_id is not null and access_level = 'download'  and premium_days is null)
    or (item_type = 'premium'  and document_id is null     and access_level is null       and premium_days is not null)
  ),
  unique (order_id, document_id)
);

create index order_items_document_idx on public.order_items (document_id) where document_id is not null;


-- ---------- payment_transactions: mọi giao dịch SePay gửi về ----------
-- Lưu cả giao dịch không khớp đơn nào để admin đối soát thủ công.
-- sepay_transaction_id UNIQUE -> webhook gọi lặp cũng chỉ ghi 1 lần (idempotent).
create table public.payment_transactions (
  id                    uuid primary key default gen_random_uuid(),
  sepay_transaction_id  text not null unique,
  gateway               text,                 -- tên ngân hàng (MBBank)
  account_number        text,
  transfer_type         text check (transfer_type in ('in', 'out')),
  amount                integer not null check (amount >= 0),
  content               text,                 -- nội dung chuyển khoản
  reference_code        text,
  transaction_date      timestamptz,
  order_id              uuid references public.orders (id) on delete set null,
  status                public.payment_tx_status not null default 'unmatched',
  note                  text,
  raw_payload           jsonb not null,
  created_at            timestamptz not null default now()
);

create index payment_transactions_order_idx on public.payment_transactions (order_id) where order_id is not null;
create index payment_transactions_status_idx on public.payment_transactions (status, created_at desc);


-- ---------- entitlements: quyền truy cập tài liệu VĨNH VIỄN đã mua ----------
-- 1 dòng / (người, tài liệu). Nâng cấp xem -> tải chỉ cập nhật access_level.
create table public.entitlements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  document_id   uuid not null references public.documents (id) on delete restrict,
  access_level  public.access_level not null,
  source        text not null default 'purchase' check (source in ('purchase', 'admin_grant')),
  order_id      uuid references public.orders (id) on delete set null, -- đơn gần nhất cấp/nâng quyền
  granted_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, document_id)
);

create index entitlements_document_idx on public.entitlements (document_id);

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();


-- ---------- coupon_redemptions: lượt dùng mã công khai ----------
-- Tạo khi đặt đơn (giữ chỗ lượt dùng). Nếu đơn hết hạn / bị hủy, server xóa dòng này
-- và giảm coupons.used_count để trả lại lượt.
create table public.coupon_redemptions (
  id               uuid primary key default gen_random_uuid(),
  coupon_id        uuid not null references public.coupons (id) on delete restrict,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  order_id         uuid not null unique references public.orders (id) on delete cascade,
  discount_amount  integer not null check (discount_amount >= 0),
  redeemed_at      timestamptz not null default now(),
  -- Mỗi tài khoản dùng tối đa 1 lần cho mỗi mã.
  unique (user_id, coupon_id)
);

create index coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);


-- ---------- premium_subscriptions: các kỳ Premium (59.000đ / 30 ngày) ----------
-- Mỗi lần mua / gia hạn = 1 dòng mới với 5 suất tải mới. Gia hạn khi còn hạn thì
-- starts_at = ends_at của kỳ trước (server tính).
create table public.premium_subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  order_id             uuid unique references public.orders (id) on delete set null,
  starts_at            timestamptz not null,
  ends_at              timestamptz not null,
  download_slot_limit  integer not null default 5 check (download_slot_limit >= 0),
  source               text not null default 'purchase' check (source in ('purchase', 'admin_grant', 'reward')),
  created_at           timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index premium_subscriptions_user_idx on public.premium_subscriptions (user_id, ends_at desc);


-- ---------- premium_download_slots: suất tải của từng kỳ Premium ----------
-- Lần đầu tải 1 tài liệu trong kỳ -> chiếm 1 suất; tải lại tài liệu đó không tốn thêm.
create table public.premium_download_slots (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references public.premium_subscriptions (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  document_id      uuid not null references public.documents (id) on delete cascade,
  claimed_at       timestamptz not null default now(),
  unique (subscription_id, document_id)
);

create index premium_download_slots_user_idx on public.premium_download_slots (user_id, subscription_id);

-- Chặn vượt quá số suất (mặc định 5). Khóa dòng subscription (FOR UPDATE) để 2 request
-- tải đồng thời không cùng lọt qua khi chỉ còn 1 suất.
create or replace function public.premium_slots_enforce_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_limit integer;
  v_owner uuid;
  v_used  integer;
begin
  select s.download_slot_limit, s.user_id
    into v_limit, v_owner
  from public.premium_subscriptions s
  where s.id = new.subscription_id
  for update;

  if v_owner is distinct from new.user_id then
    raise exception 'Suất tải không thuộc kỳ Premium của người dùng này';
  end if;

  select count(*) into v_used
  from public.premium_download_slots
  where subscription_id = new.subscription_id;

  if v_used >= v_limit then
    raise exception 'Đã dùng hết % suất tải của kỳ Premium', v_limit
      using errcode = 'P0001', hint = 'premium_slot_limit_reached';
  end if;

  return new;
end;
$$;

create trigger premium_slots_enforce_limit
  before insert on public.premium_download_slots
  for each row execute function public.premium_slots_enforce_limit();


-- ---------- download_logs: nhật ký mỗi lần cấp link xem/tải ----------
create table public.download_logs (
  id                bigint generated always as identity primary key,
  user_id           uuid references public.profiles (id) on delete set null,
  document_id       uuid references public.documents (id) on delete set null,
  document_file_id  uuid references public.document_files (id) on delete set null,
  action            text not null check (action in ('view', 'download')),
  via               text not null check (via in ('free', 'entitlement', 'premium', 'admin')),
  ip_hash           text,   -- băm IP (không lưu IP gốc)
  user_agent        text check (char_length(user_agent) <= 500),
  created_at        timestamptz not null default now()
);

create index download_logs_user_idx on public.download_logs (user_id, created_at desc);
create index download_logs_document_idx on public.download_logs (document_id, created_at desc);
