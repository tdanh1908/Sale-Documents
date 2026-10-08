"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Maximize, Minimize } from "lucide-react";

export default function ReadDocumentPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient());
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
        router.push('/doc/' + id);
        return;
      }

      if (!data.is_free) {
        // Not a free document, kick back to detail page
        router.push('/doc/' + id);
        return;
      }

      setDocument(data);

      if (data.full_file_path) {
        const { data: urlData, error: urlError } = await supabase
          .storage
          .from('documents')
          .createSignedUrl(data.full_file_path, 3600);
        
        if (!urlError && urlData?.signedUrl) {
          setPdfUrl(urlData.signedUrl);
        }
      }

      setLoading(false);
    };

    fetchDocument();
  }, [id, supabase, router]);

  const handleDownload = async () => {
    if (!document?.full_file_path) {
      alert("Không tìm thấy file tải về!");
      return;
    }

    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const { data, error } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(document.full_file_path, 60);

      if (error || !data?.signedUrl) {
        throw new Error("Không thể tạo link tải về.");
      }

      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error("Không tải được file.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = (document.title || 'Tai-lieu') + '.pdf';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi tải file:", err);
      alert("Có lỗi xảy ra khi tải file!");
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (window.document.exitFullscreen) {
        window.document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement);
    };
    window.document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => window.document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-[#2563EB]"></i>
          <p className="font-bold">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="h-14 lg:h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 md:px-4 flex-shrink-0 z-40 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 truncate pr-2">
              {document.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={toggleFullscreen}
            className="hidden md:flex w-10 h-10 md:w-11 md:h-11 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 items-center justify-center transition"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button 
            onClick={handleDownload}
            className="h-9 md:h-10 px-4 md:px-5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition shadow-md flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Tải xuống</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative bg-slate-200 dark:bg-slate-900 flex items-center justify-center">
        {pdfUrl ? (
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
            className="w-full h-full border-none"
            title={document.title}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <i className="fa-regular fa-file-pdf text-5xl mb-3 opacity-50"></i>
            <p className="font-bold text-sm">Không tìm thấy file để đọc.</p>
          </div>
        )}
      </main>
    </div>
  );
}
