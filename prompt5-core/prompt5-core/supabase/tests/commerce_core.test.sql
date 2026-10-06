-- =============================================================================
-- TEST LÕI THANH TOÁN (migration 0012)
-- Cách chạy (database LOCAL hoặc project thử, KHÔNG chạy trên database thật đang bán hàng):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/commerce_core.test.sql
-- Mỗi kiểm tra in "PASS: ..." hoặc dừng ngay với "FAIL: ...". Cuối file ROLLBACK:
-- mọi dữ liệu thử đều bị hủy, không để lại gì.
-- =============================================================================
\set ON_ERROR_STOP on
\set VERBOSITY terse
begin;

create function pg_temp.ok(p_name text, p_cond boolean) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FAIL: %', p_name; end if;
  raise notice 'PASS: %', p_name;
end $$;

create temp table fx (name text primary key, id uuid);
create function pg_temp.fx(p text) returns uuid language sql as $$ select id from fx where name = p $$;
create function pg_temp.q(p_user text, p_items jsonb, p_coupon text default null) returns jsonb
  language sql as $$ select public.quote_cart(pg_temp.fx(p_user), p_items, p_coupon) $$;
create function pg_temp.doc(p text) returns jsonb language sql as $$
  select jsonb_build_object('type', 'document', 'document_id', pg_temp.fx(p), 'access', 'view') $$;
create function pg_temp.docdl(p text) returns jsonb language sql as $$
  select jsonb_build_object('type', 'document', 'document_id', pg_temp.fx(p), 'access', 'download') $$;

-- ---------------------------------------------------------------- FIXTURES ----
do $$
declare
  v_id uuid;
  v_n  text;
  i    integer;
begin
  -- người dùng: a (đã xác minh email), b (chưa xác minh), c, d, e (người mua phụ), admin
  foreach v_n in array array['a', 'b', 'c', 'd', 'e', 'admin'] loop
    insert into auth.users (email, email_confirmed_at, raw_user_meta_data)
    values (v_n || '@test.vn', case when v_n = 'b' then null else now() end, jsonb_build_object('full_name', 'User ' || v_n))
    returning id into v_id;
    insert into fx values (v_n, v_id);
  end loop;
  update public.profiles set role = 'admin' where id = pg_temp.fx('admin');

  -- tài liệu: giá xem / giá tải
  for v_n, i in select * from (values ('d1', 20000), ('d2', 10000), ('d3', 15000), ('d4', 8000)) t loop
    insert into public.documents (slug, title, subject, doc_type, page_count, price_per_page, view_price, download_price, status)
    values (v_n, 'Tài liệu ' || v_n, 'toan', 'ly_thuyet', 30, 500, i, round(i * 1.2 / 500.0) * 500, 'published')
    returning id into v_id;
    insert into fx values (v_n, v_id);
  end loop;
  insert into public.documents (slug, title, subject, doc_type, page_count, price_per_page, view_price, download_price, status)
  values ('dcheap', 'Tài liệu rẻ', 'hoa', 'bai_tap', 3, 500, 1500, 1800, 'published') returning id into v_id;
  insert into fx values ('dcheap', v_id);
  insert into public.documents (slug, title, subject, doc_type, is_free, page_count, status)
  values ('dfree', 'Tài liệu miễn phí', 'ly', 'ly_thuyet', true, 20, 'published') returning id into v_id;
  insert into fx values ('dfree', v_id);
  insert into public.documents (slug, title, subject, doc_type, page_count, price_per_page, view_price, download_price, status)
  values ('dhidden', 'Tài liệu đã gỡ', 'toan', 'ly_thuyet', 30, 500, 10000, 12000, 'hidden') returning id into v_id;
  insert into fx values ('dhidden', v_id);

  -- file đầy đủ (private) + file demo 3 trang cho mọi tài liệu
  for v_n in select name from fx where name ~ '^d([0-9]|cheap|free|hidden)' loop
    insert into public.document_files (document_id, kind, bucket, storage_path, file_size, page_count)
    values (pg_temp.fx(v_n), 'full', 'documents', 'full/' || v_n || '.pdf', 1000, 30);
    insert into public.document_files (document_id, kind, bucket, storage_path, file_size, page_count)
    values (pg_temp.fx(v_n), 'demo', 'previews', 'demo/' || v_n || '.pdf', 100, 3);
  end loop;
end $$;

