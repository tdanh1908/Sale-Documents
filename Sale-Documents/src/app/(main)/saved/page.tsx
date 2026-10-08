"use client";

import { useState, useEffect } from "react";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { createBrowserClient } from "@/lib/supabase/client";
import { Bookmark } from "lucide-react";
import Link from "next/link";

export default function SavedDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("Tất cả");

  useEffect(() => {
    const fetchSavedDocuments = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('saved_documents')
          .select('*, documents(*)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Extract documents from the joined data
        const validDocs = (data || [])
          .filter(item => item && item.documents)
          .map(item => Array.isArray(item.documents) ? item.documents[0] : item.documents)
          .filter(doc => doc !== null && doc !== undefined);

        setDocuments(validDocs);
        
        // Extract unique tags
        const allTags = validDocs.flatMap(doc => doc?.tags || []);
        const unique = Array.from(new Set(allTags));
        setUniqueTags(unique);
        
      } catch (err) {
        console.error("Lỗi fetch tài liệu đã lưu:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedDocuments();
  }, []);

  const mapDocToProps = (doc: any) => ({
    id: doc?.id,
    title: doc?.title,
    subject: doc?.subject === 'toan' ? 'Môn Toán' : doc?.subject === 'ly' ? 'Vật Lý' : doc?.subject === 'hoa' ? 'Hóa Học' : doc?.subject === 'van' ? 'Ngữ Văn' : doc?.subject === 'anh' ? 'Tiếng Anh' : 'Khác',
    subjectColor: 'blue',
    pages: doc?.page_count,
    rating: doc?.rating_avg > 0 ? doc?.rating_avg : undefined,
    sales: doc?.sales_count > 0 ? `${doc?.sales_count}` : undefined,
    priceOnline: doc?.view_price ? `${doc?.view_price.toLocaleString('vi-VN')}đ` : undefined,
    priceDownload: doc?.download_price ? `${doc?.download_price.toLocaleString('vi-VN')}đ` : undefined,
    isFree: doc?.is_free,
    imageColor: doc?.is_free ? "10B981" : "3B82F6",
    coverUrl: doc?.cover_url,
    cover_image_url: doc?.cover_image_url,
    thumbnail_url: doc?.thumbnail_url,
    image_url: doc?.image_url,
    avatar_url: doc?.avatar_url,
    demo_file_url: doc?.demo_file_url,
  });

  const filteredDocs = selectedTag === "Tất cả" 
    ? documents 
    : documents.filter(doc => (doc?.tags || []).includes(selectedTag));

  const handleRemoveDoc = (idToRemove: string) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== idToRemove));
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 min-h-[calc(100vh-64px)]">
      <div className="mb-6 md:mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center shadow-inner">
          <Bookmark className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Tài liệu đã lưu</h1>
          <p className="text-sm text-slate-500 mt-1">Các tài liệu bạn đã yêu thích và đánh dấu lưu lại.</p>
        </div>
      </div>

      {!isLoading && documents.length > 0 && uniqueTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-2">
          <button 
            onClick={() => setSelectedTag("Tất cả")}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition border ${selectedTag === "Tất cả" ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            Tất cả
          </button>
          {uniqueTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition border ${selectedTag === tag ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-[#2563EB] mb-3"></i>
          <p className="font-bold">Đang tải danh sách...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <Bookmark className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100">Bạn chưa lưu tài liệu nào</h3>
          <p className="text-slate-500 text-sm mb-6">Hãy lướt thư viện và thả tim các tài liệu bạn yêu thích nhé.</p>
          <Link href="/thu-vien" className="h-11 px-6 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition flex items-center justify-center">
            Khám phá thư viện
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {filteredDocs.map(doc => (
            <DocumentCard 
              key={doc.id}
              {...mapDocToProps(doc)}
              variant="library"
              isFavorite={true}
              onRemoveFromSaved={handleRemoveDoc}
            />
          ))}
          {filteredDocs.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              Không có tài liệu nào thuộc tag này.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
