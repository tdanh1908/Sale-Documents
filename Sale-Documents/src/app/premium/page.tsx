import Link from "next/link";
import { Check, ArrowRight, BookOpen, Download, MonitorPlay } from "lucide-react";

export default function PremiumPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 min-h-screen">
      <div id="state-container">
        {/* ================= STATE 1: CHƯA ĐĂNG KÝ ================= */}
        <div className="mb-12 transition-all duration-300">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            {/* Decor */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#FACC15] opacity-20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#2563EB] opacity-30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex-1 relative z-10 text-center md:text-left">
              <div className="inline-block bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded mb-4 uppercase tracking-wider shadow-sm">
                Gói khuyên dùng
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FACC15] to-[#F97316] mb-4 drop-shadow-sm">
                ÔnThiPro Premium
              </h1>
              <p className="text-slate-300 text-sm md:text-base font-medium mb-6 leading-relaxed max-w-lg mx-auto md:mx-0">
                Mở khóa không giới hạn kho tài liệu và đề thi luyện thi THPT Quốc Gia chất lượng cao. Lộ trình chinh phục điểm 9+ bắt đầu từ đây.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <div className="flex flex-col items-center sm:items-start bg-slate-800/50 dark:bg-slate-800/80 px-5 py-2.5 rounded-2xl border border-slate-700 backdrop-blur-sm">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Đầu tư chỉ
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-3xl md:text-4xl text-white">59.000đ</span>
                    <span className="text-sm font-bold text-slate-400">/30 ngày</span>
                  </div>
                </div>
                <button className="w-full sm:w-auto h-14 md:h-[68px] px-8 bg-[#2563EB] text-white font-black text-lg rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                  ĐĂNG KÝ NGAY <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visual Right Side */}
            <div className="hidden md:flex flex-col gap-3 relative z-10 w-72 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4 transform -rotate-2 hover:rotate-0 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center text-xl flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm leading-tight text-white">
                  Xem Online <br />
                  <span className="text-[#FACC15]">Mọi tài liệu có phí</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4 transform translate-x-4 hover:translate-x-0 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center text-xl flex-shrink-0">
                  <Download className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm leading-tight text-white">
                  Tải về vĩnh viễn <br />
                  <span className="text-green-400">5 tài liệu bạn chọn</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4 transform rotate-2 hover:rotate-0 transition duration-300">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl flex-shrink-0">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm leading-tight text-white">
                  Thi thử thả ga <br />
                  <span className="text-purple-400">Mọi đề thi VIP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quyền lợi (Mobile List) */}
          <div className="md:hidden mt-6 bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-extrabold text-lg mb-4 text-slate-800 dark:text-slate-100">Quyền lợi Gói Premium:</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Xem online mọi tài liệu có phí</div>
                  <div className="text-xs text-slate-500">Không giới hạn số lượng tài liệu đọc trên web.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Tải về 5 tài liệu tự chọn</div>
                  <div className="text-xs text-slate-500">Tải file PDF vĩnh viễn, tải lại không mất thêm suất.</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-8">So sánh quyền lợi</h2>
        
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 font-bold text-slate-500 uppercase tracking-wider w-1/3 border-r border-slate-200 dark:border-slate-700">Tính năng</th>
                  <th className="p-4 font-bold text-slate-700 dark:text-slate-200 text-center w-2/9 border-r border-slate-100 dark:border-slate-800">Cơ bản<br /><span className="text-xs font-normal text-slate-500">(Miễn phí)</span></th>
                  <th className="p-4 font-bold text-slate-700 dark:text-slate-200 text-center w-2/9 border-r border-slate-100 dark:border-slate-800">Mua lẻ<br /><span className="text-xs font-normal text-slate-500">(Tùy tài liệu)</span></th>
                  <th className="p-4 font-black text-[#2563EB] text-center w-2/9 bg-blue-50 dark:bg-blue-900/10">PREMIUM<br /><span className="text-xs font-bold text-slate-900 dark:text-white bg-[#FACC15] px-2 py-0.5 rounded-full mt-1 inline-block">59K / 30 Ngày</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#1E293B] group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 p-4 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">Xem tài liệu Miễn phí</td>
                  <td className="p-4 text-center"><Check className="inline-block w-5 h-5 text-green-500" /></td>
                  <td className="p-4 text-center border-l border-slate-100 dark:border-slate-800"><Check className="inline-block w-5 h-5 text-green-500" /></td>
                  <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-900/5 border-l border-slate-100 dark:border-slate-800"><Check className="inline-block w-5 h-5 text-[#2563EB]" /></td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#1E293B] group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 p-4 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">Xem online tài liệu Có phí</td>
                  <td className="p-4 text-center text-slate-400">-</td>
                  <td className="p-4 text-center text-slate-600 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800">Chỉ bài đã mua</td>
                  <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-900/5 border-l border-slate-100 dark:border-slate-800"><span className="font-bold text-[#2563EB]">Tất cả tài liệu</span></td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#1E293B] group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 p-4 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">Tải file PDF về máy</td>
                  <td className="p-4 text-center text-slate-600 dark:text-slate-300">Tùy bài Free</td>
                  <td className="p-4 text-center text-slate-600 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800">Mua thêm phí tải</td>
                  <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-900/5 border-l border-slate-100 dark:border-slate-800"><span className="font-bold text-[#2563EB]">5 bài tự chọn</span></td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#1E293B] group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 p-4 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">Làm đề thi trực tuyến</td>
                  <td className="p-4 text-center text-slate-400">-</td>
                  <td className="p-4 text-center text-slate-600 dark:text-slate-300 border-l border-slate-100 dark:border-slate-800">Chỉ đề đã mua</td>
                  <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-900/5 border-l border-slate-100 dark:border-slate-800"><span className="font-bold text-[#2563EB]">Toàn bộ đề thi</span></td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#1E293B] group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 p-4 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">Hỗ trợ giải đáp thắc mắc</td>
                  <td className="p-4 text-center text-slate-400">-</td>
                  <td className="p-4 text-center text-slate-400 border-l border-slate-100 dark:border-slate-800">-</td>
                  <td className="p-4 text-center bg-blue-50/50 dark:bg-blue-900/5 border-l border-slate-100 dark:border-slate-800"><span className="font-bold text-[#2563EB]">Ưu tiên (Zalo 1-1)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
