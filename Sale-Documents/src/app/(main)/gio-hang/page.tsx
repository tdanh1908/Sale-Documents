"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Check, AlertTriangle, ShoppingBasket, Trash2, X, Lightbulb, 
  Plus, Ticket, ArrowRight, ShieldCheck, ArrowLeft, Copy, 
  Info, Headset, Clock, BookOpen, Search 
} from "lucide-react";

import { createBrowserClient } from "@/lib/supabase/client";
import { useCart } from "@/contexts/CartContext";

const suggestedItems = [
  { id: "sug_1", title: "Công thức Lý 12", price: 5000, image: "https://placehold.co/150x200/8B5CF6/FFF?text=LY", subject: "Môn Lý", colorClass: "purple" },
  { id: "sug_2", title: "Sơ đồ tư duy Văn", price: 9000, image: "https://placehold.co/150x200/EC4899/FFF?text=VAN", subject: "Môn Văn", colorClass: "pink" },
];

export default function CartPage() {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const { removeFromCart } = useCart();
  const [supabase] = useState(() => createBrowserClient());
  const [user, setUser] = useState<any>(null);
  
  // Timer state (15:00)
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [successType, setSuccessType] = useState("auto");

  useEffect(() => {
    let mounted = true;
    async function fetchCart() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (mounted) setUser(session.user);
          const { data, error } = await supabase
            .from('cart_items')
            .select('*, documents(*)')
            .eq('user_id', session.user.id);
          
          if (error) throw error;
          
          if (mounted && data) {
            setCart(data);
            setSelectedItemIds(data.map((item: any) => item.id));
          }
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchCart();
  }, [supabase]);

  const formatMoney = (amount: number) => amount.toLocaleString("vi-VN") + "đ";

  // Calculate totals
  const selectedItems = cart.filter(item => selectedItemIds.includes(item.id));
  const subTotal = selectedItems.reduce((total, item) => {
    try {
      const doc = item.documents;
      if (!doc) return total;
      const basePrice = doc.price || doc.view_price || 0;
      const finalDocPrice = item.option === 'download' 
        ? Math.round((basePrice * 1.2) / 500) * 500
        : basePrice;
      return total + finalDocPrice;
    } catch(e) {
      return total;
    }
  }, 0);
  
  let discount = 0;
  if (appliedPromo === "FREE100") {
    discount = subTotal;
  }
  
  const finalTotal = subTotal - discount;
  const isFreeOrder = finalTotal === 0 && selectedItemIds.length > 0;
  const isUnderMinOrder = finalTotal > 0 && finalTotal < 2000;

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpdateOption = async (cartItemId: string, newOption: string) => {
    setCart(prev => prev.map(c => c.id === cartItemId ? { ...c, option: newOption } : c));
    const { error } = await supabase
      .from('cart_items')
      .update({ option: newOption })
      .eq('id', cartItemId);
    if (error) {
      console.error(error);
      alert("Lỗi cập nhật tùy chọn");
    }
  };

  const handleRemoveItem = async (cartItemId: string, documentId: string) => {
    setCart(prev => prev.filter(c => c.id !== cartItemId));
    setSelectedItemIds(prev => prev.filter(id => id !== cartItemId));
    await removeFromCart(documentId);
    if (cart.length <= 1) {
      setAppliedPromo(null);
      setPromoCode("");
    }
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === cart.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cart.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleAddSuggested = (sug: typeof suggestedItems[0]) => {
    // Keep it as a mock add or implement later
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === "FREE100") {
      setAppliedPromo("FREE100");
    } else {
      alert("Mã giảm giá không hợp lệ hoặc đã hết hạn!");
      setAppliedPromo(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCheckout = () => {
    if (isUnderMinOrder) return;
    if (isFreeOrder) {
      setSuccessType("auto");
      setStep(3);
    } else {
      setStep(2);
      setTimeLeft(15 * 60);
    }
  };

  return (
    <div className="relative pb-24 md:pb-0">
      
      {/* Progress Bar (Desktop) - Only show if not using global header progress bar, 
          but since we have a global header in layout.tsx, we put it here under a container */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="hidden md:flex flex-1 max-w-lg mx-auto items-center justify-center mb-8">
          <div className="flex items-center w-full justify-between relative">
            {/* Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2563EB] transition-all duration-500" 
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              ></div>
            </div>
            
            {/* Nodes */}
            <div className={`step-node flex flex-col items-center gap-1 ${step >= 1 ? 'active' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow ring-4 ring-slate-50 dark:ring-[#0F172A] transition-colors duration-300 ${step >= 1 ? 'bg-[#2563EB] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>1</div>
              <span className={`text-xs font-bold ${step >= 1 ? 'text-[#2563EB]' : 'text-slate-500 dark:text-slate-400'}`}>Giỏ hàng</span>
            </div>
            <div className={`step-node flex flex-col items-center gap-1 ${step >= 2 ? 'active' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-slate-50 dark:ring-[#0F172A] transition-colors duration-300 ${step >= 2 ? 'bg-[#2563EB] text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>2</div>
              <span className={`text-xs font-bold ${step >= 2 ? 'text-[#2563EB]' : 'text-slate-500 dark:text-slate-400'}`}>Thanh toán</span>
            </div>
            <div className={`step-node flex flex-col items-center gap-1 ${step >= 3 ? 'active' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ring-4 ring-slate-50 dark:ring-[#0F172A] transition-colors duration-300 ${step >= 3 ? 'bg-[#2563EB] text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}><Check className="w-4 h-4" /></div>
              <span className={`text-xs font-bold ${step >= 3 ? 'text-[#2563EB]' : 'text-slate-500 dark:text-slate-400'}`}>Hoàn tất</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar (Mobile) */}
      <div className="md:hidden bg-white dark:bg-[#1E293B] px-4 py-3 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 mb-6">
        <div className="flex items-center w-full justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#2563EB] transition-all duration-500"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            ></div>
          </div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-[#1E293B] ${step >= 1 ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>1</div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-[#1E293B] ${step >= 2 ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>2</div>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-[#1E293B] ${step >= 3 ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}><Check className="w-3 h-3" /></div>
        </div>
        <div className="text-center font-bold text-[#2563EB] mt-2 text-sm">
          {step === 1 ? "Giỏ hàng của bạn" : step === 2 ? "Thanh toán chuyển khoản" : "Thanh toán thành công"}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2 md:py-4 min-h-[60vh]">
        
        {/* ==================== BƯỚC 1: GIỎ HÀNG ==================== */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-6 hidden md:block text-slate-800 dark:text-slate-100">Giỏ hàng của bạn</h1>
            
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Cột trái: Danh sách item */}
              <div className="flex-1 w-full space-y-4">
                
                {/* Block cảnh báo đơn dưới 2k */}
                {isUnderMinOrder && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 mt-1 w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-red-700 dark:text-red-400">Giá trị thanh toán tối thiểu là 2.000đ</div>
                      <div className="text-sm text-red-600 dark:text-red-300 mt-1">Hệ thống ngân hàng không hỗ trợ chuyển khoản dưới 2.000đ. Vui lòng thêm tài liệu khác vào giỏ để tiếp tục.</div>
                    </div>
                  </div>
                )}

                {/* Giỏ hàng trống */}
                {loading ? (
                  <div className="flex justify-center py-12 text-slate-500">Đang tải giỏ hàng...</div>
                ) : cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                      <ShoppingBasket className="w-10 h-10" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100">Giỏ hàng trống</h3>
                    <p className="text-slate-500 text-sm mb-6">Bạn chưa có tài liệu nào trong giỏ.</p>
                    <Link href="/thu-vien" className="h-11 px-6 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition flex items-center justify-center">
                      Đi tìm tài liệu
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] accent-blue-600"
                        checked={cart.length > 0 && selectedItemIds.length === cart.length}
                        onChange={handleSelectAll}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-100">Chọn tất cả ({cart.length} sản phẩm)</span>
                    </div>
                    {cart.map((item) => {
                      const doc = item.documents;
                      if (!doc) return null;
                      
                      const basePrice = doc.price || doc.view_price || 0;
                      const downloadPrice = Math.round((basePrice * 1.2) / 500) * 500;
                      const currentPrice = item.option === 'download' ? downloadPrice : basePrice;

                      return (
                        <div key={item.id} className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 relative items-start sm:items-center">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] accent-blue-600 mt-2 sm:mt-0"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                          />
                          <div className={`w-20 h-28 sm:w-24 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-blue-50`}>
                            <img src={`https://placehold.co/200x266/3B82F6/FFF?text=TL`} alt="Bìa sách" className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="pr-8 sm:pr-0">
                              <span className={`text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md mb-2 inline-block`}>
                                {doc.subject || 'Khác'}
                              </span>
                              <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2 mb-2 text-slate-800 dark:text-slate-100">{doc.title}</h3>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              <label className="relative cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`pkg_${item.id}`} 
                                  value="view_only" 
                                  className="absolute opacity-0 w-0 h-0" 
                                  checked={item.option !== 'download'} 
                                  onChange={() => handleUpdateOption(item.id, 'view_only')} 
                                />
                                <div className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition text-sm ${item.option !== 'download' ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${item.option !== 'download' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {item.option !== 'download' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                  </div>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">Xem Online</span>
                                </div>
                              </label>

                              <label className="relative cursor-pointer">
                                <input 
                                  type="radio" 
                                  name={`pkg_${item.id}`} 
                                  value="download" 
                                  className="absolute opacity-0 w-0 h-0" 
                                  checked={item.option === 'download'} 
                                  onChange={() => handleUpdateOption(item.id, 'download')} 
                                />
                                <div className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition text-sm ${item.option === 'download' ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${item.option === 'download' ? 'border-[#2563EB] bg-[#2563EB]' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {item.option === 'download' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                  </div>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">Xem + Tải về</span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between border-t border-slate-100 sm:border-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                            <div className="font-extrabold text-[#2563EB] text-lg">{formatMoney(currentPrice)}</div>
                            <button 
                              className="w-11 h-11 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center" 
                              aria-label="Xóa" 
                              onClick={() => handleRemoveItem(item.id, item.document_id)}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <button 
                            className="absolute top-2 right-2 w-8 h-8 sm:hidden rounded-full text-slate-400 bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 flex items-center justify-center" 
                            onClick={() => handleRemoveItem(item.id, item.document_id)}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Gợi ý mua thêm (Hiển thị khi thiếu tiền) */}
                {cart.length > 0 && isUnderMinOrder && (
                  <div className="animate-in fade-in mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <Lightbulb className="text-[#FACC15] w-5 h-5 fill-current" /> Gợi ý tài liệu giá rẻ để đủ điều kiện
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {suggestedItems.map((sug) => (
                        <div key={sug.id} className="bg-white dark:bg-[#1E293B] rounded-xl p-2 border border-slate-100 dark:border-slate-800 flex flex-col hover:border-[#2563EB] transition group">
                          <div className={`aspect-[3/4] w-full rounded-lg overflow-hidden bg-${sug.colorClass}-50 mb-2`}>
                            <img src={sug.image} alt={sug.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="font-bold text-xs line-clamp-2 mb-1 text-slate-800 dark:text-slate-100">{sug.title}</div>
                          <div className="mt-auto flex items-center justify-between">
                            <span className="text-[#2563EB] font-extrabold text-sm">{formatMoney(sug.price)}</span>
                            <button 
                              className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#2563EB] flex items-center justify-center hover:bg-[#2563EB] hover:text-white transition"
                              onClick={() => handleAddSuggested(sug)}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cột phải: Tổng kết (Sticky) */}
              <div className="w-full lg:w-[380px] flex-shrink-0">
                <div className="sticky top-24 bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xl lg:shadow-md">
                  <h3 className="font-extrabold text-xl mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-800 dark:text-slate-100">Tóm tắt đơn hàng</h3>
                  
                  {/* Mã giảm giá */}
                  <div className="mb-4">
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Nhập mã giảm giá..." 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 rounded-xl pl-9 pr-4 text-sm focus:border-[#2563EB] outline-none text-slate-800 dark:text-slate-200 uppercase transition"
                        />
                      </div>
                      <button 
                        className="h-11 px-4 bg-slate-800 text-white dark:bg-slate-700 font-bold text-sm rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition disabled:opacity-50"
                        onClick={handleApplyPromo}
                        disabled={!promoCode.trim() || selectedItemIds.length === 0}
                      >
                        Áp dụng
                      </button>
                    </div>
                    {appliedPromo && (
                      <div className="text-xs font-bold mt-2 text-green-600 dark:text-green-400 transition-all flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đã áp dụng mã {appliedPromo} thành công!
                      </div>
                    )}
                  </div>

                  {/* Các dòng tiền */}
                  <div className="space-y-3 mb-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Tổng tiền hàng ({selectedItemIds.length} sản phẩm được chọn)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{formatMoney(subTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Giảm giá</span>
                        <span className="font-bold">-{formatMoney(discount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Thành tiền */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-slate-800 dark:text-slate-100">Thành tiền</span>
                      <div className="text-right">
                        <div className="font-black text-2xl text-[#F97316]">{formatMoney(finalTotal)}</div>
                        <div className="text-[10px] text-slate-400">(Đã bao gồm VAT)</div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <button 
                    className={`w-full h-12 text-white font-extrabold text-base rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none ${
                      selectedItemIds.length === 0 || isUnderMinOrder 
                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500 shadow-none' 
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                    }`}
                    onClick={handleCheckout}
                    disabled={selectedItemIds.length === 0 || isUnderMinOrder}
                  >
                    Thanh toán ngay <ArrowRight className="w-4 h-4" />
                  </button>
                  
                  <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-green-500" /> Giao dịch an toàn & bảo mật
                  </p>
                </div>
              </div>
            </div>
            
            {/* Thêm khu vực Test Case nhanh cho Developer ở cuối (không quá nổi bật) */}
            <div className="mt-12 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-xs text-slate-500 flex flex-wrap gap-2 items-center">
              <span className="font-bold">Test Shortcuts:</span>
              <button onClick={() => { setPromoCode("FREE100"); setAppliedPromo("FREE100"); }} className="px-2 py-1 bg-white dark:bg-slate-700 rounded border hover:border-[#2563EB] transition">Set FREE100</button>
              <button onClick={() => { setStep(3); setSuccessType('auto'); }} className="px-2 py-1 bg-white dark:bg-slate-700 rounded border hover:border-[#2563EB] transition">Success Auto</button>
              <button onClick={() => { setStep(3); setSuccessType('manual'); }} className="px-2 py-1 bg-white dark:bg-slate-700 rounded border hover:border-[#2563EB] transition">Success Manual</button>
            </div>
          </div>
        )}

        {/* ==================== BƯỚC 2: THANH TOÁN ==================== */}
        {step === 2 && (
          <div className="animate-in fade-in max-w-3xl mx-auto slide-in-from-right-4 duration-300">
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-800 text-center relative">
                <button 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 flex items-center justify-center text-[#2563EB] transition" 
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-extrabold text-lg text-[#2563EB]">Thanh toán chuyển khoản</h2>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Trái: QR Code */}
                <div className="flex-shrink-0 flex flex-col items-center w-full md:w-auto">
                  <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl border-4 border-[#2563EB] p-2 bg-white shadow-lg relative">
                    <img src="https://placehold.co/400x400/FFF/000?text=QR+CODE" alt="Mã QR" className="w-full h-full object-contain rounded-xl" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-lg p-1 shadow-md">
                      <div className="w-full h-full bg-blue-600 rounded flex items-center justify-center text-white font-black text-[10px]">MB</div>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="mt-6 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-200 border-l-[#2563EB] animate-spin"></div>
                    <span className="font-bold text-sm text-[#2563EB]">Đang chờ thanh toán...</span>
                  </div>
                </div>

                {/* Phải: Thông tin CK */}
                <div className="flex-1 w-full space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 md:p-5 border border-slate-100 dark:border-slate-800">
                    
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Ngân hàng thụ hưởng</div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">MB Bank (Ngân hàng Quân Đội)</div>
                      </div>
                      <div className="w-12 h-8 bg-blue-600 text-white rounded font-black text-xs flex items-center justify-center">MB</div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Tên tài khoản</div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 uppercase">CTY TNHH GIAO DUC ONTHIPRO</div>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Số tài khoản</div>
                          <div className="font-extrabold text-lg font-mono tracking-wider text-slate-800 dark:text-slate-100">8888 6666 9999</div>
                        </div>
                        <button 
                          className="h-10 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition flex items-center gap-2 text-slate-700 dark:text-slate-200" 
                          onClick={() => handleCopy('888866669999')}
                        >
                          <Copy className="w-4 h-4" /> Sao chép
                        </button>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Số tiền</div>
                          <div className="font-extrabold text-2xl text-[#F97316]">{formatMoney(finalTotal)}</div>
                        </div>
                        <button 
                          className="h-10 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition flex items-center gap-2 text-slate-700 dark:text-slate-200" 
                          onClick={() => handleCopy(finalTotal.toString())}
                        >
                          <Copy className="w-4 h-4" /> Sao chép
                        </button>
                      </div>
                      
                      <div className="pt-2">
                        <div className="text-xs text-slate-500 mb-1">Nội dung chuyển khoản (BẮT BUỘC)</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex-1 bg-white dark:bg-[#1E293B] h-11 border border-[#2563EB]/30 rounded-xl flex items-center px-4 font-mono font-bold text-[#2563EB] tracking-widest text-lg">
                            OTP2026A
                          </div>
                          <button 
                            className="h-11 px-4 bg-[#2563EB] text-white rounded-xl text-sm font-bold hover:bg-[#1D4ED8] transition flex items-center justify-center gap-2 flex-shrink-0 shadow-md shadow-blue-200 dark:shadow-none" 
                            onClick={() => handleCopy('OTP2026A')}
                          >
                            <Copy className="w-4 h-4" /> Sao chép
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cảnh báo & Đếm ngược */}
                  <div className="flex items-start gap-3 mt-4 text-sm text-slate-600 dark:text-slate-400">
                    <Info className="text-[#2563EB] mt-0.5 w-5 h-5 flex-shrink-0" />
                    <div>
                      LƯU Ý: Vui lòng chuyển <span className="font-bold text-[#F97316]">ĐÚNG SỐ TIỀN</span> và ghi <span className="font-bold text-[#2563EB]">ĐÚNG NỘI DUNG</span> để hệ thống mở khóa tài liệu tự động ngay lập tức.
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Thời gian giữ đơn:</div>
                    <div className="font-mono font-bold text-lg text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Box */}
              <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 text-center">
                <button className="h-11 px-6 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm flex items-center justify-center gap-2 mx-auto">
                  <Headset className="w-4 h-4" /> Tôi gặp vấn đề khi chuyển khoản
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== BƯỚC 3: HOÀN TẤT ==================== */}
        {step === 3 && (
          <div className="animate-in zoom-in-95 max-w-2xl mx-auto text-center py-8 duration-500">
            
            {successType === "auto" ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/40 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-green-50 dark:ring-green-900/10">
                  <Check className="w-12 h-12" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Thanh toán thành công!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Cảm ơn bạn đã tin tưởng. Tài liệu đã được thêm vào tủ sách của bạn.</p>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mb-8 text-left border border-slate-100 dark:border-slate-800 inline-block w-full max-w-sm mx-auto">
                  <div className="flex justify-between mb-3 text-sm">
                    <span className="text-slate-500">Mã đơn hàng:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">OTP2026A</span>
                  </div>
                  <div className="flex justify-between mb-3 text-sm">
                    <span className="text-slate-500">Số tài liệu:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItemIds.length} cuốn</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                    <span className="text-slate-500">Tổng thanh toán:</span>
                    <span className="font-black text-[#F97316] text-lg">{formatMoney(finalTotal)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/" className="h-12 w-full sm:w-auto px-8 rounded-full border-2 border-[#2563EB] text-[#2563EB] font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center justify-center gap-2">
                    Về trang chủ
                  </Link>
                  <Link href="/tai-khoan" className="h-12 w-full sm:w-auto px-8 bg-[#2563EB] text-white font-extrabold rounded-full hover:bg-[#1D4ED8] transition shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2">
                    <BookOpen className="w-5 h-5" /> Đọc tài liệu ngay
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-700 shadow-xl">
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/40 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-orange-50 dark:ring-orange-900/10">
                  <Clock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Đơn đang được xử lý!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Chúng tôi đã ghi nhận giao dịch của bạn. Do số tiền chuyển khoản có sai lệch hoặc sai nội dung, Admin sẽ kiểm tra thủ công và mở khóa trong vòng 5-15 phút.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                  <Link href="/" className="h-12 w-full sm:w-auto px-8 rounded-full border-2 border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center">
                    Về trang chủ
                  </Link>
                  <button className="h-12 w-full sm:w-auto px-8 bg-[#0068FF] text-white font-bold rounded-full hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2">
                    Chat Zalo với Admin
                  </button>
                </div>
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}

