"use client";

import { Star, FileText, ShoppingCart, Heart, Download } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface DocumentCardProps {
  id: string;
  title: string;
  subject?: string;
  subjectColor?: string; // e.g. "blue", "lime"
  pages?: number;
  rating?: number;
  reviews?: number;
  reviewCount?: number;
  sales?: string;
  downloads?: number;
  priceOnline?: string;
  priceDownload?: string;
  originalPrice?: string;
  discount?: string;
  badge?: string;
  badgeColor?: "highlight" | "slate" | string;
  isFree: boolean;
  imageColor?: string;
  coverUrl?: string;
  cover_image_url?: string;
  thumbnail_url?: string;
  image_url?: string;
  avatar_url?: string;
  demo_file_url?: string;
  variant?: "default" | "horizontal" | "library";
  isFavorite?: boolean;
  onRemoveFromSaved?: (id: string) => void;
}

export function DocumentCard({
  id,
  title,
  subject,
  subjectColor = "blue",
  pages,
  rating,
  reviews,
  reviewCount,
  sales,
  downloads,
  priceOnline,
  priceDownload,
  originalPrice,
  discount,
  badge,
  badgeColor = "slate",
  isFree,
  imageColor = "3B82F6",
  coverUrl,
  cover_image_url,
  thumbnail_url,
  image_url,
  avatar_url,
  demo_file_url,
  variant = "default",
  isFavorite = false,
  onRemoveFromSaved,
}: DocumentCardProps) {
  // Lấy ảnh bìa theo thứ tự ưu tiên
  const coverImg = coverUrl || cover_image_url || thumbnail_url || image_url || avatar_url;

  // Map standard color names to specific tailwind variants
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    lime: "bg-lime-50 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
    slate: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    highlight: "bg-[#FACC15] text-orange-800",
  };

  const [favorited, setFavorited] = useState(isFavorite);
  const [user, setUser] = useState<any>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user && !isFavorite) {
        const { data } = await supabase
          .from("saved_documents")
          .select("id")
          .eq("document_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setFavorited(true);
        }
      }
    };
    checkFavoriteStatus();
  }, [id, supabase, isFavorite]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Vui lòng đăng nhập để lưu tài liệu!");
      return;
    }

    const previousState = favorited;
    setFavorited(!previousState);

    if (!previousState) {
      const { error } = await supabase
        .from("saved_documents")
        .insert({ document_id: id, user_id: user.id });
      
      if (error) {
        console.error("Error saving document:", error);
        setFavorited(previousState);
      }
    } else {
      const { error } = await supabase
        .from("saved_documents")
        .delete()
        .eq("document_id", id)
        .eq("user_id", user.id);
        
      if (error) {
        console.error("Error removing document:", error);
        setFavorited(previousState);
      } else if (onRemoveFromSaved) {
        onRemoveFromSaved(id);
      }
    }
  };

  const parsePrice = (priceStr?: string) => {
    if (!priceStr) return 0;
    return parseInt(priceStr.replace(/\D/g, '')) || 0;
  };
  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

  const currentPriceNum = parsePrice(priceOnline || priceDownload);
  const fakeOriginalPriceNum = currentPriceNum * 1.5;
  const fakeOriginalPrice = formatPrice(fakeOriginalPriceNum);

  const { cartItems, addToCart, removeFromCart } = useCart();
  const isInCart = cartItems.some(item => item.document_id === id);

  const dl = downloads || 0;
  const rate = rating || 0.0;
  const rev = reviewCount || reviews || 0;

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInCart) {
      removeFromCart(id);
    } else {
      addToCart(id);
    }
  };

  const getBadgeClass = (color: string) => colorMap[color] || colorMap["blue"];

  const containerClass = variant === "horizontal"
    ? "bg-white dark:bg-[#1E293B] rounded-2xl p-3 flex flex-row gap-4 shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700/60 dark:hover:border-slate-600 transition relative overflow-hidden group h-full"
    : variant === "library"
    ? "bg-white dark:bg-[#1E293B] rounded-2xl flex flex-col shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700/60 dark:hover:border-slate-600 transition relative overflow-hidden h-full"
    : "bg-white dark:bg-[#1E293B] rounded-2xl p-3 flex flex-row md:flex-col gap-4 shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-700/60 dark:hover:border-slate-600 transition relative overflow-hidden group h-full";

  const imageWrapperClass = variant === "horizontal"
    ? "w-20 h-24 rounded-lg overflow-hidden relative flex-shrink-0 bg-slate-100 dark:bg-slate-800"
    : variant === "library"
    ? "relative aspect-[3/4] w-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800"
    : "w-24 h-32 md:w-full md:h-48 rounded-xl overflow-hidden relative flex-shrink-0 bg-slate-100 dark:bg-slate-800";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`${containerClass} animate-pulse bg-slate-100 dark:bg-slate-800`} style={{ minHeight: variant === 'horizontal' ? '120px' : '280px' }} />;
  }

  const isValidImage = (url: any) => url && typeof url === 'string' && url !== 'null' && url !== 'undefined' && url.trim() !== '';
  const validCoverImg = isValidImage(coverImg) ? coverImg : null;
  const validDemoFile = isValidImage(demo_file_url) ? demo_file_url : null;

  return (
    <Link href={id ? `/doc/${id}` : '#'} className={containerClass + " cursor-pointer block"}>
      {badge && (
        <div className={`absolute top-0 right-0 text-xs font-bold px-2 py-1 rounded-bl-lg z-10 ${getBadgeClass(badgeColor)}`}>
          {badge}
        </div>
      )}
      
      <div className={imageWrapperClass}>
        {validCoverImg ? (
          <img 
            src={validCoverImg} 
            alt={title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : validDemoFile ? (
          <div className="w-full h-full relative group overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center transition-transform group-hover:scale-105">
            <iframe src={`${validDemoFile}#toolbar=0&navpanes=0&scrollbar=0`} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-50 mix-blend-multiply dark:mix-blend-screen" title="PDF Preview"></iframe>
            {variant !== "horizontal" && (
              <div className="relative z-10 flex flex-col items-center bg-white/80 dark:bg-black/60 px-3 py-2 rounded-xl backdrop-blur-sm">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Xem trước</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center p-3 transition-transform group-hover:scale-105 border border-slate-700">
            <div className={`${variant === "horizontal" ? "w-8 h-8 mb-0" : "w-10 h-10 mb-2"} bg-slate-700 rounded-full flex items-center justify-center shadow-sm`}>
              <FileText className={`${variant === "horizontal" ? "w-4 h-4" : "w-5 h-5"} text-slate-300`} />
            </div>
            {variant !== "horizontal" && (
              <span className="text-slate-300 font-bold text-center text-xs md:text-sm leading-snug">
                Tài liệu
              </span>
            )}
          </div>
        )}
        {discount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            {discount}
          </div>
        )}
      </div>

      <div 
        role="button"
        onClick={handleToggleSave}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 flex items-center justify-center hover:bg-white dark:hover:bg-black/70 transition shadow-sm z-20" aria-label="Thả tim">
        <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-300'}`} />
      </div>

      <div className={`flex flex-col justify-between flex-1 min-w-0 ${variant === "library" ? "p-3 sm:p-4 bg-white dark:bg-[#1E293B]" : ""}`}>
        <div className="min-w-0">
          {subject && (
            <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block ${getBadgeClass(subjectColor)}`}>
              {subject}
            </span>
          )}
          <h4 className={`font-bold text-sm md:text-base line-clamp-2 overflow-hidden text-ellipsis w-full break-all leading-snug text-slate-800 dark:text-slate-100 ${variant === "horizontal" ? "pr-8 md:pr-12" : ""}`}>
            {title}
          </h4>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" /> <span>{pages || 0} trang</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" /> <span>{dl} lượt tải</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4" fill="currentColor" />
                ))}
              </div>
              <span className="font-bold text-slate-200">{rate.toFixed(1)}</span>
              <span>({rev} đánh giá)</span>
            </div>
          </div>
        </div>

        {variant === "library" ? (
          <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/50">
            {isFree ? (
              <>
                <div className="mb-3 h-9 sm:h-[42px] flex items-center">
                  <span className="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">Miễn phí</span>
                </div>
                <div className="flex items-center gap-2">
                  <div role="button" className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 text-sm font-bold rounded-xl hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white transition flex items-center justify-center">
                    Xem miễn phí
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 line-through">{fakeOriginalPrice}</span>
                    <span className="bg-red-100 text-red-600 px-1 rounded text-[10px] font-bold">-33%</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#F97316] font-extrabold text-base sm:text-lg">{priceOnline || priceDownload}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    role="button"
                    onClick={handleCartClick}
                    className={`w-11 h-11 rounded-xl transition flex items-center justify-center flex-shrink-0 ${
                      isInCart 
                        ? "bg-[#F97316] text-white" 
                        : "bg-orange-50 text-[#F97316] dark:bg-orange-900/30 dark:text-orange-400 hover:bg-[#F97316] hover:text-white"
                    }`}
                    title={isInCart ? "Xóa khỏi giỏ" : "Thêm vào giỏ"}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div role="button" className="flex-1 h-11 bg-[#2563EB] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center">
                    Xem trước
                  </div>
                </div>
              </>
            )}
          </div>
        ) : isFree ? (
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-block px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold rounded w-max">
              Miễn Phí
            </span>
            <div role="button" className="text-[#2563EB] bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full hover:bg-[#2563EB] hover:text-white transition-colors flex items-center gap-1 text-xs font-bold">
              Xem miễn phí
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-400 line-through">{fakeOriginalPrice}</span>
                <span className="bg-red-100 text-red-600 px-1 rounded text-[10px] font-bold">-33%</span>
              </div>
              <div className="text-[#F97316] font-bold text-lg leading-none">
                {priceOnline || priceDownload}
              </div>
            </div>
            <div 
              role="button"
              onClick={handleCartClick}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition flex items-center justify-center flex-shrink-0 ${
                isInCart 
                  ? "bg-[#F97316] text-white" 
                  : "bg-orange-100 text-[#F97316] dark:bg-orange-900/40 dark:text-orange-400 hover:bg-[#F97316] hover:text-white"
              }`}
              title={isInCart ? "Xóa khỏi giỏ" : "Thêm vào giỏ"}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
