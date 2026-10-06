'use client';

export default function AccountPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 pt-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Tài khoản của tôi</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-3">Hồ sơ cá nhân</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ tên</label>
                    <input type="text" defaultValue="Người dùng" className="w-full mt-1 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Biệt danh</label>
                    <input type="text" defaultValue="user123" className="w-full mt-1 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trường học</label>
                  <input type="text" defaultValue="THPT Chuyên" className="w-full mt-1 p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 transition" />
                </div>
                <div className="pt-2">
                  <button type="button" className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition">Lưu thay đổi</button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-3">Tài liệu đã mua</h2>
              <ul className="space-y-3">
                <li className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-100 dark:border-gray-600">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Combo 50 Đề Toán Trọng Tâm 2026</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Đã mua ngày: 01/10/2026</p>
                  </div>
                  <a href="#" className="mt-3 sm:mt-0 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition">Tải xuống</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-700/30 p-6">
              <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-500 mb-2">Thành viên Premium</h2>
              <p className="text-yellow-700 dark:text-yellow-600 text-sm mb-4">Bạn đang có các đặc quyền tải tài liệu không giới hạn.</p>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-yellow-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Thời hạn còn:</span>
                <span className="font-bold text-gray-900 dark:text-white">30 ngày</span>
              </div>
              <button className="w-full mt-4 bg-yellow-500 text-white font-medium py-2 rounded-lg hover:bg-yellow-600 transition shadow-sm">Gia hạn ngay</button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold dark:text-gray-100 mb-3">Mã giới thiệu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Mời bạn bè đăng ký để nhận thêm 7 ngày Premium miễn phí.</p>
              <div className="flex gap-2">
                <input type="text" readOnly value="REF-XYZ123" className="flex-1 p-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" />
                <button className="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition">Copy</button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 p-6">
              <h2 className="text-lg font-bold text-red-600 mb-2">Vùng nguy hiểm</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hành động này không thể hoàn tác. Dữ liệu của bạn sẽ bị xóa vĩnh viễn.</p>
              <button className="w-full text-red-600 font-medium px-4 py-2 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">Xóa tài khoản</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
