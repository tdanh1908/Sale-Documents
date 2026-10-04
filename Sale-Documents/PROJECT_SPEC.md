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