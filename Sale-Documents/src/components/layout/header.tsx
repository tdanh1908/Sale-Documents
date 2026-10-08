"use client";

import Link from "next/link";
import { GraduationCap, Search, ShoppingCart, Menu, User, LogOut, Shield } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "./ThemeToggle";
import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

import { useCart } from "@/contexts/CartContext";

export function Header() {
  const { cartItems } = useCart();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createBrowserClient());
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (mounted && data) setProfile(data);
          }
        }
      } catch (err) {
        console.error("Auth session error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (mounted && data) setProfile(data);
          } else {
            if (mounted) setProfile(null);
          }
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    router.refresh();
  };

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
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F97316] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#1E293B]">
                {cartItems.length}
              </span>
            )}
          </Link>
          
          {/* User Menu */}
          {isLoading ? (
            <div className="hidden md:block w-20 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"></div>
          ) : user ? (
            <div className="relative hidden md:block group pt-2 pb-2">
              <button
                className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 hover:text-[#2563EB] transition"
                title={profile?.full_name || user.email?.split('@')[0] || "Người dùng"}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
              </button>
              
              <div className="absolute right-0 top-full hidden group-hover:block w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-2 flex flex-col overflow-hidden z-50">
                <div className="px-4 py-2 mb-1 border-b border-slate-100 dark:border-slate-700/60">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {profile?.full_name || user.email?.split('@')[0] || "Người dùng"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>

                <Link
                  href="/thu-vien"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <GraduationCap className="w-4 h-4" />
                  Thư viện tài liệu
                </Link>

                <Link
                  href="/saved"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Tài liệu đã lưu
                </Link>

                <Link
                  href="/account"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <User className="w-4 h-4" />
                  Hồ sơ cá nhân
                </Link>

                {profile?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <Shield className="w-4 h-4" />
                    Quản lý Admin
                  </Link>
                )}
                
                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href={pathname && pathname !== '/dang-nhap' ? `/dang-nhap?next=${encodeURIComponent(pathname)}` : '/dang-nhap'}
              className="hidden md:block font-bold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap shrink-0"
            >
              Đăng nhập
            </Link>
          )}
          
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
