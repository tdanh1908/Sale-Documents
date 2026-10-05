-- =============================================================================
-- 0004 · THI THỬ: khối thi, đề, câu hỏi, lượt làm bài, kỳ thi
-- =============================================================================

-- ---------- combos: khối thi (A00, A01, ...) ----------
-- Dùng cho BXH theo khối (tổng điểm cao nhất của 3 môn) và lọc tài liệu theo khối.
create table public.combos (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-Z][0-9A-Z]{1,5}$'),
  name        text check (char_length(name) <= 100),
  subjects    public.subject[] not null,
  is_active   boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Đúng 3 môn, khác nhau, không chứa Văn (Văn không thi thử / không xếp hạng).
  check (cardinality(subjects) = 3 and array_ndims(subjects) = 1),
  check (subjects[1] <> subjects[2] and subjects[1] <> subjects[3] and subjects[2] <> subjects[3]),
  check (not ('van'::public.subject = any (subjects)))
);

create trigger combos_set_updated_at
  before update on public.combos
  for each row execute function public.set_updated_at();


-- ---------- exams: kho đề ----------
create table public.exams (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title                   text not null check (char_length(btrim(title)) between 3 and 200),
  description             text check (char_length(description) <= 5000),
  subject                 public.subject not null check (subject <> 'van'),
  mode                    public.exam_mode not null default 'web',
  availability            public.exam_availability not null default 'always',
  status                  public.exam_status not null default 'draft',

  -- Quyền làm đề: miễn phí, hoặc có phí (Premium / đã mua tài liệu gắn kèm).
  is_free                 boolean not null default true,
  document_id             uuid references public.documents (id) on delete set null,

  duration_minutes        integer check (duration_minutes between 1 and 300),
  question_count          integer not null default 0 check (question_count >= 0),
  max_score               numeric(5, 2) not null default 10 check (max_score > 0),
  counts_for_leaderboard  boolean not null default true,

  -- Đề web phải có thời gian làm bài; đề Azota không tự vào BXH.
  check (mode <> 'web' or duration_minutes is not null),
  check (mode = 'web' or counts_for_leaderboard = false),

  published_at            timestamptz,
  created_by              uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index exams_listing_idx on public.exams (subject, availability) where status = 'published';
create index exams_document_idx on public.exams (document_id) where document_id is not null;

create trigger exams_set_updated_at
  before update on public.exams
  for each row execute function public.set_updated_at();


-- ---------- exam_private: dữ liệu bí mật của đề (link Azota) ----------
-- Tách riêng vì RLS chỉ lọc theo hàng: nếu để azota_url trong exams thì ai đọc được
-- metadata đề cũng đọc được link. Bảng này chỉ server/admin đọc; server kiểm tra quyền
-- (miễn phí / đã mua / Premium) rồi mới trả link cho người dùng.
create table public.exam_private (
  exam_id     uuid primary key references public.exams (id) on delete cascade,
  azota_url   text check (azota_url ~ '^https://'),
  updated_at  timestamptz not null default now()
);

create trigger exam_private_set_updated_at
  before update on public.exam_private
  for each row execute function public.set_updated_at();


-- ---------- questions: câu hỏi trắc nghiệm A/B/C/D ----------
-- Chứa đáp án đúng -> TUYỆT ĐỐI không cho client đọc trực tiếp. Server lấy đề (bỏ cột
-- đáp án) để hiển thị, và chấm điểm ở server.
create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  exam_id         uuid not null references public.exams (id) on delete cascade,
  position        integer not null check (position > 0),
  content         text not null check (char_length(content) between 1 and 10000),
  image_path      text,
  options         jsonb not null,           -- {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_option  char(1) not null check (correct_option in ('A', 'B', 'C', 'D')),
  explanation     text check (char_length(explanation) <= 10000),
  topic           text check (topic = btrim(topic) and char_length(topic) <= 120), -- chủ đề, dùng gợi ý tài liệu
  points          numeric(5, 2) not null default 0.25 check (points > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  check (jsonb_typeof(options) = 'object' and options ?& array['A', 'B', 'C', 'D']),
  unique (exam_id, position)
);

create index questions_topic_idx on public.questions (exam_id, topic);

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();


-- ---------- exam_events: kỳ thi (sự kiện) ----------
-- status được cron ở server tự chuyển scheduled -> live -> ended theo opens_at/closes_at;
-- nút "Mở ngay"/"Đóng ngay" chỉ cần đặt opens_at/closes_at = now() và đổi status.
create table public.exam_events (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title                  text not null check (char_length(btrim(title)) between 3 and 200),
  description            text check (char_length(description) <= 5000),
  rules                  text check (char_length(rules) <= 10000),   -- thể lệ
  banner_path            text,                                      -- ảnh trong bucket `covers`
  status                 public.exam_event_status not null default 'draft',
  opens_at               timestamptz,
  closes_at              timestamptz,
  eligibility            public.event_eligibility not null default 'all',
  max_attempts           integer not null default 1 check (max_attempts between 1 and 100),
  ranking_scope          public.event_ranking_scope not null default 'event_only',
  answer_reveal          public.answer_reveal not null default 'after_submit',
  reward_top_n           integer check (reward_top_n between 1 and 100),  -- vinh danh top N
  reward_description     text check (char_length(reward_description) <= 2000),
  summary_sent_at        timestamptz,  -- đã gửi báo cáo tổng kết qua Telegram (tránh gửi trùng)
  cloned_from            uuid references public.exam_events (id) on delete set null, -- "Nhân bản kỳ thi"
  created_by             uuid references public.profiles (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  check (closes_at is null or opens_at is null or closes_at > opens_at),
  -- Ngoài trạng thái Nháp, kỳ thi bắt buộc có giờ mở/đóng.
  check (status = 'draft' or (opens_at is not null and closes_at is not null))
);

create index exam_events_status_idx on public.exam_events (status, opens_at);
create index exam_events_closes_idx on public.exam_events (closes_at) where status in ('scheduled', 'live');

create trigger exam_events_set_updated_at
  before update on public.exam_events
  for each row execute function public.set_updated_at();

-- Danh sách đề của kỳ thi (chọn từ kho đề).
create table public.exam_event_items (
  exam_event_id  uuid not null references public.exam_events (id) on delete cascade,
  exam_id        uuid not null references public.exams (id) on delete restrict,
  position       integer not null default 0,
  primary key (exam_event_id, exam_id)
);

create index exam_event_items_exam_idx on public.exam_event_items (exam_id);


-- ---------- event_coupon_templates: cấu hình mã tặng sau lần thi đầu ----------
-- Mỗi kỳ thi tối đa 1 cấu hình. Khi học sinh nộp bài lần đầu, server tạo 1 mã riêng
-- (bảng user_coupons) theo cấu hình này.
create table public.event_coupon_templates (
  id              uuid primary key default gen_random_uuid(),
  exam_event_id   uuid not null unique references public.exam_events (id) on delete cascade,
  percent         integer not null check (percent between 1 and 100),
  valid_hours     integer not null check (valid_hours between 1 and 720), -- hạn tính từ lúc nộp bài
  scope           public.coupon_scope not null default 'all',
  scope_subject   public.subject,
  max_issues      integer check (max_issues > 0),   -- tổng số mã tối đa được phát
  issued_count    integer not null default 0 check (issued_count >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  check (scope <> 'subject' or scope_subject is not null),
  check (max_issues is null or issued_count <= max_issues)
);

create trigger event_coupon_templates_set_updated_at
  before update on public.event_coupon_templates
  for each row execute function public.set_updated_at();

-- Danh sách tài liệu áp dụng khi scope = 'documents'.
create table public.event_coupon_template_documents (
  template_id  uuid not null references public.event_coupon_templates (id) on delete cascade,
  document_id  uuid not null references public.documents (id) on delete cascade,
  primary key (template_id, document_id)
);


-- ---------- attempts: lượt làm bài ----------
-- Chỉ server tạo/chấm (client không được tự ghi điểm).
create table public.attempts (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles (id) on delete cascade,
  exam_id                 uuid not null references public.exams (id) on delete restrict,
  exam_event_id           uuid references public.exam_events (id) on delete set null,
  subject                 public.subject not null,  -- sao chép từ đề để truy vấn BXH nhanh
  status                  public.attempt_status not null default 'in_progress',
  started_at              timestamptz not null default now(),
  deadline_at             timestamptz,              -- started_at + thời gian làm bài
  submitted_at            timestamptz,
  answers                 jsonb not null default '{}'::jsonb, -- {"<question_id>": "A", ...}
  correct_count           integer check (correct_count >= 0),
  total_questions         integer check (total_questions >= 0),
  score                   numeric(5, 2) check (score >= 0),
  duration_seconds        integer check (duration_seconds >= 0),
  counts_for_leaderboard  boolean not null default false,
  topic_stats             jsonb,                    -- {"Hàm số": {"wrong": 3, "total": 5}, ...}
  utm_source              text check (char_length(utm_source) <= 100), -- nguồn khách cho thống kê kỳ thi
  created_at              timestamptz not null default now(),

  check (status <> 'submitted' or (submitted_at is not null and score is not null)),
  check (jsonb_typeof(answers) = 'object')
);

create index attempts_user_idx on public.attempts (user_id, created_at desc);
create index attempts_exam_user_idx on public.attempts (exam_id, user_id);
create index attempts_event_user_idx on public.attempts (exam_event_id, user_id) where exam_event_id is not null;
-- BXH theo môn: điểm cao nhất của mỗi học sinh ở môn đó.
create index attempts_leaderboard_idx on public.attempts (subject, user_id, score desc)
  where status = 'submitted' and counts_for_leaderboard;
