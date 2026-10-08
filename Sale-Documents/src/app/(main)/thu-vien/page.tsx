"use client";

import { useState, useEffect } from "react";
import { Search, Sliders, Filter, X, ChevronDown } from "lucide-react";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { SUBJECTS_MOCK } from "@/lib/mock-data";
import { createBrowserClient } from "@/lib/supabase/client";

function FilterCheckbox({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
      <input type="checkbox" className="peer hidden" defaultChecked={defaultChecked} />
      <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-[#1E293B] transition peer-checked:bg-[#2563EB] peer-checked:border-[#2563EB] peer-checked:[&>svg]:block">
        <svg className="w-3 h-3 text-white hidden pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-slate-600 dark:text-slate-300 group-hover:text-[#2563EB] transition font-medium select-none">
        {label}
      </span>
    </label>
  );
}

export default function LibraryPage() {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (err) {
        console.error("Lỗi fetch tài liệu:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const mapDocToProps = (doc: any) => ({
    id: doc.id,
    title: doc.title,
    subject: doc.subject === 'toan' ? 'Môn Toán' : doc.subject === 'ly' ? 'Vật Lý' : doc.subject === 'hoa' ? 'Hóa Học' : doc.subject === 'van' ? 'Ngữ Văn' : doc.subject === 'anh' ? 'Tiếng Anh' : 'Khác',
    subjectColor: 'blue',
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
    <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 min-h-[calc(100vh-64px)]">
      {/* Page Header & Mobile Search */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 text-slate-800 dark:text-slate-100">Thư viện Tài liệu</h1>
        
        {/* Search for Mobile */}
        <div className="md:hidden relative w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo từ khóa..." 
              className="w-full bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 pl-11 pr-4 h-12 rounded-2xl outline-none focus:ring-2 focus:ring-[#2563EB] border border-slate-200 dark:border-slate-700 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 relative">
        {/* Sidebar / Filter Drawer */}
        {/* Lớp phủ (Overlay) cho Mobile */}
        {isMobileFilterOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 z-40 md:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
        )}
        
        <aside 
          className={`fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white dark:bg-[#1E293B] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col md:static md:w-64 md:translate-x-0 md:bg-transparent md:dark:bg-transparent md:shadow-none md:z-auto flex-shrink-0 ${isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 md:hidden">
            <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Filter className="w-5 h-5" /> Bộ Lọc
            </h2>
            <button 
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lọc Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-0 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Lọc Môn Học */}
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Môn Học</h3>
              <div className="space-y-2">
                {SUBJECTS_MOCK.slice(0, 5).map(sub => (
                  <FilterCheckbox key={sub.id} label={sub.name} />
                ))}
                <div className="pl-8">
                  <button className="text-sm text-[#2563EB] font-bold hover:underline">
                    Xem thêm ({SUBJECTS_MOCK.length - 5})
                  </button>
                </div>
              </div>
            </div>

            {/* Lọc Loại tài liệu */}
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Loại</h3>
              <div className="space-y-2">
                <FilterCheckbox label="Lý thuyết" />
                <FilterCheckbox label="Bài tập" />
                <FilterCheckbox label="Đề thi" />
              </div>
            </div>

            {/* Lọc Giá */}
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider">Giá</h3>
              <div className="space-y-2">
                <FilterCheckbox label="Miễn phí" defaultChecked />
                <FilterCheckbox label="Có phí" />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 md:border-none md:p-0 md:mt-4 flex flex-col gap-3">
            <button className="w-full h-11 bg-[#2563EB] text-white font-bold rounded-full hover:bg-blue-700 transition">
              Tìm Tài Liệu
            </button>
            <button 
              className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Xóa lọc
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Kết quả & Sắp xếp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Tìm thấy <span className="text-slate-800 dark:text-white font-extrabold text-base">{documents.length}</span> tài liệu
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 hidden sm:inline">Sắp xếp:</span>
              <div className="relative">
                <select className="appearance-none bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl h-11 pl-4 pr-10 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm cursor-pointer">
                  <option>Mới nhất</option>
                  <option>Bán chạy nhất</option>
                  <option>Giá: Thấp đến cao</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid Tài liệu */}
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Đang tải dữ liệu...</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {documents.map(doc => (
                <DocumentCard 
                  key={doc.id}
                  {...mapDocToProps(doc)}
                  variant="library"
                  isFavorite={false}
                />
              ))}
              {documents.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">Không tìm thấy tài liệu nào</div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

