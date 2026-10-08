# Bộ prompt + hướng dẫn A-Z: Web bán tài liệu học tập lớp 12

Dùng cho Antigravity (model Claude Opus 5.5). Cách dùng chung:

1. Làm **theo đúng thứ tự**, mỗi prompt chạy trong một phiên riêng.
2. Trước khi cho agent viết code, yêu cầu nó **lập kế hoạch** và bạn đọc duyệt (bước "Plan" trong Antigravity).
3. Sau mỗi giai đoạn: chạy thử, sửa lỗi, rồi `git commit`. Không sang giai đoạn sau khi giai đoạn trước còn lỗi.
4. Khi agent hỏi lại điều chưa rõ, bạn trả lời hoặc nhờ mình (Claude trong claude.ai) giải thích.

---

## PHẦN 0. Bản đặc tả dự án (dán vào file `PROJECT_SPEC.md` ở thư mục gốc)

Mọi prompt phía dưới đều bắt đầu bằng câu: "Đọc PROJECT_SPEC.md trước khi làm."

```markdown
# PROJECT_SPEC: Web bán tài liệu học tập lớp 12 (tiếng Việt)

## Mục tiêu
Website bán tài liệu PDF luyện thi THPT cho học sinh lớp 12, chủ web là 1 cá nhân (admin duy nhất).
Ưu tiên: mobile-first, đơn giản, tươi sáng, bảo mật, chịu 10.000 người truy cập cùng lúc khi quảng bá.
Ngân sách vận hành: 500k-2 triệu VNĐ/tháng. Ưu tiên dịch vụ miễn phí hoặc rẻ.

## Tech stack (không tự đổi nếu chưa hỏi)
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: PostgreSQL, Auth (email + mật khẩu), Storage (bucket private), Realtime (chat)
- Deploy: Vercel; DNS + chống tấn công: Cloudflare; captcha: Cloudflare Turnstile
- Thanh toán: SePay (webhook) + VietQR, ngân hàng MB (MBBank), tài khoản cá nhân của chủ web
- Email giao dịch (reset mật khẩu, xác nhận): SMTP tùy chỉnh (Resend hoặc Brevo)
- Thông báo cho admin: Telegram Bot
- PDF: pdf-lib (đếm số trang), thư viện render trang PDF thành ảnh (làm ảnh bìa), pdf.js (xem online)
- PWA: cài như app trên điện thoại

## Môn học
Toán, Lý, Hóa, Sinh, Sử, Địa, KTPL, Anh, Tin (bán và thi thử).
Văn: CHỈ bán tài liệu/đề, KHÔNG có bài thi thử và không xếp hạng.

## Tài liệu
- Loại: lý thuyết, bài tập, đề thi. Khoảng 30 tài liệu ban đầu: 20 miễn phí, 10 có phí.
- Mỗi tài liệu chỉ có 2 file do admin tự upload: (1) FILE ĐẦY ĐỦ (private): đúng một file duy nhất; có watermark hay không là việc của admin, web KHÔNG thêm, sửa hay quan tâm tới watermark;
  (2) FILE DEMO (public): đúng 3 trang do admin tự chọn và tự upload (web không tự cắt demo). Ảnh bìa tài liệu tự lấy từ trang 1 của file demo.
- Giá xem online = số trang x đơn giá/trang (500-750đ, admin chỉnh được). Giá tải về = giá xem x 1,2 (làm tròn 500đ).
- Chưa mua: chỉ xem file demo. Đã mua gói "Xem online": đọc file đầy đủ trong trình xem của web (có nút Đọc, không có nút Tải).
- Đã mua gói "Tải về": đọc được như trên và có thêm nút Tải; quyền tải VĨNH VIỄN (không hết hạn), tải lại bao nhiêu lần tùy ý. Người đã mua vẫn đọc/tải được kể cả khi tài liệu đã bị gỡ khỏi cửa hàng.
  Xem và tải dùng CÙNG MỘT file đầy đủ, cấp qua link tạm thời hết hạn sau vài phút; web không thêm watermark hay dòng chữ nào vào file.
- Giá tối thiểu: đơn hàng tối thiểu 2.000đ (ngân hàng không chuyển dưới mức này). Tổng nhỏ hơn thì giỏ hàng báo "Đơn tối thiểu 2.000đ" và gợi ý thêm tài liệu khác
  (hiển thị vài tài liệu giá thấp/tài liệu liên quan để khách thêm vào). Phụ phí nâng cấp từ "xem" lên "tải" tối thiểu 2.000đ. Mức 2.000đ là cài đặt trong admin.
- Tài liệu miễn phí: phải đăng nhập mới xem đủ (để gom danh sách học sinh).
- Link file luôn là signed URL hết hạn sau vài phút, không bao giờ lộ đường dẫn cố định.

## Quản trị tài liệu (admin làm việc chủ yếu trên MÁY TÍNH)
- Trang admin thiết kế desktop-first (bảng dữ liệu rộng, thao tác chuột/bàn phím, kéo thả file); điện thoại chỉ cần xem và duyệt nhanh.
- Admin tự làm được mọi việc mà không cần sửa code: đăng tài liệu mới, thay file PDF, sửa thông tin, đổi giá, gỡ khỏi cửa hàng, khôi phục.
- "Gỡ" tài liệu = ẨN khỏi cửa hàng (soft delete). Người đã mua vẫn đọc/tải được. Chỉ cho xóa vĩnh viễn khi chưa có ai mua, và phải xác nhận 2 lần.
- Đổi giá chỉ áp dụng cho đơn mới. Mỗi đơn lưu lại giá tại thời điểm mua (đơn cũ không bị đổi). Có lịch sử đổi giá.
- Thay file đầy đủ hoặc file demo (thay riêng từng file): người đã mua thấy file đầy đủ mới.
- Mọi thao tác của admin được ghi nhật ký (audit log).

## Email sau khi mua
- KHÔNG đính kèm file PDF trong email. Sau khi thanh toán thành công, gửi email xác nhận đơn hàng gồm: tên tài liệu, quyền đã mua (xem online / tải về), số tiền, mã đơn, thời gian, và nút "Đọc tài liệu" dẫn tới trang đọc tài liệu trong tài khoản.
- Link trong email là link tới trang web (ví dụ /doc/<slug>), khách PHẢI đăng nhập đúng tài khoản đã mua mới xem được. Không đặt signed URL trực tiếp tới file trong email.
- Email gửi nền (không làm chậm webhook), tự thử lại nếu lỗi, không gửi trùng khi webhook gọi lặp. Dùng chung dịch vụ SMTP với email đặt lại mật khẩu.
- Email giao dịch (xác nhận đơn) khác với email marketing: email marketing chỉ gửi cho người tick đồng ý nhận và phải có nút hủy đăng ký.

## Premium
59.000đ / 30 ngày: xem online mọi tài liệu có phí, làm mọi đề thi có phí (kể cả link Azota).
Quyền tải: được tải tối đa 5 TÀI LIỆU KHÁC NHAU trong thời gian Premium. Lần đầu bấm tải một tài liệu thì tài liệu đó chiếm 1 trong 5 suất;
5 tài liệu đã chiếm suất thì tải lại bao nhiêu lần cũng được trong thời gian Premium. Hết Premium thì hết quyền tải (file đã tải về máy vẫn còn).
Gia hạn Premium: làm mới 5 suất cho kỳ mới. Web hiển thị "Đã dùng 2/5 suất tải".

## Mã giảm giá
Giảm theo %, là chuỗi ký tự người dùng nhập. Mỗi tài khoản dùng tối đa 1 lần cho mỗi mã.
Mỗi mã có ngày giờ bắt đầu và kết thúc (thường trong 1 ngày). Admin tự tạo/tắt mã.
Hỗ trợ mã giảm 100% (đơn 0đ): không hiện mã QR, không cần chuyển khoản, đơn tự chuyển `paid` và mở khóa tài liệu ngay (vẫn gửi email xác nhận, báo Telegram).
Đơn 0đ không tính vào doanh thu và không phải chịu mức đơn tối thiểu 2.000đ. Mã 100% bắt buộc có: số lượt dùng tối đa, thời gian hiệu lực, chỉ tài khoản đã xác minh email mới dùng được,
và (tùy chọn) giới hạn áp dụng cho một số tài liệu. Tổng sau giảm nằm giữa 1đ và 1.999đ thì thu 2.000đ.

## Thi thử
- Chỉ trắc nghiệm (A/B/C/D). Chấm tự động trên web, có bấm giờ.
- Loại 1: đề làm trên web (tính điểm vào bảng xếp hạng).
- Loại 2: đề làm trên Azota: admin dán link, chỉ hiện nút mở link khi người dùng đủ quyền (miễn phí / đã mua / premium). Loại này không tự vào bảng xếp hạng.
- Admin nhập đề bằng cách dán JSON (do AI trích từ Word/PDF) vào trang admin.

## Kỳ thi (sự kiện thi thử do admin quản lý, để kéo tương tác)
- Admin tự tạo "Kỳ thi" để quyết định học sinh được thi đề nào, khi nào. Mỗi kỳ thi có: tên, mô tả và thể lệ, ảnh banner, danh sách đề được chọn từ kho đề (đề làm trên web hoặc đề Azota),
  thời gian mở và đóng (hẹn giờ, web tự mở/đóng), ai được tham gia (mọi tài khoản / chỉ Premium / chỉ người đã mua), số lần thi tối đa,
  tính vào bảng xếp hạng chung hay chỉ bảng xếp hạng riêng của kỳ thi, thời điểm hiện đáp án và giải thích (ngay sau khi nộp / sau khi kỳ thi kết thúc), phần thưởng (mã giảm giá, vinh danh top N).
- Trạng thái: Nháp, Đã hẹn giờ, Đang diễn ra, Đã kết thúc. Có nút "Mở ngay", "Đóng ngay", "Nhân bản kỳ thi".
- Mỗi đề trong kho chọn được: "Luôn mở" hoặc "Chỉ mở trong kỳ thi".
- Trang chủ hiện kỳ thi đang diễn ra (đồng hồ đếm ngược, nút Tham gia) và kỳ thi sắp tới.
- Thống kê từng kỳ thi: số người tham gia, số lượt thi, điểm trung bình, phân bố điểm, tỷ lệ hoàn thành, số người mua tài liệu sau khi thi, nguồn khách; xuất CSV; báo tổng kết qua Telegram khi kỳ thi kết thúc.

## Chuyển đổi người thi thành người mua
1. Gợi ý tài liệu sau khi thi: mỗi câu hỏi có trường `topic` (chủ đề). Admin gán chủ đề với tài liệu (bảng topic_documents). Trang kết quả hiện 2-3 chủ đề làm sai nhiều nhất kèm tài liệu gợi ý và nút Mua.
   Chưa gán thì gợi ý tài liệu cùng môn.
2. Mã giảm giá tặng sau lần thi đầu: cấu hình theo từng kỳ thi (% giảm, thời hạn tính từ lúc nộp bài, ví dụ 48 giờ, phạm vi tài liệu, số lượt tối đa). Web tự tạo mã riêng cho từng học sinh, dùng 1 lần,
   hiện ở trang kết quả và trong tài khoản (có đếm ngược). Mỗi tài khoản chỉ nhận 1 mã cho mỗi kỳ thi.
3. Chia sẻ kết quả: nút chia sẻ Facebook/Zalo/sao chép link, kèm mã giới thiệu bạn bè. Thẻ xem trước chỉ hiện môn, điểm và biệt danh ĐÃ DUYỆT (hoặc "Một học sinh"); KHÔNG hiện tên thật, trường, SĐT.

## Bảng xếp hạng
- Top 10 theo từng môn: lấy điểm cao nhất của mỗi học sinh ở môn đó.
- Top 10 theo khối: tổng điểm cao nhất của 3 môn trong khối. Chỉ xếp những học sinh đã thi đủ 3 môn.
- Khối là cấu hình trong admin (bảng `combos`), seed sẵn: A00 (Toán-Lý-Hóa), A01 (Toán-Lý-Anh), A02 (Toán-Lý-Sinh), B00 (Toán-Hóa-Sinh), D07 (Toán-Hóa-Anh), D08 (Toán-Sinh-Anh). Không có khối nào chứa Văn. Admin có thể thêm khối khác.
- Top 10 nổi bật chạy ở banner trang chủ (hiện biệt danh + trường, KHÔNG hiện địa chỉ).

## Quyền riêng tư và kiểm duyệt tên
- Nhiều học sinh dưới 18 tuổi. Chỉ thu thập: họ tên, biệt danh, tên trường, SĐT, email. Không hỏi địa chỉ.
- Người dùng phải tick đồng ý trước khi tên/trường hiển thị công khai.
- Biệt danh/tên trường mới hoặc vừa sửa luôn ở trạng thái `pending`, KHÔNG hiện công khai cho đến khi admin duyệt.
- Admin có 3 lựa chọn: Duyệt / Che bằng **** / Từ chối.
- Có bước lọc tự động trước (danh sách từ tục tiếng Việt, chuẩn hóa dấu và ký tự lách như "d.m", "đ1t"), mục nào nghi ngờ được gắn cờ để admin xem trước.

## Tương tác
- Bình luận hiện ngay khi đăng, tự ẩn nếu dính từ cấm, có nút báo cáo; admin nhận thông báo Telegram.
- Đánh giá sao (1-5) cho tài liệu, mỗi người 1 lần/tài liệu.
- Chat: chat với admin theo tài liệu, và phòng chat nhóm do học sinh tạo (có kiểm soát spam, admin xóa/khóa được).
- Nút cố định: chat Messenger fanpage + Zalo; nút "Tham gia nhóm Zalo" (link cấu hình trong admin).

## Tính năng khác
Lọc thông minh (tick môn, loại, miễn phí/có phí, khối, rồi bấm Tìm), combo nhiều tài liệu giảm giá, flash sale có đồng hồ đếm ngược,
giới thiệu bạn bè nhận mã giảm giá, chế độ sáng/tối, thống kê (bán chạy, nguồn khách qua UTM: facebook/tiktok/youtube).

## Nguyên tắc bắt buộc
1. Mọi bảng bật Row Level Security. Không để service_role key lộ ra trình duyệt.
2. Kiểm tra dữ liệu đầu vào ở server (zod). Mọi quyền truy cập file kiểm tra ở server.
3. Trang công khai phải cache được (static/ISR) để 10.000 người truy cập không đè vào database.
4. Code sạch, có comment tiếng Việt ở chỗ khó, có file `.env.example`, có README hướng dẫn chạy và deploy cho người mới.
5. Giao diện tiếng Việt, mobile-first (375px) rồi tới máy tính (1280px).
```

