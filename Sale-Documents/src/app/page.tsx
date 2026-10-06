import Link from "next/link";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { Countdown } from "@/components/ui/countdown";
import { 
  TOP_10_MOCK, 
  SUBJECTS_MOCK, 
  FLASH_SALE_DOCS, 
  FREE_DOCS_MOCK, 
  BEST_SELLING_DOCS 
} from "@/lib/mock-data";
import { 
  Trophy, Star, Flame, BookOpen, Calculator, Magnet, FlaskConical, Dna, 
  Feather, Landmark, Globe, Scale, Languages, Monitor, Bolt, Gift, ChartLine 
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  calculator: Calculator,
  magnet: Magnet,
  flask: FlaskConical,
  dna: Dna,
  feather: Feather,
  landmark: Landmark,
  globe: Globe,
  scale: Scale,
  languages: Languages,
  monitor: Monitor,
};

const subjectColorClasses: Record<string, string> = {
  blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
  green: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
  lime: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
  pink: "bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400",
  orange: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",
  teal: "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",
  indigo: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
  red: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
  cyan: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400",
};

export default function Home() {
  return (
    <div className="pb-12">
      {/* Banner Carousel: Vinh danh Top 10 */}
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl">
          <div className="flex overflow-x-auto snap-x hide-scrollbar">
            {/* Slide 1 */}
            <div className="w-full flex-shrink-0 snap-center p-6 md:p-12 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left text-white">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#FACC15] text-orange-800 text-sm font-bold rounded-full mb-3 uppercase tracking-wide">
                  <Trophy className="w-4 h-4" /> {TOP_10_MOCK.badge}
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold mb-2">{TOP_10_MOCK.title}</h2>
                <p className="text-blue-100 text-sm md:text-base mb-5">{TOP_10_MOCK.description}</p>
                <button className="bg-white text-blue-600 font-bold py-2.5 px-6 rounded-full hover:bg-slate-100 transition shadow-lg">
                  Xem Bảng Xếp Hạng
                </button>
              </div>
              <div className="w-32 md:w-48 h-32 md:h-48 rounded-full border-4 border-[#FACC15] overflow-hidden shadow-2xl relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://placehold.co/200x200/FACC15/FFF?text=Học+Sinh+A" alt="Top 1" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-[#F97316] text-white text-center font-bold text-xs py-1">
                  {TOP_10_MOCK.studentScore}
                </div>
              </div>
            </div>
            {/* Slide 2 (Mock) */}
            <div className="w-full flex-shrink-0 snap-center p-6 md:p-12 flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-pink-500 to-rose-500">
              <div className="flex-1 text-center md:text-left text-white">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-white text-rose-600 text-sm font-bold rounded-full mb-3 uppercase tracking-wide">
                  <Star className="w-4 h-4 fill-current" /> Tài liệu mới
                </div>
                <h2 className="text-2xl md:text-4xl font-extrabold mb-2">Bộ Đề Tinh Túy Ngữ Văn 2026</h2>
                <p className="text-pink-100 text-sm md:text-base mb-5">Đã cập nhật theo cấu trúc đề thi mới nhất của Bộ GD&ĐT.</p>
                <button className="bg-white text-rose-600 font-bold py-2.5 px-6 rounded-full hover:bg-slate-100 transition shadow-lg">
                  Tải Ngay
                </button>
              </div>
            </div>
          </div>
          {/* Carousel Dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            <button className="w-2.5 h-2.5 rounded-full bg-white"></button>
            <button className="w-2.5 h-2.5 rounded-full bg-white/50"></button>
          </div>
        </div>
      </section>

      {/* Grid 10 Môn Học */}
      <section className="max-w-7xl mx-auto px-4 mt-8 md:mt-12">
        <h3 className="text-xl font-bold mb-4 md:mb-6 flex items-center">
          Chọn Môn Học <BookOpen className="w-5 h-5 text-blue-600 ml-2" />
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5">
          {SUBJECTS_MOCK.map((subject) => {
            const Icon = iconMap[subject.icon] || BookOpen;
            return (
              <Link key={subject.id} href={`/mon/${subject.id}`} className="flex items-center p-3 rounded-2xl bg-card shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700/60 dark:hover:border-slate-600 transition group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition ${subjectColorClasses[subject.color] || subjectColorClasses.blue}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="ml-3 font-bold text-slate-700 dark:text-slate-200">{subject.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Flash Sale */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <div className="bg-gradient-to-br from-orange-100 to-red-50 dark:from-orange-950/30 dark:to-red-950/20 rounded-3xl p-4 md:p-6 border border-orange-200 dark:border-orange-900/50 relative overflow-hidden">
          {/* Header Flash Sale */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <Bolt className="w-8 h-8 text-[#F97316] animate-pulse fill-current" />
              <h2 className="text-2xl font-extrabold text-orange-600 dark:text-orange-500 italic">FLASH SALE</h2>
              <Countdown />
            </div>
            <Link href="/flash-sale" className="text-orange-600 dark:text-orange-500 font-bold hover:underline text-sm md:text-base flex items-center gap-1">
              Xem tất cả <span className="text-lg leading-none">&rsaquo;</span>
            </Link>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {FLASH_SALE_DOCS.map((doc) => (
              <DocumentCard key={doc.id} {...doc} />
            ))}
          </div>
        </div>
      </section>

      {/* Tài Liệu Nổi Bật */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
            Tài liệu Nổi Bật <Flame className="w-6 h-6 text-red-500 fill-current" />
          </h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Miễn phí nổi bật */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg text-green-600 flex items-center gap-2">
                <Gift className="w-5 h-5" /> Miễn Phí Mới Nhất
              </h4>
              <Link href="/mien-phi" className="text-sm text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {FREE_DOCS_MOCK.map((doc) => (
                <DocumentCard key={doc.id} {...doc} variant="horizontal" />
              ))}
            </div>
          </div>

          {/* Bán chạy nhất */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg text-blue-600 flex items-center gap-2">
                <ChartLine className="w-5 h-5" /> Bán Chạy Nhất
              </h4>
              <Link href="/ban-chay" className="text-sm text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              {BEST_SELLING_DOCS.map((doc) => (
                <DocumentCard key={doc.id} {...doc} variant="horizontal" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
