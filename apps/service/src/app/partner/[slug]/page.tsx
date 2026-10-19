'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin,
  ShieldCheck,
  Star,
  Clock,
  Phone,
  MessageSquare,
  ArrowRight,
  Plus,
  Check,
  ShoppingBag,
  Building2,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { useCart, CartPartner } from '@/lib/cart-context';

interface ServiceDetail {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  price: number;
  turnaround: string;
  requiredDocs: string[];
}

const PARTNER_SERVICES: ServiceDetail[] = [
  {
    id: 'svc-1',
    title: 'Black & White Laser Print / Xerox',
    category: 'xerox',
    categoryLabel: 'Xerox & Print Desk',
    description: 'High-speed 75 GSM double/single-sided print for application forms and study materials.',
    price: 3,
    turnaround: 'Instant (2-5m)',
    requiredDocs: ['Digital File (PDF/Word) or Hard Copy'],
  },
  {
    id: 'svc-2',
    title: 'Full Color Printout (Admit Cards / Certs)',
    category: 'xerox',
    categoryLabel: 'Xerox & Print Desk',
    description: 'Clear photographic color printing on glossy or bright-white sheets.',
    price: 15,
    turnaround: 'Instant (2-5m)',
    requiredDocs: ['Digital PDF or Image File'],
  },
  {
    id: 'svc-3',
    title: 'High-Quality UIDAI Aadhaar PVC Smart Card',
    category: 'aadhaar',
    categoryLabel: 'Aadhaar Services',
    description: 'Pocket plastic smart card with embossed holographic security seal and verified QR code.',
    price: 50,
    turnaround: '15 Mins',
    requiredDocs: ['Aadhaar Number & Registered Mobile', 'eAadhaar PDF'],
  },
  {
    id: 'svc-4',
    title: 'Aadhaar Demographic Update Assistance',
    category: 'aadhaar',
    categoryLabel: 'Aadhaar Services',
    description: 'Document verification and correction filing for name, address, or date of birth.',
    price: 50,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Valid Address Proof (Electricity bill / Voter ID)'],
  },
  {
    id: 'svc-5',
    title: 'Instant e-PAN Card Application',
    category: 'pan',
    categoryLabel: 'PAN Card Desk',
    description: 'Paperless digital PAN generation directly linked with Aadhaar OTP.',
    price: 80,
    turnaround: '1-2 Hours',
    requiredDocs: ['Aadhaar Card with active mobile linking'],
  },
  {
    id: 'svc-6',
    title: 'New Physical NSDL / UTI PAN Card Application',
    category: 'pan',
    categoryLabel: 'PAN Card Desk',
    description: 'Complete registration with digital photograph, signature stamping, and home delivery.',
    price: 150,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Aadhaar Card', '2 Passport Photos', 'Signature Scan'],
  },
  {
    id: 'svc-7',
    title: 'Integrated Caste / Community Certificate Filing',
    category: 'meeseva',
    categoryLabel: 'MeeSeva / Revenue',
    description: 'Official revenue department OBC-NCL, SC, ST or BC certificate filing with acknowledgment.',
    price: 100,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Applicant Aadhaar', 'School TC / Marksheet', 'Parent Ration Card'],
  },
  {
    id: 'svc-8',
    title: 'Integrated Income Certificate Application',
    category: 'meeseva',
    categoryLabel: 'MeeSeva / Revenue',
    description: 'Essential certificate for state fee reimbursement, scholarship eligibility, and housing schemes.',
    price: 100,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Food Security / White Ration Card', 'Salary Proof or Self Declaration'],
  },
  {
    id: 'svc-9',
    title: 'SSC CGL / CHSL / MTS Online Registration Assistance',
    category: 'exams',
    categoryLabel: 'Exam & Job Form Filing',
    description: 'OTR profile setup, AI-compliant live photo capture, exam city sorting, and fee payment check.',
    price: 150,
    turnaround: 'Same Day Filing',
    requiredDocs: ['10th / 12th / Degree Certificates', 'Photo & Signature Scan'],
  },
];