---

## PHẦN 1. Lộ trình A-Z (làm trước khi chạy prompt)

### Bước 1. Tạo tài khoản (đều có gói miễn phí để bắt đầu)
| Dịch vụ | Dùng để làm gì |
|---|---|
| GitHub | Lưu code |
| Supabase | Database, đăng nhập, lưu PDF, chat realtime |
| Vercel | Chạy website |
| Cloudflare | Quản lý tên miền, chống DDoS, captcha Turnstile |
| SePay | Xác nhận thanh toán tự động |
| Telegram (tạo bot qua @BotFather) | Báo cho bạn khi có đơn, bình luận, tên chờ duyệt |
| Resend hoặc Brevo | Gửi email reset mật khẩu |
| Azota | Tạo đề có link (cho đề có phí) |

### Bước 2. Cài trên máy
Antigravity, Node.js bản LTS, Git. Tạo thư mục dự án, `git init`, tạo file `PROJECT_SPEC.md` (Phần 0).

### Bước 3. Liên kết SePay với MB (MBBank)
Đăng ký SePay, chọn gói "Chỉ cần chia sẻ biến động số dư", thêm tài khoản MB theo hướng dẫn "Kết nối ngân hàng MB qua API" của SePay và xác nhận qua OTP. Sau đó chuyển thử 1.000đ bằng mã QR SePay hiển thị để kiểm tra SePay thấy giao dịch. Hãy tạo tiền tố mã thanh toán (ví dụ `TL`). Giai đoạn 5 mới cần tới webhook.