-- ====================================================== 1. BÁO GIÁ (quote_cart) ====
do $$
declare r jsonb;
begin
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')));
  perform pg_temp.ok('báo giá 1 tài liệu (xem online) = 20.000đ', (r ->> 'ok')::boolean and (r ->> 'total_amount')::int = 20000);

  r := pg_temp.q('a', jsonb_build_array(pg_temp.docdl('d1')));
  perform pg_temp.ok('báo giá gói Tải về = 24.000đ (giá xem x 1,2)', (r ->> 'total_amount')::int = 24000);

  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('dcheap')));
  perform pg_temp.ok('đơn dưới 2.000đ bị từ chối, báo thiếu 500đ',
    r ->> 'error' = 'ORDER_BELOW_MINIMUM' and (r ->> 'missing_amount')::int = 500 and (r ->> 'min_amount')::int = 2000);

  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('dcheap'), pg_temp.doc('d2')));
  perform pg_temp.ok('thêm tài liệu khác thì qua mức tối thiểu (1.500 + 10.000)', (r ->> 'total_amount')::int = 11500);

  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('dfree')));
  perform pg_temp.ok('tài liệu miễn phí không mua được', r ->> 'error' = 'FREE_DOCUMENT');

  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('dhidden')));
  perform pg_temp.ok('tài liệu đã gỡ không mua được', r ->> 'error' = 'DOC_NOT_AVAILABLE');

  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1'), pg_temp.doc('d1')));
  perform pg_temp.ok('trùng tài liệu trong giỏ bị chặn', r ->> 'error' = 'DUPLICATE_ITEM');

  r := pg_temp.q('a', '[]'::jsonb);
  perform pg_temp.ok('giỏ trống bị chặn', r ->> 'error' = 'EMPTY_CART');

  r := pg_temp.q('a', '[{"type":"document","document_id":"không-phải-uuid"}]'::jsonb);
  perform pg_temp.ok('dữ liệu rác không làm sập hàm', r ->> 'error' = 'INVALID_ITEM');

  r := public.quote_cart(null, jsonb_build_array(pg_temp.doc('d1')));
  perform pg_temp.ok('chưa đăng nhập bị chặn', r ->> 'error' = 'LOGIN_REQUIRED');

  r := pg_temp.q('a', jsonb_build_array(jsonb_build_object('type', 'premium')));
  perform pg_temp.ok('báo giá Premium = 59.000đ, 30 ngày',
    (r ->> 'total_amount')::int = 59000 and (r -> 'lines' -> 0 ->> 'premium_days')::int = 30);
end $$;

-- ====================================================== 2. MÃ GIẢM GIÁ ===========
insert into public.coupons (code, percent, starts_at, ends_at, max_uses, require_verified_email, applies_to_all)
values ('GIAM20', 20, now() - interval '1 hour', now() + interval '1 day', 100, false, true),
       ('HETHAN', 20, now() - interval '2 days', now() - interval '1 day', 100, false, true),
       ('CHUADEN', 20, now() + interval '1 day', now() + interval '2 days', 100, false, true),
       ('FREE100', 100, now() - interval '1 hour', now() + interval '1 day', 2, true, true),
       ('GIAM99', 99, now() - interval '1 hour', now() + interval '1 day', 100, false, true),
       ('CHIDOC1', 50, now() - interval '1 hour', now() + interval '1 day', 100, false, false),
       ('MOT', 10, now() - interval '1 hour', now() + interval '1 day', 1, false, true);
insert into public.coupons (code, percent, starts_at, ends_at, is_active)
values ('DATAT', 10, now() - interval '1 hour', now() + interval '1 day', false);
insert into public.coupon_documents (coupon_id, document_id)
select c.id, pg_temp.fx('d1') from public.coupons c where c.code = 'CHIDOC1';

do $$
declare r jsonb;
begin
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')), 'giam20');
  perform pg_temp.ok('mã 20% (gõ thường, có khoảng trắng vẫn nhận): 20.000 -> 16.000',
    (r ->> 'total_amount')::int = 16000 and (r ->> 'discount_amount')::int = 4000);
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')), '  GiAm20 ');
  perform pg_temp.ok('mã chuẩn hóa chữ hoa + bỏ khoảng trắng', (r ->> 'total_amount')::int = 16000);

  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')), 'HETHAN');
  perform pg_temp.ok('mã hết hạn bị từ chối', r ->> 'error' = 'COUPON_EXPIRED');
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')), 'CHUADEN');
  perform pg_temp.ok('mã chưa tới giờ bị từ chối', r ->> 'error' = 'COUPON_NOT_STARTED');
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')), 'DATAT');
  perform pg_temp.ok('mã đã tắt bị từ chối', r ->> 'error' = 'COUPON_INACTIVE');
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')), 'KHONGCO');
  perform pg_temp.ok('mã không tồn tại bị từ chối', r ->> 'error' = 'COUPON_NOT_FOUND');

  r := pg_temp.q('b', jsonb_build_array(pg_temp.doc('d1')), 'FREE100');
  perform pg_temp.ok('mã 100% yêu cầu đã xác minh email', r ->> 'error' = 'COUPON_EMAIL_NOT_VERIFIED');
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')), 'FREE100');
  perform pg_temp.ok('mã 100%: đơn 0đ miễn phí', (r ->> 'total_amount')::int = 0 and (r ->> 'is_free')::boolean);

  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')), 'GIAM99');
  perform pg_temp.ok('tổng sau giảm 200đ (1-1.999đ) được thu bù lên đúng 2.000đ',
    (r ->> 'surcharge_amount')::int = 1800 and (r ->> 'total_amount')::int = 2000);

  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d2')), 'CHIDOC1');
  perform pg_temp.ok('mã giới hạn theo tài liệu: không áp dụng cho tài liệu khác', r ->> 'error' = 'COUPON_NOT_APPLICABLE');
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1'), pg_temp.doc('d2')), 'CHIDOC1');
  perform pg_temp.ok('mã giới hạn theo tài liệu: chỉ giảm dòng đúng tài liệu (10.000 của d1, giữ nguyên d2)',
    (r ->> 'discount_amount')::int = 10000 and (r ->> 'total_amount')::int = 20000);

  r := pg_temp.q('a', jsonb_build_array(jsonb_build_object('type', 'premium')), 'GIAM20');
  perform pg_temp.ok('mã mặc định không áp dụng cho gói Premium', r ->> 'error' = 'COUPON_NOT_APPLICABLE');
