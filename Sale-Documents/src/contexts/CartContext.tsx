"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

type CartItemState = {
  document_id: string;
  option: string;
};

type CartContextType = {
  cartItems: CartItemState[];
  addToCart: (documentId: string, option?: string) => Promise<void>;
  removeFromCart: (documentId: string) => Promise<void>;
  updateCartItemOption: (documentId: string, newOption: string) => Promise<void>;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItemState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createBrowserClient());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function initCart() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase
          .from('cart_items')
          .select('document_id, option')
          .eq('user_id', session.user.id);
        
        if (mounted && data) {
          setCartItems(data.map(item => ({ document_id: item.document_id, option: item.option })));
        }
      }
      if (mounted) setIsLoading(false);
    }

    initCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from('cart_items')
            .select('document_id, option')
            .eq('user_id', session.user.id);
          if (data) setCartItems(data.map(item => ({ document_id: item.document_id, option: item.option })));
        } else {
          setUser(null);
          setCartItems([]);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const addToCart = async (documentId: string, option?: string) => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }
    
    const finalOption = option || 'view_only';
    const existingIndex = cartItems.findIndex(item => item.document_id === documentId);
    
    if (existingIndex !== -1) {
      if (cartItems[existingIndex].option === finalOption) return; // already exists with same option
      // Needs update
      return updateCartItemOption(documentId, finalOption);
    }

    // Optimistic UI update
    setCartItems(prev => [...prev, { document_id: documentId, option: finalOption }]);
    
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, document_id: documentId, option: finalOption });

    if (error) {
      console.error("Error adding to cart:", error);
      // Revert optimistic update
      setCartItems(prev => prev.filter(item => item.document_id !== documentId));
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    } else {
      alert("Đã thêm vào giỏ");
    }
  };

  const removeFromCart = async (documentId: string) => {
    if (!user) return;
    
    const removedItem = cartItems.find(item => item.document_id === documentId);
    
    // Optimistic update
    setCartItems(prev => prev.filter(item => item.document_id !== documentId));

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .match({ user_id: user.id, document_id: documentId });

    if (error && removedItem) {
      console.error("Error removing from cart:", error);
      // Revert
      setCartItems(prev => [...prev, removedItem]);
    }
  };

  const updateCartItemOption = async (documentId: string, newOption: string) => {
    if (!user) return;
    
    const originalItem = cartItems.find(item => item.document_id === documentId);
    if (!originalItem || originalItem.option === newOption) return;

    // Optimistic update
    setCartItems(prev => prev.map(item => item.document_id === documentId ? { ...item, option: newOption } : item));

    const { error } = await supabase
      .from('cart_items')
      .update({ option: newOption })
      .match({ user_id: user.id, document_id: documentId });

    if (error) {
      console.error("Error updating cart option:", error);
      // Revert
      setCartItems(prev => prev.map(item => item.document_id === documentId ? { ...item, option: originalItem.option } : item));
      alert("Có lỗi xảy ra khi cập nhật, vui lòng thử lại.");
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateCartItemOption, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