### Bước 4. Chạy lần lượt Prompt 1 đến Prompt 9 (Phần 2), có thêm Prompt 6B (Kỳ thi) chạy ngay sau Prompt 6

### Bước 5. Trước khi quảng bá, bắt buộc kiểm tra
- Tự mua thử 1 tài liệu với số tiền nhỏ (ví dụ đặt giá thử 2.000đ), xem web có tự mở khóa không.
- Thử chuyển sai số tiền, sai nội dung, chuyển trùng 2 lần: web phải xử lý đúng (xem Prompt 5).
- Thử mã giảm giá: hết hạn, dùng lần 2, nhập sai.
- Chạy thử kiểm tra tải (Prompt 9).
- Nâng Supabase và Vercel lên gói trả phí trước ngày quảng bá lớn (xem Phần 3).

### Bước 6. Vận hành hằng ngày
Quy trình đẩy tài liệu: soạn PDF, vào trang Admin, upload file đầy đủ và file demo 3 trang (web tự đếm số trang, tự lấy ảnh bìa từ trang 1 file demo), điền môn, loại, giá, bấm đăng. Mỗi sáng bạn xem Telegram và mục "Chờ duyệt" (tên học sinh, bình luận bị gắn cờ, đơn thanh toán lệch tiền).

---

## PHẦN 2. Các prompt cho Antigravity

### Prompt 1. Khởi tạo dự án, database, phân quyền

```
Đọc PROJECT_SPEC.md trước khi làm. Hãy lập kế hoạch rồi chờ tôi duyệt, sau đó thực hiện.

Nhiệm vụ: khởi tạo nền tảng dự án.
1. Tạo dự án Next.js (App Router, TypeScript, Tailwind), cấu trúc thư mục rõ ràng, ESLint + Prettier.
2. Kết nối Supabase (client cho trình duyệt dùng anon key, client riêng cho server dùng service role key chỉ ở server).
3. Viết các file migration SQL đầy đủ cho các bảng: profiles, documents, document_files, orders, order_items,
   entitlements, coupons, coupon_redemptions, premium_subscriptions, download_logs, exams, questions, attempts,
   combos (khối thi), comments, reviews, chat_rooms, chat_messages, notifications, referrals, bundles, flash_sales,
   site_settings, analytics_events, exam_events, exam_event_items, event_coupon_templates, topic_documents (và bảng lưu mã giảm giá riêng tặng cho từng học sinh).
   - Thêm khóa ngoại, index cho các cột hay truy vấn, ràng buộc unique (ví dụ coupon_redemptions unique theo user_id + coupon_id,
     reviews unique theo user_id + document_id, orders.payment_code unique, sepay_transaction_id unique).
   - Cột trạng thái dùng enum hoặc check constraint.
4. Bật Row Level Security cho TẤT CẢ bảng, viết policy: người dùng chỉ đọc/ghi dữ liệu của mình; tài liệu công khai chỉ đọc
   metadata; admin (role trong profiles) mới được ghi các bảng quản trị. Giải thích từng policy bằng comment.
5. Tạo Supabase Storage bucket: `previews` (public), `documents` (private, chứa file đầy đủ), `covers` (public).
6. Tạo file `.env.example` liệt kê mọi biến môi trường cần, và README hướng dẫn tôi cách tạo project Supabase,
   chạy migration và chạy web ở máy cho người mới.

Đầu ra: code + file SQL + README. Không làm giao diện ở bước này.
```

