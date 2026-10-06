-- Migration: Quản lý Tài liệu, Phân quyền và Lịch sử

-- 0. Cập nhật kiểu ENUM document_status có sẵn
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'archived';

-- 1. Cập nhật Bảng Documents (Bảng đã tồn tại)
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS grades TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS pages_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_view NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_download NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS demo_file_url TEXT,
ADD COLUMN IF NOT EXISTS full_file_path TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Bảng Price History (Lịch sử giá)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.documents(id),
    admin_id UUID REFERENCES auth.users(id),
    old_price_view NUMERIC,
    new_price_view NUMERIC,
    old_price_download NUMERIC,
    new_price_download NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Premium Download Slots (Quota 5 tài liệu/chu kỳ)
CREATE TABLE IF NOT EXISTS public.premium_download_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    document_id UUID REFERENCES public.documents(id),
    cycle_start TIMESTAMPTZ NOT NULL,
    cycle_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, document_id, cycle_start)
);

-- 4. Bảng Download/View Logs
CREATE TABLE IF NOT EXISTS public.download_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    document_id UUID REFERENCES public.documents(id),
    action TEXT CHECK (action IN ('view', 'download')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tạo Storage Bucket: private_documents
INSERT INTO storage.buckets (id, name, public) VALUES ('private_documents', 'private_documents', false) ON CONFLICT DO NOTHING;

-- RLS chặn tất cả public access cho bucket private_documents (chỉ Server Role mới được lấy)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Block all public access' AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Block all public access" ON storage.objects
        FOR SELECT USING (bucket_id = 'private_documents' AND false);
    END IF;
END $$;
