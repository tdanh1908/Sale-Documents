'use client';
import { useState, useEffect } from 'react';
import { siteConfig } from '@/lib/site-config';
import { SiZalo } from 'react-icons/si';
import { FaFacebookMessenger } from 'react-icons/fa';

export function FloatingContact() {
  const [isBouncing, setIsBouncing] = useState(true);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsBouncing(false);
      return;
    }
    
    // Stop bounce after 4 seconds
    const timer = setTimeout(() => {
      setIsBouncing(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-6 right-4 md:right-8 flex flex-col gap-3 z-50">
      <a 
        href={siteConfig.links.zalo} 
        target="_blank" 
        rel="noreferrer"
        className={`w-12 h-12 rounded-full bg-[#0068FF] text-white flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110 ${isBouncing ? 'animate-bounce' : ''}`}
        title="Chat Zalo"
      >
        <SiZalo className="w-6 h-6" />
      </a>
      <a 
        href={siteConfig.links.messenger} 
        target="_blank" 
        rel="noreferrer"
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00C6FF] to-[#0072FF] text-white flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110"
        title="Chat Messenger"
      >
        <FaFacebookMessenger className="w-6 h-6" />
      </a>
    </div>
  );
}
