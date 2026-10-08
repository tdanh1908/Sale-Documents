"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [supabase] = useState(() => createBrowserClient());
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedOption, setSelectedOption] = useState("view_only");
  const [activeTab, setActiveTab] = useState("desc");

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error || !data) {
        console.error(error);
        setError(true);
      } else {
        setDocument(data);
      }
      setLoading(false);
    };

    fetchDocument();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-[#2563EB]"></i>
          <p className="font-bold">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    notFound();
    return null;
  }

  const subjectMap: Record<string, string> = {
    "toan": "Toán học",
    "ly": "Vật lý",
    "hoa": "Hóa học",
    "sinh": "Sinh học",
    "van": "Ngữ Văn",
    "anh": "Tiếng Anh"
  };

  const subjectName = subjectMap[document.subject] || "Khác";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 pb-24 md:pb-0 relative">
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {/* Breadcrumb */}
        <nav className="flex text-sm text-slate-500 dark:text-slate-400 mb-6 whitespace-nowrap overflow-x-auto hide-scrollbar">
          <Link href="/" className="hover:text-[#2563EB] transition flex-shrink-0">Trang chủ</Link>
          <span className="mx-2 flex-shrink-0">/</span>
          <Link href={`/subject/${document.subject}`} className="hover:text-[#2563EB] transition flex-shrink-0">{subjectName}</Link>
          <span className="mx-2 flex-shrink-0">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-xs">{document.title}</span>
        </nav>

        {/* Khối Layout chính */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
          {/* Cột trái: Nội dung tài liệu */}
          <div className="flex-1 w-full min-w-0">
              
            {/* Bìa và Thông tin cơ bản (Mobile & Desktop) */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              {/* Ảnh bìa */}
              <div className="w-full sm:w-48 lg:w-56 flex-shrink-0">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-md relative border border-slate-100 dark:border-slate-800 bg-blue-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={document.cover_url || `https://placehold.co/400x533/3B82F6/FFF?text=${encodeURIComponent(document.subject || 'TL')}`} 
                    alt="Bìa sách" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
              
              {/* Thông tin */}
              <div className="flex flex-col flex-1 justify-center">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    Môn {subjectName}
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {document.doc_type || 'Tài liệu'}
                  </span>
                  
                  {document.is_free ? (
                    <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-green-200 dark:border-green-800">Miễn phí</span>
                  ) : (
                    <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800">Có phí</span>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
                  {document.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5"><i className="fa-regular fa-file-pdf"></i> {document.page_count || 0} trang</div>
                  <div className="flex items-center gap-1.5"><i className="fa-solid fa-file-arrow-down"></i> {document.sales_count || 0} lượt tải</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#FACC15]"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star-half-stroke"></i></span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">0.0</span> (0 đánh giá)
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://placehold.co/40x40/94A3B8/FFF?text=GV" alt="Tác giả" className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-xs text-slate-500">Tác giả / Sưu tầm</div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{document.author || "Khuyết danh"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phần Xem trước (Preview) */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 sm:p-6 mb-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-lg flex items-center gap-2"><i className="fa-solid fa-eye text-[#2563EB]"></i> Xem trước tài liệu</h2>
                <div className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Giới hạn 3 trang</div>
              </div>

              {/* Container hiển thị ảnh/iframe */}
              <div className="relative w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden aspect-[1/1.4] sm:aspect-[16/10] flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {document.demo_file_url ? (
                  <iframe 
                    src={`${document.demo_file_url}#toolbar=0`} 
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <i className="fa-regular fa-file-pdf text-5xl mb-3 opacity-50"></i>
                    <p className="font-bold text-sm">Chưa có bản xem trước</p>
                  </div>
                )}
              </div>
            </div>

            {/* Khu vực Tabs (Mô tả, Đánh giá, Bình luận) */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 sm:p-6 sm:px-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                
              {/* Tab Header */}
              <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto hide-scrollbar">
                <button 
                  onClick={() => setActiveTab("desc")} 
                  className={`pb-3 font-bold whitespace-nowrap transition border-b-2 ${activeTab === 'desc' ? 'text-[#2563EB] border-[#2563EB]' : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'}`}
                >Mô tả chi tiết</button>
                <button 
                  onClick={() => setActiveTab("review")} 
                  className={`pb-3 font-bold whitespace-nowrap transition border-b-2 ${activeTab === 'review' ? 'text-[#2563EB] border-[#2563EB]' : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200'}`}
                >Đánh giá (0)</button>
              </div>

              {/* TAB 1: MÔ TẢ */}
              {activeTab === "desc" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {document.tags && document.tags.length > 0 && (
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {document.tags.map((tag: string, index: number) => (
                          <span key={index} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {document.detailed_description || document.description || "Tài liệu này chưa có mô tả chi tiết."}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ĐÁNH GIÁ (Mock) */}
              {activeTab === "review" && (
                <div className="animate-in fade-in duration-300 text-center py-8 text-slate-500">
                  <i className="fa-regular fa-comment-dots text-4xl mb-3 opacity-50"></i>
                  <p>Chưa có đánh giá nào cho tài liệu này.</p>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Khối mua hàng (Dính màn hình trên Desktop) */}
          <div className="w-full lg:w-[360px] flex-shrink-0 relative">
            <div className="sticky top-20 flex flex-col gap-4">
                
              {/* Box Mua Hàng */}
              <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xl lg:shadow-md relative overflow-hidden">
                  
                {/* Header Box */}
                <h3 className="font-extrabold text-xl mb-4 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Tùy chọn sở hữu</h3>

                {!document.is_free ? (
                  /* ================= STATE 1 & 2: CÓ PHÍ ================= */
                  <div className="flex flex-col gap-4">
                    {/* Các gói giá */}
                    <div className="space-y-3">
                      {/* Option 1: Online */}
                      <label className="block relative cursor-pointer group">
                        <input 
                          type="radio" 
                          name="buy_type" 
                          value="online" 
                          className="peer absolute opacity-0 w-0 h-0" 
                          checked={selectedOption === 'view_only'}
                          onChange={() => setSelectedOption('view_only')}
                        />
                        <div className="flex items-center justify-between p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl transition hover:border-blue-300 dark:hover:border-blue-800 bg-white dark:bg-[#1E293B] peer-checked:border-[#2563EB] peer-checked:bg-blue-50 dark:peer-checked:bg-[#2563EB]/10">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${selectedOption === 'view_only' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300 dark:border-slate-600'}`}>
                              <div className={`w-2 h-2 bg-white rounded-full ${selectedOption === 'view_only' ? 'block' : 'hidden'}`}></div>
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Chỉ xem Online</div>
                              <div className="text-[11px] text-slate-500">Xem vĩnh viễn trên web</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-[#2563EB] text-base">{document.view_price?.toLocaleString('vi-VN')}đ</div>
                          </div>
                        </div>
                      </label>

                      {/* Option 2: Download */}
                      <label className="block relative cursor-pointer group">
                        <input 
                          type="radio" 
                          name="buy_type" 
                          value="download" 
                          className="peer absolute opacity-0 w-0 h-0"
                          checked={selectedOption === 'download'}
                          onChange={() => setSelectedOption('download')}
                        />
                        <div className="flex items-center justify-between p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl transition hover:border-blue-300 dark:hover:border-blue-800 bg-white dark:bg-[#1E293B] relative overflow-hidden peer-checked:border-[#2563EB] peer-checked:bg-blue-50 dark:peer-checked:bg-[#2563EB]/10">
                          <div className="absolute top-0 right-0 bg-[#FACC15] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">Khuyên dùng</div>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${selectedOption === 'download' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300 dark:border-slate-600'}`}>
                              <div className={`w-2 h-2 bg-white rounded-full ${selectedOption === 'download' ? 'block' : 'hidden'}`}></div>
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Xem & Tải File PDF</div>
                              <div className="text-[11px] text-slate-500">Được tải về để in ấn</div>
                            </div>
                          </div>
                          <div className="text-right mt-3 sm:mt-0">
                            <div className="font-extrabold text-[#2563EB] text-base">{document.download_price?.toLocaleString('vi-VN')}đ</div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Mã giảm giá */}
                    <div className="relative">
                      <i className="fa-solid fa-ticket absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                      <input type="text" placeholder="Nhập mã giảm giá..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl pl-9 pr-20 text-sm focus:border-[#2563EB] outline-none text-slate-800 dark:text-slate-200 uppercase" />
                      <button className="absolute right-1 top-1 bottom-1 px-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-300 transition">Áp dụng</button>
                    </div>

                    {/* Nút Hành động chính */}
                    <div className="flex gap-2">
                      <button className="w-12 h-12 flex-shrink-0 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 flex items-center justify-center text-lg hover:bg-[#F97316] hover:text-white transition" title="Thêm vào giỏ">
                        <i className="fa-solid fa-cart-plus"></i>
                      </button>
                      <button className="flex-1 h-12 bg-[#2563EB] text-white font-extrabold text-sm rounded-2xl hover:bg-[#1D4ED8] transition flex flex-col items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                        <span>MUA NGAY</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ================= STATE 5: MIỄN PHÍ ================= */
                  <div className="flex flex-col gap-4">
                    <div className="text-center py-4">
                      <div className="text-green-500 font-black text-3xl mb-1">0đ</div>
                      <div className="text-sm text-slate-500 font-medium">Tài liệu chia sẻ miễn phí</div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button className="w-full h-12 bg-[#2563EB] text-white font-extrabold text-sm rounded-2xl hover:bg-[#1D4ED8] transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none">
                        <i className="fa-solid fa-book-open"></i> XEM MIỄN PHÍ
                      </button>
                    </div>
                  </div>
                )}

                {/* Thông tin cam kết (Chung) */}
                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1"><i className="fa-solid fa-shield-halved text-green-500"></i> Thanh toán an toàn</span>
                  <span className="flex items-center gap-1"><i className="fa-solid fa-bolt text-[#F97316]"></i> Mở khóa tức thì</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