end $$;

-- =========================================== 3. KHUYẾN MÃI: FLASH SALE, COMBO ====
insert into public.flash_sales (title, discount_percent, starts_at, ends_at, applies_to_all)
values ('Flash sale thử', 50, now() - interval '1 hour', now() + interval '1 hour', false);
insert into public.flash_sale_items (flash_sale_id, document_id)
select f.id, pg_temp.fx('d3') from public.flash_sales f where f.title = 'Flash sale thử';

insert into public.bundles (slug, title, discount_percent, access_level)
values ('combo-thu', 'Combo thử', 30, 'view');
insert into public.bundle_items (bundle_id, document_id, position)
select b.id, pg_temp.fx(n), p from public.bundles b, (values ('d1', 1), ('d2', 2)) t(n, p) where b.slug = 'combo-thu';

do $$
declare r jsonb;
begin
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d3')));
  perform pg_temp.ok('flash sale 50% giảm tài liệu d3: 15.000 -> 7.500',
    (r ->> 'total_amount')::int = 7500 and (r -> 'lines' -> 0 ->> 'flash_sale_id') is not null);
  r := pg_temp.q('a', jsonb_build_array(pg_temp.doc('d1')));
  perform pg_temp.ok('flash sale không áp cho tài liệu ngoài danh sách', (r ->> 'total_amount')::int = 20000);

  r := pg_temp.q('a', jsonb_build_array(jsonb_build_object('type', 'bundle', 'bundle_id', (select id from public.bundles where slug = 'combo-thu'))));
  perform pg_temp.ok('combo 30%: (20.000 + 10.000) x 0,7 = 21.000, tạo 2 dòng tài liệu',
    (r ->> 'total_amount')::int = 21000 and jsonb_array_length(r -> 'lines') = 2);
end $$;

-- ============================================ 4. NÂNG CẤP XEM -> TẢI ==============
insert into public.entitlements (user_id, document_id, access_level)
values (pg_temp.fx('c'), pg_temp.fx('d1'), 'view'),
       (pg_temp.fx('c'), pg_temp.fx('dcheap'), 'view'),
       (pg_temp.fx('c'), pg_temp.fx('d2'), 'download');

do $$
declare r jsonb;
begin
  r := pg_temp.q('c', jsonb_build_array(pg_temp.docdl('d1')));
  perform pg_temp.ok('đang có quyền xem mà mua tải => tự thành nâng cấp: 24.000 - 20.000 = 4.000đ',
    (r ->> 'total_amount')::int = 4000 and r -> 'lines' -> 0 ->> 'item_type' = 'upgrade');

  r := pg_temp.q('c', jsonb_build_array(jsonb_build_object('type', 'upgrade', 'document_id', pg_temp.fx('dcheap'))));
  perform pg_temp.ok('nâng cấp tài liệu rẻ: phụ phí tối thiểu 2.000đ (chênh lệch chỉ 300đ)', (r ->> 'total_amount')::int = 2000);

  r := pg_temp.q('c', jsonb_build_array(pg_temp.doc('d1')));
  perform pg_temp.ok('mua lại tài liệu đã có quyền xem bị chặn', r ->> 'error' = 'ALREADY_OWNED');
  r := pg_temp.q('c', jsonb_build_array(pg_temp.docdl('d2')));
  perform pg_temp.ok('tài liệu đã có quyền tải bị chặn', r ->> 'error' = 'ALREADY_OWNED');
  r := pg_temp.q('a', jsonb_build_array(jsonb_build_object('type', 'upgrade', 'document_id', pg_temp.fx('d1'))));
  perform pg_temp.ok('nâng cấp tài liệu chưa mua bị chặn', r ->> 'error' = 'NOT_OWNED');
end $$;

