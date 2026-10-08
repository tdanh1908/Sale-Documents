import { createServerClient } from "@/lib/supabase/server";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { SUBJECTS_MOCK } from "@/lib/mock-data";
import { BookX, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SubjectPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // Find the subject details from mock data
  const subjectInfo = SUBJECTS_MOCK.find(s => s.id === slug);
  const displaySubjectName = subjectInfo ? subjectInfo.name : "Không xác định";

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('status', 'published')
    .eq('subject', slug)
    .order('created_at', { ascending: false });

  const mapDocToProps = (doc: any) => ({
    id: doc.id,
    title: doc.title,
    subject: displaySubjectName,
    subjectColor: subjectInfo?.color || 'blue',
    pages: doc.page_count,
    rating: doc.rating_avg > 0 ? doc.rating_avg : undefined,
    sales: doc.sales_count > 0 ? `${doc.sales_count}` : undefined,
    priceOnline: doc.view_price ? `${doc.view_price.toLocaleString('vi-VN')}đ` : "0đ",
    priceDownload: doc.download_price ? `${doc.download_price.toLocaleString('vi-VN')}đ` : "0đ",
    isFree: doc.is_free,
    imageColor: doc.is_free ? "10B981" : "3B82F6",
    coverUrl: doc.cover_url,
    cover_image_url: doc.cover_image_url,
    thumbnail_url: doc.thumbnail_url,
    image_url: doc.image_url,
    avatar_url: doc.avatar_url,
    demo_file_url: doc.demo_file_url,
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 min-h-[60vh]">
      <div className="w-full mb-8">
        <Link href="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4 font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> Về trang chủ
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Tài liệu môn {displaySubjectName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          {documents?.length ? `Tìm thấy ${documents.length} tài liệu.` : "Đang cập nhật tài liệu cho môn học này."}
        </p>
      </div>

      {(!documents || documents.length === 0) ? (
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <BookX className="w-12 h-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">Chưa có tài liệu</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md text-lg">
            Hiện tại môn <span className="font-semibold">{displaySubjectName}</span> chưa có tài liệu nào được đăng tải. Vui lòng quay lại sau nhé.
          </p>
          <Link href="/" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Quay Về Trang Chủ
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {documents.map((doc: any) => (
            <DocumentCard key={doc.id} {...mapDocToProps(doc)} />
          ))}
        </div>
      )}
    </div>
  );
}
