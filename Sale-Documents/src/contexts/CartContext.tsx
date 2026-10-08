"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

type CartContextType = {
  cartItems: string[];
  addToCart: (documentId: string, option?: string) => Promise<void>;
  removeFromCart: (documentId: string) => Promise<void>;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<string[]>([]);
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
          .select('document_id')
          .eq('user_id', session.user.id);
        
        if (mounted && data) {
          setCartItems(data.map(item => item.document_id));
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
            .select('document_id')
            .eq('user_id', session.user.id);
          if (data) setCartItems(data.map(item => item.document_id));
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
    
    if (cartItems.includes(documentId)) return;

    // Optimistic UI update
    setCartItems(prev => [...prev, documentId]);
    
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, document_id: documentId, option: option || 'view_only' });

    if (error) {
      console.error("Error adding to cart:", error);
      // Revert optimistic update
      setCartItems(prev => prev.filter(id => id !== documentId));
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    } else {
      alert("Đã thêm vào giỏ");
    }
  };

  const removeFromCart = async (documentId: string) => {
    if (!user) return;
    
    // Optimistic update
    setCartItems(prev => prev.filter(id => id !== documentId));

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .match({ user_id: user.id, document_id: documentId });

    if (error) {
      console.error("Error removing from cart:", error);
      // Revert
      setCartItems(prev => [...prev, documentId]);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, isLoading }}>
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
