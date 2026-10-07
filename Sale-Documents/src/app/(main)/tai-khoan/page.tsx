
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from "@/lib/supabase/client";

export default function AccountPage() {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supabase] = useState(() => createBrowserClient());

    useEffect(() => {
        let mounted = true;
        async function fetchProfile() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && mounted) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, nickname, school, avatar_url, phone')
                    .eq('id', session.user.id)
                    .single();
                if (data && mounted) {
                    setProfile(data);
                }
            }
            if (mounted) setIsLoading(false);
        }
        fetchProfile();
        return () => { mounted = false; };
    }, [supabase]);

    return (
        <main  className="max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row gap-8 items-start relative min-h-[70vh]">
            
        
        
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 md:sticky md:top-24 z-30">
            
            <div className="md:hidden flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 border-b border-slate-200 dark:border-slate-800 mb-6 bg-slate-50 dark:bg-darkBg sticky top-16 pt-2">
                <button className="cursor-pointer nav-item active flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 transition flex-shrink-0" data-target="tab-overview">
                    <i className="fa-solid fa-border-all"></i> Tổng quan
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 transition flex-shrink-0" data-target="tab-docs">
                    <i className="fa-solid fa-book"></i> Tài liệu
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 transition flex-shrink-0" data-target="tab-orders">
                    <i className="fa-solid fa-receipt"></i> Đơn hàng
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 transition flex-shrink-0" data-target="tab-results">
                    <i className="fa-solid fa-ranking-star"></i> Kết quả thi
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 transition flex-shrink-0" data-target="tab-coupons">
                    <i className="fa-solid fa-ticket"></i> Mã của tôi
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 transition flex-shrink-0" data-target="tab-referral">
                    <i className="fa-solid fa-users-viewfinder"></i> Giới thiệu
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-2 h-11 px-4 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 transition flex-shrink-0" data-target="tab-security">
                    <i className="fa-solid fa-shield-halved"></i> Hồ sơ
                </button>
            </div>

            
            <div className="hidden md:flex flex-col bg-white dark:bg-darkCard rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-2 space-y-1">
                <button className="cursor-pointer nav-item active flex items-center gap-3 w-full h-12 px-4 rounded-2xl text-left font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent" data-target="tab-overview">
                    <i className="fa-solid fa-border-all w-5 text-center"></i> Tổng quan
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-3 w-full h-12 px-4 rounded-2xl text-left font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent" data-target="tab-docs">
                    <i className="fa-solid fa-book w-5 text-center"></i> Tài liệu của tôi
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-3 w-full h-12 px-4 rounded-2xl text-left font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent" data-target="tab-orders">
                    <i className="fa-solid fa-receipt w-5 text-center"></i> Đơn hàng
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-3 w-full h-12 px-4 rounded-2xl text-left font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent" data-target="tab-results">
                    <i className="fa-solid fa-ranking-star w-5 text-center"></i> Kết quả thi thử
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-3 w-full h-12 px-4 rounded-2xl text-left font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent" data-target="tab-coupons">
                    <i className="fa-solid fa-ticket w-5 text-center"></i> Mã của tôi <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                <button className="cursor-pointer nav-item flex items-center gap-3 w-full h-12 px-4 rounded-2xl text-left font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent" data-target="tab-referral">
                    <i className="fa-solid fa-users-viewfinder w-5 text-center"></i> Giới thiệu bạn bè
                </button>
                <button className="cursor-pointer nav-item flex items-center gap-3 w-full h-12 px-4 rounded-2xl text-left font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent" data-target="tab-security">
                    <i className="fa-solid fa-shield-halved w-5 text-center"></i> Hồ sơ & Bảo mật
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                <button className="cursor-pointer flex items-center gap-3 w-full h-12 px-4 rounded-2xl text-left font-bold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition border border-transparent">
                    <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Đăng xuất
                </button>
            </div>
        </aside>

        
        <div className="flex-1 w-full min-w-0">
            
            
            <div id="tab-overview" className="tab-pane active space-y-6">
                
                
                <div className="bg-white dark:bg-darkCard rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
                    
                    <div className="relative group cursor-pointer">
                        <img src={profile?.avatar_url || "https://placehold.co/150x150/3B82F6/FFF?text=User"} alt="Avatar" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-md" />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition">
                            <i className="fa-solid fa-camera text-xl"></i>
                        </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{isLoading ? 'Đang tải...' : profile?.full_name || 'Chưa cập nhật'}</h2>
                        
                        
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                            <span className="text-sm font-bold text-slate-500">@{profile?.nickname || 'Chưa cập nhật'}</span>
                            
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-green-200 dark:border-green-800" title="Biệt danh đang hiển thị công khai trên Bảng xếp hạng">Đã duyệt</span>
                            
                            
                            
                            
                        </div>

                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-4 flex items-center justify-center sm:justify-start gap-2">
                            <i className="fa-solid fa-school text-primary"></i> {profile?.school || 'Chưa cập nhật'}
                        </div>

                        <button className="cursor-pointer h-9 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition" >
                            Chỉnh sửa hồ sơ
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-highlight opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition"></div>
                        
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-highlight text-xl shadow-inner border border-white/10"><i className="fa-solid fa-crown"></i></div>
                            <div>
                                <h3 className="font-extrabold text-lg text-white">Gói Premium</h3>
                                <div className="text-xs text-blue-200 font-medium">Đang hoạt động</div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <div className="flex justify-between text-sm mb-1 font-bold">
                                    <span>Thời gian còn lại</span>
                                    <span className="text-highlight">23 ngày</span>
                                </div>
                                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="bg-highlight h-full" ></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-1 font-bold">
                                    <span>Suất tải tài liệu</span>
                                    <span className="text-green-400">2 / 5</span>
                                </div>
                                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full" ></div>
                                </div>
                            </div>
                        </div>
                        <button className="cursor-pointer w-full mt-5 h-11 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">Gia hạn ngay</button>
                    </div>

                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-full flex items-center justify-center text-xl mb-3"><i className="fa-solid fa-book"></i></div>
                            <div className="font-black text-2xl text-slate-800 dark:text-white mb-1">12</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tài liệu sở hữu</div>
                        </div>
                        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 text-accent rounded-full flex items-center justify-center text-xl mb-3"><i className="fa-solid fa-pen-to-square"></i></div>
                            <div className="font-black text-2xl text-slate-800 dark:text-white mb-1">45</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lượt làm bài</div>
                        </div>
                    </div>
                </div>
            </div>

            
            <div id="tab-docs" className="tab-pane space-y-6">
                <h2 className="text-2xl font-extrabold mb-6 hidden md:block">Tài liệu của tôi</h2>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Tìm tên tài liệu..." className="w-full bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 h-11 rounded-xl pl-11 pr-4 text-sm outline-none focus:border-primary" />
                    </div>
                    <select className="h-11 px-4 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                        <option>Tất cả môn</option>
                        <option>Toán</option>
                        <option>Lý</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div className="bg-white dark:bg-darkCard rounded-2xl p-3 border border-slate-200 dark:border-slate-700 flex flex-col shadow-sm">
                        <div className="flex gap-3 mb-3">
                            <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-blue-50">
                                <img src="https://placehold.co/150x200/3B82F6/FFF?text=TOAN" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1 w-max">Môn Toán</span>
                                <h4 className="font-bold text-sm line-clamp-2 leading-snug">Bộ 50 đề thi thử THPT QG Môn Toán 2026</h4>
                                <div className="text-[10px] text-slate-400 mt-1">Đã mua: 01/10/2026</div>
                            </div>
                        </div>
                        <div className="mt-auto flex gap-2">
                            <button className="cursor-pointer flex-1 h-9 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primaryHover transition flex items-center justify-center gap-1.5"><i className="fa-solid fa-book-open"></i> Đọc</button>
                            <button className="cursor-pointer flex-1 h-9 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition flex items-center justify-center gap-1.5"><i className="fa-solid fa-download"></i> Tải PDF</button>
                        </div>
                    </div>

                    
                    <div className="bg-white dark:bg-darkCard rounded-2xl p-3 border border-slate-200 dark:border-slate-700 flex flex-col shadow-sm">
                        <div className="flex gap-3 mb-3">
                            <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-green-50">
                                <img src="https://placehold.co/150x200/10B981/FFF?text=HOA" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded mb-1 w-max">Môn Hóa</span>
                                <h4 className="font-bold text-sm line-clamp-2 leading-snug">Chuyên đề Vận dụng cao Hóa học vô cơ</h4>
                                <div className="text-[10px] text-slate-400 mt-1">Gói: Chỉ xem Online</div>
                            </div>
                        </div>
                        <div className="mt-auto flex gap-2">
                            <button className="cursor-pointer flex-1 h-9 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primaryHover transition flex items-center justify-center gap-1.5"><i className="fa-solid fa-book-open"></i> Đọc</button>
                        </div>
                    </div>
                </div>
            </div>

            
            <div id="tab-orders" className="tab-pane space-y-6">
                <h2 className="text-2xl font-extrabold mb-6 hidden md:block">Lịch sử Đơn hàng</h2>
                
                <div className="bg-white dark:bg-darkCard rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto hide-scrollbar">
                        <table className="w-full text-sm text-left min-w-[600px]">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                                <tr>
                                    <th className="p-4">Mã ĐH</th>
                                    <th className="p-4">Ngày mua</th>
                                    <th className="p-4">Sản phẩm</th>
                                    <th className="p-4 text-right">Tổng tiền</th>
                                    <th className="p-4 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-sm">
                                
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">OTP2026A</td>
                                    <td className="p-4 text-slate-500 text-xs">04/10/2026<br />15:30</td>
                                    <td className="cursor-pointer p-4 text-xs">2 tài liệu<br /><a href="#" className="text-primary hover:underline">Xem chi tiết</a></td>
                                    <td className="p-4 text-right font-bold">84.000đ</td>
                                    <td className="p-4 text-center">
                                        <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">Thành công</span>
                                    </td>
                                </tr>
                                
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">OTP9988B</td>
                                    <td className="p-4 text-slate-500 text-xs">04/10/2026<br />16:00</td>
                                    <td className="p-4 text-xs">Gói Premium 30 Ngày</td>
                                    <td className="p-4 text-right font-bold">59.000đ</td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded">
                                            <i className="fa-solid fa-spinner animate-spin-slow"></i> Đang kiểm tra
                                        </span>
                                    </td>
                                </tr>
                                
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">OTP1122C</td>
                                    <td className="p-4 text-slate-500 text-xs">03/10/2026<br />10:15</td>
                                    <td className="p-4 text-xs">1 tài liệu</td>
                                    <td className="p-4 text-right font-bold">39.000đ</td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="inline-block bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded">Chờ thanh toán</span>
                                            <a href="#" className="cursor-pointer text-[10px] text-primary hover:underline">Thanh toán ngay</a>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            
            <div id="tab-results" className="tab-pane space-y-6">
                <h2 className="text-2xl font-extrabold mb-6 hidden md:block">Kết quả thi thử</h2>
                
                <div className="bg-white dark:bg-darkCard rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto hide-scrollbar">
                        <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider text-xs font-bold">
                                <tr>
                                    <th className="p-4">Ngày thi</th>
                                    <th className="p-4">Tên đề thi</th>
                                    <th className="p-4">Môn</th>
                                    <th className="p-4 text-center">Điểm số</th>
                                    <th className="p-4 text-center">Thứ hạng</th>
                                    <th className="p-4 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                                    <td className="p-4 text-slate-500">10/10/2026<br /><span className="text-xs">14:30</span></td>
                                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200 max-w-[250px] truncate" title="Đề thi thử THPT QG Sở Hà Nội 2026">Đề thi thử THPT QG Sở Hà Nội 2026</td>
                                    <td className="p-4"><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded">Toán</span></td>
                                    <td className="p-4 text-center"><span className="font-black text-lg text-green-500">8.5</span> <span className="text-xs text-slate-400">/10</span></td>
                                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">#42<br /><span className="text-[10px] text-slate-400 font-normal">/ 1,245</span></td>
                                    <td className="p-4 text-right">
                                        <button className="cursor-pointer h-9 px-4 bg-slate-100 dark:bg-slate-800 text-primary font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs">Xem chi tiết</button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                                    <td className="p-4 text-slate-500">05/10/2026<br /><span className="text-xs">09:15</span></td>
                                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200 max-w-[250px] truncate" title="Đề thi thử chuyên KHTN lần 1">Đề thi thử chuyên KHTN lần 1</td>
                                    <td className="p-4"><span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs px-2 py-1 rounded">Lý</span></td>
                                    <td className="p-4 text-center"><span className="font-black text-lg text-primary">7.25</span> <span className="text-xs text-slate-400">/10</span></td>
                                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">--</td>
                                    <td className="p-4 text-right">
                                        <button className="cursor-pointer h-9 px-4 bg-slate-100 dark:bg-slate-800 text-primary font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs">Xem chi tiết</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            
            <div id="tab-coupons" className="tab-pane space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-extrabold hidden md:block">Mã giảm giá cá nhân</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="bg-white dark:bg-darkCard rounded-2xl border border-slate-200 dark:border-slate-700 flex overflow-hidden shadow-sm hover:shadow-md transition">
                        <div className="w-1/3 bg-gradient-to-br from-red-500 to-orange-500 flex flex-col justify-center items-center text-white p-3 border-r border-dashed border-slate-300 relative">
                            
                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-white dark:bg-darkCard rounded-full"></div>
                            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white dark:bg-darkCard rounded-full"></div>
                            
                            <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Giảm</div>
                            <div className="text-2xl sm:text-3xl font-black leading-none text-white drop-shadow-sm">20%</div>
                        </div>
                        <div className="w-2/3 p-4 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono font-black text-slate-800 dark:text-white text-lg">GIOITOAN20</span>
                                    <span className="bg-green-100 text-green-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Còn hạn</span>
                                </div>
                                <div className="text-[11px] text-slate-500 leading-tight mb-2">Thưởng thi thử điểm cao. Áp dụng cho tài liệu môn Toán.</div>
                                <div className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-max">
                                    Hết hạn sau: <span className="font-mono" data-countdown="172800">48:00:00</span>
                                </div>
                            </div>
                            <button className="cursor-pointer mt-3 h-9 bg-slate-100 dark:bg-slate-800 text-primary font-bold text-xs rounded-lg hover:bg-slate-200 transition">Dùng ngay</button>
                        </div>
                    </div>

                    
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex overflow-hidden shadow-sm opacity-60 grayscale">
                        <div className="w-1/3 bg-slate-400 flex flex-col justify-center items-center text-white p-3 border-r border-dashed border-slate-300 relative">
                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full"></div>
                            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full"></div>
                            <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Giảm</div>
                            <div className="text-2xl sm:text-3xl font-black leading-none text-white drop-shadow-sm">50K</div>
                        </div>
                        <div className="w-2/3 p-4 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono font-black text-slate-800 dark:text-white text-lg line-through">FRIEND50</span>
                                    <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded">Hết hạn</span>
                                </div>
                                <div className="text-[11px] text-slate-500 leading-tight mb-2">Giới thiệu bạn bè thành công.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
            <div id="tab-referral" className="tab-pane space-y-6">
                
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden text-center">
                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-white/30"><i className="fa-solid fa-handshake-angle text-highlight"></i></div>
                    <h2 className="text-2xl md:text-3xl font-black mb-2">Mời Bạn Bè, Nhận Quà Khủng!</h2>
                    <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">Nhận ngay voucher <span className="font-bold text-highlight">50.000đ</span> cho mỗi người bạn đăng ký và mua tài liệu thành công qua link của bạn.</p>
                    
                    <div className="bg-white/10 p-2 rounded-2xl backdrop-blur border border-white/20 flex items-center max-w-sm mx-auto relative">
                        <input type="text" value="https://onthipro.vn/ref/OTP_HUY99" readOnly className="bg-transparent border-none text-white font-mono text-sm pl-4 pr-2 outline-none flex-1 truncate" />
                        <button className="cursor-pointer h-11 px-5 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition shadow relative" >
                            Sao chép
                            <div className="copy-feedback">Đã chép!</div>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-darkCard rounded-3xl p-5 border border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Đã đăng ký</div>
                        <div className="font-black text-3xl text-slate-800 dark:text-white">3 <span className="text-sm text-slate-400 font-normal">bạn</span></div>
                    </div>
                    <div className="bg-white dark:bg-darkCard rounded-3xl p-5 border border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Mã đã nhận</div>
                        <div className="font-black text-3xl text-accent">1 <span className="text-sm text-slate-400 font-normal">mã</span></div>
                    </div>
                </div>
            </div>

            
            <div id="tab-security" className="tab-pane space-y-8">
                <h2 className="text-2xl font-extrabold hidden md:block">Hồ sơ & Bảo mật</h2>

                
                <div className="bg-white dark:bg-darkCard rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Thông tin cá nhân</h3>
                    <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Họ và tên</label>
                                <input type="text" defaultValue={profile?.full_name || ""} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl px-4 text-sm focus:border-primary outline-none text-slate-800 dark:text-slate-100 transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Số điện thoại</label>
                                <input type="tel" defaultValue={profile?.phone || ""} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl px-4 text-sm focus:border-primary outline-none text-slate-800 dark:text-slate-100 transition" />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Biệt danh hiển thị</label>
                                <span className="text-[10px] text-green-500 font-bold"><i className="fa-solid fa-check"></i> Đã duyệt</span>
                            </div>
                            <input type="text" defaultValue={profile?.nickname || ""} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl px-4 text-sm focus:border-primary outline-none text-slate-800 dark:text-slate-100 transition" />
                            <p className="text-[10px] text-slate-400 mt-1">Lưu ý: Nếu bạn đổi biệt danh, hệ thống sẽ cần Admin duyệt lại trước khi hiển thị công khai.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Trường THPT</label>
                            <input type="text" defaultValue={profile?.school || ""} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl px-4 text-sm focus:border-primary outline-none text-slate-800 dark:text-slate-100 transition" />
                        </div>

                        <div className="pt-2">
                            <button type="button" className="cursor-pointer h-11 px-6 bg-primary text-white font-bold rounded-xl hover:bg-primaryHover transition shadow-sm">Lưu thay đổi</button>
                        </div>
                    </form>
                </div>

                
                <div className="bg-white dark:bg-darkCard rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="font-bold text-lg mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Đổi mật khẩu</h3>
                    <form className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Mật khẩu hiện tại</label>
                            <input type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl px-4 text-sm focus:border-primary outline-none text-slate-800 dark:text-slate-100 transition" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Mật khẩu mới</label>
                            <input type="password" placeholder="Tối thiểu 8 ký tự" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl px-4 text-sm focus:border-primary outline-none text-slate-800 dark:text-slate-100 transition" />
                        </div>
                        <div className="pt-2">
                            <button type="button" className="cursor-pointer h-11 px-6 bg-slate-800 text-white dark:bg-slate-700 font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition shadow-sm">Cập nhật mật khẩu</button>
                        </div>
                    </form>
                </div>

                
                <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-200 dark:border-red-900/30">
                    <h3 className="font-bold text-lg text-red-600 dark:text-red-500 mb-2">Vùng nguy hiểm</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Khi bạn xóa tài khoản, toàn bộ dữ liệu lịch sử thi, tài liệu đã mua và gói Premium sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
                    <button className="cursor-pointer h-11 px-6 bg-white dark:bg-darkCard text-red-500 border border-red-200 dark:border-red-800 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition">Xóa tài khoản và dữ liệu của tôi</button>
                </div>

            </div>

        </div>
    
        </main>
    );
}
