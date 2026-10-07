"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle"; // We can reuse ThemeToggle since it handles dark mode nicely, but we will wrap it or modify it to look like the design if needed. But the design says "Bê nguyên xi". Let's write raw HTML for Topbar.

export default function Topbar() {
  return (
    <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button className="xl:hidden w-11 h-11 flex items-center justify-center text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition -ml-2">
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
        <div className="hidden sm:flex relative w-64 lg:w-96">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Tìm kiếm nhanh toàn hệ thống..." 
            className="w-full h-11 pl-10 pr-4 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2563EB] text-slate-700 dark:text-slate-200" 
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* We reuse the project's ThemeToggle here because it controls next-themes, but we'll try to keep the exact classNames. */}
        <ThemeToggle />
      </div>
    </header>
  );
}
