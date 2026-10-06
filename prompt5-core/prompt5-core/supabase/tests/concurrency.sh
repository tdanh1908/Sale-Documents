#!/usr/bin/env bash
# =============================================================================
# KIỂM TRA CHẠY ĐỒNG THỜI: nhiều phiên cùng gọi hàm một lúc (như khi quảng bá mạnh).
# Dùng database LOCAL / project thử (script tự TẠO và để lại dữ liệu thử, chỉ dùng nơi thử):
#   PSQL='psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"' bash supabase/tests/concurrency.sh
# (PSQL là lệnh kết nối psql; mặc định: psql "$DATABASE_URL")
# =============================================================================
set -u
PSQL="${PSQL:-psql "$DATABASE_URL"}"
TMP="$(mktemp -d)"
FAILS=0

q()  { eval "$PSQL -At -v ON_ERROR_STOP=1 -c \"\$1\""; }
check() { # check "tên" "giá trị thực" "giá trị mong đợi"
  if [ "$2" = "$3" ]; then echo "PASS: $1 (=$2)"; else echo "FAIL: $1 (thực tế=$2, mong đợi=$3)"; FAILS=$((FAILS+1)); fi
}
RUN="$(date +%s)$RANDOM"

echo "--- Chuẩn bị dữ liệu thử ($RUN) ---"
q "
insert into auth.users (id, email, email_confirmed_at)
select gen_random_uuid(), 'cc${RUN}_' || g || '@test.vn', now() from generate_series(1, 12) g;
insert into public.documents (slug, title, subject, doc_type, page_count, price_per_page, view_price, download_price, status)
select 'cc${RUN}-d' || g, 'CC doc ' || g, 'toan', 'ly_thuyet', 20, 500, 10000, 12000, 'published' from generate_series(1, 8) g;
insert into public.document_files (document_id, kind, bucket, storage_path, file_size, page_count)
select id, 'full', 'documents', 'full/cc${RUN}-' || id || '.pdf', 1000, 20 from public.documents where slug like 'cc${RUN}-d%';
insert into public.coupons (code, percent, starts_at, ends_at, max_uses)
values ('CC${RUN}A', 10, now() - interval '1 hour', now() + interval '1 day', 3),
       ('CC${RUN}B', 10, now() - interval '1 hour', now() + interval '1 day', 100);
" > /dev/null
U=($(q "select id from auth.users where email like 'cc${RUN}\_%' order by email"))
D=($(q "select id from public.documents where slug like 'cc${RUN}-d%' order by slug"))

# ---------------------------------------------------------------- A
echo "--- A. 10 người cùng dùng 1 mã giới hạn 3 lượt ---"
for i in $(seq 0 9); do
  ( q "select public.create_order('${U[$i]}', '[{\"type\":\"document\",\"document_id\":\"${D[0]}\"}]'::jsonb, 'CC${RUN}A')::jsonb ->> 'ok'" > "$TMP/a$i" 2>&1 ) &
done; wait
OK=$(cat $TMP/a* | grep -c '^true$')
check "mã 3 lượt: đúng 3 người dùng được (không vượt giới hạn)" "$OK" "3"
check "used_count của mã = 3" "$(q "select used_count from public.coupons where code = 'CC${RUN}A'")" "3"
check "có đúng 3 dòng coupon_redemptions" "$(q "select count(*) from public.coupon_redemptions r join public.coupons c on c.id = r.coupon_id where c.code = 'CC${RUN}A'")" "3"

# ---------------------------------------------------------------- B
echo "--- B. 1 người bấm tạo đơn 6 lần cùng lúc với cùng 1 mã (mỗi tài khoản 1 lần) ---"
for i in $(seq 1 6); do
  ( q "select public.create_order('${U[10]}', '[{\"type\":\"document\",\"document_id\":\"${D[1]}\"}]'::jsonb, 'CC${RUN}B')::jsonb ->> 'ok'" > "$TMP/b$i" 2>&1 ) &
done; wait
check "cùng tài khoản + cùng mã: chỉ 1 đơn tạo được" "$(cat $TMP/b* | grep -c '^true$')" "1"
check "chỉ có 1 dòng dùng mã của tài khoản đó" "$(q "select count(*) from public.coupon_redemptions r join public.coupons c on c.id = r.coupon_id where c.code = 'CC${RUN}B' and r.user_id = '${U[10]}'")" "1"

