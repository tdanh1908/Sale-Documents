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
- PDF: pdf-lib (watermark, cắt trang demo), pdf.js (xem online)
- PWA: cài như app trên điện thoại

## Môn học
Toán, Lý, Hóa, Sinh, Sử, Địa, KTPL, Anh, Tin (bán và thi thử).
Văn: CHỈ bán tài liệu/đề, KHÔNG có bài thi thử và không xếp hạng.

## Tài liệu
- Loại: lý thuyết, bài tập, đề thi. Khoảng 30 tài liệu ban đầu: 20 miễn phí, 10 có phí.
- Mỗi tài liệu có 2 file: bản demo (vài trang đầu, công khai) và bản đầy đủ (private).
- Giá xem online = số trang x đơn giá/trang (500-750đ, admin chỉnh được). Giá tải về = giá xem x 1,2 (làm tròn 500đ).
- Chưa mua: chỉ xem demo. Đã mua xem online: xem đủ, có watermark tên + SĐT. Đã mua tải về: tải được file có watermark riêng.
- Tài liệu miễn phí: phải đăng nhập mới xem đủ (để gom danh sách học sinh).
- Link file luôn là signed URL hết hạn sau vài phút, không bao giờ lộ đường dẫn cố định.

## Premium
59.000đ / 30 ngày: xem online mọi tài liệu có phí, tải về tối đa 5 bản trong 30 ngày, làm mọi đề thi có phí (kể cả link Azota).

## Mã giảm giá
Giảm theo %, là chuỗi ký tự người dùng nhập. Mỗi tài khoản dùng tối đa 1 lần cho mỗi mã.
Mỗi mã có ngày giờ bắt đầu và kết thúc (thường trong 1 ngày). Admin tự tạo/tắt mã.

## Thi thử
- Chỉ trắc nghiệm (A/B/C/D). Chấm tự động trên web, có bấm giờ.
- Loại 1: đề làm trên web (tính điểm vào bảng xếp hạng).
- Loại 2: đề làm trên Azota: admin dán link, chỉ hiện nút mở link khi người dùng đủ quyền (miễn phí / đã mua / premium). Loại này không tự vào bảng xếp hạng.
- Admin nhập đề bằng cách dán JSON (do AI trích từ Word/PDF) vào trang admin.

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