-- ======================================================= 5. TẠO ĐƠN ================
do $$
declare r jsonb; v_order record; v_n int;
begin
  r := public.create_order(pg_temp.fx('a'), jsonb_build_array(pg_temp.doc('d1')), 'GIAM20', '{"utm_source":"facebook"}'::jsonb);
  perform pg_temp.ok('tạo đơn thành công', (r ->> 'ok')::boolean);
  select * into v_order from public.orders where id = (r -> 'order' ->> 'id')::uuid;
  perform pg_temp.ok('mã đơn bắt đầu bằng tiền tố TL, chỉ gồm chữ/số in hoa', v_order.payment_code ~ '^TL[A-Z0-9]{8}$');
  perform pg_temp.ok('đơn pending, đúng số tiền 16.000đ, có hạn chuyển khoản',
    v_order.status = 'pending' and v_order.total_amount = 16000 and v_order.expires_at > now());
  perform pg_temp.ok('lưu nguồn khách (UTM)', v_order.utm_source = 'facebook');
  perform pg_temp.ok('giữ lượt mã: used_count tăng, có dòng coupon_redemptions',
    (select used_count from public.coupons where code = 'GIAM20') = 1
    and exists (select 1 from public.coupon_redemptions where order_id = v_order.id));
  perform pg_temp.ok('lưu giá tại thời điểm mua (order_items)',
    (select final_price from public.order_items where order_id = v_order.id) = 16000
    and (select unit_price from public.order_items where order_id = v_order.id) = 20000);
  perform pg_temp.ok('chưa thanh toán thì CHƯA mở khóa', not exists (select 1 from public.entitlements where user_id = pg_temp.fx('a')));

  -- cùng tài khoản dùng lại mã -> chặn
  r := public.create_order(pg_temp.fx('a'), jsonb_build_array(pg_temp.doc('d2')), 'GIAM20');
  perform pg_temp.ok('mỗi tài khoản chỉ dùng 1 lần mỗi mã', r ->> 'error' = 'COUPON_ALREADY_USED_BY_USER');

  -- hết lượt: mã MOT chỉ 1 lượt
  r := public.create_order(pg_temp.fx('d'), jsonb_build_array(pg_temp.doc('d1')), 'MOT');
  perform pg_temp.ok('người 1 dùng mã giới hạn 1 lượt: OK', (r ->> 'ok')::boolean);
  r := public.create_order(pg_temp.fx('e'), jsonb_build_array(pg_temp.doc('d1')), 'MOT');
  perform pg_temp.ok('người 2 dùng mã đã hết lượt: bị chặn', r ->> 'error' = 'COUPON_EXHAUSTED');
  perform pg_temp.ok('lỗi giữa chừng không để lại đơn nửa vời', not exists (select 1 from public.orders where user_id = pg_temp.fx('e')));

  -- giới hạn đơn chờ
  for v_n in 1..5 loop
    perform public.create_order(pg_temp.fx('e'), jsonb_build_array(pg_temp.doc('d2')));
  end loop;
  r := public.create_order(pg_temp.fx('e'), jsonb_build_array(pg_temp.doc('d2')));
  perform pg_temp.ok('quá 5 đơn đang chờ bị chặn', r ->> 'error' = 'TOO_MANY_PENDING');

  -- tài khoản bị khóa
  update public.profiles set is_banned = true where id = pg_temp.fx('b');
  r := public.create_order(pg_temp.fx('b'), jsonb_build_array(pg_temp.doc('d2')));
  perform pg_temp.ok('tài khoản bị khóa không tạo được đơn', r ->> 'error' = 'USER_BANNED');
  update public.profiles set is_banned = false where id = pg_temp.fx('b');
end $$;

-- ================================================ 6. ĐƠN 0đ (MÃ 100%) ===============
do $$
declare r jsonb; v_id uuid;
begin
  r := public.create_order(pg_temp.fx('a'), jsonb_build_array(pg_temp.doc('d3')), 'FREE100');
  v_id := (r -> 'order' ->> 'id')::uuid;
  perform pg_temp.ok('đơn 0đ: tự chuyển paid, không cần chuyển khoản',
    (r ->> 'ok')::boolean and (select status from public.orders where id = v_id) = 'paid' and (r -> 'order' ->> 'is_free')::boolean);
  perform pg_temp.ok('đơn 0đ: mở khóa tài liệu ngay',
    exists (select 1 from public.entitlements where user_id = pg_temp.fx('a') and document_id = pg_temp.fx('d3') and access_level = 'view'));
  perform pg_temp.ok('đơn 0đ: xếp email xác nhận vào hàng đợi', exists (select 1 from public.email_outbox where dedupe_key = 'order_paid:' || v_id));
  perform pg_temp.ok('đơn 0đ: có dòng tài liệu lưu giá', (select count(*) from public.order_items where order_id = v_id) = 1);

  -- người 2 dùng nốt lượt cuối của mã FREE100 (max 2), người 3 hết lượt
  r := public.create_order(pg_temp.fx('c'), jsonb_build_array(pg_temp.doc('d4')), 'FREE100');
  perform pg_temp.ok('mã 100% lượt thứ 2 vẫn dùng được', (r ->> 'ok')::boolean);
  r := public.create_order(pg_temp.fx('d'), jsonb_build_array(pg_temp.doc('d4')), 'FREE100');
  perform pg_temp.ok('mã 100% hết lượt (max_uses = 2) bị chặn', r ->> 'error' = 'COUPON_EXHAUSTED');
end $$;

-- ==================================================== 7. WEBHOOK SEPAY ==============
create function pg_temp.hook(p_id text, p_amount numeric, p_content text, p_type text default 'in', p_code text default null) returns jsonb
language sql as $$
  select public.process_sepay_payment(jsonb_build_object(
    'id', p_id, 'gateway', 'MBBank', 'transactionDate', '2026-10-05 10:00:00', 'accountNumber', '0000000000',
    'code', p_code, 'content', p_content, 'transferType', p_type, 'transferAmount', p_amount, 'referenceCode', 'FT' || p_id))
$$;

