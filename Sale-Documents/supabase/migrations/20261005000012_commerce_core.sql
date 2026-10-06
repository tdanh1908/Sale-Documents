-- =============================================================================
-- 0012 · LÕI THANH TOÁN (Prompt 5): báo giá, tạo đơn, đối soát SePay, mở khóa,
--        suất tải Premium, hết hạn đơn, duyệt tay đơn lệch
-- -----------------------------------------------------------------------------
-- VÌ SAO LÀM TRONG DATABASE (hàm SQL) THAY VÌ TRONG CODE NEXT.JS?
--   * Mỗi hàm chạy trong ĐÚNG MỘT giao dịch (transaction): hoặc xong hết (tạo đơn +
--     giữ lượt mã giảm giá + mở khóa tài liệu...), hoặc không gì cả. Không bao giờ
--     rơi vào trạng thái nửa vời "đã thu tiền nhưng chưa mở khóa".
--   * Chống chạy trùng khi nhiều người bấm / SePay gọi lặp cùng lúc: dựa vào
--     ràng buộc UNIQUE và khóa dòng (FOR UPDATE) của chính database, chắc hơn
--     kiểm tra bằng code.
--   * Một nguồn sự thật duy nhất cho cách tính giá: giỏ hàng, tạo đơn, hóa đơn
--     đều dùng chung hàm quote_cart.
--
-- AN TOÀN: mọi hàm ở đây CHỈ service_role (server Next.js) gọi được. Trình duyệt
-- (anon/authenticated) KHÔNG gọi được -> không ai tự "xác nhận thanh toán" được.
-- =============================================================================


-- ---------- 1) Bổ sung schema ----------

-- Đơn "Cần kiểm tra" (chuyển thiếu/thừa tiền, chuyển muộn, chuyển trùng...).
-- Schema cũ chưa có chỗ lưu trạng thái này nên thêm cột lý do.
alter table public.orders
  add column if not exists review_reason text
  check (review_reason in ('underpaid', 'overpaid', 'late_payment', 'double_payment', 'paid_after_cancel'));

create index if not exists orders_review_idx
  on public.orders (created_at desc) where review_reason is not null;

-- Cài đặt mới (admin sửa được trong trang quản trị; ON CONFLICT: không ghi đè giá trị đã chỉnh).
insert into public.site_settings (key, value, is_public, description) values
  ('payment.code_prefix',            '"TL"',     false, 'Tiền tố mã thanh toán. PHẢI trùng "Cấu trúc mã thanh toán" đã cấu hình trên SePay'),
  ('payment.bank_name',              '"MBBank"', true,  'Tên ngân hàng dùng tạo QR (xem danh sách qr.sepay.vn/banks.json)'),
  ('order.max_pending_per_user',     '5',        false, 'Số đơn đang chờ thanh toán tối đa của mỗi người'),
  ('files.free_docs_downloadable',   'false',    false, 'Tài liệu miễn phí có cho tải về không (false: chỉ xem online)')
on conflict (key) do nothing;


