import Link from "next/link";
import { GraduationCap, Phone, Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { FaFacebook, FaYoutube, FaTiktok } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-card pt-12 pb-6 border-t border-slate-100 dark:border-slate-700/60 mt-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#2563EB] text-white rounded-lg flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-[#2563EB]">{siteConfig.name}</span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {siteConfig.description}
          </p>
          <div className="flex gap-4">
            <a href={siteConfig.links.facebook} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#2563EB] transition">
              <FaFacebook className="w-6 h-6" />
            </a>
            <a href={siteConfig.links.youtube} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-red-500 transition">
              <FaYoutube className="w-6 h-6" />
            </a>
            <a href={siteConfig.links.tiktok} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
              <FaTiktok className="w-6 h-6" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold mb-4 text-slate-800 dark:text-slate-200">Về chúng tôi</h4>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
            <li><Link href="/gioi-thieu" className="hover:text-[#2563EB] transition">Giới thiệu</Link></li>
            <li><Link href="/dieu-khoan" className="hover:text-[#2563EB] transition">Điều khoản sử dụng</Link></li>
            <li><Link href="/bao-mat" className="hover:text-[#2563EB] transition">Chính sách bảo mật</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-4 text-slate-800 dark:text-slate-200">Hỗ trợ học sinh</h4>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
            <li><Link href="/huong-dan" className="hover:text-[#2563EB] transition">Hướng dẫn thanh toán</Link></li>
            <li><Link href="/faq" className="hover:text-[#2563EB] transition">Câu hỏi thường gặp</Link></li>
            <li>
              <Link href="/premium" className="hover:text-[#2563EB] transition flex items-center">
                Gói Premium 
                <span className="bg-[#FACC15] text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">HOT</span>
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-4 text-slate-800 dark:text-slate-200">Liên hệ</h4>
          <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
            <li className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {siteConfig.contact.phone}</li>
            <li className="flex items-center"><Mail className="w-4 h-4 mr-2" /> {siteConfig.contact.email}</li>
            <li className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {siteConfig.contact.address}</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-6">
        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
