# Lõi thanh toán (Prompt 5): hướng dẫn ghép vào dự án

Gói này gồm phần xử lý tiền đã viết sẵn và đã kiểm tra, để Antigravity chỉ cần **ghép vào**, không viết lại.

## 1. Trong gói có gì

| Đường dẫn | Việc của nó |
|---|---|
| `supabase/migrations/20261005000012_commerce_core.sql` | Các hàm database: báo giá, tạo đơn, xử lý webhook SePay, Premium, cấp quyền xem/tải, hết hạn đơn, admin duyệt đơn |
| `supabase/tests/commerce_core.test.sql` | 125 kiểm tra (chạy xong tự hoàn tác) |
| `supabase/tests/concurrency.sh` | 18 kiểm tra nhiều người bấm cùng lúc |
| `src/lib/commerce/*.ts` | Code TypeScript gọi các hàm trên, xác thực SePay, tạo link QR, báo Telegram |
| `src/lib/commerce/__tests__/*.test.ts` | 20 test cho phần TypeScript |
| `src/app/api/**/route.ts` | 6 đường API: báo giá, tạo đơn, trạng thái đơn, cấp link file, webhook SePay, cron hết hạn đơn |

Kết quả đã chạy thật: 125/125 kiểm tra SQL, 18/18 kiểm tra đồng thời, 20/20 test TypeScript, biên dịch TypeScript không lỗi (database thử là PostgreSQL 16 với bản giả lập các phần Supabase).

**Chưa kiểm tra được ở đây:** chạy với Supabase thật, SePay thật, Telegram thật, signed URL của Supabase Storage. Mục 6 là cách bạn kiểm tra những phần đó.

## 2. Cách ghép (làm theo thứ tự)

1. Chép `supabase/migrations/20261005000012_commerce_core.sql` vào thư mục `supabase/migrations` của dự án. **Không sửa tên**, vì số thứ tự phải đứng sau 0011.
2. **Không chép đè** `package.json`, `tsconfig.json` trong gói (chúng chỉ để mình chạy kiểm tra, dự án của bạn đã có bản riêng). Chép thư mục `src/lib/commerce` và `src/app/api` vào `src` của dự án (nếu dự án đã có thư mục `src/app/api` thì gộp, đừng ghi đè file khác).
3. Mở `src/lib/commerce/adapters.ts`. Prompt 1 đã tạo sẵn client Supabase (`server.ts`, có cả client service_role). Hãy làm cho `getAdminClient()` **dùng lại** client service_role đó, và `getSessionUserId()` dùng lại client đọc phiên đăng nhập, **đừng tạo bản trùng**. Nếu giữ nguyên bản trong gói cũng chạy được.
4. Cài thư viện còn thiếu: `npm install zod` (và `@supabase/ssr`, `@supabase/supabase-js` nếu chưa có). Cài `vitest` để chạy test: `npm install -D vitest`, thêm `"test": "vitest run"` vào `scripts`, và thêm vào `vitest.config.ts` alias `@` trỏ tới `src` (xem file mẫu trong gói).
5. Thêm biến môi trường (mục 3).
6. Chạy `npx supabase db push` để đưa migration 0012 lên Supabase.
7. Chạy `npm run test` (test TypeScript), rồi chạy file test SQL trên project thử (mục 5).

## 3. Biến môi trường cần thêm vào `.env.local` (và vào Vercel khi deploy)

```
SEPAY_WEBHOOK_API_KEY=      # tự đặt một chuỗi ngẫu nhiên dài ít nhất 32 ký tự; dán cùng chuỗi này vào ô API Key khi tạo webhook trên SePay
BANK_ACCOUNT_NUMBER=        # số tài khoản MB nhận tiền (chỉ nằm trong .env, không đưa lên GitHub)
BANK_ACCOUNT_NAME=          # tên chủ tài khoản hiển thị cho khách
TELEGRAM_BOT_TOKEN=         # token của bot do @BotFather cấp
TELEGRAM_CHAT_ID=           # id cuộc trò chuyện nhận thông báo
CRON_SECRET=                # chuỗi ngẫu nhiên dài ít nhất 32 ký tự
IP_HASH_SALT=               # chuỗi ngẫu nhiên, dùng để băm IP trong nhật ký tải
```