-- ---------- 2) Hàm đọc cài đặt ----------
create or replace function public.setting_int(p_key text, p_default integer)
returns integer language sql stable security definer set search_path = '' as $$
  select coalesce((select (s.value #>> '{}')::integer from public.site_settings s where s.key = p_key), p_default);
$$;

create or replace function public.setting_text(p_key text, p_default text)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select s.value #>> '{}' from public.site_settings s where s.key = p_key), p_default);
$$;

create or replace function public.setting_bool(p_key text, p_default boolean)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select (s.value #>> '{}')::boolean from public.site_settings s where s.key = p_key), p_default);
$$;

-- Kết quả lỗi nghiệp vụ dạng JSON (server hiển thị thông báo thân thiện cho khách).
create or replace function public._err(p_code text, p_message text, p_extra jsonb default '{}'::jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('ok', false, 'error', p_code, 'message', p_message) || p_extra;
$$;


-- =============================================================================
-- 3) quote_cart: BÁO GIÁ giỏ hàng (không ghi gì vào database)
-- -----------------------------------------------------------------------------
-- Đầu vào p_items: mảng JSON, mỗi phần tử một trong các dạng:
--   {"type":"document","document_id":"<uuid>","access":"view"|"download"}
--   {"type":"upgrade","document_id":"<uuid>"}        -- nâng cấp từ xem lên tải
--   {"type":"bundle","bundle_id":"<uuid>"}           -- combo
--   {"type":"premium"}
-- Quy tắc giá (khớp PROJECT_SPEC):
--   * Tài liệu miễn phí không mua được; tài liệu đã sở hữu đủ quyền thì báo lỗi.
--   * Đang sở hữu "xem" mà mua "tải" cho cùng tài liệu -> tự chuyển thành nâng cấp.
--   * Nâng cấp = giá tải - giá xem, tối thiểu order.upgrade_min_amount (2.000đ).
--   * Khuyến mãi mỗi dòng KHÔNG cộng dồn: combo dùng % của combo, tài liệu lẻ dùng
--     flash sale đang chạy (lấy % cao nhất). Nâng cấp và Premium không có khuyến mãi dòng.
--   * Mã giảm giá áp lên giá sau khuyến mãi của các dòng đủ điều kiện (cộng dồn
--     với flash sale/combo). Làm tròn xuống từng dòng.
--   * Tổng trước mã < order.min_amount -> lỗi ORDER_BELOW_MINIMUM (gợi ý thêm tài liệu).
--   * Tổng sau mã 1..(min-1)đ -> thu bù lên đúng order.min_amount (surcharge).
--   * Tổng sau mã = 0đ (chỉ xảy ra với mã 100%) -> đơn 0đ miễn phí.
-- =============================================================================
create or replace function public.quote_cart(p_user_id uuid, p_items jsonb, p_coupon_code text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_min_amount    integer := public.setting_int('order.min_amount', 2000);
  v_upgrade_min   integer := public.setting_int('order.upgrade_min_amount', 2000);
  v_lines         jsonb := '[]'::jsonb;
  v_out           jsonb := '[]'::jsonb;
  v_it            jsonb;
  v_line          jsonb;
  v_type          text;
  v_access        text;
  v_doc           public.documents;
  v_bundle        public.bundles;
  v_owned         public.access_level;
  v_unit          integer;
  v_promo         integer;
  v_pct           integer;
  v_flash         uuid;
  v_doc_ids       uuid[] := '{}';
  v_premium_count integer := 0;
  v_added         integer;
  v_pre_total     integer := 0;
  v_subtotal      integer := 0;
  v_promo_total   integer := 0;
  v_coupon_total  integer := 0;
  v_total_after   integer;
  v_surcharge     integer := 0;
  v_code          text;
  v_coupon        public.coupons;
  v_ucoupon       public.user_coupons;
  v_coupon_json   jsonb := null;
  v_cpct          integer := 0;
  v_eligible      boolean;
  v_cdisc         integer;
  v_email_ok      boolean;
begin
  if p_user_id is null then
    return public._err('LOGIN_REQUIRED', 'Bạn cần đăng nhập để mua hàng.');
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return public._err('EMPTY_CART', 'Giỏ hàng đang trống.');
  end if;
  if jsonb_array_length(p_items) > 50 then
    return public._err('TOO_MANY_ITEMS', 'Giỏ hàng có quá nhiều mục.');
  end if;

  -- ----- Vòng 1: dựng từng dòng + khuyến mãi dòng -----
  for v_it in select * from jsonb_array_elements(p_items) loop
    v_type := v_it ->> 'type';

    if v_type in ('document', 'upgrade') then
      select * into v_doc from public.documents where id = (v_it ->> 'document_id')::uuid;
      if not found or v_doc.status <> 'published' then
        return public._err('DOC_NOT_AVAILABLE', 'Tài liệu không còn bán.');
      end if;
      if v_doc.is_free then
        return public._err('FREE_DOCUMENT', 'Tài liệu miễn phí không cần mua. Hãy đăng nhập để đọc.');
      end if;
      if v_doc.id = any (v_doc_ids) then
        return public._err('DUPLICATE_ITEM', 'Một tài liệu xuất hiện nhiều lần trong giỏ.');
      end if;

      select e.access_level into v_owned from public.entitlements e
       where e.user_id = p_user_id and e.document_id = v_doc.id;

      if v_type = 'upgrade' then
        if v_owned is null then
          return public._err('NOT_OWNED', 'Bạn chưa mua tài liệu này nên không thể nâng cấp.');
        end if;
        if v_owned = 'download' then
          return public._err('ALREADY_OWNED', 'Bạn đã có quyền tải tài liệu này.');
        end if;
        v_access := 'download';
      else
        v_access := coalesce(v_it ->> 'access', 'view');
        if v_access not in ('view', 'download') then
          return public._err('INVALID_ACCESS', 'Loại quyền mua không hợp lệ.');
        end if;
        if v_owned is not null then
          if v_owned = 'download' or v_access = 'view' then
            return public._err('ALREADY_OWNED', 'Bạn đã sở hữu tài liệu này.');
          end if;
          v_type := 'upgrade';   -- đang có quyền xem, mua tải -> nâng cấp
        end if;
      end if;

      if v_type = 'upgrade' then
        v_unit := greatest(v_doc.download_price - v_doc.view_price, v_upgrade_min);
        v_promo := 0;
        v_flash := null;
      else
        v_unit := case v_access when 'view' then v_doc.view_price else v_doc.download_price end;
        if v_unit <= 0 then
          return public._err('INVALID_PRICE', 'Tài liệu chưa có giá hợp lệ.');
        end if;
        -- Flash sale đang chạy: lấy % cao nhất áp cho tài liệu này.
        select f.discount_percent, f.id into v_pct, v_flash
          from public.flash_sales f
         where f.is_active and now() >= f.starts_at and now() < f.ends_at
           and (f.applies_to_all or exists (
                 select 1 from public.flash_sale_items fi
                  where fi.flash_sale_id = f.id and fi.document_id = v_doc.id))
         order by f.discount_percent desc
         limit 1;
        v_promo := case when v_pct is null then 0 else floor(v_unit * v_pct / 100.0)::integer end;
        if v_pct is null then v_flash := null; end if;
      end if;

      v_doc_ids := v_doc_ids || v_doc.id;
      v_lines := v_lines || jsonb_build_object(
        'item_type', v_type, 'document_id', v_doc.id, 'bundle_id', null, 'flash_sale_id', v_flash,
        'access_level', v_access, 'premium_days', null,
        'title', case when v_type = 'upgrade' then 'Nâng cấp tải về: ' || v_doc.title else v_doc.title end,
        'page_count', v_doc.page_count, 'subject', v_doc.subject,
        'unit_price', v_unit, 'promo_discount', v_promo, 'coupon_discount', 0);

    elsif v_type = 'bundle' then
      select * into v_bundle from public.bundles b
       where b.id = (v_it ->> 'bundle_id')::uuid and b.is_active
         and (b.starts_at is null or b.starts_at <= now())
         and (b.ends_at is null or b.ends_at > now());
      if not found then
        return public._err('BUNDLE_NOT_AVAILABLE', 'Combo không còn hiệu lực.');
      end if;
      v_added := 0;
      for v_doc in
        select d.* from public.bundle_items bi
          join public.documents d on d.id = bi.document_id
         where bi.bundle_id = v_bundle.id and d.status = 'published' and not d.is_free
         order by bi.position, d.title
      loop
        if v_doc.id = any (v_doc_ids) then
          return public._err('DUPLICATE_ITEM', 'Một tài liệu xuất hiện nhiều lần trong giỏ.');
        end if;
        select e.access_level into v_owned from public.entitlements e
         where e.user_id = p_user_id and e.document_id = v_doc.id;
        -- Đã có đủ quyền combo này cho: bỏ qua, không bắt trả lại.
        if v_owned = 'download' or (v_owned = 'view' and v_bundle.access_level = 'view') then
          continue;
        end if;
        v_unit := case v_bundle.access_level when 'view' then v_doc.view_price else v_doc.download_price end;
        if v_unit <= 0 then continue; end if;
        v_promo := floor(v_unit * v_bundle.discount_percent / 100.0)::integer;
        v_doc_ids := v_doc_ids || v_doc.id;
        v_added := v_added + 1;
        v_lines := v_lines || jsonb_build_object(
          'item_type', 'document', 'document_id', v_doc.id, 'bundle_id', v_bundle.id, 'flash_sale_id', null,
          'access_level', v_bundle.access_level, 'premium_days', null,
          'title', v_doc.title, 'page_count', v_doc.page_count, 'subject', v_doc.subject,
          'unit_price', v_unit, 'promo_discount', v_promo, 'coupon_discount', 0);
      end loop;
      if v_added = 0 then
        return public._err('ALREADY_OWNED', 'Bạn đã sở hữu toàn bộ tài liệu trong combo này.');
      end if;

    elsif v_type = 'premium' then
      v_premium_count := v_premium_count + 1;
      if v_premium_count > 1 then
        return public._err('DUPLICATE_PREMIUM', 'Chỉ mua một gói Premium mỗi đơn.');
      end if;
      v_unit := public.setting_int('premium.price', 59000);
      v_lines := v_lines || jsonb_build_object(
        'item_type', 'premium', 'document_id', null, 'bundle_id', null, 'flash_sale_id', null,
        'access_level', null, 'premium_days', public.setting_int('premium.duration_days', 30),
        'title', 'Gói Premium ' || public.setting_int('premium.duration_days', 30) || ' ngày',
        'page_count', null, 'subject', null,
        'unit_price', v_unit, 'promo_discount', 0, 'coupon_discount', 0);
    else
      return public._err('INVALID_ITEM', 'Mục trong giỏ không hợp lệ.');
    end if;
  end loop;

  if jsonb_array_length(v_lines) = 0 then
    return public._err('EMPTY_CART', 'Giỏ hàng đang trống.');
  end if;

  select coalesce(sum((l ->> 'unit_price')::integer - (l ->> 'promo_discount')::integer), 0)
    into v_pre_total from jsonb_array_elements(v_lines) l;

  if v_pre_total < v_min_amount then
    return public._err('ORDER_BELOW_MINIMUM',
      format('Đơn tối thiểu %s đ. Bạn thêm tài liệu khác nhé.', v_min_amount),
      jsonb_build_object('min_amount', v_min_amount, 'current_amount', v_pre_total,
                         'missing_amount', v_min_amount - v_pre_total));
  end if;

  -- ----- Mã giảm giá -----
  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    v_code := upper(btrim(p_coupon_code));

    select * into v_coupon from public.coupons where code = v_code;
    if found then
      if not v_coupon.is_active then
        return public._err('COUPON_INACTIVE', 'Mã giảm giá đã bị tắt.');
      end if;
      if now() < v_coupon.starts_at then
        return public._err('COUPON_NOT_STARTED', 'Mã giảm giá chưa tới thời gian áp dụng.');
      end if;
      if now() >= v_coupon.ends_at then
        return public._err('COUPON_EXPIRED', 'Mã giảm giá đã hết hạn.');
      end if;
      if v_coupon.require_verified_email then
        select (u.email_confirmed_at is not null) into v_email_ok from auth.users u where u.id = p_user_id;
        if not coalesce(v_email_ok, false) then
          return public._err('COUPON_EMAIL_NOT_VERIFIED', 'Bạn cần xác minh email để dùng mã này.');
        end if;
      end if;
      if exists (select 1 from public.coupon_redemptions r where r.coupon_id = v_coupon.id and r.user_id = p_user_id) then
        return public._err('COUPON_ALREADY_USED_BY_USER', 'Bạn đã dùng mã này rồi (mỗi tài khoản chỉ dùng 1 lần).');
      end if;
      if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
        return public._err('COUPON_EXHAUSTED', 'Mã giảm giá đã hết lượt sử dụng.');
      end if;
      v_cpct := v_coupon.percent;
      v_coupon_json := jsonb_build_object('kind', 'public', 'id', v_coupon.id, 'code', v_coupon.code, 'percent', v_coupon.percent);
    else
      -- Mã riêng: chỉ chủ sở hữu thấy; mã của người khác trả lời như "không tồn tại".
      select * into v_ucoupon from public.user_coupons where code = v_code and user_id = p_user_id;
      if not found then
        return public._err('COUPON_NOT_FOUND', 'Mã giảm giá không tồn tại.');
      end if;
      if v_ucoupon.used_at is not null
         or exists (select 1 from public.orders o
                     where o.user_coupon_id = v_ucoupon.id and o.status in ('pending', 'paid')) then
        return public._err('COUPON_ALREADY_USED', 'Mã này đã được sử dụng.');
      end if;
      if now() < v_ucoupon.starts_at then
        return public._err('COUPON_NOT_STARTED', 'Mã giảm giá chưa tới thời gian áp dụng.');
      end if;
      if now() >= v_ucoupon.expires_at then
        return public._err('COUPON_EXPIRED', 'Mã giảm giá đã hết hạn.');
      end if;
      v_cpct := v_ucoupon.percent;
      v_coupon_json := jsonb_build_object('kind', 'private', 'id', v_ucoupon.id, 'code', v_ucoupon.code, 'percent', v_ucoupon.percent);
    end if;

    -- Vòng 2: áp mã lên các dòng đủ điều kiện.
    for v_line in select * from jsonb_array_elements(v_lines) loop
      if v_coupon_json ->> 'kind' = 'public' then
        if (v_line ->> 'item_type') = 'premium' then
          v_eligible := v_coupon.applies_to_all and v_coupon.applies_to_premium;
        else
          v_eligible := v_coupon.applies_to_all or exists (
            select 1 from public.coupon_documents cd
             where cd.coupon_id = v_coupon.id and cd.document_id = (v_line ->> 'document_id')::uuid);
        end if;
      else
        if (v_line ->> 'item_type') = 'premium' then
          v_eligible := false;
        elsif v_ucoupon.scope = 'all' then
          v_eligible := true;
        elsif v_ucoupon.scope = 'subject' then
          v_eligible := (v_line ->> 'subject') = v_ucoupon.scope_subject::text;
        else
          v_eligible := exists (
            select 1 from public.event_coupon_template_documents td
             where td.template_id = v_ucoupon.template_id and td.document_id = (v_line ->> 'document_id')::uuid);
        end if;
      end if;

      if v_eligible then
        v_cdisc := floor(((v_line ->> 'unit_price')::integer - (v_line ->> 'promo_discount')::integer) * v_cpct / 100.0)::integer;
      else
        v_cdisc := 0;
      end if;
      v_out := v_out || (v_line || jsonb_build_object('coupon_discount', v_cdisc));
    end loop;

    if not exists (select 1 from jsonb_array_elements(v_out) l where (l ->> 'coupon_discount')::integer > 0) then
      return public._err('COUPON_NOT_APPLICABLE', 'Mã này không áp dụng cho các mục trong giỏ hàng.');
    end if;
  else
    v_out := v_lines;
  end if;

  -- ----- Tổng kết -----
  select coalesce(sum((l ->> 'unit_price')::integer), 0),
         coalesce(sum((l ->> 'promo_discount')::integer), 0),
         coalesce(sum((l ->> 'coupon_discount')::integer), 0)
    into v_subtotal, v_promo_total, v_coupon_total
    from jsonb_array_elements(v_out) l;

  v_total_after := v_subtotal - v_promo_total - v_coupon_total;
  if v_total_after > 0 and v_total_after < v_min_amount then
    v_surcharge := v_min_amount - v_total_after;
  end if;

  -- Gắn final_price + discount_amount cho từng dòng.
  select jsonb_agg(l || jsonb_build_object(
           'discount_amount', (l ->> 'promo_discount')::integer + (l ->> 'coupon_discount')::integer,
           'final_price', (l ->> 'unit_price')::integer - (l ->> 'promo_discount')::integer - (l ->> 'coupon_discount')::integer))
    into v_out from jsonb_array_elements(v_out) l;

  return jsonb_build_object(
    'ok', true,
    'lines', v_out,
    'subtotal', v_subtotal,
    'discount_amount', v_promo_total + v_coupon_total,
    'promo_discount', v_promo_total,
    'coupon_discount', v_coupon_total,
    'surcharge_amount', v_surcharge,
    'total_amount', v_total_after + v_surcharge,
    'is_free', (v_total_after + v_surcharge) = 0,
    'coupon', v_coupon_json,
    'min_amount', v_min_amount);

exception
  when invalid_text_representation then
    return public._err('INVALID_ITEM', 'Mục trong giỏ không hợp lệ.');
end;
$$;


-- =============================================================================
-- 4) _fulfil_order: MỞ KHÓA cho đơn đã thanh toán (nội bộ, gọi từ các hàm khác)
-- -----------------------------------------------------------------------------
-- Gọi khi đơn đã được khóa dòng (FOR UPDATE). Làm trọn trong 1 giao dịch:
--   đặt đơn paid, cấp/nâng quyền tài liệu, tạo kỳ Premium, đánh dấu mã riêng đã dùng,
--   tăng lượt bán, xếp email xác nhận vào hàng đợi (chống trùng bằng dedupe_key).
-- =============================================================================
create or replace function public._fulfil_order(p_order_id uuid, p_sepay_tx_id text, p_paid_amount integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order  public.orders;
  v_item   public.order_items;
  v_start  timestamptz;
  v_email  text;
  v_titles jsonb;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.user_id is null then
    raise exception 'Đơn % không còn gắn với tài khoản nào', p_order_id;
  end if;

  update public.orders
     set status = 'paid',
         paid_at = coalesce(paid_at, now()),
         paid_amount = coalesce(p_paid_amount, paid_amount, total_amount),
         sepay_transaction_id = coalesce(p_sepay_tx_id, sepay_transaction_id)
   where id = p_order_id;

  for v_item in select * from public.order_items where order_id = p_order_id loop
    if v_item.item_type in ('document', 'upgrade') then
      insert into public.entitlements (user_id, document_id, access_level, order_id)
      values (v_order.user_id, v_item.document_id, v_item.access_level, p_order_id)
      on conflict (user_id, document_id) do update
        set access_level = case
              when public.entitlements.access_level = 'download' or excluded.access_level = 'download'
                then 'download'::public.access_level
              else 'view'::public.access_level end,
            order_id = excluded.order_id;
      if v_item.item_type = 'document' then
        update public.documents set sales_count = sales_count + 1 where id = v_item.document_id;
      end if;

    elsif v_item.item_type = 'premium' then
      -- Còn hạn: nối tiếp sau kỳ hiện tại (kỳ mới có 5 suất tải mới); hết hạn: bắt đầu ngay.
      select greatest(now(), coalesce(max(s.ends_at), now())) into v_start
        from public.premium_subscriptions s where s.user_id = v_order.user_id;
      insert into public.premium_subscriptions (user_id, order_id, starts_at, ends_at, download_slot_limit)
      values (v_order.user_id, p_order_id, v_start,
              v_start + make_interval(days => v_item.premium_days),
              public.setting_int('premium.download_slots', 5))
      on conflict (order_id) do nothing;
    end if;
  end loop;

  if v_order.user_coupon_id is not null then
    update public.user_coupons set used_at = now() where id = v_order.user_coupon_id and used_at is null;
  end if;

  select p.email into v_email from public.profiles p where p.id = v_order.user_id;
  if v_email is not null then
    select coalesce(jsonb_agg(jsonb_build_object(
             'title', i.title_snapshot, 'type', i.item_type, 'access', i.access_level,
             'price', i.final_price, 'document_id', i.document_id) order by i.created_at), '[]'::jsonb)
      into v_titles from public.order_items i where i.order_id = p_order_id;
    insert into public.email_outbox (dedupe_key, to_email, user_id, template, payload)
    values ('order_paid:' || p_order_id, v_email, v_order.user_id, 'order_confirmation',
            jsonb_build_object('order_id', p_order_id, 'payment_code', v_order.payment_code,
                               'total', v_order.total_amount, 'is_free', v_order.is_free_order,
                               'paid_at', now(), 'items', v_titles))
    on conflict (dedupe_key) do nothing;
  end if;
end;
$$;


-- =============================================================================
-- 5) create_order: TẠO ĐƠN (giữ lượt mã giảm giá, đơn 0đ mở khóa luôn)
-- =============================================================================
create or replace function public.create_order(
  p_user_id uuid,
  p_items jsonb,
  p_coupon_code text default null,
  p_utm jsonb default '{}'::jsonb,
  p_exam_event_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_banned     boolean;
  v_pending    integer;
  v_quote      jsonb;
  v_line       jsonb;
  v_coupon     jsonb;
  v_order_id   uuid;
  v_code       text;
  v_prefix     text := upper(public.setting_text('payment.code_prefix', 'TL'));
  v_total      integer;
  v_free       boolean;
  v_expires    timestamptz;
  v_constraint text;
  i            integer;
begin
  select p.is_banned into v_banned from public.profiles p where p.id = p_user_id;
  if not found then
    return public._err('USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
  end if;
  if v_banned then
    return public._err('USER_BANNED', 'Tài khoản đang bị khóa.');
  end if;

  select count(*) into v_pending from public.orders o
   where o.user_id = p_user_id and o.status = 'pending' and o.expires_at > now();
  if v_pending >= public.setting_int('order.max_pending_per_user', 5) then
    return public._err('TOO_MANY_PENDING', 'Bạn đang có quá nhiều đơn chờ thanh toán. Hãy hoàn tất hoặc chờ đơn cũ hết hạn.');
  end if;

  v_quote := public.quote_cart(p_user_id, p_items, p_coupon_code);
  if not (v_quote ->> 'ok')::boolean then
    return v_quote;
  end if;

  v_total := (v_quote ->> 'total_amount')::integer;
  v_free := v_total = 0;
  v_coupon := v_quote -> 'coupon';
  v_expires := now() + make_interval(mins => public.setting_int('order.pending_expiry_minutes', 30));

  -- Toàn bộ phần ghi nằm trong 1 khối: lỗi giữa chừng -> hoàn tác sạch, trả lỗi nghiệp vụ.
  begin
    v_order_id := null;
    for i in 1..5 loop
      v_code := v_prefix || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      begin
        insert into public.orders (
          payment_code, user_id, status, subtotal, discount_amount, surcharge_amount, total_amount,
          coupon_id, user_coupon_id, coupon_code, discount_percent, expires_at,
          utm_source, utm_medium, utm_campaign, exam_event_id)
        values (
          v_code, p_user_id, 'pending',
          (v_quote ->> 'subtotal')::integer, (v_quote ->> 'discount_amount')::integer,
          (v_quote ->> 'surcharge_amount')::integer, v_total,
          case when v_coupon ->> 'kind' = 'public'  then (v_coupon ->> 'id')::uuid end,
          case when v_coupon ->> 'kind' = 'private' then (v_coupon ->> 'id')::uuid end,
          v_coupon ->> 'code', (v_coupon ->> 'percent')::integer, v_expires,
          left(p_utm ->> 'utm_source', 100), left(p_utm ->> 'utm_medium', 100), left(p_utm ->> 'utm_campaign', 100),
          p_exam_event_id)
        returning id into v_order_id;
        exit;
      exception when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'orders_user_coupon_once_idx' then
          raise exception 'COUPON_ALREADY_USED' using errcode = 'P0001';
        end if;
        v_order_id := null;   -- trùng mã đơn (hiếm): thử mã khác
      end;
    end loop;
    if v_order_id is null then
      raise exception 'Không tạo được mã đơn duy nhất';
    end if;

    for v_line in select * from jsonb_array_elements(v_quote -> 'lines') loop
      insert into public.order_items (
        order_id, item_type, document_id, bundle_id, flash_sale_id, access_level, premium_days,
        title_snapshot, page_count_snapshot, unit_price, discount_amount, final_price)
      values (
        v_order_id, (v_line ->> 'item_type')::public.order_item_type,
        (v_line ->> 'document_id')::uuid, (v_line ->> 'bundle_id')::uuid, (v_line ->> 'flash_sale_id')::uuid,
        (v_line ->> 'access_level')::public.access_level, (v_line ->> 'premium_days')::integer,
        left(v_line ->> 'title', 300), (v_line ->> 'page_count')::integer,
        (v_line ->> 'unit_price')::integer, (v_line ->> 'discount_amount')::integer, (v_line ->> 'final_price')::integer);
    end loop;

    -- Giữ lượt mã công khai: cập nhật nguyên tử (không vượt max_uses dù nhiều người cùng bấm)
    -- + ghi lượt dùng (UNIQUE user+mã: mỗi tài khoản 1 lần).
    if v_coupon ->> 'kind' = 'public' then
      update public.coupons set used_count = used_count + 1
       where id = (v_coupon ->> 'id')::uuid and is_active
         and now() >= starts_at and now() < ends_at
         and (max_uses is null or used_count < max_uses);
      if not found then
        raise exception 'COUPON_EXHAUSTED' using errcode = 'P0001';
      end if;
      insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount_amount)
      values ((v_coupon ->> 'id')::uuid, p_user_id, v_order_id, (v_quote ->> 'coupon_discount')::integer);
    end if;

    if v_free then
      perform public._fulfil_order(v_order_id, null, 0);
    end if;
  exception
    when raise_exception then
      if sqlerrm = 'COUPON_ALREADY_USED' then
        return public._err('COUPON_ALREADY_USED', 'Mã này đã được sử dụng.');
      elsif sqlerrm = 'COUPON_EXHAUSTED' then
        return public._err('COUPON_EXHAUSTED', 'Mã giảm giá đã hết lượt sử dụng.');
      end if;
      raise;
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'coupon_redemptions_user_id_coupon_id_key' then
        return public._err('COUPON_ALREADY_USED_BY_USER', 'Bạn đã dùng mã này rồi (mỗi tài khoản chỉ dùng 1 lần).');
      end if;
      raise;
  end;

  return jsonb_build_object(
    'ok', true,
    'order', (select jsonb_build_object(
                'id', o.id, 'payment_code', o.payment_code, 'status', o.status,
                'total_amount', o.total_amount, 'is_free', o.is_free_order,
                'expires_at', o.expires_at, 'bank_name', public.setting_text('payment.bank_name', 'MBBank'))
              from public.orders o where o.id = v_order_id),
    'quote', v_quote);
end;
$$;


-- =============================================================================
-- 6) release_order_coupon / expire_pending_orders: trả lượt mã, hết hạn đơn
-- =============================================================================
create or replace function public._release_order_coupon(p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  with d as (
    delete from public.coupon_redemptions where order_id = p_order_id returning coupon_id
  )
  update public.coupons c set used_count = greatest(c.used_count - 1, 0)
   where c.id in (select coupon_id from d);
$$;

-- Chạy định kỳ (mỗi 1-5 phút). Đơn đang "cần kiểm tra" (review_reason) KHÔNG tự hết hạn.
create or replace function public.expire_pending_orders(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_n  integer := 0;
begin
  for v_id in
    select o.id from public.orders o
     where o.status = 'pending' and o.expires_at < now() and o.review_reason is null
     order by o.expires_at
     limit p_limit
     for update skip locked
  loop
    update public.orders set status = 'expired' where id = v_id;
    perform public._release_order_coupon(v_id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;


-- =============================================================================
-- 7) process_sepay_payment: XỬ LÝ WEBHOOK SEPAY (idempotent)
-- -----------------------------------------------------------------------------
-- Đầu vào: nguyên JSON SePay gửi (id, transferType, transferAmount, content, code, ...).
-- Server đã xác thực header Authorization trước khi gọi. Hàm này luôn ghi 1 dòng
-- payment_transactions; gọi lặp cùng id -> trả 'duplicate', không xử lý lại.
-- Kết quả status:
--   paid          đơn đủ/thừa tiền -> đã mở khóa
--   review        cần admin xem (thiếu tiền / chuyển muộn / đơn đã hủy)
--   double_payment đơn đã trả rồi mà có thêm 1 giao dịch nữa
--   unmatched     không tìm thấy đơn nào khớp
--   ignored       tiền ra / không phải giao dịch tiền vào
--   duplicate     webhook gọi lặp
-- =============================================================================
create or replace function public.process_sepay_payment(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tx_id     text := nullif(btrim(p_payload ->> 'id'), '');
  v_type      text := lower(coalesce(p_payload ->> 'transferType', ''));
  v_amount    integer;
  v_content   text := p_payload ->> 'content';
  v_token     text;
  v_cleaned   text;
  v_order     public.orders;
  v_order_id  uuid;
  v_new_tx    uuid;
begin
  if v_tx_id is null or jsonb_typeof(p_payload) <> 'object' then
    return public._err('INVALID_PAYLOAD', 'Thiếu id giao dịch.');
  end if;
  begin
    v_amount := round((p_payload ->> 'transferAmount')::numeric)::integer;
  exception when others then
    return public._err('INVALID_PAYLOAD', 'transferAmount không hợp lệ.');
  end;
  if v_amount is null or v_amount < 0 then
    return public._err('INVALID_PAYLOAD', 'transferAmount không hợp lệ.');
  end if;

  insert into public.payment_transactions (
    sepay_transaction_id, gateway, account_number, transfer_type, amount, content,
    reference_code, transaction_date, status, raw_payload)
  values (
    v_tx_id, p_payload ->> 'gateway', p_payload ->> 'accountNumber',
    case when v_type in ('in', 'out') then v_type end, v_amount, v_content,
    p_payload ->> 'referenceCode',
    case when (p_payload ->> 'transactionDate') ~ '^\d{4}-\d{2}-\d{2}' then (p_payload ->> 'transactionDate')::timestamp at time zone 'Asia/Ho_Chi_Minh' end,
    'unmatched', p_payload)
  on conflict (sepay_transaction_id) do nothing
  returning id into v_new_tx;

  if v_new_tx is null then
    return jsonb_build_object('ok', true, 'status', 'duplicate');
  end if;

  if v_type <> 'in' then
    update public.payment_transactions set status = 'ignored', note = 'not_incoming' where id = v_new_tx;
    return jsonb_build_object('ok', true, 'status', 'ignored', 'transaction_id', v_new_tx);
  end if;

  -- Tìm đơn: ưu tiên trường "code" SePay tự nhận diện, sau đó quét nội dung chuyển khoản
  -- (ngân hàng đôi khi dính liền chữ, bỏ khoảng trắng/dấu).
  v_token := upper(regexp_replace(coalesce(p_payload ->> 'code', ''), '[^A-Za-z0-9]', '', 'g'));
  v_cleaned := upper(regexp_replace(coalesce(v_content, ''), '[^A-Za-z0-9]', '', 'g'));

  if v_token <> '' then
    select o.id into v_order_id from public.orders o where o.payment_code = v_token;
  end if;
  if v_order_id is null and v_cleaned <> '' then
    select o.id into v_order_id from public.orders o
     where o.created_at > now() - interval '30 days'
       and position(o.payment_code in v_cleaned) > 0
     order by o.created_at desc
     limit 1;
  end if;

  if v_order_id is null then
    update public.payment_transactions set note = 'no_matching_order' where id = v_new_tx;
    return jsonb_build_object('ok', true, 'status', 'unmatched', 'transaction_id', v_new_tx,
                              'amount', v_amount, 'content', v_content);
  end if;

  -- Khóa đơn: hai giao dịch cùng đơn xử lý lần lượt, không giẫm chân nhau.
  select * into v_order from public.orders where id = v_order_id for update;

  if v_order.status = 'paid' then
    update public.payment_transactions set order_id = v_order.id, note = 'double_payment' where id = v_new_tx;
    update public.orders set review_reason = coalesce(review_reason, 'double_payment') where id = v_order.id;
    return jsonb_build_object('ok', true, 'status', 'double_payment', 'transaction_id', v_new_tx,
                              'order_id', v_order.id, 'payment_code', v_order.payment_code, 'amount', v_amount);

  elsif v_order.status = 'expired' then
    update public.payment_transactions set order_id = v_order.id, note = 'late_payment' where id = v_new_tx;
    update public.orders set review_reason = 'late_payment', paid_amount = v_amount where id = v_order.id;
    return jsonb_build_object('ok', true, 'status', 'review', 'reason', 'late_payment', 'transaction_id', v_new_tx,
                              'order_id', v_order.id, 'payment_code', v_order.payment_code,
                              'amount', v_amount, 'expected', v_order.total_amount);

  elsif v_order.status in ('cancelled', 'refunded') then
    update public.payment_transactions set order_id = v_order.id, note = 'order_' || v_order.status where id = v_new_tx;
    update public.orders set review_reason = 'paid_after_cancel', paid_amount = v_amount where id = v_order.id;
    return jsonb_build_object('ok', true, 'status', 'review', 'reason', 'paid_after_cancel', 'transaction_id', v_new_tx,
                              'order_id', v_order.id, 'payment_code', v_order.payment_code,
                              'amount', v_amount, 'expected', v_order.total_amount);

  elsif v_amount < v_order.total_amount then
    update public.payment_transactions set order_id = v_order.id, note = 'underpaid' where id = v_new_tx;
    update public.orders set review_reason = 'underpaid', paid_amount = v_amount where id = v_order.id;
    return jsonb_build_object('ok', true, 'status', 'review', 'reason', 'underpaid', 'transaction_id', v_new_tx,
                              'order_id', v_order.id, 'payment_code', v_order.payment_code,
                              'amount', v_amount, 'expected', v_order.total_amount);
  end if;

  -- Đơn pending và đủ (hoặc thừa) tiền -> mở khóa.
  update public.payment_transactions
     set order_id = v_order.id, status = 'matched',
         note = case when v_amount > v_order.total_amount then 'overpaid' else null end
   where id = v_new_tx;
  perform public._fulfil_order(v_order.id, v_tx_id, v_amount);
  if v_amount > v_order.total_amount then
    update public.orders set review_reason = 'overpaid' where id = v_order.id;
  end if;

  return jsonb_build_object('ok', true, 'status', 'paid', 'transaction_id', v_new_tx,
                            'order_id', v_order.id, 'user_id', v_order.user_id,
                            'payment_code', v_order.payment_code, 'amount', v_amount,
                            'expected', v_order.total_amount, 'overpaid', v_amount > v_order.total_amount);
end;
$$;


-- =============================================================================
-- 8) Hàm cho trang admin "Đơn cần kiểm tra"
-- =============================================================================

-- "Duyệt thủ công": admin xác nhận đã nhận đủ tiền (đơn lệch / chuyển muộn).
create or replace function public.admin_approve_order(p_order_id uuid, p_admin_id uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not exists (select 1 from public.profiles p where p.id = p_admin_id and p.role = 'admin') then
    return public._err('FORBIDDEN', 'Chỉ admin được duyệt đơn.');
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return public._err('ORDER_NOT_FOUND', 'Không tìm thấy đơn.');
  end if;
  if v_order.status = 'paid' then
    return public._err('ALREADY_PAID', 'Đơn này đã được thanh toán.');
  end if;
  if v_order.status not in ('pending', 'expired') then
    return public._err('INVALID_STATUS', 'Đơn đã hủy/hoàn tiền, không thể duyệt.');
  end if;

  -- Đơn đã hết hạn thì mã công khai đã được trả lượt: giữ chỗ lại nếu còn có thể.
  if v_order.status = 'expired' and v_order.coupon_id is not null then
    begin
      insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount_amount)
      values (v_order.coupon_id, v_order.user_id, v_order.id, v_order.discount_amount)
      on conflict do nothing;
      if found then
        update public.coupons set used_count = used_count + 1 where id = v_order.coupon_id;
      end if;
    exception when others then
      null;  -- mã đã hết lượt/vi phạm ràng buộc: vẫn duyệt đơn, chỉ bỏ qua việc giữ lượt
    end;
  end if;

  perform public._fulfil_order(v_order.id, null, coalesce(v_order.paid_amount, v_order.total_amount));
  update public.orders set review_reason = null where id = v_order.id;
  update public.payment_transactions set status = 'matched' where order_id = v_order.id and status = 'unmatched';

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (p_admin_id, 'order.approve_manual', 'order', v_order.id::text,
          jsonb_build_object('status', v_order.status, 'review_reason', v_order.review_reason, 'paid_amount', v_order.paid_amount),
          jsonb_build_object('status', 'paid', 'note', p_note));

  return jsonb_build_object('ok', true, 'order_id', v_order.id, 'status', 'paid');
end;
$$;

-- "Từ chối": hủy đơn, trả lượt mã giảm giá. (Hoàn tiền cho khách do admin làm ngoài ngân hàng.)
create or replace function public.admin_reject_order(p_order_id uuid, p_admin_id uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not exists (select 1 from public.profiles p where p.id = p_admin_id and p.role = 'admin') then
    return public._err('FORBIDDEN', 'Chỉ admin được từ chối đơn.');
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return public._err('ORDER_NOT_FOUND', 'Không tìm thấy đơn.');
  end if;
  if v_order.status not in ('pending', 'expired') then
    return public._err('INVALID_STATUS', 'Chỉ từ chối được đơn đang chờ hoặc đã hết hạn.');
  end if;

  update public.orders set status = 'cancelled', review_reason = null where id = v_order.id;
  perform public._release_order_coupon(v_order.id);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (p_admin_id, 'order.reject_manual', 'order', v_order.id::text,
          jsonb_build_object('status', v_order.status, 'review_reason', v_order.review_reason),
          jsonb_build_object('status', 'cancelled', 'note', p_note));
  return jsonb_build_object('ok', true, 'order_id', v_order.id, 'status', 'cancelled');
end;
$$;

-- Đơn thừa tiền / chuyển trùng: sau khi admin đã hoàn tiền ngoài ngân hàng, bấm xóa cờ.
create or replace function public.admin_resolve_review(p_order_id uuid, p_admin_id uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text;
begin
  if not exists (select 1 from public.profiles p where p.id = p_admin_id and p.role = 'admin') then
    return public._err('FORBIDDEN', 'Chỉ admin được xử lý.');
  end if;
  select review_reason into v_reason from public.orders where id = p_order_id for update;
  if v_reason is null then
    return public._err('NOTHING_TO_RESOLVE', 'Đơn này không có cờ cần kiểm tra.');
  end if;
  update public.orders set review_reason = null where id = p_order_id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (p_admin_id, 'order.resolve_review', 'order', p_order_id::text,
          jsonb_build_object('review_reason', v_reason), jsonb_build_object('note', p_note));
  return jsonb_build_object('ok', true);
end;
$$;


-- =============================================================================
-- 9) Premium + CẤP QUYỀN XEM / TẢI FILE
-- =============================================================================

-- Trạng thái Premium cho trang tài khoản: "Còn 23 ngày", "Đã dùng 2/5 suất tải".
create or replace function public.premium_status(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_sub public.premium_subscriptions;
  v_used integer;
  v_docs jsonb;
begin
  select * into v_sub from public.premium_subscriptions s
   where s.user_id = p_user_id and now() >= s.starts_at and now() < s.ends_at
   order by s.ends_at desc limit 1;
  if not found then
    return jsonb_build_object('active', false);
  end if;
  select count(*), coalesce(jsonb_agg(jsonb_build_object('document_id', d.id, 'title', d.title)), '[]'::jsonb)
    into v_used, v_docs
    from public.premium_download_slots sl join public.documents d on d.id = sl.document_id
   where sl.subscription_id = v_sub.id;
  return jsonb_build_object(
    'active', true, 'subscription_id', v_sub.id, 'starts_at', v_sub.starts_at, 'ends_at', v_sub.ends_at,
    'days_left', greatest(ceil(extract(epoch from (v_sub.ends_at - now())) / 86400.0)::integer, 0),
    'slots_used', v_used, 'slots_limit', v_sub.download_slot_limit, 'claimed_documents', v_docs);
end;
$$;

-- Quyết định ai được XEM / TẢI file đầy đủ và (nếu Premium tải lần đầu) chiếm 1 suất.
-- Server gọi hàm này, nếu ok=true thì tạo signed URL (bucket + storage_path trả về) hết hạn sau vài phút.
create or replace function public.authorize_file_access(
  p_user_id uuid,
  p_document_id uuid,
  p_action text,
  p_ip_hash text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc      public.documents;
  v_file     public.document_files;
  v_ent      public.access_level;
  v_banned   boolean;
  v_sub      public.premium_subscriptions;
  v_via      text;
  v_used     integer;
  v_claimed  boolean := false;
  v_upgrade  integer;
begin
  if p_user_id is null then
    return public._err('LOGIN_REQUIRED', 'Bạn cần đăng nhập.');
  end if;
  if p_action not in ('view', 'download') then
    return public._err('INVALID_ACTION', 'Thao tác không hợp lệ.');
  end if;
  select p.is_banned into v_banned from public.profiles p where p.id = p_user_id;
  if not found then
    return public._err('USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
  end if;
  if v_banned then
    return public._err('USER_BANNED', 'Tài khoản đang bị khóa.');
  end if;

  select * into v_doc from public.documents where id = p_document_id;
  if not found then
    return public._err('DOC_NOT_FOUND', 'Không tìm thấy tài liệu.');
  end if;
  select * into v_file from public.document_files
   where document_id = p_document_id and kind = 'full' and is_current;
  if not found then
    return public._err('FILE_MISSING', 'Tài liệu chưa có file đầy đủ.');
  end if;

  select e.access_level into v_ent from public.entitlements e
   where e.user_id = p_user_id and e.document_id = p_document_id;

  -- ----- XEM -----
  if p_action = 'view' then
    if v_ent is not null then
      v_via := 'entitlement';                    -- đã mua: luôn xem được, kể cả tài liệu đã gỡ
    elsif v_doc.status = 'published' and v_doc.is_free then
      v_via := 'free';
    elsif v_doc.status = 'published' and exists (
            select 1 from public.premium_subscriptions s
             where s.user_id = p_user_id and now() >= s.starts_at and now() < s.ends_at) then
      v_via := 'premium';
    else
      return public._err('NO_ACCESS', 'Bạn chưa có quyền xem tài liệu này.');
    end if;

  -- ----- TẢI -----
  else
    if v_ent = 'download' then
      v_via := 'entitlement';
    elsif v_doc.status = 'published' and v_doc.is_free and v_ent is null
          and public.setting_bool('files.free_docs_downloadable', false) then
      v_via := 'free';
    else
      -- Premium: tối đa N tài liệu khác nhau mỗi kỳ; tải lại tài liệu đã chiếm suất thì không tốn thêm.
      select * into v_sub from public.premium_subscriptions s
       where s.user_id = p_user_id and now() >= s.starts_at and now() < s.ends_at
         and (v_doc.status = 'published' and not v_doc.is_free)
       order by s.ends_at desc limit 1
       for update;
      if found then
        if exists (select 1 from public.premium_download_slots sl
                    where sl.subscription_id = v_sub.id and sl.document_id = p_document_id) then
          v_via := 'premium';
        else
          begin
            insert into public.premium_download_slots (subscription_id, user_id, document_id)
            values (v_sub.id, p_user_id, p_document_id);
            v_claimed := true;
            v_via := 'premium';
          exception when raise_exception then
            return public._err('PREMIUM_SLOTS_EXHAUSTED',
              format('Bạn đã dùng hết %s suất tải của kỳ Premium này.', v_sub.download_slot_limit),
              jsonb_build_object('slots_limit', v_sub.download_slot_limit, 'slots_used', v_sub.download_slot_limit));
          end;
        end if;
      elsif v_ent = 'view' and v_doc.status = 'published' then
        v_upgrade := greatest(v_doc.download_price - v_doc.view_price, public.setting_int('order.upgrade_min_amount', 2000));
        return public._err('DOWNLOAD_NOT_PURCHASED', 'Bạn mới mua quyền xem online. Nâng cấp để tải về.',
                           jsonb_build_object('upgrade_price', v_upgrade));
      else
        return public._err('NO_ACCESS', 'Bạn chưa có quyền tải tài liệu này.');
      end if;
    end if;
  end if;

  insert into public.download_logs (user_id, document_id, document_file_id, action, via, ip_hash, user_agent)
  values (p_user_id, p_document_id, v_file.id, p_action, v_via, p_ip_hash, left(p_user_agent, 500));

  if v_via = 'premium' and p_action = 'download' then
    select count(*) into v_used from public.premium_download_slots sl where sl.subscription_id = v_sub.id;
  end if;

  return jsonb_build_object(
    'ok', true, 'via', v_via, 'action', p_action,
    'bucket', v_file.bucket, 'storage_path', v_file.storage_path, 'document_file_id', v_file.id,
    'signed_url_ttl_seconds', public.setting_int('files.signed_url_ttl_seconds', 300),
    'slots_claimed_now', v_claimed,
    'slots_used', v_used, 'slots_limit', v_sub.download_slot_limit);
end;
$$;


-- =============================================================================
-- 10) PHÂN QUYỀN GỌI HÀM: chỉ service_role (server). Trình duyệt tuyệt đối không.
-- -----------------------------------------------------------------------------
-- Mặc định Postgres cho PUBLIC quyền chạy mọi hàm; Supabase còn cấp thêm cho
-- anon/authenticated -> phải thu hồi rõ ràng, nếu không ai cũng tự gọi được
-- process_sepay_payment("đã thanh toán") qua API!
-- =============================================================================
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.quote_cart(uuid, jsonb, text)',
    'public.create_order(uuid, jsonb, text, jsonb, uuid)',
    'public.process_sepay_payment(jsonb)',
    'public.expire_pending_orders(integer)',
    'public.admin_approve_order(uuid, uuid, text)',
    'public.admin_reject_order(uuid, uuid, text)',
    'public.admin_resolve_review(uuid, uuid, text)',
    'public.premium_status(uuid)',
    'public.authorize_file_access(uuid, uuid, text, text, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;

  -- Hàm nội bộ: chỉ các hàm trên (chạy với quyền chủ sở hữu) gọi được.
  foreach f in array array[
    'public._fulfil_order(uuid, text, integer)',
    'public._release_order_coupon(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f);
  end loop;
end;
$$;
