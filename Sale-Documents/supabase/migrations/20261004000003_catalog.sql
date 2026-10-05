-- =============================================================================
-- 0003 · CỬA HÀNG: tài liệu, file, lịch sử giá, combo, flash sale, chủ đề
-- =============================================================================

-- ---------- documents: metadata tài liệu ----------
create table public.documents (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title            text not null check (char_length(btrim(title)) between 3 and 200),
  description      text check (char_length(description) <= 5000),
  subject          public.subject not null,
  doc_type         public.doc_type not null,
  is_free          boolean not null default false,

  -- Giá: tính ở server khi admin lưu (số trang x đơn giá/trang; giá tải = giá xem x 1,2
  -- làm tròn 500đ) rồi lưu lại ở đây. Đổi giá chỉ ảnh hưởng đơn mới vì order_items
  -- luôn lưu giá tại thời điểm mua.
  page_count       integer not null default 0 check (page_count >= 0),
  price_per_page   integer not null default 0 check (price_per_page between 0 and 100000),
  view_price       integer not null default 0 check (view_price >= 0),
  download_price   integer not null default 0 check (download_price >= 0),
  check (not is_free or (view_price = 0 and download_price = 0)),
  check (is_free or download_price >= view_price),

  cover_path       text,              -- đường dẫn trong bucket `covers` (ảnh trang 1 của file demo)
  status           public.document_status not null default 'draft',
  published_at     timestamptz,
  hidden_at        timestamptz,       -- thời điểm "Gỡ" khỏi cửa hàng (soft delete)

  -- Số liệu tổng hợp (denormalized) để trang công khai đọc nhanh, cache được.
  sales_count      integer not null default 0 check (sales_count >= 0),
  rating_avg       numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count     integer not null default 0 check (rating_count >= 0),

  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.documents is 'Tài liệu bán/miễn phí. Gỡ = status hidden (soft delete), người đã mua vẫn đọc được.';

-- Lọc thông minh ở cửa hàng: môn + loại + miễn phí/có phí, chỉ tài liệu đang bán.
create index documents_catalog_idx on public.documents (subject, doc_type, is_free) where status = 'published';
create index documents_published_at_idx on public.documents (published_at desc) where status = 'published';
create index documents_best_seller_idx on public.documents (sales_count desc) where status = 'published';
create index documents_status_idx on public.documents (status);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- Tự ghi published_at / hidden_at khi đổi trạng thái.
create or replace function public.documents_status_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
    new.hidden_at := null;
  elsif new.status = 'hidden' and (tg_op = 'INSERT' or old.status is distinct from 'hidden') then
    new.hidden_at := now();
  end if;
  return new;
end;
$$;

create trigger documents_status_timestamps
  before insert or update of status on public.documents
  for each row execute function public.documents_status_timestamps();


-- ---------- document_files: file đầy đủ (private) + file demo (public) ----------
-- Mỗi tài liệu chỉ có 1 file đầy đủ và 1 file demo "hiện hành" (is_current = true).
-- Khi admin thay file, file cũ chuyển is_current = false (giữ để đối chiếu/audit),
-- người đã mua tự động thấy file mới vì server luôn lấy file hiện hành.
create table public.document_files (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references public.documents (id) on delete cascade,
  kind             public.file_kind not null,
  bucket           text not null,
  storage_path     text not null check (char_length(storage_path) between 1 and 500),
  file_size        bigint not null check (file_size > 0),
  page_count       integer not null check (page_count > 0),
  checksum_sha256  text check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  is_current       boolean not null default true,
  uploaded_by      uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),

  -- File đầy đủ nằm ở bucket private `documents`; file demo ở bucket public `previews`.
  check ((kind = 'full' and bucket = 'documents') or (kind = 'demo' and bucket = 'previews')),
  -- File demo luôn đúng 3 trang (admin tự chọn, web không tự cắt).
  check (kind <> 'demo' or page_count = 3),
  unique (bucket, storage_path)
);

create unique index document_files_one_current_idx
  on public.document_files (document_id, kind)
  where is_current;


