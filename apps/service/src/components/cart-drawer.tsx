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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="border-b border-slate-800 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Your Service Cart</h2>
                  <p className="text-[11px] text-slate-400">
                    {totalQuantity} {totalQuantity === 1 ? 'service item' : 'service items'} selected
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Linked Partner Center Info */}
            {partner && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <span>Selected Center</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified Partner
                  </span>
                </div>
                <p className="font-bold text-white text-sm truncate">{partner.name}</p>
                <p className="text-slate-400 text-[11px] flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                  {partner.address}, {partner.city}
                </p>
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-bold text-white">Your cart is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Browse nearby MeeSeva, CSC, and Xerox centers to add certificate filing, PVC prints, or application assistance into your visit.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2.5 transition hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-white text-xs mt-1.5">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5 text-cyan-400" /> {item.turnaround}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-5 w-5 flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono font-bold text-white px-2.5">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-5 w-5 flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="font-mono text-sm font-black text-cyan-300">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && (
            <div className="border-t border-slate-800 p-5 space-y-4 bg-slate-950/70">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({totalQuantity} items):</span>
                  <span className="font-mono font-bold text-white">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Center Booking Convenience:</span>
                  <span className="font-mono font-bold text-emerald-400">FREE</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-black text-white">
                  <span>Total Payable:</span>
                  <span className="font-mono text-cyan-300 text-base">₹{subtotal}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-3 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
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
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/20"
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
