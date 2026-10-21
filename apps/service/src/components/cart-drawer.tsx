'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  X,
  Trash2,
  ArrowRight,
  Clock,
  Building2,
  MapPin,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';

export function CartDrawer() {
  const {
    items,
    partner,
    totalQuantity,
    subtotal,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  const router = useRouter();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#082046]/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#d5deea] text-[#082046] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="border-b border-[#d5deea] p-5 bg-[#F8FAFC]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0e7bf4] text-white shadow-sm">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#082046]">Your Service Cart</h2>
                  <p className="text-[11px] text-[#526987] font-semibold">
                    {totalQuantity} {totalQuantity === 1 ? 'service item' : 'service items'} selected
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-xl p-1.5 text-[#526987] hover:text-[#082046] hover:bg-[#edf2f8] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Linked Partner Center Info */}
            {partner && (
              <div className="mt-4 rounded-2xl border border-white bg-white p-3.5 space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-[#526987] font-bold text-[10px] uppercase tracking-wider">
                  <span>Selected Center</span>
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified Partner
                  </span>
                </div>
                <p className="font-black text-[#082046] text-sm truncate">{partner.name}</p>
                <p className="text-[#526987] text-[11px] flex items-center gap-1 truncate font-medium">
                  <MapPin className="h-3 w-3 text-[#0e7bf4] shrink-0" />
                  {partner.address}, {partner.city}
                </p>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#F0F4F8]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm text-[#7896bc]">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-black text-[#082046]">Your cart is empty</h3>
                <p className="text-xs text-[#526987] max-w-xs leading-relaxed font-medium">
                  Browse nearby MeeSeva, CSC, and Xerox centers to add certificate filing, PVC prints, or application assistance into your visit.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="cut-corner-card rounded-[20px] border border-white bg-white p-4 space-y-2.5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#0e7bf4]">
                        {item.category}
                      </span>
                      <h4 className="font-black text-[#082046] text-xs mt-1.5">{item.title}</h4>
                      <p className="text-[10px] text-[#526987] flex items-center gap-1 mt-0.5 font-semibold">
                        <Clock className="h-2.5 w-2.5 text-[#0e7bf4]" /> {item.turnaround}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#d5deea] text-xs">
                    <div className="flex items-center rounded-xl bg-[#edf2f8] px-2 py-1 shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-5 w-5 flex items-center justify-center text-[#526987] hover:text-[#082046] font-bold"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono font-black text-[#082046] px-2.5">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-5 w-5 flex items-center justify-center text-[#526987] hover:text-[#082046] font-bold"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="font-mono text-sm font-black text-[#0e7bf4]">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && (
            <div className="border-t border-[#d5deea] p-5 space-y-4 bg-white">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#526987] font-medium">
                  <span>Subtotal ({totalQuantity} items):</span>
                  <span className="font-mono font-black text-[#082046]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-[#526987] font-medium">
                  <span>Center Booking Convenience:</span>
                  <span className="font-mono font-bold text-emerald-700">FREE</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#d5deea] text-sm font-black text-[#082046]">
                  <span>Total Payable:</span>
                  <span className="font-mono text-[#0e7bf4] text-base">₹{subtotal}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-xl border border-[#d5deea] bg-white px-3.5 py-3 text-xs font-semibold text-[#526987] hover:text-rose-600 hover:bg-rose-50 transition shadow-sm"
                  title="Clear all items"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/checkout');
                  }}
                  className="cut-corner-btn flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e7bf4] px-5 py-3 text-xs font-bold text-white hover:bg-[#0c6fdc] transition shadow-clay-btn-azure active:scale-95"
                >
                  <span>Proceed to Slot Booking</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
