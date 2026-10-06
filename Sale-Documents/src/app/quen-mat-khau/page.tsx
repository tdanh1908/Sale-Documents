
"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassPage() {
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
<div id="view-forgot" className="auth-view">
                    
                    <Link href="/dang-nhap" className="cursor-pointer w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition mb-2 -ml-2" title="Quay lại"><i className="fa-solid fa-arrow-left"></i></Link>

                    <div className="text-center mb-6 lg:text-left">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-2xl flex items-center justify-center text-3xl mx-auto lg:mx-0 mb-4">
                            <i className="fa-solid fa-key"></i>
                        </div>
                        <h2 className="text-3xl font-extrabold mb-2 text-slate-900 dark:text-white">Quên mật khẩu?</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
                    </div>

                    
                    <div id="forgot-success" className="hidden bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-2xl text-center mb-6">
                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                            <i className="fa-solid fa-paper-plane"></i>
                        </div>
                        <h4 className="font-extrabold text-lg mb-1">Đã gửi email hướng dẫn!</h4>
                        <p className="text-sm">Vui lòng kiểm tra hộp thư đến (và mục Spam) của email <strong><span id="sentEmailTxt"></span></strong> để đặt lại mật khẩu.</p>
                        
                        <Link href="/dang-nhap"><button className="cursor-pointer mt-4 w-full h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                            Quay lại đăng nhập</button></Link>
                    </div>

                    <form id="forgotForm"  className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email đã đăng ký</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input type="email" id="forgotEmail" placeholder="nhapemail@gmail.com" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-12 rounded-xl pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition text-slate-800 dark:text-slate-100" required />
                            </div>
                        </div>

                        
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between">
                            <label className="custom-checkbox flex items-center gap-3 cursor-pointer group min-h-[32px]">
                                <input type="checkbox" className="hidden" required />
                                <div className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-darkCard transition shadow-inner group-has-[:checked]:bg-primary group-has-[:checked]:border-primary group-has-[:checked]:dark:bg-primary">
                                    <svg className="w-3.5 h-3.5 text-white hidden pointer-events-none group-has-[:checked]:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                </div>
                                <span className="text-slate-700 dark:text-slate-300 font-medium select-none text-sm">Tôi không phải là robot</span>
                            </label>
                            <div className="flex flex-col items-center">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/RecaptchaLogo.svg/512px-RecaptchaLogo.svg.png?20201014163435" alt="reCAPTCHA" className="w-8 opacity-70" />
                            </div>
                        </div>

                        <button type="submit" className="cursor-pointer w-full h-12 bg-primary text-white font-extrabold text-base rounded-xl hover:bg-primaryHover transition shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center">
                            Gửi Link Đặt Lại
                        </button>
                    </form>
                    
                    <div className="mt-4 text-center">
                        <Link href="/dat-lai-mat-khau" className="cursor-pointer text-[10px] text-slate-400 hover:underline">(Dev: Bấm để test form Đặt lại MK)</Link>
                    </div>
                </div>
</div>
        </div>
    </div>

    

        </main>
    );
}