do $$
declare r jsonb; o record; v_sales int; v_oid uuid; v_code text;
begin
  -- Đơn mới của học sinh d: tài liệu d4 (8.000đ), không mã
  r := public.create_order(pg_temp.fx('d'), jsonb_build_array(pg_temp.doc('d4')));
  v_oid := (r -> 'order' ->> 'id')::uuid;
  v_code := r -> 'order' ->> 'payment_code';
  select sales_count into v_sales from public.documents where id = pg_temp.fx('d4');

  -- Nội dung có chữ thường, khoảng trắng, chữ thừa của ngân hàng
  r := pg_temp.hook('1001', 8000, 'NGUYEN VAN D chuyen tien ' || lower(substr(v_code, 1, 4)) || ' ' || substr(v_code, 5) || ' FT123');
  perform pg_temp.ok('webhook đúng tiền (mã bị tách/chữ thường trong nội dung): đơn paid', r ->> 'status' = 'paid');
  select * into o from public.orders where id = v_oid;
  perform pg_temp.ok('đơn paid, lưu id giao dịch + số tiền + thời gian', o.status = 'paid' and o.sepay_transaction_id = '1001' and o.paid_amount = 8000 and o.paid_at is not null);
  perform pg_temp.ok('mở khóa quyền xem tài liệu', exists (select 1 from public.entitlements where user_id = pg_temp.fx('d') and document_id = pg_temp.fx('d4') and access_level = 'view'));
  perform pg_temp.ok('tăng lượt bán tài liệu', (select sales_count from public.documents where id = pg_temp.fx('d4')) = v_sales + 1);
  perform pg_temp.ok('xếp email xác nhận (1 email)', (select count(*) from public.email_outbox where dedupe_key = 'order_paid:' || v_oid) = 1);
  perform pg_temp.ok('ghi giao dịch trạng thái matched', (select status from public.payment_transactions where sepay_transaction_id = '1001') = 'matched');

  -- SePay gọi lặp cùng id
  r := pg_temp.hook('1001', 8000, 'NGUYEN VAN D ' || v_code);
  perform pg_temp.ok('webhook gọi lặp (cùng id): trả duplicate', r ->> 'status' = 'duplicate');
  perform pg_temp.ok('gọi lặp KHÔNG tăng lượt bán / không email trùng',
    (select sales_count from public.documents where id = pg_temp.fx('d4')) = v_sales + 1
    and (select count(*) from public.email_outbox where dedupe_key = 'order_paid:' || v_oid) = 1
    and (select count(*) from public.payment_transactions where sepay_transaction_id = '1001') = 1);

  -- Chuyển lần 2 vào đơn đã trả
  r := pg_temp.hook('1002', 8000, v_code);
  perform pg_temp.ok('chuyển trùng vào đơn đã paid: cảnh báo double_payment', r ->> 'status' = 'double_payment');
  perform pg_temp.ok('đơn đánh dấu cần kiểm tra (double_payment)', (select review_reason from public.orders where id = v_oid) = 'double_payment');
end $$;

do $$
declare r jsonb; o record; v_oid uuid; v_code text;
begin
  -- Thiếu tiền
  r := public.create_order(pg_temp.fx('b'), jsonb_build_array(pg_temp.doc('d1')));
  v_oid := (r -> 'order' ->> 'id')::uuid; v_code := r -> 'order' ->> 'payment_code';
  r := pg_temp.hook('2001', 15000, v_code);
  perform pg_temp.ok('chuyển thiếu tiền: chuyển sang cần kiểm tra (underpaid)', r ->> 'status' = 'review' and r ->> 'reason' = 'underpaid');
  select * into o from public.orders where id = v_oid;
  perform pg_temp.ok('thiếu tiền: đơn vẫn pending, CHƯA mở khóa, lưu số tiền đã nhận',
    o.status = 'pending' and o.review_reason = 'underpaid' and o.paid_amount = 15000
    and not exists (select 1 from public.entitlements where user_id = pg_temp.fx('b')));

  -- Admin duyệt thủ công
  r := public.admin_approve_order(v_oid, pg_temp.fx('a'), 'thử');
  perform pg_temp.ok('học sinh không phải admin không duyệt được đơn', r ->> 'error' = 'FORBIDDEN');
  r := public.admin_approve_order(v_oid, pg_temp.fx('admin'), 'đã nhận đủ tiền');
  perform pg_temp.ok('admin duyệt thủ công: đơn paid + mở khóa', (r ->> 'ok')::boolean
    and (select status from public.orders where id = v_oid) = 'paid'
    and (select review_reason from public.orders where id = v_oid) is null
    and exists (select 1 from public.entitlements where user_id = pg_temp.fx('b') and document_id = pg_temp.fx('d1')));
  perform pg_temp.ok('duyệt thủ công được ghi nhật ký admin', exists (select 1 from public.audit_logs where entity_id = v_oid::text and action = 'order.approve_manual'));
  r := public.admin_approve_order(v_oid, pg_temp.fx('admin'));
  perform pg_temp.ok('duyệt lại đơn đã paid bị chặn', r ->> 'error' = 'ALREADY_PAID');
end $$;