# ---------------------------------------------------------------- C
echo "--- C. SePay gọi lặp 12 lần cùng 1 giao dịch ---"
OID=$(q "select (public.create_order('${U[11]}', '[{\"type\":\"document\",\"document_id\":\"${D[2]}\"}]'::jsonb) -> 'order' ->> 'id')")
CODE=$(q "select payment_code from public.orders where id = '$OID'")
SALES0=$(q "select sales_count from public.documents where id = '${D[2]}'")
PAYLOAD="{\"id\":\"cc${RUN}1\",\"transferType\":\"in\",\"transferAmount\":10000,\"content\":\"chuyen khoan $CODE\",\"gateway\":\"MBBank\"}"
for i in $(seq 1 12); do
  ( q "select public.process_sepay_payment('$PAYLOAD'::jsonb) ->> 'status'" > "$TMP/c$i" 2>&1 ) &
done; wait
check "đúng 1 lần xử lý 'paid'" "$(cat $TMP/c* | grep -c '^paid$')" "1"
check "11 lần còn lại là 'duplicate'" "$(cat $TMP/c* | grep -c '^duplicate$')" "11"
check "quyền tài liệu chỉ cấp 1 lần" "$(q "select count(*) from public.entitlements where user_id = '${U[11]}'")" "1"
check "lượt bán chỉ tăng 1" "$(( $(q "select sales_count from public.documents where id = '${D[2]}'") - SALES0 ))" "1"
check "chỉ 1 email xác nhận" "$(q "select count(*) from public.email_outbox where dedupe_key = 'order_paid:$OID'")" "1"
check "chỉ 1 dòng giao dịch" "$(q "select count(*) from public.payment_transactions where sepay_transaction_id = 'cc${RUN}1'")" "1"

# ---------------------------------------------------------------- D
echo "--- D. 8 giao dịch KHÁC id cùng trả 1 đơn (khách chuyển trùng nhiều lần) ---"
OID=$(q "select (public.create_order('${U[10]}', '[{\"type\":\"document\",\"document_id\":\"${D[3]}\"}]'::jsonb) -> 'order' ->> 'id')")
CODE=$(q "select payment_code from public.orders where id = '$OID'")
for i in $(seq 1 8); do
  ( q "select public.process_sepay_payment('{\"id\":\"cc${RUN}2$i\",\"transferType\":\"in\",\"transferAmount\":10000,\"content\":\"$CODE\"}'::jsonb) ->> 'status'" > "$TMP/d$i" 2>&1 ) &
done; wait
check "đúng 1 giao dịch mở khóa đơn" "$(cat $TMP/d* | grep -c '^paid$')" "1"
check "7 giao dịch còn lại gắn cờ double_payment" "$(cat $TMP/d* | grep -c '^double_payment$')" "7"
check "quyền tài liệu chỉ cấp 1 lần" "$(q "select count(*) from public.entitlements where user_id = '${U[10]}' and document_id = '${D[3]}'")" "1"

# ---------------------------------------------------------------- E
echo "--- E. Premium: 8 tài liệu khác nhau tải cùng lúc, chỉ có 5 suất ---"
q "insert into public.premium_subscriptions (user_id, starts_at, ends_at, download_slot_limit) values ('${U[9]}', now() - interval '1 day', now() + interval '29 days', 5)" > /dev/null
for i in $(seq 0 7); do
  ( q "select public.authorize_file_access('${U[9]}', '${D[$i]}', 'download') ->> 'ok'" > "$TMP/e$i" 2>&1 ) &
done; wait
check "đúng 5 tải thành công (không vượt 5 suất)" "$(cat $TMP/e* | grep -c '^true$')" "5"
check "đúng 5 suất đã chiếm" "$(q "select count(*) from public.premium_download_slots where user_id = '${U[9]}'")" "5"
check "không có lỗi hệ thống nào" "$(cat $TMP/e* | grep -ci 'error')" "0"

echo
if [ "$FAILS" -eq 0 ]; then echo "=== TẤT CẢ KIỂM TRA ĐỒNG THỜI ĐÃ QUA ==="; else echo "=== CÓ $FAILS KIỂM TRA THẤT BẠI ==="; fi
rm -rf "$TMP"
exit "$FAILS"
