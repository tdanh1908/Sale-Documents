export default function AdminDashboardPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">Tổng quan hệ thống</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-2">Quản lý người dùng</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Xem và phân quyền người dùng trong hệ thống.</p>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-2">Quản lý tài liệu</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Duyệt tài liệu và quản lý các bài đăng.</p>
        </div>
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-2">Cài đặt hệ thống</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Thay đổi các thông số cấu hình của website.</p>
        </div>
      </div>
    </div>
  );
}