Tạo chuỗi ngẫu nhiên: mở Terminal gõ `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## 4. Cài đặt trong Admin (bảng `site_settings`, sửa được không cần code)

| Khóa | Mặc định | Ghi chú |
|---|---|---|
| `payment.code_prefix` | `TL` | **Phải trùng** "Cấu trúc mã thanh toán" bạn đặt trên SePay |
| `payment.bank_name` | `MBBank` | Tên ngắn dùng để tạo QR. Kiểm tra đúng tên trong https://qr.sepay.vn/banks.json |
| `order.min_amount` | 2000 | Đơn tối thiểu |
| `order.upgrade_min_amount` | 2000 | Phụ phí nâng cấp xem -> tải tối thiểu |
| `order.pending_expiry_minutes` | 30 | Hạn chuyển khoản |
| `order.max_pending_per_user` | 5 | Số đơn chờ tối đa mỗi người |
| `premium.price` / `premium.duration_days` / `premium.download_slots` | 59000 / 30 / 5 | Gói Premium |
| `files.signed_url_ttl_seconds` | 300 | Link xem/tải sống 5 phút |
| `files.free_docs_downloadable` | false | Tài liệu miễn phí có cho tải không |

## 5. Chạy các bài test SQL

Chỉ chạy trên **project thử hoặc database local, không chạy khi đã có dữ liệu khách thật**.

- `commerce_core.test.sql`: tự hoàn tác sau khi chạy nên không để lại dữ liệu. Chạy bằng `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/commerce_core.test.sql`. Thấy dòng `=== TẤT CẢ KIỂM TRA ĐÃ QUA ===` là đạt.
- `concurrency.sh`: **để lại** dữ liệu thử trong database, nên chỉ chạy trên project thử.
- Cách đơn gọn nhất: tạo thêm một project Supabase miễn phí tên `...-test`, `db push` vào đó rồi chạy hai file trên. Nếu bạn dùng Supabase CLI local (`npx supabase start`, cần Docker) thì chạy trên đó.

## 6. Kiểm tra với dịch vụ thật (sau khi web có địa chỉ)

1. **Cấu hình SePay** (https://my.sepay.vn):
   - Công ty → Cấu hình chung → **Cấu trúc mã thanh toán**: đặt tiền tố `TL` (trùng `payment.code_prefix`).
   - Tích hợp WebHooks → Thêm: URL `https://<tên-miền-của-bạn>/api/webhooks/sepay`, kiểu chứng thực **API Key** (điền `SEPAY_WEBHOOK_API_KEY`), kiểu nội dung **JSON**, chỉ bắt giao dịch **tiền vào**.
   - Không tick "Bỏ qua nếu không có mã thanh toán", để chuyển khoản sai nội dung vẫn báo về cho bạn đối soát.
   - SePay gọi lại khi mã trả về không phải 2xx, và chờ tối đa 8 giây. Code đã trả đúng `{"success": true}`.