### Prompt 2. Hệ thống giao diện và các trang công khai (dùng bản thiết kế Gemini)

Đính kèm ảnh chụp/HTML của bản phác thảo Gemini vào prompt này.

```
Đọc PROJECT_SPEC.md trước khi làm. Lập kế hoạch rồi chờ tôi duyệt.

Hãy dựng giao diện theo bản thiết kế tôi đính kèm (từ Gemini). Làm đúng bố cục, màu sắc, font.

1. Thiết lập design system trong Tailwind: bảng màu (mỗi môn 1 màu riêng cho 10 môn), font, bo góc, các component dùng lại:
   Button, Card tài liệu, Badge (Miễn phí/Có phí), Rating sao, Modal, Toast, Skeleton loading, bộ lọc dạng checkbox.
2. Layout chung: header (logo, ô tìm kiếm, giỏ hàng, đăng nhập), thanh điều hướng dưới cùng cho điện thoại,
   footer (chính sách bảo mật, điều khoản, liên hệ), nút nổi chat Messenger + Zalo.
3. Các trang (tạm dùng dữ liệu mẫu, chưa nối database): Trang chủ (banner vinh danh Top 10 dạng carousel, lưới 10 môn,
   tài liệu miễn phí nổi bật, bán chạy, flash sale đếm ngược), Thư viện (bộ lọc tick ô + nút Tìm), Chi tiết tài liệu,
   Giỏ hàng, Premium, Bảng xếp hạng (tab theo môn và theo khối), Trang tài khoản.
4. Chế độ sáng/tối (lưu lựa chọn), responsive 375px và 1280px, đạt Lighthouse mobile >= 90 về hiệu năng.
5. Dùng next/image, lazy load, font tối ưu. Trang công khai phải dùng static generation/ISR.

Đầu ra: giao diện chạy được với dữ liệu mẫu. Chụp ảnh màn hình 375px và 1280px cho từng trang để tôi kiểm tra.
```

### Prompt 3. Đăng nhập, hồ sơ, kiểm duyệt tên

```
Đọc PROJECT_SPEC.md trước khi làm. Lập kế hoạch rồi chờ tôi duyệt.

Xây hệ thống tài khoản bằng Supabase Auth (email + mật khẩu), nối với database thật:
1. Đăng ký (email, mật khẩu, họ tên, biệt danh, tên trường, SĐT, tick đồng ý chính sách + tick đồng ý hiển thị công khai),
   đăng nhập, đăng xuất, quên mật khẩu/đặt lại mật khẩu (qua email, cấu hình SMTP tùy chỉnh), xác minh email.
2. Cloudflare Turnstile ở form đăng ký/đăng nhập/quên mật khẩu; giới hạn số lần thử (rate limit) theo IP và theo email.
3. Mật khẩu tối thiểu 8 ký tự; không tự viết cơ chế mã hóa mật khẩu, dùng của Supabase.
4. Khi đăng ký hoặc sửa biệt danh/tên trường: đặt trạng thái `pending`. Chạy bộ lọc tự động
   (danh sách từ tục tiếng Việt, chuẩn hóa bỏ dấu, bỏ ký tự chen như dấu chấm/số lách, kiểm tra từ viết tắt).
   Mục nghi ngờ gắn cờ `flagged`. Gửi thông báo Telegram cho admin.
5. Trang admin "Chờ duyệt": liệt kê mục chờ duyệt, 3 nút Duyệt / Che (thay bằng ****) / Từ chối, duyệt hàng loạt.
   Chỉ mục `approved` hoặc `masked` mới được hiển thị công khai.
6. Trang tài khoản: sửa hồ sơ, xem tài liệu đã mua, premium còn bao nhiêu ngày, mã giới thiệu, xóa tài khoản và dữ liệu cá nhân.
7. Ghi lại UTM nguồn khách (facebook/tiktok/youtube) khi vào web lần đầu, lưu vào hồ sơ.

Viết test cho luồng đăng ký, đăng nhập, bộ lọc từ cấm. Báo cáo cho tôi các cài đặt cần làm thủ công trên Supabase dashboard.
```

### Prompt 4. Tài liệu: upload, thư viện, xem trước, quyền xem/tải

