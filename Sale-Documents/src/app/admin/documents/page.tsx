"use client";

import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DocumentsPage() {
  const supabase = createBrowserClient();
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setDocuments(data);
      }
      setLoading(false);
    };
    fetchDocuments();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = (currentStatus === 'published' || currentStatus === 'draft') ? 'hidden' : 'published';
    const { error } = await supabase
      .from('documents')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) {
      setDocuments(docs => docs.map(doc => doc.id === id ? { ...doc, status: newStatus } : doc));
      router.refresh();
    } else {
      console.error(error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này không? Hành động này không thể hoàn tác.")) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setDocuments(docs => docs.filter(doc => doc.id !== id));
        router.refresh();
      } else {
        console.error(error);
        alert("Có lỗi xảy ra khi xóa tài liệu!");
      }
    }
  };

  // Helper hiển thị môn học
  const getSubjectInfo = (subjectCode: string) => {
    const map: Record<string, { label: string, colorClass: string, bgCode: string }> = {
      'toan': { label: 'Toán', colorClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400', bgCode: '3B82F6' },
      'ly': { label: 'Lý', colorClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400', bgCode: '8B5CF6' },
      'hoa': { label: 'Hóa', colorClass: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400', bgCode: '10B981' },
      'sinh': { label: 'Sinh', colorClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400', bgCode: '10B981' },
      'van': { label: 'Văn', colorClass: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-400', bgCode: 'EC4899' },
      'anh': { label: 'Anh', colorClass: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400', bgCode: 'EF4444' }
    };
    return map[subjectCode] || { label: 'Khác', colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', bgCode: '94A3B8' };
  };

  const totalCount = documents?.length || 0;

  return (
    <div id="view-list" className="view-section active h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Quản lý Tài liệu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tổng số: {totalCount.toLocaleString('vi-VN')} tài liệu trên hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/documents/logs" className="h-11 px-4 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left"></i> Nhật ký
          </Link>
          <Link href="/admin/documents/create" className="h-11 px-5 bg-[#2563EB] text-white rounded-xl text-sm font-bold hover:bg-[#1D4ED8] transition shadow-sm flex items-center gap-2">
            <i className="fa-solid fa-plus"></i> Thêm tài liệu
          </Link>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-t-2xl border border-slate-200 dark:border-slate-700 border-b-0 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 w-full lg:w-auto gap-4 flex-col sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Tìm theo tên, ID tài liệu..." 
              className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2563EB] text-slate-800 dark:text-slate-100" 
            />
          </div>
          <select className="h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-sm font-bold outline-none cursor-pointer w-full sm:w-40">
            <option value="">Tất cả môn</option>
            <option value="Toán">Toán học</option>
            <option value="Lý">Vật lý</option>
            <option value="Hóa">Hóa học</option>
          </select>
          <select className="h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-sm font-bold outline-none cursor-pointer w-full sm:w-40">
            <option value="">Mọi trạng thái</option>
            <option value="Đang bán">Đang bán</option>
            <option value="Nháp">Bản nháp</option>
            <option value="Đã gỡ">Đã gỡ</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-b-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto custom-scroll flex-1">
          <table className="w-full text-left min-w-[1100px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-4 w-12 text-center">
                  <label className="custom-checkbox flex items-center justify-center cursor-pointer">
                    <input type="checkbox" className="hidden" id="selectAll" />
                    <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-[#1E293B] transition">
                      <svg className="w-3 h-3 text-white hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  </label>
                </th>
                <th className="p-4 w-20">Ảnh</th>
                <th className="p-4 cursor-pointer hover:text-[#2563EB] transition">Tên tài liệu <i className="fa-solid fa-sort ml-1"></i></th>
                <th className="p-4 w-24">Môn</th>
                <th className="p-4 w-20 text-center">Trang</th>
                <th className="p-4 w-28 text-right cursor-pointer hover:text-[#2563EB] transition">Giá Xem <i className="fa-solid fa-sort ml-1"></i></th>
                <th className="p-4 w-28 text-right">Giá Tải</th>
                <th className="p-4 w-32 text-center">Trạng thái</th>
                <th className="p-4 w-24 text-center cursor-pointer hover:text-[#2563EB] transition">Đã bán <i className="fa-solid fa-sort-down ml-1"></i></th>
                <th className="p-4 w-32 text-right">Cập nhật</th>
                <th className="p-4 w-40 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : documents?.map((doc: any) => {
                const subjectInfo = getSubjectInfo(doc.subject);
                const isHidden = doc.status === 'hidden';
                const isDraft = doc.status === 'draft';
                
                // Trạng thái styles
                let statusBadge = "";
                let statusText = "";
                if (doc.status === 'published') {
                  statusBadge = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50";
                  statusText = "Đang bán";
                } else if (isDraft) {
                  statusBadge = "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600/50";
                  statusText = "Bản nháp";
                } else {
                  statusBadge = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50";
                  statusText = "Đã gỡ";
                }

                // Format ngày
                const date = new Date(doc.updated_at || doc.created_at);
                const dateStr = date.toLocaleDateString('vi-VN');
                const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition group">
                    <td className="p-4 text-center">
                      <label className="custom-checkbox flex items-center justify-center cursor-pointer">
                        <input type="checkbox" className="hidden row-checkbox" value={doc.id} />
                        <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-[#1E293B] transition">
                          <svg className="w-3 h-3 text-white hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                      </label>
                    </td>
                    <td className="p-4">
                      <div className="w-12 h-16 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {(() => {
                          const cover = doc.cover_image_url || doc.thumbnail_url || doc.image_url || doc.file_url || doc.cover_url;
                          if (cover && typeof cover === 'string' && cover.trim() !== '') {
                            /* eslint-disable-next-line @next/next/no-img-element */
                            return <img src={cover} className="w-full h-full object-cover" alt={doc.title} />;
                          }
                          return (
                            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100 dark:bg-slate-800 p-1">
                              <i className="fa-solid fa-file-pdf text-slate-300 dark:text-slate-600 text-xl mb-1"></i>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center line-clamp-1">
                                {doc.title ? doc.title.substring(0, 2) : 'TL'}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold line-clamp-2">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1" title={doc.id}>ID: {doc.id.substring(0, 8)}...</div>
                    </td>
                    <td className="p-4">
                      <span className={`${subjectInfo.colorClass} text-xs px-2 py-1 rounded`}>
                        {subjectInfo.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {doc.page_count}
                    </td>
                    <td className="p-4 text-right font-bold">
                      {doc.view_price ? `${doc.view_price.toLocaleString('vi-VN')}đ` : '0đ'}
                    </td>
                    <td className="p-4 text-right">
                      {doc.download_price ? `${doc.download_price.toLocaleString('vi-VN')}đ` : '0đ'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`${statusBadge} inline-block text-xs font-bold px-2 py-1 rounded-full`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold">
                      {doc.sales_count}
                    </td>
                    <td className="p-4 text-right text-xs text-slate-500">
                      {dateStr}<br/>{timeStr}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/documents/edit/${doc.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-[#2563EB] transition" title="Sửa thông tin"><i className="fa-solid fa-pen"></i></Link>
                        <button className="w-8 h-8 rounded-lg text-slate-500 hover:bg-orange-50 hover:text-[#F97316] transition" title="Đổi giá"><i className="fa-solid fa-tag"></i></button>
                        <button className="w-8 h-8 rounded-lg text-slate-500 hover:bg-purple-50 hover:text-purple-600 transition" title="Thay file"><i className="fa-solid fa-file-pdf"></i></button>
                        {doc.status === 'published' || isDraft ? (
                          <button onClick={() => handleToggleStatus(doc.id, doc.status)} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition" title="Gỡ khỏi cửa hàng"><i className="fa-solid fa-eye-slash"></i></button>
                        ) : (
                          <button onClick={() => handleToggleStatus(doc.id, doc.status)} className="w-8 h-8 rounded-lg text-green-500 hover:bg-green-50 hover:text-green-600 transition" title="Khôi phục bán"><i className="fa-solid fa-rotate-left"></i></button>
                        )}
                        <button onClick={() => handleDelete(doc.id)} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition" title="Xóa vĩnh viễn"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {!loading && (!documents || documents.length === 0) && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    Chưa có tài liệu nào trên hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-sm gap-4">
          <div className="text-slate-500">Hiển thị 1-10 của 2,450</div>
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"><i className="fa-solid fa-chevron-left"></i></button>
            <button className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold shadow-sm transition">1</button>
            <button className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition">2</button>
            <button className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition">3</button>
            <span className="px-2 text-slate-400">...</span>
            <button className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
}
