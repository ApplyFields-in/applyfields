'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  User,
  CreditCard,
  QrCode,
  FileText,
  ArrowRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  Receipt,
  Layers,
  ChevronRight,
  Check,
  AlertCircle,
  Camera,
} from 'lucide-react';
import {
  COUNTER_CATALOG,
  CounterServiceItem,
  WalkInTicket,
} from '@/lib/counter-data';

export function CounterClient() {
  const router = useRouter();

  // Citizen Input State
  const [citizenName, setCitizenName] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [category, setCategory] = useState<'UR' | 'OBC-NCL' | 'SC' | 'ST' | 'EWS'>('OBC-NCL');
  const [aadhaarMasked, setAadhaarMasked] = useState('');

  // Selected Service
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-ssc-cgl');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Extras & Payment
  const [includeScanPrint, setIncludeScanPrint] = useState(true);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash');
  const [smsTokenAlert, setSmsTokenAlert] = useState(true);

  // Generated Ticket / Modal State
  const [activeTicket, setActiveTicket] = useState<WalkInTicket | null>(null);
  const [tokenCounter, setTokenCounter] = useState(43);

  // Recent walk-in queue
  const [recentWalkIns, setRecentWalkIns] = useState<WalkInTicket[]>([
    {
      tokenNumber: 'TK-042',
      createdAt: '10 mins ago',
      citizenName: 'B. Jagadeesh',
      mobile: '+91 99480 11928',
      gender: 'Male',
      category: 'ST',
      serviceTitle: 'Integrated Caste & Domicile Certificate',
      govtFee: 45,
      kioskFee: 50,
      printFee: 20,
      totalCollected: 115,
      paymentMode: 'Cash',
      status: 'scanning_pending',
    },
    {
      tokenNumber: 'TK-041',
      createdAt: '25 mins ago',
      citizenName: 'P. Sai Praneeth',
      mobile: '+91 98481 22910',
      gender: 'Male',
      category: 'OBC-NCL',
      serviceTitle: 'SSC CGL 2026 Application Filing',
      govtFee: 100,
      kioskFee: 70,
      printFee: 20,
      totalCollected: 190,
      paymentMode: 'UPI',
      status: 'dispatched_to_backoffice',
    },
  ]);

  const selectedService = useMemo(
    () => COUNTER_CATALOG.find((s) => s.id === selectedServiceId) || COUNTER_CATALOG[0],
    [selectedServiceId]
  );

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    return COUNTER_CATALOG.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Pricing calculations
  const govtFee = useMemo(() => {
    if (selectedService.femaleExemptGovtFee && gender === 'Female') return 0;
    return selectedService.govtFeePaise / 100;
  }, [selectedService, gender]);

  const kioskFee = selectedService.kioskFeePaise / 100;
  const printFee = includeScanPrint ? 20 : 0;
  const totalDue = govtFee + kioskFee + printFee;

  // Handle Token Generation
  const handleGenerateToken = (action: 'print' | 'scan' | 'backoffice') => {
    if (!citizenName.trim() || mobile.length < 10) {
      alert('Please enter a valid Citizen Full Name and 10-digit Mobile Number.');
      return;
    }

    const tokenNum = `TK-${String(tokenCounter).padStart(3, '0')}`;
    const newTicket: WalkInTicket = {
      tokenNumber: tokenNum,
      createdAt: 'Just now',
      citizenName: citizenName.trim(),
      mobile: mobile.trim(),
      gender,
      category,
      serviceTitle: selectedService.title,
      govtFee,
      kioskFee,
      printFee,
      totalCollected: totalDue,
      paymentMode,
      status: action === 'scan' ? 'scanning_pending' : 'dispatched_to_backoffice',
    };

    setActiveTicket(newTicket);
    setRecentWalkIns([newTicket, ...recentWalkIns]);
    setTokenCounter((prev) => prev + 1);

    if (action === 'scan') {
      router.push(`/scanner?token=${tokenNum}&name=${encodeURIComponent(citizenName)}&service=${encodeURIComponent(selectedService.title)}`);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-slate-100">
      {/* Top Banner / Counter Cockpit Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Kiosk Partner Operations</span>
            <span>/</span>
            <span className="text-emerald-400">Physical Counter POS</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl mt-1">
            Walk-In Registration &amp; Fee Billing
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
            Register walk-in citizens, quote official exam/certificate fees, issue printed queue slips, and route to scanner.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Next Token</span>
            <span className="font-mono text-base font-black text-emerald-400">TK-{String(tokenCounter).padStart(3, '0')}</span>
          </div>
          <Link
            href="/scanner"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <Camera className="size-4 text-emerald-400" />
            <span>Open Document Scanner</span>
          </Link>
        </div>
      </div>

      {/* Main Counter Workstation Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT PANE: Citizen Intake & Target Service Picker (7 Columns) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Step 1: Citizen Particulars */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <User className="size-4 text-emerald-400" />
                <span>1. Citizen Particulars</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Walk-in Counter Intake</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Citizen Full Name (as per 10th Memo) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value.toUpperCase())}
                  placeholder="e.g. KONGARA VENKATA NAVEEN"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mobile Number (for OTP &amp; Status SMS) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9848023194"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 font-mono text-xs font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`rounded-xl py-2 text-xs font-bold transition border ${
                        gender === g
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Social Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="UR">UR (General / Open)</option>
                  <option value="OBC-NCL">OBC Non-Creamy Layer</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="EWS">EWS (Economically Weaker)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={smsTokenAlert}
                  onChange={(e) => setSmsTokenAlert(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                />
                <span>Send queue token slip &amp; OTP alert to citizen via WhatsApp/SMS</span>
              </label>
            </div>
          </div>

          {/* Step 2: Target Opportunity / Service Picker */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Layers className="size-4 text-emerald-400" />
                <span>2. Select Requested Service or Exam</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search SSC, UPSC, Caste..."
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Service Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Services' },
                { id: 'Recruitment Exam', label: 'Recruitment Exams' },
                { id: 'MeeSeva Certificate', label: 'MeeSeva Certificates' },
                { id: 'Identity & Card', label: 'PAN & Identity' },
                { id: 'Printing & Xerox', label: 'Printing & Scan Pack' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                    categoryFilter === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1">
              {filteredCatalog.map((service) => {
                const isSelected = service.id === selectedServiceId;
                const isExempt = service.femaleExemptGovtFee && gender === 'Female';
                const serviceGovtFee = isExempt ? 0 : service.govtFeePaise / 100;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`flex flex-col justify-between text-left rounded-xl border p-3 transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 shadow-xs'
                        : 'border-slate-800 bg-slate-800/60 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-white line-clamp-1">{service.title}</span>
                        {isSelected && <Check className="size-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{service.category}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[11px]">
                      <span className="text-slate-400">
                        Govt Fee:{' '}
                        <strong className="text-slate-200">
                          {isExempt ? 'FREE' : `₹${serviceGovtFee}`}
                        </strong>
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        Kiosk: ₹{service.kioskFeePaise / 100}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Required Documents Alert */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-xs space-y-1">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="size-3.5 text-emerald-400" />
                Physical Documents Needed from Citizen:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedService.requiredDocuments.map((doc, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Counter Bill Slip, Payment & Actions (5 Columns) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Dynamic Counter Bill Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Counter Billing Breakdown</h3>
              </div>
              <span className="font-mono text-xs text-slate-400">POS Slip</span>
            </div>

            {/* Itemized summary */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Selected Service:</span>
                <span className="font-bold text-white max-w-[200px] truncate text-right">{selectedService.title}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Official Government Fee:</span>
                <span className="font-mono font-bold text-slate-200">
                  {selectedService.femaleExemptGovtFee && gender === 'Female' ? '₹0.00 (Female Exempt)' : `₹${govtFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Kiosk Counter Assistance Fee:</span>
                <span className="font-mono font-bold text-emerald-400">₹{kioskFee.toFixed(2)}</span>
              </div>

              {/* Addon: Document Scanning & Print */}
              <div className="flex items-center justify-between text-slate-300 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeScanPrint}
                    onChange={(e) => setIncludeScanPrint(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Digitization &amp; Print Slip Pack</span>
                </label>
                <span className="font-mono font-bold text-slate-200">₹{printFee.toFixed(2)}</span>
              </div>

              {/* Total Due Callout */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-sm font-black text-white">
                <span>Total Cash to Collect:</span>
                <span className="font-mono text-xl text-emerald-400">₹{totalDue.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-1.5 border-t border-slate-800 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Counter Payment Mode
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('Cash')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold border transition ${
                    paymentMode === 'Cash'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <CreditCard className="size-3.5" />
                  <span>Cash In Hand</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold border transition ${
                    paymentMode === 'UPI'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <QrCode className="size-3.5" />
                  <span>Counter UPI Scan</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleGenerateToken('scan')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 active:scale-98"
              >
                <Camera className="size-4" />
                <span>Save &amp; Open Scanner Tool (Recommended)</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateToken('backoffice')}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-750 transition"
              >
                <ArrowRight className="size-4 text-emerald-400" />
                <span>Direct Dispatch to Back-Office Desk</span>
              </button>
            </div>
          </div>

          {/* Recent Counter Walk-ins Register */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300">Today's Walk-in Queue</span>
              <span className="text-[10px] text-slate-500">{recentWalkIns.length} registered</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recentWalkIns.map((ticket, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/50 p-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-400">{ticket.tokenNumber}</span>
                      <span>·</span>
                      <span className="font-bold text-white truncate max-w-[130px]">{ticket.citizenName}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate max-w-[190px]">{ticket.serviceTitle}</p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 block">₹{ticket.totalCollected}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        ticket.status === 'dispatched_to_backoffice'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {ticket.status === 'dispatched_to_backoffice' ? 'DISPATCHED' : 'NEEDS SCAN'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