```
Đọc PROJECT_SPEC.md trước khi làm. Lập kế hoạch rồi chờ tôi duyệt.

Xây phần quản lý và hiển thị tài liệu:
1. Trang admin quản lý tài liệu, thiết kế cho MÁY TÍNH (bảng rộng, thao tác bằng chuột, kéo thả file). Tôi phải tự làm được mọi việc không cần sửa code:
   a. Đăng mới: có 2 ô kéo thả: "File đầy đủ" (bắt buộc, riêng tư) và "File demo" (bắt buộc, công khai, 3 trang do tôi tự chọn). Web KHÔNG tự cắt demo và KHÔNG thêm/sửa watermark.
      Hệ thống tự (1) đếm số trang của file đầy đủ, (2) tạo ảnh bìa từ trang 1 của file demo, (3) tính giá xem = số trang x đơn giá/trang, giá tải = giá xem x 1,2 làm tròn 500đ (admin sửa tay được).
      An toàn: file demo là công khai nên nếu file ở ô demo có hơn 5 trang hoặc nhiều hơn 30% số trang của file đầy đủ thì hiện cảnh báo lớn và bắt xác nhận, tránh upload nhầm file đầy đủ vào ô demo.
      Admin chọn môn, loại, miễn phí/có phí, khối liên quan, mô tả, lưu nháp hoặc đăng.
   b. Danh sách tài liệu dạng bảng: tìm kiếm, lọc theo môn/trạng thái (Nháp, Đang bán, Đã gỡ), sắp xếp, chọn nhiều dòng để thao tác hàng loạt.
   c. Sửa tài liệu: đổi tên, mô tả, môn, miễn phí/có phí.
   d. Đổi giá: sửa giá từng tài liệu; sửa giá hàng loạt (đặt lại đơn giá/trang cho nhiều tài liệu, hoặc tăng/giảm theo %); xem trước giá mới trước khi lưu.
      Đổi giá chỉ áp dụng cho đơn mới, đơn cũ giữ giá lúc mua (lưu giá trong order_items). Có lịch sử đổi giá (ai đổi, lúc nào, từ bao nhiêu sang bao nhiêu).
   e. Thay file cho tài liệu đã đăng: thay riêng "File đầy đủ" hoặc "File demo" (thay file demo thì ảnh bìa tự cập nhật). Người đã mua thấy file đầy đủ mới. Giữ lại tối đa vài phiên bản cũ.
   f. Gỡ và khôi phục: nút "Gỡ khỏi cửa hàng" chỉ ẨN tài liệu (soft delete), người đã mua vẫn đọc/tải được; nút "Khôi phục". Chỉ cho "Xóa vĩnh viễn" khi chưa có ai mua,
      và phải xác nhận 2 lần (gõ lại tên tài liệu). Gỡ hàng loạt được.
   g. Mọi thao tác thêm/sửa/đổi giá/gỡ ghi vào audit log.
   Lưu bản đầy đủ vào bucket private. Kiểm tra file tải lên: chỉ nhận PDF, giới hạn dung lượng, quét kiểu file thật (không tin đuôi file).
2. Thư viện công khai: lọc bằng ô tick (môn, loại, miễn phí/có phí, khối) rồi bấm Tìm; tìm theo từ khóa
   (full-text search tiếng Việt không dấu); phân trang; sắp xếp mới nhất/bán chạy/giá.
3. Trang chi tiết: xem bản demo công khai; hiển thị giá xem và giá tải; thêm vào giỏ; đánh giá và bình luận (làm ở giai đoạn sau).
4. Hệ thống không tạo, không thêm, không sửa watermark và không sinh file riêng cho từng người dùng. File đầy đủ do tôi upload thế nào thì phục vụ đúng như vậy.
   Quyền "Xem online" chỉ mở trình xem; quyền "Tải về" mới mở thêm nút Tải (cùng một file đầy đủ).
   Người dùng chỉ nhận signed URL hết hạn sau vài phút, do server cấp sau khi kiểm tra quyền.
5. Trình xem online dùng pdf.js: chống chọn/copy văn bản cơ bản, tắt chuột phải, ẩn nút tải nếu không có quyền tải.
   Nút tải chỉ hiện khi có quyền "download"; mỗi lượt tải ghi vào download_logs.
6. Quyền tải: gói "Tải về" mua lẻ là vĩnh viễn, tải lại không giới hạn. Premium: tối đa 5 tài liệu khác nhau trong kỳ 30 ngày, lần đầu tải một tài liệu thì chiếm 1 suất
   (bảng premium_download_slots, unique theo user + document + kỳ premium), tải lại tài liệu đã chiếm suất thì không tốn thêm suất, hết Premium thì hết quyền tải.
   Báo rõ "Đã dùng 2/5 suất tải" và cảnh báo trước khi chiếm suất ("Tài liệu này sẽ dùng 1 trong 5 suất tải của bạn").

Quan trọng: việc tạo ảnh bìa chạy nền; việc cấp link xem/tải phải có giới hạn tốc độ để không bị lạm dụng khi nhiều người cùng bấm.
Viết test cho phân quyền (người chưa mua không lấy được file đầy đủ bằng bất kỳ cách nào).
```

### Prompt 5. Giỏ hàng, mã giảm giá, thanh toán QR SePay, Premium

```
Đọc PROJECT_SPEC.md trước khi làm. Lập kế hoạch rồi chờ tôi duyệt.

Xây giỏ hàng và thanh toán tự động bằng SePay (chuyển khoản vào tài khoản MB, xác nhận bằng webhook):
1. Giỏ hàng (nhiều tài liệu, mỗi mục chọn "xem online" hoặc "tải về"; combo; flash sale). Tính tổng ở SERVER, không tin giá từ trình duyệt.
2. Mã giảm giá: nhập chuỗi ký tự, kiểm tra ở server: còn trong thời gian, đang bật, tài khoản này chưa dùng
   (ràng buộc unique trong database để chống bấm 2 lần cùng lúc), còn lượt dùng (max_uses), giảm theo %. Hiện số tiền được giảm.
   Mã giảm 100% (đơn 0đ): bỏ qua bước QR, tạo đơn `paid` với payment_method='coupon', mở khóa tài liệu ngay trong cùng một giao dịch database
   (chống dùng 2 lần cùng lúc), gửi email xác nhận, báo Telegram, KHÔNG tính vào doanh thu. Chỉ tài khoản đã xác minh email mới dùng được mã 100%.
   Đơn tối thiểu 2.000đ (đọc từ cài đặt admin): đơn có tổng từ 1đ đến 1.999đ thì báo "Đơn tối thiểu 2.000đ" và hiện gợi ý thêm tài liệu liên quan/giá thấp;
   riêng đơn 0đ do mã 100% thì được miễn mức tối thiểu. Phụ phí nâng cấp "xem" lên "tải" tối thiểu 2.000đ. Tổng sau giảm từ 1đ đến 1.999đ thì thu 2.000đ.
3. Tạo đơn: sinh payment_code ngẫu nhiên duy nhất (tiền tố cấu hình được, ví dụ TL + 8 ký tự), lưu đơn trạng thái pending,
   hiện mã VietQR (số tiền + nội dung chuyển khoản = payment_code), đếm ngược thời gian, tự động kiểm tra trạng thái đơn
   (Supabase Realtime hoặc polling nhẹ) và chuyển sang "Thanh toán thành công".
   Thông tin nhận tiền (mã ngân hàng MB, số tài khoản, tên chủ tài khoản) đọc từ biến môi trường/site_settings, KHÔNG viết cứng trong code,
   để sau này đổi ngân hàng hoặc tài khoản không phải sửa code. Tạo ảnh QR bằng dịch vụ tạo QR của SePay hoặc VietQR (đọc tài liệu chính thức để dùng đúng định dạng).
4. Webhook SePay (`/api/webhooks/sepay`):
   - Xác thực bằng API key trong header, so sánh hằng thời gian, từ chối nếu sai.
   - Tìm đơn theo payment_code trong nội dung chuyển khoản. Kiểm tra số tiền >= tổng đơn.
   - Idempotent: một giao dịch SePay (id) chỉ xử lý một lần, kể cả khi SePay gọi lại nhiều lần hoặc nhiều giao dịch đến cùng lúc.
   - Thành công: đặt đơn `paid`, cấp entitlements (xem/tải) cho từng tài liệu, ghi nhận dùng mã giảm giá, báo Telegram cho admin,
     và đưa việc gửi email xác nhận đơn vào hàng đợi chạy nền (xem mục Email sau khi mua trong PROJECT_SPEC.md: không đính kèm PDF, chỉ có nút "Đọc tài liệu" dẫn vào web, khách phải đăng nhập).
     Email gửi trùng phải được chặn (mỗi đơn chỉ gửi 1 email xác nhận), lỗi gửi email KHÔNG được làm hỏng việc mở khóa tài liệu.
   - Sai số tiền / sai nội dung / thanh toán muộn sau khi đơn hết hạn: KHÔNG tự từ chối mà chuyển đơn sang `review` và báo Telegram để admin xử lý.
   - Luôn trả HTTP 200 đúng định dạng SePay yêu cầu khi đã nhận, ghi log đầy đủ (không log thông tin nhạy cảm).
5. Mua Premium 59.000đ/30 ngày qua cùng luồng thanh toán. Nếu đang còn hạn thì cộng thêm 30 ngày.
6. Trang admin "Đơn hàng": danh sách, lọc trạng thái, xử lý đơn `review` (duyệt thủ công / hoàn tiền thủ công), xuất CSV.
7. Giới thiệu bạn bè: khi bạn của người giới thiệu mua đơn đầu tiên, tự tạo mã giảm giá dùng 1 lần cho người giới thiệu.
8. Chống gian lận: giới hạn tạo đơn theo người dùng, không cho mua tài liệu đã sở hữu, tự hủy đơn pending quá hạn.

Viết test tình huống: thanh toán trùng, webhook gọi lặp, hai người dùng cùng mã giảm giá, chuyển thiếu tiền, chuyển muộn,
mã 100% bị dùng đồng thời nhiều lần, mã 100% hết lượt, đơn dưới mức tối thiểu.
Cho tôi hướng dẫn từng bước cấu hình webhook trên SePay và cách thử bằng sandbox.
```

