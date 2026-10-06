import Link from "next/link";
import { GraduationCap, Search, ShoppingCart, Menu } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-slate-100 dark:border-slate-700/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-[#2563EB] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#2563EB] whitespace-nowrap">
            {siteConfig.name}
          </span>
        </Link>

        {/* Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
          <input
            type="text"
            placeholder="Tìm tài liệu, đề thi, môn học..."
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-[#2563EB] border-none"
          />
          <button className="absolute right-1 top-1 bottom-1 px-4 bg-[#2563EB] text-white rounded-full hover:bg-[#1D4ED8] transition">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          <ThemeToggle />
          
          {/* Cart */}
          <Link
            href="/gio-hang"
            className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-[#F97316] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#1E293B]">
              2
            </span>
          </Link>
          
          {/* Thư viện (Desktop) */}
          <Link
            href="/thu-vien"
            className="hidden md:block font-bold text-slate-700 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-[#3B82F6] whitespace-nowrap shrink-0"
          >
            Thư viện
          </Link>

          {/* Login (Desktop) */}
          <Link
            href="/dang-nhap"
            className="hidden md:block font-bold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap shrink-0"
          >
            Đăng nhập
          </Link>
          
          {/* Hamburger (Mobile) */}
          <button className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Search (Mobile) */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tài liệu, đề thi..."
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 pl-11 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[#2563EB] border-none"
          />
        </div>
      </div>
    </header>
  );
}
