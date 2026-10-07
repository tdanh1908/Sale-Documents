import { ReactNode } from "react";
import Sidebar from "./_components/Sidebar";
import Topbar from "./_components/Topbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        /* Scrollbar styles */
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scroll::-webkit-scrollbar-thumb { background: #475569; }

        /* Hide scrollbar completely */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Custom Checkbox */
        .custom-checkbox input:checked + div { background-color: #2563EB; border-color: #2563EB; }
        .custom-checkbox input:checked + div svg { display: block; }
      `}</style>
      <div className="bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 flex overflow-hidden h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 xl:ml-64 h-screen bg-slate-50 dark:bg-[#0F172A] transition-all duration-300 relative">
          <Topbar />
          <main className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6 lg:p-8 relative">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