export default function PartnerStorefrontPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'sri-balaji-meeseva-ameerpet';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addItem, items, setIsCartOpen, totalQuantity, subtotal } = useCart();

  // Partner Info
  const partner: CartPartner = {
    id: 'pt-1',
    name: 'Sri Balaji MeeSeva & Xerox Centre',
    slug,
    type: 'meeseva',
    address: 'Shop #12, Ground Floor, Opp Metro Pillar 1042, Main Road',
    city: 'Ameerpet',
    district: 'Hyderabad',
    phone: '+91 98480 12345',
  };

  const filteredServices = PARTNER_SERVICES.filter(
    (s) => selectedCategory === 'all' || s.category === selectedCategory,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        ← Back to All Centers
      </Link>

      {/* Partner Storefront Header Card */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
                MeeSeva &amp; CSC Digital Hub
              </span>
              <span className="flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> ApplyFields Verified Center
              </span>
              <span className="rounded-xl bg-slate-800 px-3 py-1 text-xs font-mono text-slate-300">
                📍 0.8 km from Ameerpet
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {partner.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 leading-relaxed max-w-2xl">
              <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{partner.address}, {partner.city}, {partner.district} - 500016</span>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <span className="flex items-center gap-1 font-bold text-amber-300">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                4.9 <span className="text-slate-400 font-normal">(218 verified citizen reviews)</span>
              </span>

              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold border-l border-slate-800 pl-4">
                <Clock className="h-3.5 w-3.5" />
                Open Today: 09:00 AM – 08:00 PM (30m Slots)
              </span>
            </div>
          </div>

          {/* Contact & Booking Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <a
              href="tel:+919848012345"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Phone className="h-4 w-4 text-cyan-400" /> Call Operator Desk
            </a>
            <a
              href="https://wa.me/919848012345"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp Operator
            </a>
          </div>
        </div>
      </div>

      {/* Service Catalog & Rate Card */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              Available Services &amp; Official Rate Card
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add services to your visit cart. Arrive at your reserved slot with documents ready.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Services' },
              { id: 'xerox', label: 'Xerox & Print' },
              { id: 'aadhaar', label: 'Aadhaar' },
              { id: 'pan', label: 'PAN Card' },
              { id: 'meeseva', label: 'MeeSeva' },
              { id: 'exams', label: 'Exam Filing' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`rounded-xl px-3 py-1.5 font-bold transition ${
                  selectedCategory === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const inCart = items.some((it) => it.serviceId === service.id);

            return (
              <div
                key={service.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                      {service.categoryLabel}
                    </span>
                    <span className="font-mono text-base font-black text-cyan-300">
                      ₹{service.price}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">{service.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{service.description}</p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    <span>Turnaround: <strong className="text-slate-200">{service.turnaround}</strong></span>
                  </div>

                  {service.requiredDocs.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Documents Needed:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {service.requiredDocs.map((doc, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                          >
                            📎 {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  {inCart ? (
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition"
                    >
                      <Check className="h-4 w-4" /> Added (Open Cart)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          {
                            id: service.id,
                            title: service.title,
                            category: service.categoryLabel,
                            price: service.price,
                            turnaround: service.turnaround,
                          },
                          partner,
                        )
                      }
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan-400 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-md shadow-cyan-500/20"
                    >
                      <Plus className="h-4 w-4" /> Add to Visit Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Cart Bar if items exist */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
          <div className="flex items-center justify-between rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 font-bold">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {totalQuantity} {totalQuantity === 1 ? 'service' : 'services'} added
                </p>
                <p className="text-[11px] text-cyan-300 font-mono font-bold">
                  Total: ₹{subtotal}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-md"
            >
              <span>View Cart &amp; Book Slot</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
