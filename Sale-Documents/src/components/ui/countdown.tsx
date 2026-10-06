'use client';
import { useState, useEffect } from 'react';

export function Countdown() {
  const [mounted, setMounted] = useState(false);
  const [sec, setSec] = useState(12);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const timer = setInterval(() => {
      setSec((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-1 ml-2 text-white font-bold text-sm">
        <span className="bg-slate-800 dark:bg-black px-2 py-1 rounded">02</span>
        <span className="text-slate-800 dark:text-slate-200">:</span>
        <span className="bg-slate-800 dark:bg-black px-2 py-1 rounded">45</span>
        <span className="text-slate-800 dark:text-slate-200">:</span>
        <span className="bg-slate-800 dark:bg-black px-2 py-1 rounded">12</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 ml-2 text-white font-bold text-sm">
      <span className="bg-slate-800 dark:bg-black px-2 py-1 rounded">02</span>
      <span className="text-slate-800 dark:text-slate-200">:</span>
      <span className="bg-slate-800 dark:bg-black px-2 py-1 rounded">45</span>
      <span className="text-slate-800 dark:text-slate-200">:</span>
      <span className="bg-slate-800 dark:bg-black px-2 py-1 rounded">
        {sec < 10 ? `0${sec}` : sec}
      </span>
    </div>
  );
}