### Prompt 6. Thi thử, Azota, bảng xếp hạng, banner vinh danh

```
Đọc PROJECT_SPEC.md trước khi làm. Lập kế hoạch rồi chờ tôi duyệt.

Xây thi thử trắc nghiệm và bảng xếp hạng:
1. Admin tạo đề bằng cách dán JSON theo schema cố định:
   {"title","subject","duration_minutes","is_free","price","questions":[{"content","topic","options":{"A","B","C","D"},"correct","explanation"}]}
   Có nút kiểm tra JSON, báo lỗi dòng nào sai, xem trước đề, rồi mới đăng. Cho phép sửa từng câu sau khi nhập.
2. Loại đề "Azota": admin dán link Azota vào ô riêng. Chỉ khi người dùng đủ quyền (miễn phí, đã mua, hoặc premium)
   server mới trả link; không bao giờ để link trong HTML công khai. Hiện nút "Làm bài trên Azota" mở tab mới.
3. Giao diện làm bài: đồng hồ đếm ngược, bảng số câu có đánh dấu câu đã làm/chưa làm, tự lưu đáp án tạm thời trên máy
   (mất mạng hoặc tải lại trang không mất bài), nộp bài một lần. Chấm điểm ở SERVER (thang 10), không gửi đáp án đúng xuống trình duyệt khi đang làm.
   Xem lại bài và giải thích sau khi nộp.
4. Bảng xếp hạng: Top 10 theo từng môn (điểm cao nhất mỗi học sinh) và Top 10 theo khối (tổng điểm cao nhất của 3 môn, chỉ xếp học sinh
   đã thi đủ 3 môn). Khối lấy từ bảng `combos` (seed: A00, A01, A02, B00, D07, D08, không có môn Văn), admin thêm/sửa/xóa được.
   Tính bằng materialized view hoặc job làm mới mỗi 1-5 phút, cache kết quả, KHÔNG tính lại mỗi lượt xem trang.
5. Chỉ hiển thị học sinh đã tick đồng ý và có biệt danh/trường đã duyệt (approved/masked). Hiện biệt danh + tên trường, không hiện địa chỉ, SĐT, email.
6. Banner trang chủ: carousel Top 10 nổi bật (admin chọn môn/khối nào hiện), cập nhật tự động từ bảng xếp hạng.
7. Chống gian lận cơ bản: giới hạn số lần thi tính vào xếp hạng cho mỗi đề, ghi thời gian làm bài, cảnh báo bài làm bất thường (quá nhanh).
8. Phục vụ khi nhiều người thi cùng lúc: nộp bài phải nhanh, không để mỗi lượt chấm gọi database nhiều lần.

Viết test cho chấm điểm, xếp hạng theo khối, và quyền mở link Azota.
```

### Prompt 6B. Kỳ thi (admin quản lý) và chuyển đổi người thi thành người mua

Chạy sau Prompt 6.

