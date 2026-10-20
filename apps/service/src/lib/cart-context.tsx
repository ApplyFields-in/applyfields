'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  id: string; // unique item id in cart
  serviceId: string;
  title: string;
  category: string;
  price: number; // in INR
  turnaround: string;
  quantity: number;
}

export interface CartPartner {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string;
  city: string;
  district: string;
  phone?: string;
}

interface CartContextType {
  items: CartItem[];
  partner: CartPartner | null;
  totalQuantity: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (
    service: { id: string; title: string; category?: string; price: number; turnaround?: string },
    partnerInfo: CartPartner,
    quantity?: number,
  ) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  partner: null,
  totalQuantity: 0,
  subtotal: 0,
  isCartOpen: false,
  setIsCartOpen: () => {},
  addItem: () => false,
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [partner, setPartner] = useState<CartPartner | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('applyfields_citizen_cart_v1');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            setItems(parsed.items);
            setPartner(parsed.partner || null);
          }
        } catch {}
      }
    }
  }, []);

  // Save to localStorage whenever items or partner change
  function persistCart(newItems: CartItem[], newPartner: CartPartner | null) {
    setItems(newItems);
    setPartner(newPartner);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'applyfields_citizen_cart_v1',
        JSON.stringify({ items: newItems, partner: newPartner }),
      );
    }
  }

  function addItem(
    service: { id: string; title: string; category?: string; price: number; turnaround?: string },
    partnerInfo: CartPartner,
    quantity: number = 1,
  ): boolean {
    // If cart already has items from a DIFFERENT center, prompt or reset
    if (partner && partner.id !== partnerInfo.id && items.length > 0) {
      const confirmSwitch = window.confirm(
        `Your cart currently contains services from "${partner.name}". Would you like to clear your cart and start a new booking with "${partnerInfo.name}"?`,
      );
      if (!confirmSwitch) return false;
      // Clear and proceed with new partner
      const freshItem: CartItem = {
        id: `${service.id}-${Date.now()}`,
        serviceId: service.id,
        title: service.title,
        category: service.category || 'General Service',
        price: service.price,
        turnaround: service.turnaround || 'Standard',
        quantity: Math.max(1, quantity),
      };
      persistCart([freshItem], partnerInfo);
      setIsCartOpen(true);
      return true;
    }

    // Check if service already in cart
    const existingIndex = items.findIndex((it) => it.serviceId === service.id);
    let updatedItems: CartItem[];
    if (existingIndex >= 0) {
      updatedItems = items.map((it, idx) =>
        idx === existingIndex ? { ...it, quantity: it.quantity + quantity } : it,
      );
    } else {
      const newItem: CartItem = {
        id: `${service.id}-${Date.now()}`,
        serviceId: service.id,
        title: service.title,
        category: service.category || 'General Service',
        price: service.price,
        turnaround: service.turnaround || 'Standard',
        quantity: Math.max(1, quantity),
      };
      updatedItems = [...items, newItem];
    }

    persistCart(updatedItems, partnerInfo);
    setIsCartOpen(true);
    return true;
  }

  function removeItem(id: string) {
    const updated = items.filter((it) => it.id !== id);
    if (updated.length === 0) {
      persistCart([], null);
    } else {
      persistCart(updated, partner);
    }
  }

  function updateQuantity(id: string, qty: number) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    const updated = items.map((it) => (it.id === id ? { ...it, quantity: qty } : it));
    persistCart(updated, partner);
  }

  function clearCart() {
    persistCart([], null);
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        partner,
        totalQuantity,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