do $$
declare r jsonb; v_oid uuid; v_code text;
begin
  -- Thừa tiền
  r := public.create_order(pg_temp.fx('b'), jsonb_build_array(pg_temp.doc('d2')));
  v_oid := (r -> 'order' ->> 'id')::uuid; v_code := r -> 'order' ->> 'payment_code';
  r := pg_temp.hook('3001', 12000, v_code);
  perform pg_temp.ok('chuyển thừa tiền: vẫn paid, gắn cờ overpaid để hoàn tiền',
    r ->> 'status' = 'paid' and (r ->> 'overpaid')::boolean
    and (select review_reason from public.orders where id = v_oid) = 'overpaid');
  r := public.admin_resolve_review(v_oid, pg_temp.fx('admin'), 'đã hoàn 2.000đ');
  perform pg_temp.ok('admin xóa cờ sau khi hoàn tiền', (r ->> 'ok')::boolean and (select review_reason from public.orders where id = v_oid) is null);

  -- Không khớp đơn
  r := pg_temp.hook('4001', 50000, 'chuyen tien linh tinh khong co ma');
  perform pg_temp.ok('giao dịch không có mã đơn: unmatched (admin đối soát)', r ->> 'status' = 'unmatched');
  perform pg_temp.ok('giao dịch unmatched vẫn được lưu', exists (select 1 from public.payment_transactions where sepay_transaction_id = '4001' and note = 'no_matching_order'));

  -- Tiền ra
  r := pg_temp.hook('5001', 100000, 'rut tien', 'out');
  perform pg_temp.ok('giao dịch tiền ra bị bỏ qua', r ->> 'status' = 'ignored');

  -- Payload hỏng
  r := public.process_sepay_payment('{"content":"x"}'::jsonb);
  perform pg_temp.ok('payload thiếu id bị từ chối', r ->> 'error' = 'INVALID_PAYLOAD');
  r := public.process_sepay_payment('{"id":"9","transferAmount":"abc","transferType":"in"}'::jsonb);
  perform pg_temp.ok('số tiền không phải số bị từ chối', r ->> 'error' = 'INVALID_PAYLOAD');

  -- Dùng trường "code" SePay tự nhận diện
  r := public.create_order(pg_temp.fx('a'), jsonb_build_array(pg_temp.doc('d4')));
  v_oid := (r -> 'order' ->> 'id')::uuid; v_code := r -> 'order' ->> 'payment_code';
  r := pg_temp.hook('6001', 8000, 'noi dung khong co ma', 'in', v_code);
  perform pg_temp.ok('khớp đơn bằng trường code của SePay (nội dung không có mã)', r ->> 'status' = 'paid');
end $$;

-- ================================================ 8. HẾT HẠN ĐƠN, TRẢ LƯỢT MÃ =====
do $$
declare r jsonb; v_oid uuid; v_code text; v_used int; n int;
begin
  insert into public.coupons (code, percent, starts_at, ends_at, max_uses)
  values ('HET1', 10, now() - interval '1 hour', now() + interval '1 day', 1);
  r := public.create_order(pg_temp.fx('d'), jsonb_build_array(pg_temp.doc('d2')), 'HET1');
  v_oid := (r -> 'order' ->> 'id')::uuid; v_code := r -> 'order' ->> 'payment_code';
  perform pg_temp.ok('mã HET1 đã giữ lượt (1/1)', (select used_count from public.coupons where code = 'HET1') = 1);

  update public.orders set expires_at = now() - interval '1 minute' where id = v_oid;
  n := public.expire_pending_orders();
  perform pg_temp.ok('đơn quá hạn chuyển expired', (select status from public.orders where id = v_oid) = 'expired' and n >= 1);
  perform pg_temp.ok('hết hạn: trả lại lượt mã (used_count = 0, bỏ dòng dùng mã)',
    (select used_count from public.coupons where code = 'HET1') = 0
    and not exists (select 1 from public.coupon_redemptions where order_id = v_oid));
  r := public.create_order(pg_temp.fx('b'), jsonb_build_array(pg_temp.doc('d3')), 'HET1');
  perform pg_temp.ok('người khác dùng được lượt vừa được trả lại', (r ->> 'ok')::boolean);

  -- Chuyển khoản muộn vào đơn expired
  r := pg_temp.hook('7001', 10000, v_code);
  perform pg_temp.ok('chuyển muộn vào đơn hết hạn: KHÔNG tự mở khóa, chuyển sang kiểm tra (late_payment)',
    r ->> 'status' = 'review' and r ->> 'reason' = 'late_payment'
    and (select status from public.orders where id = v_oid) = 'expired'
    and not exists (select 1 from public.entitlements where user_id = pg_temp.fx('d') and document_id = pg_temp.fx('d2')));
  perform pg_temp.ok('đơn "cần kiểm tra" không bị job hết hạn đụng tới', public.expire_pending_orders() >= 0);

  r := public.admin_approve_order(v_oid, pg_temp.fx('admin'), 'khách báo đã chuyển');
  perform pg_temp.ok('admin duyệt đơn chuyển muộn: paid + mở khóa',
    (r ->> 'ok')::boolean and exists (select 1 from public.entitlements where user_id = pg_temp.fx('d') and document_id = pg_temp.fx('d2')));

  -- Từ chối đơn
  r := public.create_order(pg_temp.fx('c'), jsonb_build_array(pg_temp.doc('d3')));
  v_oid := (r -> 'order' ->> 'id')::uuid;
  r := public.admin_reject_order(v_oid, pg_temp.fx('admin'), 'không nhận được tiền');
  perform pg_temp.ok('admin từ chối đơn: cancelled', (r ->> 'ok')::boolean and (select status from public.orders where id = v_oid) = 'cancelled');
end $$;