```
Đọc PROJECT_SPEC.md trước khi làm (đặc biệt các mục "Kỳ thi" và "Chuyển đổi người thi thành người mua"). Lập kế hoạch rồi chờ tôi duyệt.

Phần A. Quản lý "Kỳ thi" trong trang Admin (thiết kế cho MÁY TÍNH, menu "Kỳ thi" riêng):
1. Danh sách kỳ thi dạng bảng: tên, trạng thái (Nháp / Đã hẹn giờ / Đang diễn ra / Đã kết thúc, mỗi trạng thái một màu), thời gian mở-đóng, số người tham gia, số lượt thi.
   Tìm kiếm, lọc theo trạng thái, nút Nhân bản, Mở ngay, Đóng ngay, Xóa (chỉ khi chưa có ai thi).
2. Form tạo/sửa kỳ thi: tên, mô tả và thể lệ (soạn được nội dung có định dạng cơ bản), ảnh banner, chọn đề từ kho đề (chọn nhiều, sắp xếp thứ tự, tìm theo môn),
   thời gian mở và đóng (web tự mở/đóng đúng giờ bằng cron/scheduled job, dùng múi giờ Việt Nam), đối tượng (mọi tài khoản / chỉ Premium / chỉ người đã mua),
   số lần thi tối đa, tính vào bảng xếp hạng chung hay chỉ bảng xếp hạng riêng của kỳ thi, thời điểm hiện đáp án (ngay sau nộp / sau khi kỳ thi kết thúc),
   phần thưởng (văn bản vinh danh, mẫu mã giảm giá tặng).
3. Trong trang quản lý đề: mỗi đề đặt chế độ "Luôn mở" hoặc "Chỉ mở trong kỳ thi" (đề chỉ trong kỳ thi sẽ ẩn khỏi danh sách ngoài kỳ thi, và không làm được khi kỳ thi chưa mở hoặc đã đóng; kiểm tra ở server).
4. Xem trước kỳ thi đúng như học sinh sẽ thấy; lịch các kỳ thi (dạng lịch tháng) để tôi sắp xếp.
5. Trang thống kê từng kỳ thi: số người đăng ký, số lượt thi, điểm trung bình, phân bố điểm (biểu đồ), tỷ lệ hoàn thành bài, bảng xếp hạng riêng của kỳ thi,
   số người mua tài liệu trong 7 ngày sau khi thi, nguồn khách (UTM). Xuất CSV. Khi kỳ thi kết thúc, gửi tổng kết qua Telegram.

Phần B. Phía học sinh:
1. Trang chủ có khối "Kỳ thi đang diễn ra" (banner, đồng hồ đếm ngược, nút Tham gia) và "Sắp diễn ra". Trang riêng cho mỗi kỳ thi: thể lệ, danh sách đề, số người đã tham gia,
   bảng xếp hạng của kỳ thi (Top 10, chỉ hiện biệt danh/trường đã duyệt), phần thưởng.
2. Trang kết quả sau khi thi (thêm vào trang kết quả của Prompt 6):
   a. Gợi ý tài liệu: dựa vào trường `topic` của từng câu, tính 2-3 chủ đề làm sai nhiều nhất, hiện kèm tài liệu gợi ý từ bảng topic_documents (chưa gán thì gợi ý tài liệu cùng môn) và nút "Mua". Trang admin có màn hình gán chủ đề với tài liệu.
   b. Mã giảm giá tặng sau lần thi đầu của kỳ thi: web tạo mã riêng cho học sinh theo mẫu của kỳ thi, dùng 1 lần, hạn dùng tính từ lúc nộp bài (ví dụ 48 giờ), hiện đồng hồ đếm ngược
      và nút "Dùng ngay". Mỗi tài khoản chỉ nhận một mã cho mỗi kỳ thi (ràng buộc unique trong database, chống bấm nhiều lần). Mã nằm trong mục "Mã của tôi" ở trang Tài khoản.
   c. Nút chia sẻ kết quả (Facebook, Zalo, sao chép link) kèm mã giới thiệu bạn bè. Trang chia sẻ có thẻ xem trước (Open Graph) chỉ hiện môn, điểm và biệt danh ĐÃ DUYỆT
      (hoặc "Một học sinh"); tuyệt đối không hiện tên thật, trường, SĐT, email.

Phần C. Kỹ thuật:
- Chạy được khi hàng nghìn học sinh cùng vào kỳ thi lúc giờ mở: trang kỳ thi và danh sách đề cache được, nộp bài nhẹ, bảng xếp hạng kỳ thi cache 1-5 phút.
- Kiểm tra thời gian mở/đóng ở SERVER, không tin đồng hồ trên máy học sinh. Bài đang làm dở khi kỳ thi đóng: xử lý rõ ràng (cho nộp trong khoảng ân hạn ngắn, cài đặt được).
- Chống gian lận cơ bản: giới hạn số lần thi, mỗi tài khoản chỉ nhận mã thưởng một lần, xác minh email trước khi nhận mã.
- Cập nhật mẫu JSON nhập đề: mỗi câu có thêm trường "topic" (chủ đề). Viết test cho hẹn giờ mở/đóng, nhận mã thưởng đồng thời, và quyền truy cập đề chỉ trong kỳ thi.
```

---

### Prompt 7. Bình luận, đánh giá, chat, Zalo/Messenger

```
Đọc PROJECT_SPEC.md trước khi làm. Lập kế hoạch rồi chờ tôi duyệt.

Xây phần tương tác:
1. Bình luận dưới mỗi tài liệu (hỗ trợ trả lời): hiện ngay sau khi đăng. Tự ẩn nếu dính từ cấm, có nút Báo cáo.
   Mỗi bình luận mới gửi thông báo Telegram cho admin (gộp thông báo nếu quá nhiều trong thời gian ngắn).
   Admin xóa/ẩn/khóa người dùng ngay trong trang admin. Giới hạn tốc độ đăng bình luận.
2. Đánh giá sao 1-5: mỗi người 1 lần/tài liệu, hiện trung bình và số lượt.
3. Chat bằng Supabase Realtime: (a) chat với admin theo từng tài liệu (admin có hộp thư tổng, thấy tên tài liệu), 
   (b) phòng chat nhóm do học sinh tạo: tạo phòng, mời bằng link, rời phòng; admin xem và xóa tin, khóa phòng, cấm người dùng.
   Lọc từ cấm, giới hạn tốc độ gửi tin, báo cáo tin nhắn. Chỉ thành viên mới đọc được tin của phòng (RLS).
4. Nút nổi Messenger fanpage (Meta Chat plugin hoặc link m.me) và Zalo (link chat Zalo/Zalo OA), nút "Tham gia nhóm Zalo".
   Các link này đọc từ bảng site_settings để admin tự đổi, không viết cứng trong code.
5. Thông báo trong web (chuông): có người trả lời bình luận, tin nhắn mới, đơn thanh toán thành công.

Viết test cho RLS của chat và bình luận.
```

### Prompt 8. Trang Admin, thống kê, combo, flash sale

```
Đọc PROJECT_SPEC.md trước khi làm. Lập kế hoạch rồi chờ tôi duyệt.

Hoàn thiện trang Admin (/admin, chỉ tài khoản admin, bắt buộc kiểm tra quyền ở server cho mọi route và API):
1. Dashboard: doanh thu theo ngày/tuần/tháng, số đơn, tài liệu bán chạy, người dùng mới, tỷ lệ chuyển đổi,
   nguồn khách theo UTM (facebook/tiktok/youtube/khác), số người đang premium. Có biểu đồ.
2. Quản lý: tài liệu, đề thi, người dùng, đơn hàng, mã giảm giá (tạo hàng loạt mã ngẫu nhiên, đặt %, thời gian, bật/tắt, xem số lượt đã dùng),
   combo (chọn nhiều tài liệu + % giảm), flash sale (chọn tài liệu, giá, giờ bắt đầu/kết thúc, hiện đếm ngược ở web), khối thi (combos), kỳ thi (đã làm ở Prompt 6B, chỉ cần có mục menu và gom thống kê lên Dashboard), cài đặt chung (link Zalo/Messenger, đơn giá/trang, giá premium).
3. Trung tâm "Chờ duyệt": tên/biệt danh/trường chờ duyệt, bình luận bị gắn cờ, đơn thanh toán `review`, báo cáo từ người dùng.
4. Telegram Bot: gửi thông báo khi có đơn thanh toán thành công, đơn lệch tiền, tên chờ duyệt, bình luận bị gắn cờ.
   Có lệnh /doanhthu trả về doanh thu hôm nay.
5. Nhật ký thao tác admin (audit log): ai làm gì lúc nào.
6. Xuất CSV danh sách đơn hàng và danh sách người dùng đồng ý nhận email marketing.
7. Giao diện admin thiết kế ưu tiên MÁY TÍNH (menu bên trái, bảng dữ liệu rộng, phím tắt cơ bản, thao tác hàng loạt), vì tôi làm việc chủ yếu trên máy tính.
   Điện thoại chỉ cần dùng được cho việc xem số liệu và duyệt nhanh (Chờ duyệt, đơn cần kiểm tra).
```

