
"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function ResetPassPage() {
    return (
        <main  className="bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 min-h-screen flex">
            

    
    <button id="themeToggle" className="cursor-pointer fixed top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition" aria-label="Đổi giao diện">
        <i className="fa-solid fa-moon dark:hidden text-lg"></i>
        <i className="fa-solid fa-sun hidden dark:block text-highlight text-lg"></i>
    </button>

    
    <a href="#" className="cursor-pointer fixed top-4 left-4 z-50 w-11 h-11 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition lg:hidden" aria-label="Về trang chủ">
        <i className="fa-solid fa-arrow-left text-lg"></i>
    </a>

    
    <div className="flex w-full min-h-screen">
        
        
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-indigo-700 text-white relative overflow-hidden flex-col justify-between p-12">
            
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-highlight opacity-20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                <a href="#" className="cursor-pointer flex items-center gap-2 mb-12 hover:opacity-90 transition w-max">
                    <div className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg">
                        <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <span className="font-extrabold text-3xl tracking-tight text-white">ÔnThiPro</span>
                </a>
            </div>

            
            <div className="relative z-10 mb-12" id="heroContent">
                <h1 className="text-4xl xl:text-5xl font-black mb-6 leading-tight">Chinh phục điểm 9+<br />kỳ thi THPT Quốc Gia</h1>
                <p className="text-blue-100 text-lg mb-8 max-w-md">Kho tài liệu đồ sộ, đề thi thử sát với cấu trúc thực tế và hàng ngàn học sinh đang cùng nhau ôn luyện mỗi ngày.</p>
                
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl max-w-sm transform rotate-[-2deg] hover:rotate-0 transition duration-500">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-highlight text-orange-900 flex items-center justify-center font-black">1</div>
                            <div>
                                <div className="font-bold text-sm">Trần Ngọc Huy</div>
                                <div className="text-[10px] text-blue-200">THPT Chuyên KHTN</div>
                            </div>
                        </div>
                        <div className="font-black text-xl text-highlight">29.5</div>
                    </div>
                    <div className="text-sm font-medium text-white/90">"Tài liệu ở đây thực sự rất bám sát đề minh họa. Cảm ơn ÔnThiPro!"</div>
                </div>
            </div>

            <div className="relative z-10 text-sm font-medium text-blue-200">
                &copy; 2026 ÔnThiPro. All rights reserved.
            </div>
        </div>

        
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 relative">
            <div className="w-full max-w-md">
<div id="view-reset" className="auth-view">
                    
                    <div className="text-center mb-6 lg:text-left">
                        <h2 className="text-3xl font-extrabold mb-2 text-slate-900 dark:text-white">Đặt lại mật khẩu</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Tạo mật khẩu mới đủ mạnh để bảo vệ tài khoản.</p>
                    </div>

                    <form  className="space-y-5">
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mật khẩu mới</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input type="password" id="resetPass" placeholder="Tối thiểu 8 ký tự..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-12 rounded-xl pl-11 pr-12 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-slate-800 dark:text-slate-100" required  />
                                <button type="button" className="cursor-pointer absolute right-1 top-1 bottom-1 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition focus:outline-none" >
                                    <i className="fa-solid fa-eye"></i>
                                </button>
                            </div>
                            
                            
                            <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                <div id="strengthIndicator" className="h-full strength-bar w-0"></div>
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 mt-1" id="strengthText">Độ mạnh: Chưa nhập</div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nhập lại mật khẩu mới</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input type="password" id="resetPassConfirm" placeholder="••••••••" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-12 rounded-xl pl-11 pr-12 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-slate-800 dark:text-slate-100" required />
                                <button type="button" className="cursor-pointer absolute right-1 top-1 bottom-1 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition focus:outline-none" >
                                    <i className="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="cursor-pointer w-full h-12 bg-primary text-white font-extrabold text-base rounded-xl hover:bg-primaryHover transition shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2">
                            Xác nhận đổi mật khẩu
                        </button>
                    </form>
                </div>
</div>
        </div>
    </div>

    

        </main>
    );
}