-- ===================================================== 9. PREMIUM ===================
do $$
declare r jsonb; v_oid uuid; v_code text; s1 record; s2 record; st jsonb; i int;
begin
  r := public.create_order(pg_temp.fx('a'), jsonb_build_array(jsonb_build_object('type', 'premium')));
  v_oid := (r -> 'order' ->> 'id')::uuid; v_code := r -> 'order' ->> 'payment_code';
  r := pg_temp.hook('8001', 59000, v_code);
  perform pg_temp.ok('thanh toán Premium: paid', r ->> 'status' = 'paid');
  select * into s1 from public.premium_subscriptions where user_id = pg_temp.fx('a');
  perform pg_temp.ok('kỳ Premium 30 ngày, 5 suất tải',
    s1.download_slot_limit = 5 and s1.ends_at - s1.starts_at = interval '30 days' and s1.starts_at <= now() + interval '1 second');

  -- Mua tiếp khi còn hạn: nối tiếp sau kỳ cũ
  r := public.create_order(pg_temp.fx('a'), jsonb_build_array(jsonb_build_object('type', 'premium')));
  v_oid := (r -> 'order' ->> 'id')::uuid; v_code := r -> 'order' ->> 'payment_code';
  perform pg_temp.hook('8002', 59000, v_code);
  select * into s2 from public.premium_subscriptions where user_id = pg_temp.fx('a') and id <> s1.id;
  perform pg_temp.ok('gia hạn khi còn hạn: kỳ mới bắt đầu đúng lúc kỳ cũ kết thúc, +30 ngày, 5 suất mới',
    s2.starts_at = s1.ends_at and s2.ends_at = s1.ends_at + interval '30 days' and s2.download_slot_limit = 5);

  st := public.premium_status(pg_temp.fx('a'));
  perform pg_temp.ok('trạng thái Premium: đang hoạt động, đã dùng 0/5, còn khoảng 30 ngày',
    (st ->> 'active')::boolean and (st ->> 'slots_used')::int = 0 and (st ->> 'slots_limit')::int = 5 and (st ->> 'days_left')::int between 29 and 31);
  perform pg_temp.ok('người chưa có Premium: active = false', not (public.premium_status(pg_temp.fx('e')) ->> 'active')::boolean);
end $$;

-- ================================================= 10. CẤP QUYỀN XEM / TẢI ===========
do $$
declare r jsonb; i int; v_docs text[] := array['d1', 'd2', 'd3', 'd4', 'dcheap', 'dhidden'];
begin
  -- Tài liệu miễn phí
  r := public.authorize_file_access(pg_temp.fx('e'), pg_temp.fx('dfree'), 'view');
  perform pg_temp.ok('tài liệu miễn phí: người đăng nhập xem được', (r ->> 'ok')::boolean and r ->> 'via' = 'free'
    and r ->> 'bucket' = 'documents' and (r ->> 'signed_url_ttl_seconds')::int = 300);
  r := public.authorize_file_access(null, pg_temp.fx('dfree'), 'view');
  perform pg_temp.ok('chưa đăng nhập không xem được tài liệu miễn phí', r ->> 'error' = 'LOGIN_REQUIRED');
  r := public.authorize_file_access(pg_temp.fx('e'), pg_temp.fx('dfree'), 'download');
  perform pg_temp.ok('tài liệu miễn phí mặc định chỉ xem, không tải', r ->> 'error' = 'NO_ACCESS');

  -- Chưa mua
  r := public.authorize_file_access(pg_temp.fx('e'), pg_temp.fx('d1'), 'view');
  perform pg_temp.ok('chưa mua, không Premium: không xem được tài liệu có phí', r ->> 'error' = 'NO_ACCESS');

  -- Đã mua xem (user b có d1 view, d2 view từ trên)
  r := public.authorize_file_access(pg_temp.fx('c'), pg_temp.fx('d1'), 'view');
  perform pg_temp.ok('đã mua xem: xem được', (r ->> 'ok')::boolean and r ->> 'via' = 'entitlement');
  r := public.authorize_file_access(pg_temp.fx('c'), pg_temp.fx('d1'), 'download');
  perform pg_temp.ok('chỉ mua xem: tải bị chặn kèm giá nâng cấp 4.000đ',
    r ->> 'error' = 'DOWNLOAD_NOT_PURCHASED' and (r ->> 'upgrade_price')::int = 4000);
  r := public.authorize_file_access(pg_temp.fx('c'), pg_temp.fx('d2'), 'download');
  perform pg_temp.ok('đã mua gói Tải về: tải được', (r ->> 'ok')::boolean and r ->> 'via' = 'entitlement');

  -- Tài liệu đã gỡ nhưng người đã mua vẫn đọc được
  insert into public.entitlements (user_id, document_id, access_level) values (pg_temp.fx('e'), pg_temp.fx('dhidden'), 'download');
  r := public.authorize_file_access(pg_temp.fx('e'), pg_temp.fx('dhidden'), 'download');
  perform pg_temp.ok('tài liệu đã gỡ: người đã mua vẫn tải được', (r ->> 'ok')::boolean);
  delete from public.entitlements where user_id = pg_temp.fx('e') and document_id = pg_temp.fx('dhidden');

  -- Tài khoản bị khóa
  update public.profiles set is_banned = true where id = pg_temp.fx('c');
  r := public.authorize_file_access(pg_temp.fx('c'), pg_temp.fx('d1'), 'view');
  perform pg_temp.ok('tài khoản bị khóa không xem được', r ->> 'error' = 'USER_BANNED');
  update public.profiles set is_banned = false where id = pg_temp.fx('c');

  -- Ghi nhật ký
  perform pg_temp.ok('mỗi lần cấp link được ghi nhật ký', (select count(*) from public.download_logs) >= 4);
end $$;