### Prompt 9. Bảo mật, hiệu năng, PWA, kiểm tra tải, deploy

```
Đọc PROJECT_SPEC.md trước khi làm. Lập kế hoạch rồi chờ tôi duyệt.

Mục tiêu: chịu được 10.000 người dùng cùng lúc và an toàn. Hãy rà soát TOÀN BỘ dự án và sửa:

A. Bảo mật
1. Kiểm tra từng bảng đã có RLS và policy đúng. Viết script thử: dùng tài khoản học sinh thử đọc/ghi dữ liệu người khác, thử lấy file PDF chưa mua. Mọi thử nghiệm phải bị chặn.
2. Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy), CORS chặt, cookie httpOnly/secure/sameSite.
3. Rate limit cho toàn bộ API quan trọng (đăng nhập, đăng ký, mã giảm giá, tạo đơn, bình luận, chat) dùng Upstash Redis hoặc tương đương.
4. Validate đầu vào bằng zod mọi API; chống XSS ở bình luận/chat (không render HTML thô); chống SQL injection (chỉ dùng truy vấn tham số hóa).
5. Không có khóa bí mật trong mã nguồn hoặc phía trình duyệt. Rà soát .env và lịch sử git.
6. Hướng dẫn tôi bật Cloudflare (proxy, Bot Fight Mode, rule giới hạn truy cập), bật 2FA cho GitHub/Supabase/Vercel/Cloudflare, và sao lưu database định kỳ.
7. Trang Chính sách bảo mật và Điều khoản (soạn bản nháp tiếng Việt, nêu rõ thu thập dữ liệu gì, dùng để làm gì, quyền xóa dữ liệu, dành cho người dưới 18 tuổi cần có sự đồng ý của cha mẹ khi cần). Nhắc tôi nhờ người có chuyên môn pháp lý xem lại.

B. Hiệu năng
1. Trang công khai cache ở CDN (ISR/static); dữ liệu bảng xếp hạng và danh sách tài liệu cache 1-5 phút.
2. Rà soát truy vấn chậm, thêm index, tránh N+1, dùng connection pooling của Supabase.
3. Các tác vụ nặng (tạo ảnh bìa) chạy nền có hàng đợi, giới hạn đồng thời.
4. Viết kịch bản kiểm tra tải bằng k6: 10.000 người truy cập trang chủ/thư viện, 500 người cùng đăng nhập, 300 người cùng nộp bài thi,
   100 webhook thanh toán cùng lúc. Chạy và báo cáo kết quả, chỉ ra điểm nghẽn và cách sửa.

C. PWA và triển khai
1. PWA: manifest, icon, service worker, hiện lời mời "Thêm vào màn hình chính".
2. Hướng dẫn deploy lên Vercel + trỏ tên miền qua Cloudflare, cấu hình biến môi trường, cấu hình webhook SePay trỏ về tên miền thật.
3. Checklist trước ngày quảng bá lớn.
```

---

## PHẦN 3. Chi phí và cảnh báo khi quảng bá mạnh

Con số dưới đây chỉ là ước tính, bạn cần xem lại trang giá hiện hành của từng dịch vụ.

| Hạng mục | Giai đoạn làm web | Khi quảng bá mạnh |
|---|---|---|
| Tên miền | đã có | đã có |
| Supabase | gói miễn phí | nên lên gói trả phí (khoảng 25 USD/tháng) |
| Vercel | gói miễn phí để thử | gói trả phí cho thương mại (khoảng 20 USD/tháng) |
| Cloudflare | miễn phí | miễn phí |
| SePay | gói FREE (50 giao dịch/tháng) | gói trả phí, xem sepay.vn/bang-gia.html |
| Email | miễn phí (hạn mức nhỏ) | có thể cần gói rẻ |

Tổng khoảng 1-1,5 triệu/tháng, nằm trong ngân sách của bạn. Gói miễn phí của Vercel không dành cho mục đích thương mại, nên đừng bán hàng thật trên gói đó.

Hai điều nên nhớ:
- "10.000 người cùng lúc" chủ yếu được giải quyết bằng **cache**: người chỉ xem trang không đụng tới database. Chỗ dễ nghẽn là đăng nhập, nộp bài thi, webhook thanh toán và cấp link tải file. Prompt 9 xử lý các điểm này.
- Không có cách chống sao chép 100%: file đầy đủ phải tải xuống trình duyệt thì khách mới xem được, và người xem được cũng có thể chụp màn hình. Việc hạn chế chia sẻ lậu dựa vào quyền tải có kiểm soát, link tạm thời hết hạn sau vài phút, và watermark nếu bạn tự gắn vào file.

---

## PHẦN 4. Prompt mẫu nhờ AI trích đề từ Word/PDF thành JSON (dùng cho trang Admin)

Dán prompt này vào Claude hoặc Gemini kèm file đề, rồi copy kết quả dán vào trang Admin ở Prompt 6.

```
Bạn là trợ lý số hóa đề thi trắc nghiệm. Hãy đọc file đề đính kèm và chuyển thành JSON đúng schema sau, không thêm chữ nào ngoài JSON:

{
  "title": "Tên đề",
  "subject": "toan | ly | hoa | sinh | su | dia | ktpl | anh | tin",
  "duration_minutes": 50,
  "is_free": true,
  "price": 0,
  "questions": [
    {
      "content": "Nội dung câu hỏi (công thức viết bằng LaTeX trong dấu $...$)",
      "topic": "Chủ đề của câu theo chương trình lớp 12, ví dụ: Hàm số, Este - Lipit",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "A",
      "explanation": "Giải thích ngắn gọn"
    }
  ]
}

Quy tắc:
- Giữ nguyên nội dung đề, không tự sửa số liệu.
- Nếu đề không có đáp án, tự giải và ghi đáp án, đồng thời thêm trường "needs_review": true cho câu bạn không chắc chắn.
- Câu có hình/bảng: ghi rõ "[HÌNH]" ở vị trí đó để tôi chèn ảnh sau.
- Đánh số câu theo thứ tự trong đề.
- Gán trường "topic" cho MỌI câu, dùng tên chủ đề ngắn gọn và nhất quán trong cùng một đề (cùng một chủ đề thì viết giống hệt nhau).
```