2. **Mua thử tiền thật nhỏ:** tạo tài liệu giá 2.000đ, tự mua, quét QR và chuyển 2.000đ. Kiểm tra: đơn tự chuyển "thành công", tài liệu mở khóa, Telegram báo, có email xác nhận trong bảng `email_outbox`.
3. **Thử các tình huống lỗi:** chuyển thiếu 1.000đ, chuyển sai nội dung, chuyển lần 2 vào đơn cũ. Telegram phải báo đúng từng trường hợp và đơn vào mục "Cần kiểm tra".
4. **Thử mã 100%:** đơn 0đ phải mở khóa ngay, không hiện QR.
5. **Cron hết hạn đơn:** gọi `GET /api/cron/expire-orders` với header `Authorization: Bearer <CRON_SECRET>`. Trên Vercel, thêm vào `vercel.json`:
   ```json
   { "crons": [{ "path": "/api/cron/expire-orders", "schedule": "*/5 * * * *" }] }
   ```
   (Vercel tự gửi header trên khi bạn đặt `CRON_SECRET`. Gói miễn phí của Vercel có thể giới hạn tần suất cron, bạn xem lại; nếu bị giới hạn, dùng dịch vụ gọi URL định kỳ miễn phí như cron-job.org với cùng header.)

## 7. Những điều cần biết

- **Mọi thao tác tiền chạy trong database**, trong đúng một giao dịch, nên không có chuyện "đã thu tiền mà chưa mở khóa". Trình duyệt **không gọi trực tiếp** được các hàm này (đã thu hồi quyền, có test chứng minh).
- **Tiền chuyển lệch không tự xử lý:** thiếu tiền, chuyển muộn sau khi đơn hết hạn, chuyển vào đơn đã hủy đều vào trạng thái "cần kiểm tra" và báo Telegram. Bạn bấm Duyệt hoặc Từ chối trong trang Admin (các hàm `admin_approve_order`, `admin_reject_order`, `admin_resolve_review`). Việc **hoàn tiền cho khách bạn làm thủ công** bằng app ngân hàng, web không tự chuyển tiền đi.
- **Thừa tiền hoặc chuyển trùng:** đơn vẫn thành công (hoặc giữ nguyên) và gắn cờ để bạn hoàn phần dư.
- **Email xác nhận** chỉ được xếp vào hàng đợi `email_outbox`. Phần gửi thật (worker đọc hàng đợi rồi gửi qua Resend/Brevo) thuộc phần email của dự án, chưa nằm trong gói này.
- **Giao diện** (giỏ hàng, trang QR, trang đọc tài liệu) do Antigravity dựng từ các file Gemini, rồi gọi các đường API trong gói. Ghi nhớ: các thanh công tắc chuyển trạng thái trong file Gemini chỉ là bản mẫu, không đưa vào web thật.

## 8. Câu lệnh gửi cho Antigravity (sau khi chép file)

```
Trong dự án đã có sẵn "lõi thanh toán" (Prompt 5) do tôi chép vào: migration 20261005000012_commerce_core.sql,
thư mục src/lib/commerce và src/app/api. KHÔNG viết lại phần này. Hãy làm các việc sau, báo cáo ngắn sau mỗi việc:
1. Đọc src/lib/commerce/adapters.ts và nối với helper Supabase đã có (client service_role, đọc phiên đăng nhập),
   không tạo bản trùng.
2. Cài thư viện còn thiếu (zod, vitest), cấu hình vitest, chạy "npm run test" và "npx tsc --noEmit", sửa lỗi nếu có
   (chỉ sửa chỗ nối, không đổi logic tính tiền).
3. Cập nhật .env.example bằng các biến ở INTEGRATION.md mục 3.
4. Dựng giao diện giỏ hàng và trang thanh toán QR theo file Gemini (gio-hang.html trong design-reference), gọi các API:
   POST /api/cart/quote, POST /api/orders, GET /api/orders/[id] (hỏi lại mỗi 3 giây), hiển thị mã QR từ payment.qr_url.
   Hiển thị đúng các trạng thái: đơn dưới mức tối thiểu (có gợi ý thêm tài liệu), mã giảm giá lỗi, đơn 0đ (không QR),
   đang chờ thanh toán, thành công, đang được kiểm tra thủ công.
5. Dựng trang đọc tài liệu và nút Tải về gọi POST /api/files/access (xem/tải), mở link nhận được.
Không sửa file migration đã có. Không để service_role key xuất hiện ở code chạy trên trình duyệt.
```