-- Premium: tối đa 5 tài liệu KHÁC NHAU, tải lại tài liệu đã chiếm suất thì miễn phí
insert into public.documents (slug, title, subject, doc_type, page_count, price_per_page, view_price, download_price, status)
select 'dp' || g, 'Premium doc ' || g, 'ly', 'bai_tap', 20, 500, 10000, 12000, 'published' from generate_series(1, 6) g;
insert into public.document_files (document_id, kind, bucket, storage_path, file_size, page_count)
select d.id, 'full', 'documents', 'full/' || d.slug || '.pdf', 1000, 20 from public.documents d where d.slug like 'dp%';

do $$
declare r jsonb; i int; v_doc uuid; st jsonb;
begin
  -- user a có Premium (kỳ hiện tại + kỳ nối tiếp)
  for i in 1..5 loop
    select id into v_doc from public.documents where slug = 'dp' || i;
    r := public.authorize_file_access(pg_temp.fx('a'), v_doc, 'download');
    perform pg_temp.ok('Premium tải tài liệu #' || i || ' (chiếm suất ' || i || '/5)',
      (r ->> 'ok')::boolean and r ->> 'via' = 'premium' and (r ->> 'slots_claimed_now')::boolean and (r ->> 'slots_used')::int = i);
  end loop;

  select id into v_doc from public.documents where slug = 'dp6';
  r := public.authorize_file_access(pg_temp.fx('a'), v_doc, 'download');
  perform pg_temp.ok('tài liệu thứ 6 bị chặn: hết 5 suất', r ->> 'error' = 'PREMIUM_SLOTS_EXHAUSTED');
  perform pg_temp.ok('lần bị chặn không chiếm thêm suất', (select count(*) from public.premium_download_slots where user_id = pg_temp.fx('a')) = 5);

  select id into v_doc from public.documents where slug = 'dp1';
  r := public.authorize_file_access(pg_temp.fx('a'), v_doc, 'download');
  perform pg_temp.ok('tải lại tài liệu đã chiếm suất: được, không tốn thêm suất',
    (r ->> 'ok')::boolean and not (r ->> 'slots_claimed_now')::boolean and (r ->> 'slots_used')::int = 5);
  r := public.authorize_file_access(pg_temp.fx('a'), v_doc, 'download');
  perform pg_temp.ok('tải lại nhiều lần vẫn được', (r ->> 'ok')::boolean);

  select id into v_doc from public.documents where slug = 'dp6';
  r := public.authorize_file_access(pg_temp.fx('a'), v_doc, 'view');
  perform pg_temp.ok('Premium xem online mọi tài liệu có phí (kể cả khi hết suất tải)', (r ->> 'ok')::boolean and r ->> 'via' = 'premium');

  r := public.authorize_file_access(pg_temp.fx('a'), pg_temp.fx('dhidden'), 'view');
  perform pg_temp.ok('Premium không xem được tài liệu đã gỡ', r ->> 'error' = 'NO_ACCESS');

  st := public.premium_status(pg_temp.fx('a'));
  perform pg_temp.ok('trạng thái: đã dùng 5/5 suất và liệt kê 5 tài liệu',
    (st ->> 'slots_used')::int = 5 and jsonb_array_length(st -> 'claimed_documents') = 5);

  -- Trigger database chặn cả khi ai đó chèn trực tiếp suất thứ 6
  begin
    insert into public.premium_download_slots (subscription_id, user_id, document_id)
    values ((st ->> 'subscription_id')::uuid, pg_temp.fx('a'), v_doc);
    raise exception 'FAIL: trigger không chặn suất thứ 6';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
    raise notice 'PASS: trigger database cũng chặn suất thứ 6 khi chèn trực tiếp';
  end;
end $$;

-- ==================================== 11. PHÂN QUYỀN HÀM (CHỐNG TỰ XÁC NHẬN THANH TOÁN) ====
do $$
declare v_role text; v_fn text; v_blocked boolean;
begin
  foreach v_role in array array['anon', 'authenticated'] loop
    foreach v_fn in array array[
      $f$select public.process_sepay_payment('{"id":"x","transferAmount":1,"transferType":"in","content":"TL"}'::jsonb)$f$,
      $f$select public.create_order(gen_random_uuid(), '[]'::jsonb)$f$,
      $f$select public.expire_pending_orders()$f$,
      $f$select public.admin_approve_order(gen_random_uuid(), gen_random_uuid())$f$,
      $f$select public.authorize_file_access(gen_random_uuid(), gen_random_uuid(), 'view')$f$,
      $f$select public.quote_cart(gen_random_uuid(), '[]'::jsonb)$f$,
      $f$select public._fulfil_order(gen_random_uuid(), null, 0)$f$
    ] loop
      v_blocked := false;
      execute format('set local role %I', v_role);
      begin
        execute v_fn;
      exception when insufficient_privilege then
        v_blocked := true;
      end;
      reset role;
      perform pg_temp.ok(format('vai trò %s KHÔNG gọi được: %s', v_role, left(v_fn, 45)), v_blocked);
    end loop;
  end loop;

  -- service_role gọi được
  set local role service_role;
  perform public.quote_cart(gen_random_uuid(), '[]'::jsonb);
  reset role;
  perform pg_temp.ok('service_role (server) gọi được hàm', true);
end $$;

rollback;
\echo '=== TẤT CẢ KIỂM TRA ĐÃ QUA ==='
