"use client";

import { useState } from "react";
import { 
  FileText, DownloadCloud, Star, StarHalf, Eye, ChevronLeft, ChevronRight, Lock, BookOpen, 
  Target, Check, Send, User, CheckCircle, Headphones, Shield, Zap, Crown, ArrowRight, Package, 
  Plus, ShoppingCart, X
} from "lucide-react";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { LIBRARY_DOCS } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";

import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";

export default function DocumentDetailPage() {
  const [activeTab, setActiveTab] = useState("desc");
  const [previewPage, setPreviewPage] = useState(1);
  const [buyType, setBuyType] = useState("online");
  const { addToCart, cartItems } = useCart();
  const router = useRouter();

  // Mock document ID
  const mockId = "demo-doc-1";
  const isInCart = cartItems.includes(mockId);

  const handleAddToCart = () => {
    if (isInCart) {
      router.push('/cart');
    } else {
      // Map buyType to option
      addToCart(mockId, buyType === 'online' ? 'view_only' : 'download');
    }
  };

  // --- DEMO STATE CONTROLLER ---
  const [isAuth, setIsAuth] = useState(false);
  const [demoState, setDemoState] = useState("paid-none"); // paid-none, paid-online, paid-download, free

  // Derived flags for rendering based on demo state
  const isFree = demoState === "free";
  const isOwnedOnline = demoState === "paid-online";
  const isOwnedDownload = demoState === "paid-download";
  const isOwned = isOwnedOnline || isOwnedDownload;
  const isNotOwnedPaid = !isFree && !isOwned;

  const totalPreviewPages = 3;

  const handlePrevPage = () => setPreviewPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setPreviewPage(p => Math.min(totalPreviewPages, p + 1));

  // Handle Auth toggle logic
  const handleAuthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsAuth(checked);
    if (!checked && (demoState === "paid-online" || demoState === "paid-download")) {
      setDemoState("paid-none");
    }
  };

  const handleStateChange = (val: string) => {
    setDemoState(val);
    if ((val === "paid-online" || val === "paid-download") && !isAuth) {
      setIsAuth(true);
    }
  };

  return (
    <div className="relative pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {/* Breadcrumb */}
        <nav className="flex text-sm text-slate-500 dark:text-slate-400 mb-6 whitespace-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Link href="/" className="cursor-pointer hover:text-[#2563EB] transition flex-shrink-0">Trang chủ</Link>
          <span className="mx-2 flex-shrink-0">/</span>
          <Link href="/thu-vien" className="cursor-pointer hover:text-[#2563EB] transition flex-shrink-0">Toán học</Link>
          <span className="mx-2 flex-shrink-0">/</span>
          <Link href="/thu-vien" className="cursor-pointer hover:text-[#2563EB] transition flex-shrink-0">Đề thi</Link>
          <span className="mx-2 flex-shrink-0">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold truncate">Bộ 50 đề thi thử THPT QG Môn Toán 2026</span>
        </nav>

        {/* Khối Layout chính */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Cột trái: Nội dung tài liệu */}
          <div className="flex-1 w-full min-w-0">
            
            {/* Bìa và Thông tin cơ bản */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              {/* Ảnh bìa */}
              <div className="w-full sm:w-48 lg:w-56 flex-shrink-0">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-md relative border border-slate-100 dark:border-slate-800 bg-blue-50">
                  <img src="https://placehold.co/400x533/3B82F6/FFF?text=TOAN+12" alt="Bìa sách" className="w-full h-full object-cover" />
                </div>
              </div>
              
              {/* Thông tin */}
              <div className="flex flex-col flex-1 justify-center">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">Môn Toán</span>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">Đề thi</span>
                  
                  {isFree ? (
                    <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-green-200 dark:border-green-800">Miễn phí</span>
                  ) : (
                    <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800">Có phí</span>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
                  Bộ 50 đề thi thử THPT QG Môn Toán 2026 (Có đáp án chi tiết)
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> 250 trang</div>
                  <div className="flex items-center gap-1.5"><DownloadCloud className="w-4 h-4" /> 3.2K lượt tải</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#FACC15] flex"><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><StarHalf className="w-4 h-4 fill-current" /></span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">4.8</span> (120 đánh giá)
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <img src="https://placehold.co/40x40/94A3B8/FFF?text=GV" alt="Tác giả" className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="text-xs text-slate-500">Tác giả / Sưu tầm</div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Thầy Trọng Toán</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phần Xem trước (Preview) */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 sm:p-6 mb-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><Eye className="w-5 h-5 text-[#2563EB]" /> Xem trước tài liệu</h2>
                <div className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{previewPage} / 3</div>
              </div>

              {/* Container hiển thị ảnh */}
              <div className="relative w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden aspect-[1/1.4] sm:aspect-[1/1.2] flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <img 
                  src={`https://placehold.co/800x1131/F1F5F9/94A3B8?text=Trang+${previewPage}+%0A(Noi+dung+demo)`}
                  alt={`Trang ${previewPage}`} 
                  className="h-full w-auto object-contain transition-opacity duration-300" 
                />
                
                {/* Nút điều hướng */}
                <button 
                  onClick={handlePrevPage}
                  disabled={previewPage === 1}
                  className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 dark:bg-black/60 shadow text-slate-800 dark:text-white flex items-center justify-center hover:bg-white dark:hover:bg-black transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleNextPage}
                  disabled={previewPage === totalPreviewPages}
                  className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 dark:bg-black/60 shadow text-slate-800 dark:text-white flex items-center justify-center hover:bg-white dark:hover:bg-black transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Lớp mờ báo khóa */}
              <div className="mt-4 relative rounded-xl overflow-hidden h-32 border border-slate-200 dark:border-slate-700">
                <img src="https://placehold.co/800x200/F1F5F9/94A3B8?text=Trang+4..." alt="Blurred" className="w-full h-full object-cover blur-sm opacity-50" />
                <div className="absolute inset-0 bg-white/60 dark:bg-[#1E293B]/60 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                  
                  {isNotOwnedPaid ? (
                    <Link href="/premium" className="flex flex-col items-center hover:scale-105 transition-transform group cursor-pointer">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-2 group-hover:text-blue-600 transition-colors">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-600 transition-colors">Đã hết phần xem thử</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Vui lòng nâng cấp Premium hoặc mua tài liệu.</div>
                    </Link>
                  ) : (
                    <div className="flex flex-col items-center">
                      <button className="cursor-pointer h-11 px-6 bg-[#2563EB] text-white font-bold rounded-full hover:bg-blue-700 transition flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Đọc toàn bộ tài liệu
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Khu vực Tabs */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 sm:p-6 sm:px-8 border border-slate-100 dark:border-slate-800 shadow-sm">
              
              <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button onClick={() => setActiveTab('desc')} className={`cursor-pointer pb-3 font-bold whitespace-nowrap transition border-b-2 ${activeTab === 'desc' ? 'text-[#2563EB] border-[#2563EB]' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent'}`}>Mô tả chi tiết</button>
                <button onClick={() => setActiveTab('review')} className={`cursor-pointer pb-3 font-bold whitespace-nowrap transition border-b-2 ${activeTab === 'review' ? 'text-[#2563EB] border-[#2563EB]' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent'}`}>Đánh giá (120)</button>
                <button onClick={() => setActiveTab('comment')} className={`cursor-pointer pb-3 font-bold whitespace-nowrap transition border-b-2 ${activeTab === 'comment' ? 'text-[#2563EB] border-[#2563EB]' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent'}`}>Bình luận (45)</button>
              </div>

              {/* TAB 1: MÔ TẢ */}
              {activeTab === 'desc' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#2563EB]" /> Bạn sẽ học được gì?
                    </h3>
                    <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Nắm vững toàn bộ dạng bài tập Hàm số vận dụng cao.</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Kỹ năng giải nhanh trắc nghiệm bằng máy tính cầm tay.</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Luyện tập với 50 đề thi thử bám sát cấu trúc Bộ GD&ĐT.</li>
                      <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5" /> Có lời giải chi tiết từng bước cho câu khó điểm 8, 9, 10.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg mb-2 text-slate-800 dark:text-slate-100">Giới thiệu tài liệu</h3>
                    <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p>Tài liệu &quot;Bộ 50 đề thi thử THPT QG Môn Toán&quot; được biên soạn công phu nhằm giúp các em học sinh lớp 12 ôn tập và rèn luyện kỹ năng làm bài môn Toán một cách toàn diện nhất.</p>
                      <p>Mỗi đề thi bao gồm 50 câu hỏi trắc nghiệm, trải đều các mức độ từ nhận biết, thông hiểu đến vận dụng và vận dụng cao. Đặc biệt, phần lời giải chi tiết được trình bày rõ ràng, dễ hiểu, kèm theo các phương pháp giải tối ưu, mẹo giải nhanh giúp học sinh tiết kiệm thời gian làm bài trong phòng thi.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg mb-3 text-slate-800 dark:text-slate-100">Mục lục</h3>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <li className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800"><span>Phần 1: Khảo sát sự biến thiên và vẽ đồ thị hàm số</span> <span className="font-mono text-slate-400">Trang 5</span></li>
                      <li className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800"><span>Phần 2: Cực trị của hàm số - Dạng bài VDC</span> <span className="font-mono text-slate-400">Trang 45</span></li>
                      <li className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800"><span>Phần 3: Giá trị lớn nhất, nhỏ nhất của hàm số</span> <span className="font-mono text-slate-400">Trang 80</span></li>
                      <li className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800"><span>Phần 4: 50 Đề thi thử (Có đáp án chi tiết)</span> <span className="font-mono text-slate-400">Trang 110</span></li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: ĐÁNH GIÁ */}
              {activeTab === 'review' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row gap-6 mb-8 items-center sm:items-start p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                    <div className="flex flex-col items-center justify-center sm:pr-6 sm:border-r border-slate-200 dark:border-slate-700 min-w-[120px]">
                      <div className="text-4xl font-black text-slate-900 dark:text-white">4.8</div>
                      <div className="text-[#FACC15] flex text-sm my-1"><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><StarHalf className="w-4 h-4 fill-current"/></div>
                      <div className="text-xs text-slate-500">120 đánh giá</div>
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                      <div className="flex items-center text-xs text-slate-500 gap-2"><span className="w-2 font-bold">5</span> <Star className="w-3 h-3 text-[#FACC15] fill-current" /> <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="bg-[#FACC15] h-full" style={{width: '85%'}}></div></div> <span>102</span></div>
                      <div className="flex items-center text-xs text-slate-500 gap-2"><span className="w-2 font-bold">4</span> <Star className="w-3 h-3 text-[#FACC15] fill-current" /> <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="bg-[#FACC15] h-full" style={{width: '10%'}}></div></div> <span>12</span></div>
                      <div className="flex items-center text-xs text-slate-500 gap-2"><span className="w-2 font-bold">3</span> <Star className="w-3 h-3 text-slate-300 dark:text-slate-600 fill-current" /> <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="bg-[#FACC15] h-full" style={{width: '3%'}}></div></div> <span>4</span></div>
                      <div className="flex items-center text-xs text-slate-500 gap-2"><span className="w-2 font-bold">2</span> <Star className="w-3 h-3 text-slate-300 dark:text-slate-600 fill-current" /> <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="bg-[#FACC15] h-full" style={{width: '2%'}}></div></div> <span>2</span></div>
                      <div className="flex items-center text-xs text-slate-500 gap-2"><span className="w-2 font-bold">1</span> <Star className="w-3 h-3 text-slate-300 dark:text-slate-600 fill-current" /> <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="bg-[#FACC15] h-full" style={{width: '0%'}}></div></div> <span>0</span></div>
                    </div>
                  </div>

                  {isOwned && (
                    <div className="mb-6">
                      <button className="cursor-pointer h-11 px-6 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition w-full sm:w-auto">
                        Viết đánh giá của bạn
                      </button>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">L</div>
                          <div>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Lê Minh Q.</div>
                            <div className="text-xs text-slate-400">Đã mua · 2 ngày trước</div>
                          </div>
                        </div>
                        <div className="text-[#FACC15] text-xs flex"><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/></div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Tài liệu cực kỳ chi tiết, phần lời giải đọc rất cuốn và dễ hiểu. Rất đáng tiền để ôn luyện trong giai đoạn cuối này.</p>
                    </div>
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">T</div>
                          <div>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Trần Ngọc H.</div>
                            <div className="text-xs text-slate-400">Đã mua · 1 tuần trước</div>
                          </div>
                        </div>
                        <div className="text-[#FACC15] text-xs flex"><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 text-slate-300"/></div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Nội dung phong phú, tuy nhiên có một vài lỗi đánh máy nhỏ ở đề số 5. Mong tác giả khắc phục ở bản cập nhật sau.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BÌNH LUẬN */}
              {activeTab === 'comment' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex gap-3 mb-8">
                    {isAuth ? (
                      <img src="https://placehold.co/100x100/3B82F6/FFF?text=US" alt="Avatar" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"><User className="w-5 h-5"/></div>
                    )}
                    <div className="flex-1 relative">
                      <input type="text" placeholder="Hỏi đáp, thảo luận về tài liệu này..." className="w-full bg-slate-100 dark:bg-slate-800 border-none h-11 rounded-full pl-4 pr-12 text-sm focus:ring-2 focus:ring-[#2563EB] outline-none text-slate-800 dark:text-slate-200" />
                      <button className="cursor-pointer absolute right-1 top-1 bottom-1 w-9 h-9 bg-[#2563EB] text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">P</div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl rounded-tl-none">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Phạm Hùng</div>
                            <div className="text-[10px] text-slate-400">1 giờ trước</div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">Cho mình hỏi bản xem online thì xem trên web hay có app trên điện thoại không ạ?</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-11 text-xs text-slate-500 font-medium">
                        <button className="cursor-pointer hover:text-[#2563EB] transition">Trả lời</button>
                        <button className="cursor-pointer hover:text-red-500 transition">Báo cáo vi phạm</button>
                      </div>
                      
                      <div className="flex items-start gap-3 mt-3 ml-11">
                        <img src="https://placehold.co/40x40/94A3B8/FFF?text=AD" alt="Admin" className="w-7 h-7 rounded-full" />
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-sm text-[#2563EB] flex items-center gap-1">Admin ÔnThiPro <CheckCircle className="w-3 h-3" /></div>
                            <div className="text-[10px] text-slate-400">30 phút trước</div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">Chào bạn, bản xem online bạn có thể xem trực tiếp trên website bằng điện thoại hoặc máy tính rất mượt mà nhé. Nếu cần lưu về máy để in, bạn có thể chọn gói Tải về ạ.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <button className="cursor-pointer h-11 px-6 rounded-full border border-[#2563EB] text-[#2563EB] font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center gap-2 text-sm">
                      <Headphones className="w-4 h-4" /> Chat riêng với Admin về tài liệu này
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Khối mua hàng */}
          <div className="w-full lg:w-[360px] flex-shrink-0 relative">
            <div className="sticky top-20 flex flex-col gap-4">
              
              <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xl lg:shadow-md relative overflow-hidden">
                <h3 className="font-extrabold text-xl mb-4 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Tùy chọn sở hữu</h3>

                {/* State: CÓ PHÍ (CHƯA MUA) */}
                {isNotOwnedPaid && (
                  <div className="flex flex-col gap-4">
                    <div className="space-y-3">
                      {/* Option 1: Online */}
                      <label className="block relative cursor-pointer group">
                        <input type="radio" name="buy_type" value="online" checked={buyType === 'online'} onChange={() => setBuyType('online')} className="peer absolute opacity-0 w-0 h-0" />
                        <div className="flex items-center justify-between p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl transition hover:border-blue-300 dark:hover:border-blue-800 bg-white dark:bg-[#1E293B] peer-checked:border-[#2563EB] peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/10">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${buyType === 'online' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300 dark:border-slate-600'}`}>
                              <div className={`w-2 h-2 bg-white rounded-full ${buyType === 'online' ? 'block' : 'hidden'}`}></div>
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Chỉ xem Online</div>
                              <div className="text-[11px] text-slate-500">Xem vĩnh viễn trên website</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extrabold text-[#2563EB] text-base">49.000đ</div>
                          </div>
                        </div>
                      </label>

                      {/* Option 2: Download */}
                      <label className="block relative cursor-pointer group">
                        <input type="radio" name="buy_type" value="download" checked={buyType === 'download'} onChange={() => setBuyType('download')} className="peer absolute opacity-0 w-0 h-0" />
                        <div className="flex items-center justify-between p-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl transition hover:border-blue-300 dark:hover:border-blue-800 bg-white dark:bg-[#1E293B] peer-checked:border-[#2563EB] peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-[#FACC15] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">Khuyên dùng</div>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${buyType === 'download' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300 dark:border-slate-600'}`}>
                              <div className={`w-2 h-2 bg-white rounded-full ${buyType === 'download' ? 'block' : 'hidden'}`}></div>
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Xem & Tải File PDF</div>
                              <div className="text-[11px] text-slate-500">Được phép tải về để in ấn</div>
                            </div>
                          </div>
                          <div className="text-right mt-3 sm:mt-0">
                            <div className="font-extrabold text-[#2563EB] text-base">59.000đ</div>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="relative">
                      <Target className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Nhập mã giảm giá..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl pl-9 pr-20 text-sm focus:border-[#2563EB] outline-none text-slate-800 dark:text-slate-200 uppercase" />
                      <button className="cursor-pointer absolute right-1 top-1 bottom-1 px-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-300 transition">Áp dụng</button>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleAddToCart} className="cursor-pointer w-12 h-12 flex-shrink-0 rounded-2xl bg-orange-100 text-[#F97316] dark:bg-orange-900/40 dark:text-orange-400 flex items-center justify-center hover:bg-[#F97316] hover:text-white transition" title="Thêm vào giỏ">
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                      <button onClick={handleAddToCart} className="cursor-pointer flex-1 h-12 bg-[#2563EB] text-white font-extrabold text-sm rounded-2xl hover:bg-blue-700 transition flex flex-col items-center justify-center">
                        <span>{isInCart ? "Đi đến Giỏ hàng" : "MUA NGAY"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* State: ĐÃ MUA ONLINE */}
                {isOwnedOnline && (
                  <div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-800 mb-4 text-center">
                      <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl mx-auto mb-2"><Check className="w-6 h-6" /></div>
                      <div className="font-bold text-green-700 dark:text-green-400">Bạn đã sở hữu tài liệu này</div>
                      <div className="text-xs text-green-600/70 dark:text-green-500 mt-1">Phiên bản: Chỉ xem Online</div>
                    </div>
                    <button className="cursor-pointer w-full h-12 bg-[#2563EB] text-white font-extrabold text-sm rounded-2xl hover:bg-blue-700 transition flex items-center justify-center gap-2">
                      <BookOpen className="w-4 h-4" /> ĐỌC NGAY
                    </button>
                    <button className="cursor-pointer w-full mt-2 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2">
                      Nâng cấp bản Tải Về (10.000đ)
                    </button>
                  </div>
                )}

                {/* State: ĐÃ MUA TẢI VỀ */}
                {isOwnedDownload && (
                  <div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-800 mb-4 text-center">
                      <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl mx-auto mb-2">
                        <div className="flex"><Check className="w-5 h-5 -mr-1" /><Check className="w-5 h-5" /></div>
                      </div>
                      <div className="font-bold text-green-700 dark:text-green-400">Bạn đã sở hữu tài liệu này</div>
                      <div className="text-xs text-green-600/70 dark:text-green-500 mt-1">Phiên bản: Xem Online & Tải PDF</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="cursor-pointer flex-1 h-12 bg-[#2563EB] text-white font-extrabold text-sm rounded-2xl hover:bg-blue-700 transition flex items-center justify-center gap-2">
                        <BookOpen className="w-4 h-4" /> ĐỌC NGAY
                      </button>
                      <button className="cursor-pointer flex-1 h-12 bg-slate-800 dark:bg-slate-700 text-white font-extrabold text-sm rounded-2xl hover:bg-slate-700 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2">
                        <DownloadCloud className="w-4 h-4" /> TẢI PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* State: MIỄN PHÍ */}
                {isFree && (
                  <div className="flex flex-col gap-4">
                    <div className="text-center py-4">
                      <div className="text-green-500 font-black text-2xl">0đ</div>
                      <div className="text-sm text-slate-500 font-medium">Tài liệu chia sẻ miễn phí</div>
                    </div>
                    {isAuth ? (
                      <button className="cursor-pointer w-full h-12 bg-[#2563EB] text-white font-extrabold text-sm rounded-2xl hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none">
                        <BookOpen className="w-4 h-4" /> XEM MIỄN PHÍ
                      </button>
                    ) : (
                      <div>
                        <button className="cursor-pointer w-full h-12 border-2 border-[#2563EB] text-[#2563EB] font-extrabold text-sm rounded-2xl hover:bg-[#2563EB] hover:text-white transition flex flex-col items-center justify-center leading-tight py-1">
                          <span>Đăng nhập để xem</span>
                        </button>
                        <p className="text-center text-[11px] text-slate-500 mt-2">Vui lòng đăng ký/đăng nhập tài khoản để đọc tài liệu miễn phí này.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Thông tin cam kết */}
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> Thanh toán an toàn</span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#F97316]" /> Mở khóa tức thì</span>
                </div>
              </div>

              {/* Upsell Premium Block */}
              {isNotOwnedPaid && (
                <Link href="/premium" className="block bg-gradient-to-r from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 p-4 rounded-3xl text-white shadow-lg relative overflow-hidden group cursor-pointer transition hover:scale-[1.02]">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#FACC15] opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition"></div>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FACC15] to-[#F97316] flex items-center justify-center text-slate-900 flex-shrink-0 text-xl font-bold shadow-sm">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#FACC15] mb-1 drop-shadow-sm text-sm">Gói Premium <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ml-1">Hot</span></h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">Chỉ <span className="text-white font-bold text-sm">59.000đ/30 ngày</span>: Xem mọi tài liệu có phí & Tải 5 tài liệu bạn chọn.</p>
                      <div className="mt-2 text-xs font-bold text-[#FACC15] group-hover:underline flex items-center gap-1">Tìm hiểu thêm <ArrowRight className="w-3 h-3" /></div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Khu vực Combo Tiết Kiệm (Ẩn nếu Free) */}
        {!isFree && (
          <section className="mt-16">
            <h3 className="text-xl md:text-2xl font-extrabold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
              <Package className="w-6 h-6 text-[#F97316]" /> Mua Combo Tiết Kiệm Hơn
            </h3>
            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 md:p-6 rounded-3xl border border-orange-200 dark:border-orange-900/50">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden shadow">
                  <img src="https://placehold.co/200x266/3B82F6/FFF?text=TOAN+1" className="w-full h-full object-cover" alt="Sách 1" />
                </div>
                <Plus className="w-5 h-5 text-slate-400" />
                <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden shadow relative group cursor-pointer">
                  <img src="https://placehold.co/200x266/3B82F6/FFF?text=TOAN+2" className="w-full h-full object-cover" alt="Sách 2" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-1 opacity-0 group-hover:opacity-100 transition">Đề thi số phức</div>
                </div>
                <Plus className="w-5 h-5 text-slate-400" />
                <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden shadow relative group cursor-pointer">
                  <img src="https://placehold.co/200x266/3B82F6/FFF?text=TOAN+3" className="w-full h-full object-cover" alt="Sách 3" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-1 opacity-0 group-hover:opacity-100 transition">Hình học Oxyz</div>
                </div>
                
                <div className="mx-auto md:mx-6 w-full h-[1px] md:w-[1px] md:h-24 bg-orange-200 dark:bg-orange-800"></div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="text-sm text-slate-500 mb-1">Combo 3 chuyên đề Toán VDC</div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    <span className="font-black text-[#F97316] text-2xl">129.000đ</span>
                    <span className="text-sm text-slate-400 line-through">177.000đ</span>
                  </div>
                  <button className="cursor-pointer h-11 px-8 bg-[#F97316] text-white font-bold rounded-full hover:bg-orange-600 transition shadow-lg shadow-orange-200 dark:shadow-none w-full md:w-auto">
                    Thêm Combo Vào Giỏ
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tài liệu liên quan */}
        <section className="mt-16 pb-12">
          <h3 className="text-xl md:text-2xl font-extrabold mb-6 text-slate-800 dark:text-white">Tài liệu Liên Quan</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {LIBRARY_DOCS.slice(0, 4).map(doc => (
              <DocumentCard key={doc.id} {...doc} variant="library" />
            ))}
          </div>
        </section>
      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 flex items-center gap-3">
        <div className="flex-1">
          {isNotOwnedPaid && (
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Giá từ</div>
              <div className="font-extrabold text-[#2563EB] text-lg leading-none">49.000đ</div>
            </div>
          )}
          {isOwned && (
            <div>
              <div className="text-[10px] text-green-500 font-bold uppercase">Đã mua</div>
              <div className="font-extrabold text-green-600 text-sm leading-tight line-clamp-1">{isOwnedOnline ? 'Xem Online' : 'Xem & Tải'}</div>
            </div>
          )}
          {isFree && (
            <div>
              <div className="font-extrabold text-green-500 text-xl leading-none">0đ</div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isNotOwnedPaid && (
            <>
              <button onClick={handleAddToCart} className="cursor-pointer w-11 h-11 flex-shrink-0 rounded-xl bg-orange-100 text-[#F97316] dark:bg-orange-900/40 dark:text-orange-400 flex items-center justify-center hover:bg-[#F97316] hover:text-white transition">
                <ShoppingCart className="w-5 h-5" />
              </button>
              <button onClick={handleAddToCart} className="cursor-pointer h-11 px-6 bg-[#2563EB] text-white font-extrabold text-sm rounded-xl hover:bg-blue-700 transition">
                {isInCart ? "Giỏ hàng" : "MUA NGAY"}
              </button>
            </>
          )}
          
          {isOwned && (
            <button className="cursor-pointer h-11 px-6 bg-[#2563EB] text-white font-extrabold text-sm rounded-xl hover:bg-blue-700 transition flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> ĐỌC NGAY
            </button>
          )}

          {isFree && (
            isAuth ? (
              <button className="cursor-pointer h-11 px-6 bg-[#2563EB] text-white font-extrabold text-sm rounded-xl hover:bg-blue-700 transition flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> XEM MIỄN PHÍ
              </button>
            ) : (
              <button className="cursor-pointer h-11 px-6 border-2 border-[#2563EB] text-[#2563EB] font-extrabold text-sm rounded-xl">
                ĐĂNG NHẬP
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
