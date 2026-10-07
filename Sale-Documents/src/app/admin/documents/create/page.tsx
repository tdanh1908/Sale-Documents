"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateDocumentPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Toán");
  const [docType, setDocType] = useState("Lý thuyết");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  
  // Pricing State
  const [priceType, setPriceType] = useState("paid");
  const [pages, setPages] = useState(100);
  const [unitPrice, setUnitPrice] = useState(200);

  // Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Derived state
  const viewPrice = pages * unitPrice;
  const dlPrice = Math.round(viewPrice * 1.2);

  const handleSubmit = () => {
    // Simulate API call
    setIsSuccessModalOpen(true);
  };

  const handleReset = () => {
    setName("");
    setSubject("Toán");
    setDocType("Lý thuyết");
    setGrade("");
    setDescription("");
    setPriceType("paid");
    setPages(100);
    setUnitPrice(200);
    setIsSuccessModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/documents" className="w-11 h-11 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#2563EB] transition flex items-center justify-center shadow-sm" title="Quay lại">
            <i className="fa-solid fa-arrow-left"></i>
          </Link>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">Thêm tài liệu mới</h1>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 sm:flex-none h-11 px-6 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm">
            Lưu nháp
          </button>
          <button onClick={handleSubmit} className="flex-1 sm:flex-none h-11 px-8 bg-[#2563EB] text-white rounded-xl text-sm font-bold hover:bg-[#1D4ED8] transition shadow-md shadow-blue-200 dark:shadow-none">
            Đăng ngay
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start pb-10">
        {/* Left Column: Form */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Upload Section */}
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-extrabold text-lg mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">File tài liệu (Bắt buộc)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Đầy Đủ */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">File Đầy Đủ (Riêng tư - Cấp khi mua)</label>
                <div className="dropzone rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 dark:bg-[#0F172A]/50 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[160px] border-2 border-dashed border-slate-300 dark:border-slate-600 transition">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-[#2563EB] rounded-full flex items-center justify-center text-2xl mb-3"><i className="fa-solid fa-file-pdf"></i></div>
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">Kéo thả file PDF vào đây</p>
                  <p className="text-xs text-slate-500">Hoặc click để chọn file. Tối đa 50MB.</p>
                </div>
              </div>
              {/* File Demo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">File Demo (Công khai - Xem trước)</label>
                <div className="dropzone rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 dark:bg-[#0F172A]/50 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[160px] border-2 border-dashed border-slate-300 dark:border-slate-600 transition">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-[#F97316] rounded-full flex items-center justify-center text-2xl mb-3"><i className="fa-solid fa-file-pdf"></i></div>
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">Kéo thả file Demo vào đây</p>
                  <p className="text-[10px] text-orange-500 font-bold mt-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">Chỉ nên có 3 trang. Hệ thống cảnh báo nếu quá dài.</p>
                  <p className="text-[10px] text-[#2563EB] font-bold mt-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">Tự trích xuất trang 1 làm Ảnh Bìa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <h3 className="font-extrabold text-lg mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">Thông tin cơ bản</h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tên tài liệu</label>
              <input 
                type="text" 
                placeholder="Ví dụ: Chuyên đề Hàm số 12..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2563EB] transition text-slate-800 dark:text-slate-100" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Môn học</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-[#2563EB] transition cursor-pointer text-slate-800 dark:text-slate-100"
                >
                  <option value="Toán">Toán học</option>
                  <option value="Lý">Vật lý</option>
                  <option value="Hóa">Hóa học</option>
                  <option value="Sinh">Sinh học</option>
                  <option value="Văn">Ngữ Văn</option>
                  <option value="Anh">Tiếng Anh</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Loại tài liệu</label>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-[#2563EB] transition cursor-pointer text-slate-800 dark:text-slate-100"
                >
                  <option>Lý thuyết</option>
                  <option>Bài tập</option>
                  <option>Đề thi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Khối liên quan</label>
                <div className="h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center text-sm text-slate-500 cursor-pointer">
                  Chọn khối (A00, A01...)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mô tả (Bạn sẽ học được gì, mục lục...)</label>
              <textarea 
                rows={4} 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2563EB] transition resize-none text-slate-800 dark:text-slate-100"
              ></textarea>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <h3 className="font-extrabold text-lg mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">Định giá</h3>
            
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer h-11">
                <input 
                  type="radio" 
                  name="priceType" 
                  value="free" 
                  checked={priceType === "free"}
                  onChange={() => setPriceType("free")}
                  className="w-5 h-5 accent-[#2563EB]" 
                />
                <span className="font-bold text-sm">Miễn phí</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer h-11">
                <input 
                  type="radio" 
                  name="priceType" 
                  value="paid" 
                  checked={priceType === "paid"}
                  onChange={() => setPriceType("paid")}
                  className="w-5 h-5 accent-[#2563EB]" 
                />
                <span className="font-bold text-sm">Có phí</span>
              </label>
            </div>

            {priceType === "paid" && (
              <div className="bg-slate-50 dark:bg-[#0F172A]/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 transition-opacity">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Số trang PDF (Tự trích xuất)</label>
                    <input 
                      type="number" 
                      value={pages}
                      onChange={(e) => setPages(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Đơn giá / 1 Trang (VNĐ)</label>
                    <input 
                      type="number" 
                      value={unitPrice}
                      step="50"
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full h-11 px-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2563EB] text-slate-800 dark:text-slate-100" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm relative">
                    <div className="absolute -top-2.5 left-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">Giá Xem Online (Gợi ý)</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">= Số trang × Đơn giá</span>
                      <input type="text" readOnly value={viewPrice.toLocaleString('vi-VN') + "đ"} className="w-24 text-right font-black text-[#2563EB] bg-transparent border-b border-slate-200 dark:border-slate-700 outline-none" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm relative">
                    <div className="absolute -top-2.5 left-3 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800">Giá Tải PDF (Gợi ý)</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">= Giá xem × 1.2</span>
                      <input type="text" readOnly value={dlPrice.toLocaleString('vi-VN') + "đ"} className="w-24 text-right font-black text-[#F97316] bg-transparent border-b border-slate-200 dark:border-slate-700 outline-none" />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-3 text-center">Bạn có thể sửa tay lại giá cuối cùng nếu muốn làm tròn.</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Preview */}
        <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 lg:sticky lg:top-24">
          <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider mb-4">Xem trước thẻ hiển thị</h3>
          
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col h-[420px]">
            <div className="relative aspect-[3/4] w-full overflow-hidden flex-shrink-0 bg-blue-50 rounded-xl mb-3 flex items-center justify-center">
              <div className="text-slate-400 text-sm font-medium flex flex-col items-center gap-2">
                <i className="fa-regular fa-image text-3xl"></i>
                <span>Ảnh tự sinh từ File</span>
              </div>
              {priceType === "free" && (
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">Miễn phí</span>
                </div>
              )}
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md mb-2 w-max border border-blue-100 dark:border-blue-800">
                {subject}
              </span>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug mb-2">
                {name || "Tên tài liệu sẽ hiện ở đây..."}
              </h3>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-3 mb-3">
                <span><i className="fa-regular fa-file-pdf"></i> <span>{pages}</span> trang</span>
              </div>
              
              <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                {priceType === "paid" ? (
                  <div>
                    <div className="text-[10px] text-slate-500">Từ</div>
                    <div className="font-extrabold text-[#2563EB] text-xl">{viewPrice.toLocaleString('vi-VN')}đ</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-extrabold text-green-500 text-xl">0đ</div>
                  </div>
                )}
                <button className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center opacity-50 cursor-not-allowed">
                  <i className="fa-solid fa-cart-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-[#1E293B] w-[90%] max-w-sm rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 text-green-500 rounded-full flex items-center justify-center text-3xl mb-4">
              <i className="fa-solid fa-check"></i>
            </div>
            <h3 className="text-xl font-extrabold text-center mb-2">Thêm tài liệu thành công!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
              Tài liệu <strong>{name || "Mới"}</strong> đã được đưa lên hệ thống.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button onClick={() => router.push('/admin/documents')} className="h-11 rounded-xl font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition w-full">
                Quay lại danh sách
              </button>
              <button onClick={handleReset} className="h-11 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition w-full">
                Thêm tài liệu khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
