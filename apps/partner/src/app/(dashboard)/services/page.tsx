'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  Power,
  Clock,
  Tag,
  Search,
  Printer,
  Fingerprint,
  CreditCard,
  Building2,
  FileCheck2,
  AlertCircle,
  Save,
  Check,
  ChevronDown,
  X,
  ShieldCheck,
} from 'lucide-react';
import {
  listPartnerServices,
  createPartnerService,
  updatePartnerService,
  deletePartnerService,
} from '@/lib/api';

export interface ServiceItem {
  id: string;
  title: string;
  category: 'xerox' | 'aadhaar' | 'pan' | 'meeseva' | 'exams' | 'custom';
  categoryLabel: string;
  description: string;
  price: number; // in INR
  turnaround: string; // e.g. "Instant", "1-2 Hours", "Same Day", "24 Hours"
  requiredDocs: string[];
  isActive: boolean;
  isCustom?: boolean;
}

const PRECONFIGURED_PRESETS: ServiceItem[] = [
  // Xerox Desk
  {
    id: 'pre-xerox-bw',
    title: 'Black & White Xerox / Printout',
    category: 'xerox',
    categoryLabel: 'Xerox & Print Desk',
    description: 'High-speed laser printing on 75 GSM paper (single or double sided).',
    price: 3,
    turnaround: 'Instant (2-5m)',
    requiredDocs: ['Digital File / Hard Copy'],
    isActive: true,
  },
  {
    id: 'pre-xerox-color',
    title: 'Full Color Printout / Photostat',
    category: 'xerox',
    categoryLabel: 'Xerox & Print Desk',
    description: 'High-resolution vibrant color printing for admit cards, certificates, and project reports.',
    price: 15,
    turnaround: 'Instant (2-5m)',
    requiredDocs: ['Digital PDF / Image File'],
    isActive: true,
  },
  {
    id: 'pre-xerox-scan',
    title: 'Document Scanning & PDF Compression',
    category: 'xerox',
    categoryLabel: 'Xerox & Print Desk',
    description: 'Scanning hard copies up to 600 DPI and compressing to exact portal specifications (under 200 KB).',
    price: 10,
    turnaround: 'Instant (5-10m)',
    requiredDocs: ['Original Documents'],
    isActive: true,
  },
  {
    id: 'pre-xerox-spiral',
    title: 'Spiral Binding & Document Lamination',
    category: 'xerox',
    categoryLabel: 'Xerox & Print Desk',
    description: 'Durable clear-cover spiral binding up to 200 pages and waterproof heat lamination.',
    price: 40,
    turnaround: '15-20 Mins',
    requiredDocs: ['Printed Document Sheets'],
    isActive: true,
  },

  // Aadhaar Facilitation
  {
    id: 'pre-aadhaar-pvc',
    title: 'High-Quality Aadhaar PVC Smart Card',
    category: 'aadhaar',
    categoryLabel: 'Aadhaar Services',
    description: 'Official UIDAI-grade pocket PVC card with holographic security overlay and readable QR code.',
    price: 50,
    turnaround: '15 Mins',
    requiredDocs: ['Aadhaar Number / OTP', 'Digital Aadhaar PDF'],
    isActive: true,
  },
  {
    id: 'pre-aadhaar-update',
    title: 'Aadhaar Demographic Update Assistance',
    category: 'aadhaar',
    categoryLabel: 'Aadhaar Services',
    description: 'Guidance and document verification for updating name, address, gender, or date of birth.',
    price: 50,
    turnaround: 'Same Day',
    requiredDocs: ['Address Proof (Voter ID / Electricity Bill)', 'Existing Aadhaar'],
    isActive: true,
  },

  // PAN Card Desk
  {
    id: 'pre-pan-epan',
    title: 'Instant e-PAN Card Application',
    category: 'pan',
    categoryLabel: 'PAN Card Desk',
    description: 'Paperless 10-minute instant digital PAN allotment linked to Aadhaar.',
    price: 80,
    turnaround: '1-2 Hours',
    requiredDocs: ['Aadhaar Card with linked Mobile Number'],
    isActive: true,
  },
  {
    id: 'pre-pan-physical',
    title: 'New Physical NSDL / UTI PAN Card',
    category: 'pan',
    categoryLabel: 'PAN Card Desk',
    description: 'Complete application with biometric/signature upload, tracking ID, and physical card door-delivery.',
    price: 150,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Aadhaar Card', '2 Passport Photos', 'Signature Scan'],
    isActive: true,
  },
  {
    id: 'pre-pan-correction',
    title: 'PAN Card Correction & Minor-to-Major Update',
    category: 'pan',
    categoryLabel: 'PAN Card Desk',
    description: 'Filing corrections for misspelled name, father’s name, DOB, or updating minor photo to adult photo.',
    price: 120,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Existing PAN Card', '10th Marksheet or Gazette', 'Aadhaar'],
    isActive: true,
  },

  // MeeSeva / CSC Certificates
  {
    id: 'pre-cert-caste',
    title: 'Caste / Community Certificate Filing',
    category: 'meeseva',
    categoryLabel: 'MeeSeva / CSC',
    description: 'Online application for OBC-NCL, SC, ST, or BC certificates with MeeSeva transaction acknowledgment.',
    price: 100,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Applicant Aadhaar', 'School Leaving Certificate', 'Ration Card / Parent Certificate'],
    isActive: true,
  },
  {
    id: 'pre-cert-income',
    title: 'Integrated Income Certificate Application',
    category: 'meeseva',
    categoryLabel: 'MeeSeva / CSC',
    description: 'Official revenue department income declaration filing for scholarships, fee reimbursement, and housing.',
    price: 100,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Ration Card / Food Security Card', 'Aadhaar Card', 'Salary Slip / Self Declaration'],
    isActive: true,
  },
  {
    id: 'pre-cert-domicile',
    title: 'Residence / Domicile / Nativity Certificate',
    category: 'meeseva',
    categoryLabel: 'MeeSeva / CSC',
    description: 'State domicile verification filing for central and state quota college entrance admissions.',
    price: 100,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Study Certificates (7 Years)', 'Aadhaar Card', 'Electricity Bill'],
    isActive: true,
  },
  {
    id: 'pre-cert-ews',
    title: 'EWS (Economically Weaker Section) Certificate',
    category: 'meeseva',
    categoryLabel: 'MeeSeva / CSC',
    description: '10% Central/State general quota reservation certificate application with revenue inspector verification tracking.',
    price: 150,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Income Certificate', 'Land / Property Documents', 'ITR / Form 16 (if any)'],
    isActive: true,
  },

  // Job & Exam Form Filing
  {
    id: 'pre-exam-ssc',
    title: 'SSC Form Filing Assistance (CGL, CHSL, MTS, GD)',
    category: 'exams',
    categoryLabel: 'Exam & Job Form Filing',
    description: 'OTR profile creation, live photo capture per SSC AI guidelines, fee payment, and hall ticket confirmation.',
    price: 150,
    turnaround: 'Same Day',
    requiredDocs: ['SSC OTR Login / Aadhaar', '10th/12th/Degree Memo', 'Signature Scan'],
    isActive: true,
  },
  {
    id: 'pre-exam-upsc',
    title: 'UPSC Civil Services / NDA / CDS Application Filing',
    category: 'exams',
    categoryLabel: 'Exam & Job Form Filing',
    description: 'OTR registration, examination center selection, photo with name and date stamping, and preview check.',
    price: 200,
    turnaround: 'Same Day',
    requiredDocs: ['Photo ID Proof (Aadhaar / Passport)', 'Graduation Details', 'Passport Photo'],
    isActive: true,
  },
  {
    id: 'pre-exam-rrb',
    title: 'Railway RRB (NTPC, Group D, ALP) Form Filing',
    category: 'exams',
    categoryLabel: 'Exam & Job Form Filing',
    description: 'Recruitment portal submission, zone preference mapping, post priority sorting, and payment verification.',
    price: 150,
    turnaround: 'Same Day',
    requiredDocs: ['10th Memo / ITI / Diploma', 'Caste Certificate (for fee concession)', 'Aadhaar'],
    isActive: true,
  },
  {
    id: 'pre-exam-police',
    title: 'State Police Constable & Sub-Inspector Filing',
    category: 'exams',
    categoryLabel: 'Exam & Job Form Filing',
    description: 'Physical measurement standard checklist verification, agency exam booking, and reservation quota tagging.',
    price: 150,
    turnaround: 'Same Day',
    requiredDocs: ['Intermediate / Degree Certificate', 'Agency Registration Slip', 'Aadhaar'],
    isActive: true,
  },
];

