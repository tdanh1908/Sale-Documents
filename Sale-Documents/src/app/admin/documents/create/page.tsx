"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import * as pdfjsLib from "pdfjs-dist";

export default function CreateDocumentPage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient());

  useEffect(() => {
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
  }, []);

  // Form State
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("Toán");
  const [docType, setDocType] = useState("Lý thuyết");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  
  // Pricing State
  const [priceType, setPriceType] = useState("paid");
  const [pages, setPages] = useState(100);
  const [unitPrice, setUnitPrice] = useState(200);

  // File Upload State
  const [fullFile, setFullFile] = useState<File | null>(null);
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Derived state
  const viewPrice = pages * unitPrice;
  const dlPrice = Math.round(viewPrice * 1.2);

  const sanitizeFilename = (name: string) => {
    const noTones = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return noTones.replace(/[^a-zA-Z0-9.\-]/g, "-").replace(/-+/g, "-");
  };

  const generatePdfCover = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      const scale = 1.5; 
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCoverImage(dataUrl);
    } catch (error) {
      console.error("Error generating PDF cover:", error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên tài liệu!");
      return;
    }
    if (!fullFile) {
      alert("Vui lòng chọn File đầy đủ!");
      return;
    }
    if (!demoFile) {
      alert("Vui lòng chọn File demo!");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload File Đầy Đủ vào bucket 'documents' (Private)
      const fullPath = `docs/${Date.now()}_${sanitizeFilename(fullFile.name)}`;
      const { error: fullUploadError } = await supabase.storage
        .from("documents")
        .upload(fullPath, fullFile, { cacheControl: "3600", upsert: false });

      if (fullUploadError) throw new Error("Lỗi upload file đầy đủ: " + fullUploadError.message);

      // 2. Upload File Demo vào bucket 'previews' (Public)
      const demoPath = `demos/${Date.now()}_${sanitizeFilename(demoFile.name)}`;
      const { error: demoUploadError } = await supabase.storage
        .from("previews")
        .upload(demoPath, demoFile, { cacheControl: "3600", upsert: false });

      if (demoUploadError) throw new Error("Lỗi upload file demo: " + demoUploadError.message);

      // Lấy Public URL cho file demo
      const { data: { publicUrl: demoUrl } } = supabase.storage
        .from("previews")
        .getPublicUrl(demoPath);

      // Chuyển đổi dữ liệu Form sang ENUM của Database
      const subjectMap: Record<string, string> = {
        "Toán": "toan", "Lý": "ly", "Hóa": "hoa", 
        "Sinh": "sinh", "Văn": "van", "Anh": "anh"
      };
      const docTypeMap: Record<string, string> = {
        "Lý thuyết": "ly_thuyet", 
        "Bài tập": "bai_tap", 
        "Đề thi": "de_thi"
      };

      // Tạo slug hợp lệ (vd: "chuyen-de-toan-123456")
      const slug = sanitizeFilename(name).toLowerCase() + '-' + Date.now().toString().slice(-6);

      // 3. Chuẩn hóa dữ liệu đầu vào (Sanitize Payload)
      const isFree = priceType === "free";
      const sanitizedPageCount = Math.max(1, Number(pages) || 1);
      const sanitizedUnitPrice = isFree ? 0 : Math.max(0, Number(unitPrice) || 0);
      const sanitizedViewPrice = isFree ? 0 : Math.max(0, Number(viewPrice) || 0);
      const sanitizedDlPrice = isFree ? 0 : Math.max(0, Number(dlPrice) || 0);

      const payload = {
        slug: slug,
        title: name.trim(),
        subject: subjectMap[subject] || "toan",
        doc_type: docTypeMap[docType] || "ly_thuyet",
        category: grade ? grade.trim() : '12', 
        description: description ? description.trim() : null,
        author: author ? author.trim() : null,
        tags: tags.length > 0 ? tags : null,
        detailed_description: detailedDescription ? detailedDescription.trim() : null,
        is_free: isFree,
        page_count: sanitizedPageCount,           
        price_per_page: sanitizedUnitPrice,   
        view_price: sanitizedViewPrice,       
        download_price: sanitizedDlPrice,     
        full_file_path: fullPath,    
        demo_file_url: demoUrl,      
        cover_path: coverImage ? demoPath : null, 
        status: 'published'          
      };

      console.log("🚀 Payload Insert Documents:", payload);

      // Insert dữ liệu vào bảng public.documents
      const { data: newDoc, error: dbError } = await supabase.from("documents").insert(payload).select("id").single();

      if (dbError) throw new Error("Lỗi lưu dữ liệu bảng documents: " + dbError.message);

      // 4. Insert thông tin file vào bảng public.document_files (chuẩn kiến trúc)
      if (newDoc && newDoc.id) {
        const fileInserts = [
          {
            document_id: newDoc.id,
            kind: 'full',
            bucket: 'documents',
            storage_path: fullPath,
            file_size: fullFile.size,
            page_count: pages,
            is_current: true
          },
          {
            document_id: newDoc.id,
            kind: 'demo',
            bucket: 'previews',
            storage_path: demoPath,
            file_size: demoFile.size,
            page_count: 3, // Bắt buộc là 3 theo constraint
            is_current: true
          }
        ];
        
        const { error: filesError } = await supabase.from("document_files").insert(fileInserts);
        if (filesError) {
          console.error("Cảnh báo lưu document_files:", filesError.message);
          // Không throw error ở đây để người dùng vẫn thấy thành công nếu bản record chính đã lưu
        }
      }

      // 5. Refresh router để Next.js clear cache, hiển thị tài liệu mới ngay
      router.refresh();

      // 5. Hiển thị thông báo thành công
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setSubject("Toán");
    setDocType("Lý thuyết");
    setGrade("");
    setDescription("");
    setAuthor("");
    setTags([]);
    setDetailedDescription("");
    setPriceType("paid");
    setPages(100);
    setUnitPrice(200);
    setFullFile(null);
    setDemoFile(null);
    setCoverImage(null);
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
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="flex-1 sm:flex-none h-11 px-8 bg-[#2563EB] text-white rounded-xl text-sm font-bold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
            ) : (
              "Đăng ngay"
            )}
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
                <label className={`dropzone rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] border-2 border-dashed transition ${fullFile ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700' : 'bg-slate-50 dark:bg-[#0F172A]/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFullFile(e.target.files[0]);
                      }
                    }} 
                  />
                  {fullFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-[#2563EB] rounded-full flex items-center justify-center text-2xl mb-2"><i className="fa-solid fa-check"></i></div>
                      <p className="font-bold text-sm text-[#2563EB] dark:text-blue-400 mb-1 max-w-[200px] truncate">{fullFile.name}</p>
                      <p className="text-xs text-slate-500 mb-3">{(fullFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setFullFile(null);
                        }}
                        className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-200 transition flex items-center gap-1"
                      >
                        <i className="fa-solid fa-xmark"></i> Gỡ file
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-[#2563EB] rounded-full flex items-center justify-center text-2xl mb-3"><i className="fa-solid fa-file-pdf"></i></div>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">Click chọn file PDF đầy đủ</p>
                      <p className="text-xs text-slate-500">Tối đa 50MB.</p>
                    </>
                  )}
                </label>
              </div>

              {/* File Demo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">File Demo (Công khai - Xem trước)</label>
                <label className={`dropzone rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] border-2 border-dashed transition ${demoFile ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700' : 'bg-slate-50 dark:bg-[#0F172A]/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        setDemoFile(file);
                        generatePdfCover(file);
                      }
                    }} 
                  />
                  {demoFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-[#F97316] rounded-full flex items-center justify-center text-2xl mb-2"><i className="fa-solid fa-check"></i></div>
                      <p className="font-bold text-sm text-[#F97316] dark:text-orange-400 mb-1 max-w-[200px] truncate">{demoFile.name}</p>
                      <p className="text-xs text-slate-500 mb-3">{(demoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setDemoFile(null);
                          setCoverImage(null);
                        }}
                        className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-200 transition flex items-center gap-1"
                      >
                        <i className="fa-solid fa-xmark"></i> Gỡ file
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-[#F97316] rounded-full flex items-center justify-center text-2xl mb-3"><i className="fa-solid fa-file-pdf"></i></div>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">Click chọn file PDF Demo</p>
                      <p className="text-[10px] text-orange-500 font-bold mt-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">Chỉ nên có 3 trang.</p>
                      <p className="text-[10px] text-[#2563EB] font-bold mt-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">Tự trích xuất trang 1 làm Ảnh Bìa</p>
                    </>
                  )}
                </label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tên tác giả</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Nguyễn Văn A..." 
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2563EB] transition text-slate-800 dark:text-slate-100" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tags (Nhấn Enter để thêm)</label>
                <div className="w-full min-h-[44px] px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-wrap gap-1 items-center focus-within:border-[#2563EB] transition">
                  {tags.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1 bg-[#2563EB]/10 text-[#2563EB] px-2 py-1 rounded-md text-xs font-bold">
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== index))} className="hover:text-red-500">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                          setTags([...tags, tagInput.trim()]);
                          setTagInput("");
                        }
                      }
                    }}
                    placeholder="Thêm tag..." 
                    className="flex-1 min-w-[80px] h-8 bg-transparent outline-none text-sm px-2 text-slate-800 dark:text-slate-100 placeholder-slate-400" 
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {["Toán", "Vật Lý", "Hóa Học", "Sinh Học", "Ngữ Văn", "Lý thuyết", "Bài tập", "Đề thi"].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!tags.includes(tag)) {
                          setTags([...tags, tag]);
                        }
                      }}
                      className={`px-2 py-1 text-xs font-bold rounded-lg border transition ${tags.includes(tag) ? 'bg-[#2563EB]/10 border-[#2563EB]/30 text-[#2563EB]' : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
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
                  <option value="Lý thuyết">Lý thuyết</option>
                  <option value="Bài tập">Bài tập</option>
                  <option value="Đề thi">Đề thi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Khối liên quan</label>
                <input 
                  type="text"
                  placeholder="VD: Khối 12"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2563EB] transition text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mô tả ngắn</label>
              <textarea 
                rows={3} 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tóm tắt nội dung tài liệu..."
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2563EB] transition resize-none text-slate-800 dark:text-slate-100"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mô tả chi tiết</label>
              <textarea 
                rows={8} 
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                placeholder="Mục lục, chi tiết từng phần (Hỗ trợ Markdown)..."
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2563EB] transition resize-y text-slate-800 dark:text-slate-100"
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
                      className="w-full h-11 px-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#2563EB]" 
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
            <div className="relative aspect-[3/4] w-full overflow-hidden flex-shrink-0 bg-blue-50 rounded-xl mb-3 flex items-center justify-center border border-blue-100 dark:border-slate-700">
              {coverImage ? (
                <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 text-sm font-medium flex flex-col items-center gap-2">
                  <i className="fa-regular fa-image text-3xl"></i>
                  <span>Ảnh tự sinh từ File</span>
                </div>
              )}
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
              <button onClick={handleReset} className="h-11 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition w-full border border-slate-200 dark:border-slate-700">
                Thêm tài liệu khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
