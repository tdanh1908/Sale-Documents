import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { moderateText } from '@/lib/moderation';
import { sendTelegramNotification } from '@/lib/telegram';

const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải từ 8 ký tự trở lên"),
  full_name: z.string().min(1, "Họ tên không được để trống"),
  nickname: z.string().min(1, "Biệt danh không được để trống"),
  school: z.string().min(1, "Tên trường không được để trống"),
  phone: z.string().optional(),
  turnstileToken: z.string().min(1, "Thiếu mã xác thực Turnstile"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password, full_name, nickname, school, phone, turnstileToken } = parsed.data;

    // 1. Xác thực Turnstile
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${turnstileSecret}&response=${turnstileToken}`,
      });
      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        return NextResponse.json({ error: 'Xác thực mã CAPTCHA thất bại' }, { status: 400 });
      }
    }

    // 2. Auto Moderation
    const nicknameStatus = moderateText(nickname);
    const schoolStatus = moderateText(school);

    // 3. Đăng ký qua Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          nickname,
          school,
          phone,
          nickname_status: nicknameStatus,
          school_status: schoolStatus,
        }
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 4. Gửi thông báo Telegram (Không await để tránh block luồng phản hồi)
    const hasFlag = nicknameStatus === 'flagged' || schoolStatus === 'flagged';
    let tgMessage = `<b>🆕 Người dùng mới đăng ký</b>\n`;
    tgMessage += `Email: ${email}\n`;
    tgMessage += `Họ tên: ${full_name}\n`;
    tgMessage += `Biệt danh: ${nickname} [${nicknameStatus}]\n`;
    tgMessage += `Trường: ${school} [${schoolStatus}]\n`;
    
    if (hasFlag) {
      tgMessage += `\n⚠️ <b>CẢNH BÁO:</b> Có thông tin bị flagged cần kiểm duyệt!`;
    }

    sendTelegramNotification(tgMessage);

    return NextResponse.json({ success: true, user: data.user }, { status: 200 });

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
