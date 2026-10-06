"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Trophy, Medal, Award, Crown } from "lucide-react";

const SUBJECTS = [
  { id: 'toan', name: 'Toán', color: 'bg-blue-100 text-blue-600', max: 10 },
  { id: 'ly', name: 'Vật Lý', color: 'bg-purple-100 text-purple-600', max: 10 },
  { id: 'hoa', name: 'Hóa học', color: 'bg-green-100 text-green-600', max: 10 },
  { id: 'sinh', name: 'Sinh học', color: 'bg-lime-100 text-lime-600', max: 10 },
  { id: 'su', name: 'Lịch sử', color: 'bg-orange-100 text-orange-600', max: 10 },
  { id: 'dia', name: 'Địa lý', color: 'bg-teal-100 text-teal-600', max: 10 },
  { id: 'ktpl', name: 'KTPL', color: 'bg-indigo-100 text-indigo-600', max: 10 },
  { id: 'anh', name: 'Tiếng Anh', color: 'bg-red-100 text-red-600', max: 10 },
  { id: 'tin', name: 'Tin học', color: 'bg-cyan-100 text-cyan-600', max: 10 },
];

const BLOCKS = [
  { id: 'a00', name: 'A00', sub: 'Toán - Lý - Hóa', color: 'bg-slate-100 text-slate-700', max: 30 },
  { id: 'a01', name: 'A01', sub: 'Toán - Lý - Anh', color: 'bg-slate-100 text-slate-700', max: 30 },
  { id: 'a02', name: 'A02', sub: 'Toán - Lý - Sinh', color: 'bg-slate-100 text-slate-700', max: 30 },
  { id: 'b00', name: 'B00', sub: 'Toán - Hóa - Sinh', color: 'bg-slate-100 text-slate-700', max: 30 },
  { id: 'd07', name: 'D07', sub: 'Toán - Hóa - Anh', color: 'bg-slate-100 text-slate-700', max: 30 },
  { id: 'd08', name: 'D08', sub: 'Toán - Sinh - Anh', color: 'bg-slate-100 text-slate-700', max: 30 },
];

const firstNames = ["Cậu Bé", "Cô Bé", "Học sinh", "Chiến thần", "Chúa tể"];
const lastNames = ["Vàng", "Chăm Chỉ", "A", "Toán Học", "Bí Ẩn", "Minh H.", "Ngọc M."];
const schools = ["THPT Chuyên KHTN", "THPT Ams", "THPT Lê Hồng Phong", "THPT Trần Đại Nghĩa", "THPT Năng Khiếu", "THPT Chuyên Sư Phạm"];
const avatars = ['EF4444', '3B82F6', '10B981', 'F59E0B', '8B5CF6', 'EC4899', '06B6D4'];

function generateRandomData(maxScore: number) {
  let data = [];
  let currentScore = maxScore === 10 ? 10.0 : 30.0;
  
  for(let i = 1; i <= 10; i++) {
      const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const color = avatars[i % avatars.length];
      
      if (i > 1) {
          const drop = maxScore === 10 ? (Math.random() * 0.2) : (Math.random() * 0.5);
          currentScore = currentScore - drop;
      }

      data.push({
          rank: i,
          name: name,
          school: schools[i % schools.length],
          score: currentScore.toFixed(2),
          avatar: `https://placehold.co/100x100/${color}/FFF?text=${name.charAt(0)}`
      });
  }
  return data;
}