-- ---------- document_price_history: lịch sử đổi giá ----------
create table public.document_price_history (
  id                  bigint generated always as identity primary key,
  document_id         uuid not null references public.documents (id) on delete cascade,
  old_price_per_page  integer,
  new_price_per_page  integer not null,
  old_view_price      integer,
  new_view_price      integer not null,
  old_download_price  integer,
  new_download_price  integer not null,
  changed_by          uuid references public.profiles (id) on delete set null,
  changed_at          timestamptz not null default now()
);

create index document_price_history_doc_idx on public.document_price_history (document_id, changed_at desc);

-- Trigger tự ghi lịch sử mỗi khi giá thay đổi (kể cả lúc tạo mới).
-- SECURITY DEFINER để ghi được vào bảng lịch sử dù RLS không cho ai INSERT trực tiếp.
create or replace function public.documents_log_price_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.price_per_page is distinct from old.price_per_page
     or new.view_price     is distinct from old.view_price
     or new.download_price is distinct from old.download_price then
    insert into public.document_price_history (
      document_id,
      old_price_per_page, new_price_per_page,
      old_view_price,     new_view_price,
      old_download_price, new_download_price,
      changed_by
    ) values (
      new.id,
      case when tg_op = 'UPDATE' then old.price_per_page end, new.price_per_page,
      case when tg_op = 'UPDATE' then old.view_price end,     new.view_price,
      case when tg_op = 'UPDATE' then old.download_price end, new.download_price,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger documents_log_price_change
  after insert or update of price_per_page, view_price, download_price on public.documents
  for each row execute function public.documents_log_price_change();


-- ---------- bundles: combo nhiều tài liệu giảm giá ----------
create table public.bundles (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title             text not null check (char_length(btrim(title)) between 3 and 200),
  description       text check (char_length(description) <= 5000),
  cover_path        text,
  access_level      public.access_level not null default 'download', -- quyền nhận được khi mua combo
  discount_percent  integer not null check (discount_percent between 1 and 99),
  is_active         boolean not null default true,
  starts_at         timestamptz,
  ends_at           timestamptz,
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger bundles_set_updated_at
  before update on public.bundles
  for each row execute function public.set_updated_at();

create table public.bundle_items (
  bundle_id    uuid not null references public.bundles (id) on delete cascade,
  document_id  uuid not null references public.documents (id) on delete cascade,
  position     integer not null default 0,
  primary key (bundle_id, document_id)
);

create index bundle_items_document_idx on public.bundle_items (document_id);


-- ---------- flash_sales: giảm giá có đồng hồ đếm ngược ----------
create table public.flash_sales (
  id                uuid primary key default gen_random_uuid(),
  title             text not null check (char_length(btrim(title)) between 3 and 200),
  discount_percent  integer not null check (discount_percent between 1 and 99),
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  check (ends_at > starts_at),
  applies_to_all    boolean not null default false, -- true: mọi tài liệu có phí; false: theo flash_sale_items
  is_active         boolean not null default true,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index flash_sales_window_idx on public.flash_sales (starts_at, ends_at) where is_active;

create trigger flash_sales_set_updated_at
  before update on public.flash_sales
  for each row execute function public.set_updated_at();

create table public.flash_sale_items (
  flash_sale_id  uuid not null references public.flash_sales (id) on delete cascade,
  document_id    uuid not null references public.documents (id) on delete cascade,
  primary key (flash_sale_id, document_id)
);

create index flash_sale_items_document_idx on public.flash_sale_items (document_id);


-- ---------- topic_documents: gán chủ đề câu hỏi -> tài liệu gợi ý ----------
-- Trang kết quả thi lấy 2-3 chủ đề làm sai nhiều nhất rồi tra bảng này để gợi ý mua.
create table public.topic_documents (
  id           uuid primary key default gen_random_uuid(),
  subject      public.subject not null,
  topic        text not null check (topic = btrim(topic) and char_length(topic) between 1 and 120),
  document_id  uuid not null references public.documents (id) on delete cascade,
  priority     integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (subject, topic, document_id)
);

create index topic_documents_lookup_idx on public.topic_documents (subject, lower(topic));
create index topic_documents_document_idx on public.topic_documents (document_id);
