import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AuditLogsPage() {
  const supabase = await createServerClient();
  
  const { data: logs, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Lỗi khi tải nhật ký:", error);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/documents" className="w-11 h-11 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#2563EB] transition flex items-center justify-center shadow-sm" title="Quay lại">
            <i className="fa-solid fa-arrow-left"></i>
          </Link>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">Nhật ký hoạt động</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto custom-scroll flex-1">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-4 w-40">Thời gian</th>
                <th className="p-4">Tài khoản (Admin)</th>
                <th className="p-4 w-32 text-center">Hành động</th>
                <th className="p-4 w-40 text-center">Đối tượng</th>
                <th className="p-4">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium">
              {logs && logs.length > 0 ? (
                logs.map((log: any) => {
                  const date = new Date(log.created_at);
                  const dateStr = date.toLocaleDateString('vi-VN');
                  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  
                  // Style hành động
                  let actionBadge = "";
                  if (log.action_type === 'CREATE') {
                    actionBadge = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                  } else if (log.action_type === 'UPDATE') {
                    actionBadge = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                  } else if (log.action_type === 'DELETE') {
                    actionBadge = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                  } else {
                    actionBadge = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                      <td className="p-4 text-xs text-slate-500">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{timeStr}</div>
                        <div>{dateStr}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700 dark:text-slate-200">{log.admin_email}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full uppercase ${actionBadge}`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-bold">{log.entity_name}</div>
                        {log.entity_id && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1" title={log.entity_id}>
                            ID: {log.entity_id.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-slate-500 max-w-xs truncate" title={JSON.stringify(log.changes)}>
                          {log.changes ? JSON.stringify(log.changes) : "Không có chi tiết"}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Chưa có nhật ký hoạt động nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