export default function LeaderboardPage() {
  const [currentMode, setCurrentMode] = useState<'subject' | 'block'>('subject');
  const [currentTabId, setCurrentTabId] = useState('toan');

  const items = currentMode === 'subject' ? SUBJECTS : BLOCKS;
  const currentItem = items.find(i => i.id === currentTabId) || items[0];
  const maxScore = currentMode === 'subject' ? 10 : 30;
  
  // Generating data based on tab change (simulating API fetch)
  // We use stable seed or just let it re-render (which changes on tab click)
  const [data, setData] = useState(() => generateRandomData(maxScore));

  const handleModeChange = (mode: 'subject' | 'block') => {
    setCurrentMode(mode);
    const newItems = mode === 'subject' ? SUBJECTS : BLOCKS;
    setCurrentTabId(newItems[0].id);
    setData(generateRandomData(mode === 'subject' ? 10 : 30));
  };

  const handleTabChange = (id: string) => {
    setCurrentTabId(id);
    setData(generateRandomData(maxScore));
  };

  const p1 = data[0];
  const p2 = data[1];
  const p3 = data[2];
  const rest = data.slice(3);

  const bannerTopic = currentMode === 'subject' ? `Môn ${currentItem.name}` : `Khối ${currentItem.name}`;

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 min-h-[70vh]">
      {/* Banner */}
      <div className="mb-8 md:mb-10 relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg border border-white/10">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#FACC15] opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative overflow-hidden w-full h-16 md:h-20 flex items-center">
          <div className="flex items-center w-full animate-marquee whitespace-nowrap px-4 text-white">
            <div className="flex items-center gap-3 mr-12">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#FACC15] text-slate-900 flex items-center justify-center text-lg md:text-xl shadow flex-shrink-0"><Trophy className="w-5 h-5" /></div>
              <div className="text-sm md:text-base font-medium">
                Chúc mừng <span className="font-extrabold text-[#FACC15]">{p1?.name}</span> ({p1?.school}) đạt Top 1 <span className="font-bold">{bannerTopic}</span> với <span className="font-black text-[#FACC15]">{p1?.score}</span> điểm!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Bảng xếp hạng</h1>
        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl text-xs md:text-sm font-medium border border-slate-200 dark:border-slate-700">
          <Clock className="w-4 h-4 text-[#2563EB]" /> 
          <span>Bảng xếp hạng cập nhật mỗi 5 phút. <span className="hidden sm:inline">Khối được tính bằng tổng điểm cao nhất của 3 môn.</span></span>
        </div>
        <div className="sm:hidden mt-2 text-[10px] text-slate-500">Khối được tính bằng tổng 3 môn.</div>
      </div>

      {/* Tabs Mode */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex gap-1 shadow-inner border border-slate-200 dark:border-slate-700 w-full max-w-sm">
          <button 
            className={`cursor-pointer flex-1 h-11 rounded-xl font-bold text-sm transition ${currentMode === 'subject' ? 'bg-white dark:bg-slate-700 text-[#2563EB] shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            onClick={() => handleModeChange('subject')}
          >
            Theo môn
          </button>
          <button 
            className={`cursor-pointer flex-1 h-11 rounded-xl font-bold text-sm transition ${currentMode === 'block' ? 'bg-white dark:bg-slate-700 text-[#2563EB] shadow' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            onClick={() => handleModeChange('block')}
          >
            Theo khối
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="mb-10 relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-[#0B1120] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-[#0B1120] to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex overflow-x-auto hide-scrollbar gap-2 px-2">
          {items.map(item => (
            <button 
              key={item.id}
              className={`cursor-pointer sub-tab min-h-[44px] h-auto py-2 px-4 rounded-xl font-bold text-sm border-2 whitespace-nowrap flex-shrink-0 flex flex-col items-center justify-center transition ${item.id === currentTabId ? 'border-[#2563EB] text-[#2563EB] bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:border-blue-300'}`}
              onClick={() => handleTabChange(item.id)}
            >
              {item.name}
              {currentMode === 'block' && <span className="text-[10px] font-normal opacity-70 block">{(item as any).sub}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Area */}
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden relative">
        
        {/* Podium Top 3 */}
        <div className="pt-10 pb-6 px-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/50 dark:to-[#1E293B] relative">
          <div className="flex justify-center items-end gap-2 sm:gap-6 relative z-10 min-h-[220px]">
            {/* Hạng 2 */}
            {p2 && (
              <div className="flex flex-col items-center w-24 sm:w-32 relative animate-in slide-in-from-bottom-8 duration-500">
                <div className="absolute -top-3 sm:-top-4 -right-1 sm:-right-2 w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-slate-200 to-slate-400 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center font-black text-slate-800 text-xs sm:text-sm shadow-md z-20">2</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p2.avatar} alt={p2.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-slate-300 dark:border-slate-500 shadow-lg relative z-10 bg-white" />
                <div className="w-full bg-gradient-to-t from-slate-200 to-white dark:from-slate-700 dark:to-slate-600 rounded-t-2xl shadow-xl mt-[-10px] sm:mt-[-16px] pt-4 sm:pt-6 pb-2 px-1 flex flex-col items-center h-28 sm:h-36 border border-slate-300 dark:border-slate-500 border-b-0 relative z-0">
                  <div className="font-bold text-[10px] sm:text-xs text-center line-clamp-1 w-full text-slate-800 dark:text-slate-100">{p2.name}</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 text-center w-full mb-auto">{p2.school}</div>
                  <div className="font-black text-sm sm:text-lg text-[#2563EB]">{p2.score}</div>
                </div>
              </div>
            )}

            {/* Hạng 1 */}
            {p1 && (
              <div className="flex flex-col items-center w-28 sm:w-40 relative animate-in slide-in-from-bottom-12 duration-700 z-20">
                <div className="absolute -top-4 sm:-top-5 -right-2 sm:-right-3 w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center font-black text-yellow-900 text-sm sm:text-lg shadow-md z-20"><Crown className="w-4 h-4 mb-0.5" /></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p1.avatar} alt={p1.name} className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-[#FACC15] shadow-xl relative z-10 bg-white" />
                <div className="w-full bg-gradient-to-t from-yellow-100 to-white dark:from-slate-800 dark:to-slate-700 rounded-t-2xl shadow-2xl mt-[-12px] sm:mt-[-20px] pt-5 sm:pt-7 pb-3 px-2 flex flex-col items-center h-36 sm:h-48 border border-[#FACC15] border-b-0 relative z-0">
                  <div className="font-bold text-xs sm:text-sm text-center line-clamp-1 w-full text-slate-900 dark:text-white">{p1.name}</div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 text-center w-full mb-auto">{p1.school}</div>
                  <div className="font-black text-lg sm:text-2xl text-[#F97316] drop-shadow-sm">{p1.score}</div>
                </div>
              </div>
            )}

            {/* Hạng 3 */}
            {p3 && (
              <div className="flex flex-col items-center w-24 sm:w-32 relative animate-in slide-in-from-bottom-8 duration-500">
                <div className="absolute -top-3 sm:-top-4 -right-1 sm:-right-2 w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-200 to-orange-400 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center font-black text-orange-900 text-xs sm:text-sm shadow-md z-20">3</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p3.avatar} alt={p3.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-orange-300 dark:border-orange-500 shadow-lg relative z-10 bg-white" />
                <div className="w-full bg-gradient-to-t from-orange-100 to-white dark:from-slate-700 dark:to-slate-600 rounded-t-2xl shadow-xl mt-[-10px] sm:mt-[-16px] pt-4 sm:pt-6 pb-2 px-1 flex flex-col items-center h-24 sm:h-32 border border-orange-300 dark:border-orange-500 border-b-0 relative z-0">
                  <div className="font-bold text-[10px] sm:text-xs text-center line-clamp-1 w-full text-slate-800 dark:text-slate-100">{p3.name}</div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 text-center w-full mb-auto">{p3.school}</div>
                  <div className="font-black text-sm sm:text-lg text-[#F97316]">{p3.score}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List Top 4 - 10 */}
        <div className="px-2 sm:px-4 py-4 pb-20 md:pb-24">
          {rest.map(user => (
            <div key={user.rank} className="flex items-center gap-3 sm:gap-4 p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition cursor-pointer">
              <div className="w-8 font-bold text-center text-slate-400">{user.rank}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatar} alt={user.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-200 dark:border-slate-700" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{user.name}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 truncate">{user.school}</div>
              </div>
              <div className="font-black text-[#2563EB] text-sm sm:text-base">{user.score}</div>
            </div>
          ))}
        </div>

        {/* Thứ hạng của bạn (Sticky Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900 text-white p-3 sm:p-4 flex items-center justify-between shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.3)] z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold font-mono">142</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://placehold.co/100x100/3B82F6/FFF?text=US" alt="You" className="w-10 h-10 rounded-full border-2 border-slate-700" />
            <div>
              <div className="font-bold text-sm">Học sinh A (Bạn)</div>
              <div className="text-[10px] text-slate-400">THPT Võ Thị Sáu</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-[#FACC15] text-lg">{maxScore === 10 ? '8.20' : '24.50'}</div>
            <div className="text-[10px] text-slate-400">Cố lên nhé!</div>
          </div>
        </div>

      </div>
    </main>
  );
}
