import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const documentId = params.id;
    const body = await request.json();
    const { action, userId, cycleStart, cycleEnd } = body; // Giả sử middleware đã inject hoặc lấy từ session

    if (!documentId || !action || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Dùng Service Role Key để truy cập private bucket và by-pass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Kiểm tra xem user đã mua tài liệu chưa (Vĩnh viễn)
    const { data: purchase } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .eq('access_type', action)
      .single();

    let hasAccess = !!purchase;

    // 2. Nếu chưa mua lẻ và yêu cầu Tải về -> Kiểm tra Premium Quota
    if (!hasAccess && action === 'download') {
      const { data: existingSlot } = await supabaseAdmin
        .from('premium_download_slots')
        .select('id')
        .eq('user_id', userId)
        .eq('document_id', documentId)
        .eq('cycle_start', cycleStart)
        .single();

      if (existingSlot) {
        hasAccess = true; // Đã chiếm suất tài liệu này
      } else {
        // Đếm tổng suất đã dùng
        const { count } = await supabaseAdmin
          .from('premium_download_slots')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('cycle_start', cycleStart);

        if (count !== null && count < 5) {
          // Ghi nhận suất mới
          await supabaseAdmin.from('premium_download_slots').insert({
            user_id: userId,
            document_id: documentId,
            cycle_start: cycleStart,
            cycle_end: cycleEnd
          });
          hasAccess = true;
        } else {
          return NextResponse.json({ error: 'Premium download quota exceeded (5/5)' }, { status: 403 });
        }
      }
    }

    // 3. Nếu chưa mua lẻ và yêu cầu Xem online -> Kiểm tra Premium (Giả định Premium xem ko giới hạn)
    if (!hasAccess && action === 'view') {
      // (Thực tế nên kiểm tra bảng profiles xem còn hạn premium không)
      // Giả sử logic kiểm tra profile premium trả về true:
      hasAccess = true; 
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 4. Lấy Full file path từ documents
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('full_file_path')
      .eq('id', documentId)
      .single();

    if (!doc || !doc.full_file_path) {
      return NextResponse.json({ error: 'Document file not found' }, { status: 404 });
    }

    // 5. Ghi log
    await supabaseAdmin.from('download_logs').insert({
      user_id: userId,
      document_id: documentId,
      action: action
    });

    // 6. Tạo Signed URL hết hạn sau 60s
    const { data: signedUrlData, error: signError } = await supabaseAdmin
      .storage
      .from('private_documents')
      .createSignedUrl(doc.full_file_path, 60);

    if (signError || !signedUrlData) {
      throw new Error('Could not generate signed URL');
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });

  } catch (error: any) {
    console.error('Access Document Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
