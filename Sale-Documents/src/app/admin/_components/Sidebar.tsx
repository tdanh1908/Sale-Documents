"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Tổng quan", href: "/admin", icon: "fa-border-all" },
    { name: "Tài liệu", href: "/admin/documents", icon: "fa-book" },
    { name: "Đề thi", href: "/admin/exams", icon: "fa-file-signature" },
    { name: "Kỳ thi", href: "/admin/contests", icon: "fa-trophy" },
    { name: "Đơn hàng", href: "/admin/orders", icon: "fa-receipt" },
    { name: "Mã giảm giá", href: "/admin/coupons", icon: "fa-ticket" },
    { type: "divider" },
    { name: "Chờ duyệt", href: "/admin/moderation", icon: "fa-clipboard-check" },
    { name: "Người dùng", href: "/admin/users", icon: "fa-users" },
    { name: "Cài đặt", href: "/admin/settings", icon: "fa-gear" },
  ];

  return (
    <aside id="adminSidebar" className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1E293B] border-r border-slate-200 dark:border-slate-800 shadow-xl xl:shadow-none transform hidden xl:flex flex-col h-full transition-transform duration-300">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2563EB] text-white rounded-lg flex items-center justify-center font-bold text-lg">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#2563EB]">Admin Panel</span>
        </Link>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scroll py-4 px-3 space-y-1">
        {navItems.map((item, idx) => {
          if (item.type === "divider") {
            return <div key={idx} className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2"></div>;
          }

          const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href as string));
          
          return (
            <Link
              key={item.href}
              href={item.href || "#"}
              className={`flex items-center gap-3 w-full h-11 px-4 rounded-xl text-sm transition ${
                isActive
                  ? "bg-[#2563EB] text-[#ffffff] font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center ${isActive ? "text-[#ffffff]" : "text-slate-400"}`}></i> {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0F172A]/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-[#2563EB] transition">
          <img src="https://placehold.co/100x100/3B82F6/FFF?text=AD" alt="Admin" className="w-9 h-9 rounded-full" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">Admin System</div>
            <div className="text-[10px] text-green-500 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
