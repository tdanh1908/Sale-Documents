# Web bán tài liệu học tập lớp 12

Website bán tài liệu PDF luyện thi THPT cho học sinh lớp 12. Mobile-first, đơn giản, bảo mật.

## Tech stack

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL · Auth · Storage · Realtime) |
| Thanh toán | SePay webhook + VietQR (MBBank) |
| Email | Resend hoặc Brevo SMTP |
| Thông báo | Telegram Bot |
| Captcha | Cloudflare Turnstile |
| Deploy | Vercel · Cloudflare (DNS + DDoS) |
| PWA | Cài như app trên điện thoại |

---

## Yêu cầu

- **Node.js** ≥ 20
- **npm** ≥ 10
- Tài khoản [Supabase](https://supabase.com) (free tier là đủ để phát triển)
- Tài khoản [Vercel](https://vercel.com) (để deploy)

---

## Chạy local

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd Sale-Documents
npm install
```

### 2. Tạo file biến môi trường

```bash
cp .env.example .env.local
```

Mở `.env.local` và điền các giá trị thực (xem hướng dẫn từng biến trong `.env.example`).

**Bắt buộc để chạy được:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Tạo dự án Supabase và apply migration

> Cách 1: Dùng Supabase CLI (khuyến nghị khi phát triển local)

```bash
# Cài Supabase CLI nếu chưa có
npm install -g supabase

# Đăng nhập
npx supabase login

# Liên kết với dự án remote
npx supabase link --project-ref your-project-id

# Apply toàn bộ migration
npx supabase db push
```

> Cách 2: Chạy từng file SQL thủ công qua Supabase Dashboard → SQL Editor

Mở thư mục `supabase/migrations/` và chạy lần lượt 11 file theo thứ tự (từ `0001` đến `0011`).

### 4. Sinh TypeScript types từ database

Sau khi apply migration, chạy:

```bash
npx supabase gen types typescript --project-id your-project-id \
  > src/lib/supabase/types.ts
```

Hoặc dùng Supabase local dev server:

```bash
npx supabase start
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

### 5. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

---

## Cấu trúc thư mục

```
Sale-Documents/
├── src/
│   ├── app/                    # Next.js App Router (pages, layouts, API routes)
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts       # Browser client (Client Components)
│   │       ├── server.ts       # Server client + Service client (Server Components, Route Handlers)
│   │       ├── middleware.ts   # Helper cho Next.js middleware
│   │       └── types.ts        # TypeScript types (sinh từ Supabase CLI)
│   └── middleware.ts           # Next.js middleware (refresh session, bảo vệ route)
├── supabase/
│   └── migrations/             # 11 file SQL migration (chạy theo thứ tự)
│       ├── 0001_enums_and_helpers.sql
│       ├── 0002_profiles.sql
│       ├── 0003_catalog.sql
│       ├── 0004_exams.sql
│       ├── 0005_commerce.sql
│       ├── 0006_social.sql
│       ├── 0007_system.sql
│       ├── 0008_rls_policies.sql
│       ├── 0009_storage.sql    # 3 bucket: previews (public), covers (public), documents (private)
│       ├── 0010_realtime.sql
│       └── 0011_default_data.sql
├── design-reference/           # HTML mockup giao diện (tham khảo)
├── .env.example                # Mẫu biến môi trường (copy → .env.local)
└── PROJECT_SPEC.md             # Đặc tả đầy đủ của dự án
```

---

## Supabase Storage

Ba bucket được tạo bởi migration `0009_storage.sql`:

| Bucket | Visibility | Giới hạn | Dùng cho |
|--------|-----------|----------|----------|
| `previews` | **Public** | 20 MB/file | File demo 3 trang (PDF công khai) |
| `covers` | **Public** | 5 MB/file | Ảnh bìa tài liệu, banner kỳ thi |
| `documents` | **Private** | 50 MB/file | File PDF đầy đủ — chỉ truy cập qua signed URL |

**Lưu ý bảo mật:**  
Bucket `documents` hoàn toàn private. Người dùng nhận file qua **signed URL hết hạn sau vài phút** do server tạo, sau khi server đã kiểm tra quyền mua. Link signed URL không bao giờ được đặt trực tiếp trong email.

---

## Deploy lên Vercel

### 1. Push code lên GitHub/GitLab

### 2. Import project vào Vercel

Truy cập [vercel.com/new](https://vercel.com/new) → Import repository.

### 3. Cài biến môi trường

Trong Vercel Dashboard → Project → Settings → Environment Variables,  
thêm tất cả biến trong `.env.example` với giá trị thực.

### 4. Deploy

Vercel tự deploy khi push lên branch `main`.

---

## Cài Webhook SePay

1. Trong SePay Dashboard, tạo webhook với URL:  
   `https://yourdomain.com/api/webhooks/sepay`

2. Copy **Secret Key** vào biến `SEPAY_WEBHOOK_SECRET` trong `.env.local` và Vercel.

3. Server xác minh chữ ký HMAC-SHA256 của mỗi request trước khi xử lý.

---

## Lệnh hay dùng

```bash
npm run dev        # Chạy dev server (localhost:3000)
npm run build      # Build production
npm run lint       # Kiểm tra lỗi ESLint
```

---

## Lưu ý phát triển

- **Không để `SUPABASE_SERVICE_ROLE_KEY` ra client-side.** Biến này chỉ dùng trong `src/lib/supabase/server.ts`.
- **Mọi bảng đều bật RLS.** Kiểm tra policy trước khi query từ client.
- **Trang công khai dùng ISR/static** để chịu 10.000 người truy cập không đè vào database.
- **Validate dữ liệu đầu vào bằng Zod** ở server (Route Handler / Server Action).
- Sau mỗi migration mới: chạy lại `supabase gen types` để cập nhật `types.ts`.
