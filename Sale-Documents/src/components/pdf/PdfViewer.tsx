'use client';
import { useEffect, useRef, useState } from 'react';

interface PdfViewerProps {
  documentId: string;
  demoUrl?: string; // URL công khai của bản demo
  hasPremiumOrPurchased: boolean;
}

export default function PdfViewer({ documentId, demoUrl, hasPremiumOrPurchased }: PdfViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(demoUrl || null);
  const [loading, setLoading] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Chống click chuột phải, bôi đen, copy
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();

    const currentRef = viewerRef.current;
    if (currentRef) {
      currentRef.addEventListener('contextmenu', handleContextMenu);
      currentRef.addEventListener('copy', handleCopy);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('contextmenu', handleContextMenu);
        currentRef.removeEventListener('copy', handleCopy);
      }
    };
  }, []);

  const loadFullPdf = async () => {
    setLoading(true);
    try {
      // Giả lập lấy session data
      const res = await fetch(`/api/documents/${documentId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view', userId: 'mock-uuid', cycleStart: new Date().toISOString() })
      });
      if (res.ok) {
        const data = await res.json();
        setSignedUrl(data.signedUrl);
      } else {
        alert("Bạn không có quyền xem bản đầy đủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 p-4 rounded-lg shadow-inner">
      {/* Khối bảo mật trình xem */}
      <div 
        ref={viewerRef} 
        className="w-full max-w-4xl h-[600px] border bg-white rounded shadow-md relative overflow-hidden select-none"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {signedUrl ? (
          <iframe 
            src={`${signedUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
            className="w-full h-full pointer-events-none" 
            title="PDF Viewer"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">Chưa có dữ liệu PDF</div>
        )}
        {/* Lớp phủ chặn chuột tương tác thẳng vào iframe */}
        <div className="absolute inset-0 bg-transparent z-10" />
      </div>

      {!hasPremiumOrPurchased && (
        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-center border border-yellow-200">
          <p>Bạn đang xem bản Demo. Nâng cấp Premium hoặc mua lẻ để xem bản đầy đủ.</p>
        </div>
      )}

      {hasPremiumOrPurchased && signedUrl === demoUrl && (
        <button 
          onClick={loadFullPdf} 
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          {loading ? 'Đang cấp quyền...' : 'Tải trình xem bản Đầy đủ'}
        </button>
      )}
    </div>
  );
}
