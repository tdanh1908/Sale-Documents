"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Maximize, Minimize, Menu } from "lucide-react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

  // E-reader state
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pageInput, setPageInput] = useState("1");

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

  // Set up IntersectionObserver for Continuous Scrolling
  useEffect(() => {
    if (!numPages) return;
    
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pageNum = parseInt(entry.target.id.replace('page-', ''), 10);
              if (!isNaN(pageNum)) {
                setPageNumber((prev) => {
                  if (prev !== pageNum) {
                    setPageInput(pageNum.toString());
                    return pageNum;
                  }
                  return prev;
                });
              }
            }
          });
        },
        {
          root: window.document.getElementById('pdf-scroll-container'),
          rootMargin: '0px',
          threshold: 0.5,
        }
      );

      const pageElements = window.document.querySelectorAll('.pdf-page-anchor');
      pageElements.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, 500);

    return () => clearTimeout(timer);
  }, [numPages]);

  const scrollToPage = (pageNum: number) => {
    setPageNumber(pageNum);
    setPageInput(pageNum.toString());
    const target = window.document.getElementById(`page-${pageNum}`);
    if (target) {
       target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setPageInput("1");
  }

  const handlePageInputSubmit = (e: React.FormEvent | React.FocusEvent) => {
    e.preventDefault();
    const val = parseInt(pageInput);
    if (val >= 1 && val <= (numPages || 1)) {
      scrollToPage(val);
    } else {
      setPageInput(pageNumber.toString());
    }
  };

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
        
        {/* Left */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition flex-shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition flex-shrink-0"
            title="Mở Sidebar Thumbnail"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h1 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 truncate pr-2 hidden md:block max-w-[200px] lg:max-w-md">
            {document.title}
          </h1>
        </div>

        {/* Center: Page Controls */}
        <div className="flex items-center justify-center gap-2 flex-shrink-0">
          <form onSubmit={handlePageInputSubmit} className="flex items-center">
            <input 
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputSubmit}
              min={1}
              max={numPages || 1}
              className="w-12 h-8 text-center bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </form>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            / {numPages || '--'}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-2 flex-1">
          <button 
            onClick={toggleFullscreen}
            className="hidden md:flex w-10 h-10 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 items-center justify-center transition"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className={`h-9 md:h-10 px-4 md:px-5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition shadow-md flex items-center justify-center gap-2 text-sm ${isDownloading ? 'opacity-70' : ''}`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isDownloading ? 'Đang tải...' : 'Tải xuống'}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden relative flex bg-slate-200 dark:bg-slate-900">
        {pdfUrl ? (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex w-full h-full"
            loading={
              <div className="flex flex-col items-center justify-center w-full h-full text-slate-500">
                <i className="fa-solid fa-spinner fa-spin text-3xl mb-3 text-blue-500"></i>
                <p className="font-bold">Đang tải PDF...</p>
              </div>
            }
          >
            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
              <div 
                className="absolute inset-0 bg-black/50 z-10 md:hidden" 
                onClick={() => setIsSidebarOpen(false)}
              ></div>
            )}

            {/* Sidebar Thumbnails */}
            <div className={`absolute md:relative top-0 left-0 h-full w-48 lg:w-56 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 overflow-y-auto z-20 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>
              <div className="p-4 flex flex-col gap-4">
                {numPages && Array.from(new Array(numPages), (el, index) => (
                  <div 
                    key={`sidebar_page_${index + 1}`}
                    onClick={() => {
                      scrollToPage(index + 1);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`cursor-pointer rounded overflow-hidden flex flex-col justify-center items-center p-1 transition ${pageNumber === index + 1 ? 'bg-blue-500/20 ring-2 ring-blue-500' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    <div className="bg-white pointer-events-none w-full flex justify-center">
                       <Page 
                         pageNumber={index + 1} 
                         width={140} 
                         renderTextLayer={false} 
                         renderAnnotationLayer={false}
                       />
                    </div>
                    <span className="text-xs font-bold mt-2 text-slate-500 dark:text-slate-400">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Viewer - Continuous Scrolling */}
            <div 
              id="pdf-scroll-container"
              className="flex-1 h-full overflow-y-auto flex flex-col items-center gap-8 bg-slate-200 dark:bg-slate-900 p-4 md:p-8 pb-20 scroll-smooth"
            >
               {numPages && Array.from(new Array(numPages), (el, index) => (
                  <div 
                    key={`main_page_${index + 1}`}
                    id={`page-${index + 1}`}
                    className="pdf-page-anchor w-full flex justify-center"
                  >
                     <Page 
                       pageNumber={index + 1} 
                       className="shadow-2xl bg-white max-w-full"
                       renderTextLayer={true}
                       renderAnnotationLayer={true}
                       width={Math.min(window.innerWidth - (isSidebarOpen && window.innerWidth >= 768 ? 250 : 40), 900)}
                     />
                  </div>
               ))}
            </div>
          </Document>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-slate-400">
            <i className="fa-regular fa-file-pdf text-5xl mb-3 opacity-50"></i>
            <p className="font-bold text-sm">Không tìm thấy file để đọc.</p>
          </div>
        )}
      </main>
    </div>
  );
}