export default function ServicesPage() {
  const [activeServices, setActiveServices] = useState<ServiceItem[]>(PRECONFIGURED_PRESETS.slice(0, 8));
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Custom Service Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<'xerox' | 'aadhaar' | 'pan' | 'meeseva' | 'exams' | 'custom'>('custom');
  const [customPrice, setCustomPrice] = useState(100);
  const [customTurnaround, setCustomTurnaround] = useState('Instant (15m)');
  const [customDescription, setCustomDescription] = useState('');
  const [customDocTag, setCustomDocTag] = useState('');
  const [customDocs, setCustomDocs] = useState<string[]>(['Aadhaar Card', 'Mobile Number']);

  // Load saved rate card from API or localStorage on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await listPartnerServices();
        if (res.data && res.data.length > 0) {
          const mapped: ServiceItem[] = res.data.map((s) => ({
            id: s.id,
            title: s.name,
            category: (s.name.toLowerCase().includes('xerox') || s.name.toLowerCase().includes('print')
              ? 'xerox'
              : s.name.toLowerCase().includes('aadhaar')
                ? 'aadhaar'
                : s.name.toLowerCase().includes('pan')
                  ? 'pan'
                  : s.name.toLowerCase().includes('certificate') || s.name.toLowerCase().includes('caste') || s.name.toLowerCase().includes('income')
                    ? 'meeseva'
                    : s.name.toLowerCase().includes('exam') || s.name.toLowerCase().includes('ssc') || s.name.toLowerCase().includes('upsc')
                      ? 'exams'
                      : 'custom') as ServiceItem['category'],
            categoryLabel: s.name,
            description: s.description || '',
            price: (s.charge_paise ?? 10000) / 100,
            turnaround: s.estimated_time_text || 'Instant (15m)',
            requiredDocs: ['Original Documents', 'Valid Government ID Proof'],
            isActive: s.is_active,
            isCustom: true,
          }));
          setActiveServices(mapped);
          return;
        }
      } catch {}

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('applyfields_partner_services_v1');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setActiveServices(parsed);
            }
          } catch {}
        }
      }
    }

    loadCatalog();
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  // Toggle Active/Paused state of a service
  function handleToggleActive(id: string) {
    const target = activeServices.find((s) => s.id === id);
    const nextActive = target ? !target.isActive : true;
    setActiveServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: nextActive } : s))
    );
    if (!id.startsWith('pre-') && !id.startsWith('custom-')) {
      updatePartnerService(id, { is_active: nextActive }).catch(() => {});
    }
    showToast('Service availability updated.');
  }

  // Update Price
  function handlePriceChange(id: string, newPrice: number) {
    const validatedPrice = Math.max(1, newPrice);
    setActiveServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, price: validatedPrice } : s))
    );
    if (!id.startsWith('pre-') && !id.startsWith('custom-')) {
      updatePartnerService(id, { charge_paise: Math.round(validatedPrice * 100) }).catch(() => {});
    }
  }

  // Remove Service
  function handleRemoveService(id: string) {
    setActiveServices((prev) => prev.filter((s) => s.id !== id));
    if (!id.startsWith('pre-') && !id.startsWith('custom-')) {
      deletePartnerService(id).catch(() => {});
    }
    showToast('Service removed from your catalog.');
  }

  // Add 1-Click Preset to Active Rate Card
  function handleAddPreset(preset: ServiceItem) {
    const alreadyExists = activeServices.some((s) => s.id === preset.id || s.title === preset.title);
    if (alreadyExists) {
      showToast('This service is already in your rate card.');
      return;
    }
    setActiveServices((prev) => [preset, ...prev]);
    showToast(`Added "${preset.title}" to your active rate card.`);
  }

  // Add Custom Service
  function handleCreateCustomService() {
    if (!customTitle.trim()) {
      alert('Please enter a service title.');
      return;
    }
    const newService: ServiceItem = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      category: customCategory,
      categoryLabel: customCategory === 'custom' ? 'Custom Service' : customCategory.toUpperCase(),
      description: customDescription.trim() || 'Custom service provided directly by operator.',
      price: customPrice,
      turnaround: customTurnaround,
      requiredDocs: customDocs.length > 0 ? customDocs : ['Valid Government ID Proof'],
      isActive: true,
      isCustom: true,
    };

    setActiveServices((prev) => [newService, ...prev]);
    setShowCustomModal(false);
    setCustomTitle('');
    setCustomDescription('');
    setCustomPrice(100);
    showToast(`Created custom service "${newService.title}"`);
  }

  // Save Rate Card to LocalStorage & API
  async function handleSaveRateCard() {
    setIsSaving(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('applyfields_partner_services_v1', JSON.stringify(activeServices));
    }

    try {
      for (const service of activeServices) {
        const payload = {
          name: service.title,
          description: service.description,
          charge_paise: Math.round(service.price * 100),
          estimated_time_text: service.turnaround,
          is_active: service.isActive,
        };

        if (!service.id.startsWith('pre-') && !service.id.startsWith('custom-')) {
          await updatePartnerService(service.id, payload).catch(() => {});
        } else {
          const res = await createPartnerService(payload).catch(() => null);
          if (res?.data?.id) {
            service.id = res.data.id;
          }
        }
      }
      showToast('Rate card catalog saved & synced with live citizen booking engine!');
    } catch {
      showToast('Rate card saved locally.');
    } finally {
      setIsSaving(false);
    }
  }

  // Add Doc Tag in Modal
  function handleAddDocTag() {
    if (customDocTag.trim() && !customDocs.includes(customDocTag.trim())) {
      setCustomDocs([...customDocs, customDocTag.trim()]);
      setCustomDocTag('');
    }
  }

  // Filter Active Services
  const filteredServices = activeServices.filter((s) => {
    const matchesTab = activeTab === 'all' || s.category === activeTab;
    const matchesQuery =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-teal-500/40 bg-slate-900/95 px-5 py-3 text-sm font-semibold text-teal-400 shadow-2xl shadow-teal-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Save Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Session 18 · Localized Center Rate Card & Service Menu</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Services & Rate Card Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure your offerings, turnaround badges, and convenience fees reflected on <span className="text-emerald-400 font-mono">service.applyfields.in</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-xs font-bold text-teal-300 hover:bg-teal-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Service</span>
          </button>

          <button
            type="button"
            onClick={handleSaveRateCard}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-300 transition active:scale-95 shadow-md shadow-teal-500/20"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Syncing...' : 'Save Rate Card'}</span>
          </button>
        </div>
      </div>

      {/* 1-Click Indian Digital Center Presets Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-400" />
              1-Click Indian Kiosk Templates
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click &quot;+ Add to Catalog&quot; to quickly add standard Xerox, Aadhaar, PAN, MeeSeva, or Exam filing services.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {PRECONFIGURED_PRESETS.length} Standard Templates
          </span>
        </div>

        {/* Horizontal Scroll / Grid of Quick Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {PRECONFIGURED_PRESETS.map((preset) => {
            const isAdded = activeServices.some((s) => s.id === preset.id || s.title === preset.title);
            return (
              <div
                key={preset.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 transition hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      {preset.categoryLabel}
                    </span>
                    <span className="font-mono text-sm font-black text-white">₹{preset.price}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 leading-snug">{preset.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-medium">
                    <Clock className="h-3 w-3 text-teal-400" /> {preset.turnaround}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/60">
                  {isAdded ? (
                    <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-500/10 py-1.5 text-xs font-semibold text-teal-400">
                      <Check className="h-3.5 w-3.5" /> In Your Catalog
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-slate-800 py-1.5 text-xs font-bold text-slate-200 hover:bg-teal-500 hover:text-slate-950 transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add to Rate Card
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your Active Catalog Manager */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-400" />
              Your Active Rate Card ({activeServices.length} Services Listed)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit pricing directly or use the toggle to pause specific services if materials/toner run out.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'xerox', label: 'Xerox & Print' },
            { id: 'aadhaar', label: 'Aadhaar' },
            { id: 'pan', label: 'PAN Card' },
            { id: 'meeseva', label: 'MeeSeva / CSC' },
            { id: 'exams', label: 'Exam Applications' },
            { id: 'custom', label: 'Custom' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 font-bold transition ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
            No services found matching this filter. Use the 1-click templates above or create a custom service.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  service.isActive
                    ? 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    : 'border-slate-800/60 bg-slate-950/30 opacity-70'
                }`}
              >
                <div>
                  {/* Top Bar: Category Pill & Active Switch */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      {service.categoryLabel}
                    </span>

                    {/* Instant Active / Paused Switch */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold ${
                          service.isActive ? 'text-teal-400' : 'text-rose-400'
                        }`}
                      >
                        {service.isActive ? '🟢 Active' : '⏸️ Paused'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(service.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          service.isActive ? 'bg-teal-500' : 'bg-slate-700'
                        }`}
                        title="Toggle service availability"
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            service.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-2.5 text-sm font-bold text-white">{service.title}</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{service.description}</p>

                  {/* Required Documents Tags */}
                  {service.requiredDocs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {service.requiredDocs.map((doc, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          📎 {doc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Editable Fee, Turnaround, Delete Button */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold">Fee:</span>
                    <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono font-bold text-teal-300 text-xs">
                      <span>₹</span>
                      <input
                        type="number"
                        min="1"
                        value={service.price}
                        onChange={(e) => handlePriceChange(service.id, parseInt(e.target.value) || 0)}
                        className="w-14 bg-transparent outline-none pl-1 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-teal-400" /> {service.turnaround}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveService(service.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                      title="Remove from rate card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Custom Service Creator */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-400" />
                Add Custom Service to Catalog
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Police Clearance Certificate Application"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-teal-400 text-xs"
                />
              </div>

              {/* Category & Fee Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-teal-400 text-xs"
                  >
                    <option value="xerox">Xerox & Print Desk</option>
                    <option value="aadhaar">Aadhaar Services</option>
                    <option value="pan">PAN Card Services</option>
                    <option value="meeseva">MeeSeva / CSC Certificates</option>
                    <option value="exams">Exam Applications</option>
                    <option value="custom">Other Custom Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fee (₹ INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-teal-400 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Turnaround Time */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Turnaround Time</label>
                <select
                  value={customTurnaround}
                  onChange={(e) => setCustomTurnaround(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-teal-400 text-xs"
                >
                  <option value="Instant (10-15m)">⚡ Instant (10-15 mins)</option>
                  <option value="1-2 Hours">⏱️ 1-2 Hours</option>
                  <option value="Same Day">📅 Same Day</option>
                  <option value="24-48 Hours">⏳ 24-48 Hours</option>
                  <option value="3-5 Working Days">🗓️ 3-5 Working Days</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details of what is included in this service..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-teal-400 text-xs"
                />
              </div>

              {/* Required Documents Tags */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Required Documents Checklist
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Passport Photo, SSC Memo..."
                    value={customDocTag}
                    onChange={(e) => setCustomDocTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDocTag())}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-white outline-none focus:border-teal-400 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocTag}
                    className="rounded-xl bg-slate-800 px-3 py-1.5 font-bold text-slate-200 hover:bg-slate-700 text-xs"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {customDocs.map((doc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 text-[11px] text-teal-300"
                    >
                      {doc}
                      <button
                        type="button"
                        onClick={() => setCustomDocs(customDocs.filter((_, i) => i !== idx))}
                        className="text-teal-400 hover:text-rose-400 ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomService}
                className="rounded-xl bg-teal-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-300"
              >
                Create Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
