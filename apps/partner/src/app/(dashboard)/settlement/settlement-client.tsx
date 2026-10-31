'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Receipt,
  Banknote,
  QrCode,
  AlertCircle,
  AlertTriangle,
  FileText,
  Lock,
  UserCheck,
} from 'lucide-react';
import { usePartnerAuth } from '@/lib/auth-context';

interface SettlementRecord {
  id: string;
  cycleDate: string;
  utrNumber: string;
  accountMasked: string;
  amountPaise: number;
  ordersCount: number;
  status: 'cleared' | 'processing';
}

interface DisputedEscrowItem {
  id: string;
  bookingToken: string;
  serviceTitle: string;
  disputeReason: string;
  heldAmount: number;
  status: 'under_arbitration' | 'refunded' | 'released_to_partner';
  openedAt: string;
}

const SETTLEMENT_HISTORY: SettlementRecord[] = [
  {
    id: 'st-901',
    cycleDate: '26 Oct 2026',
    utrNumber: 'CMS881920194812',
    accountMasked: 'SBI A/c **** 4102',
    amountPaise: 840000,
    ordersCount: 48,
    status: 'cleared',
  },
  {
    id: 'st-902',
    cycleDate: '19 Oct 2026',
    utrNumber: 'CMS771029381920',
    accountMasked: 'SBI A/c **** 4102',
    amountPaise: 672000,
    ordersCount: 39,
    status: 'cleared',
  },
  {
    id: 'st-903',
    cycleDate: '12 Oct 2026',
    utrNumber: 'CMS661928401928',
    accountMasked: 'SBI A/c **** 4102',
    amountPaise: 915000,
    ordersCount: 52,
    status: 'cleared',
  },
];

const DISPUTED_ESCROW_HOLD: DisputedEscrowItem[] = [
  {
    id: 'dsp-01',
    bookingToken: 'AF-HYD-8824',
    serviceTitle: 'Telangana MeeSeva Income & Asset Certificate',
    disputeReason: 'Candidate signature scan defect claimed - citizen requested partial service fee review.',
    heldAmount: 120,
    status: 'under_arbitration',
    openedAt: '30 Oct 2026',
  },
];

export function SettlementClient() {
  const { activeRole, switchRole } = usePartnerAuth();
  const [walletBalance, setWalletBalance] = useState<number>(3420);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [payoutRequestedSuccess, setPayoutRequestedSuccess] = useState<boolean>(false);

  // If role is staff, display access restricted screen
  if (activeRole === 'staff') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center space-y-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Lock className="size-7" />
        </div>
        <div className="space-y-2">
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
            [Staff / Counter Operator Mode]
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Cash Drawer & Settlement Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Bank accounts, cash drawer balances, and escrow payout withdrawals are restricted exclusively to the Center Owner account. Sub-operators and counter staff are granted permissions for POS walk-in intake, document scanning, and order filing only.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left text-xs max-w-md mx-auto space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Permitted Staff Capabilities:</span>
          </div>
          <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
            <li>Customer Intake & Counter POS ticket issuance</li>
            <li>Document Scanner, cropper, and compressor</li>
            <li>Government portal candidate form autofill</li>
            <li>Official acknowledgment WhatsApp dispatch</li>
          </ul>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => switchRole('owner')}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
          >
            <UserCheck className="size-4 text-emerald-400" />
            <span>Switch to Owner Role (Demo / Elevation)</span>
          </button>
        </div>
      </div>
    );
  }

  const handleRequestPayout = () => {
    setIsRequesting(true);
    setTimeout(() => {
      setIsRequesting(false);
      setPayoutRequestedSuccess(true);
      setWalletBalance(0);
    }, 800);
  };

  const handleExportCsv = () => {
    const headers = ['Settlement ID', 'Cycle Date', 'UTR Number', 'Bank Account', 'Orders Fulfilled', 'Amount (INR)', 'Status'];
    const rows = SETTLEMENT_HISTORY.map((s) => [
      s.id,
      s.cycleDate,
      s.utrNumber,
      s.accountMasked,
      s.ordersCount,
      (s.amountPaise / 100).toFixed(2),
      s.status.toUpperCase(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kiosk_settlement_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Kiosk Partner Operations</span>
            <span>/</span>
            <span className="text-emerald-400">Settlement Ledger & Cash Register</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl mt-1">
            Cash Drawer & Commission Wallet
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
            Balance today's counter register and withdraw your 70% commission share for assisted citizen filings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-750 transition"
        >
          <Download className="size-3.5" />
          <span>Export Settlement CSV</span>
        </button>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Cash in Drawer Today */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Today's Counter Cash</span>
            <Banknote className="size-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">Rs. 4,250.00</p>
          <span className="text-[11px] text-slate-500 font-mono">From 18 walk-in citizens</span>
        </div>

        {/* Metric 2: Govt Fees Disbursed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Government Fees Disbursed</span>
            <Receipt className="size-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-200">Rs. 2,740.00</p>
          <span className="text-[11px] text-slate-500 font-mono">Exam fees paid online</span>
        </div>

        {/* Metric 3: Kiosk Retained Counter Net */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Counter Net Profit Today</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">Rs. 1,510.00</p>
          <span className="text-[11px] text-emerald-500/80 font-mono">Retained immediately at desk</span>
        </div>

        {/* Metric 4: ApplyFields Commission Wallet */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
            <span>Platform Commission Balance</span>
            <Wallet className="size-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">Rs. {walletBalance.toFixed(2)}</p>
          <span className="text-[11px] text-emerald-500/80 font-mono">Cleared for bank transfer</span>
        </div>
      </div>

      {/* Main Content Grid: Cash Register Breakdown + Bank Settlement Box */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT: Daily Cash Register Ledger (7 Columns) */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Daily Counter Cash Drawer Reconciliation</h3>
              </div>
              <span className="font-mono text-xs text-slate-400">29 Oct 2026</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-300">Physical Cash In Counter Drawer:</span>
                <strong className="font-mono text-white text-sm">Rs. 2,800.00</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-300">Counter QR Code UPI Collections:</span>
                <strong className="font-mono text-emerald-400 text-sm">Rs. 1,450.00</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-300">Net Counter Earnings Retained:</span>
                <strong className="font-mono text-emerald-400 text-sm">Rs. 1,510.00</strong>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-300">Kiosk Settlement Rule:</p>
              <p>
                Counter fees (Rs. 70 assistance + Rs. 20 print pack) are collected and retained directly by the kiosk in cash or shop UPI. ApplyFields automatically deposits the remaining 70% back-office margin for online bookings directly to your bank account weekly.
              </p>
            </div>
          </div>

          {/* Disputed Escrow Deductions & Claims */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Disputed Escrow Holds & Claims</h3>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 font-mono">
                {DISPUTED_ESCROW_HOLD.length} Active Hold
              </span>
            </div>

            <div className="space-y-3">
              {DISPUTED_ESCROW_HOLD.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400">{item.bookingToken}</span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
                      [Escrow Held: Rs. {item.heldAmount}]
                    </span>
                  </div>
                  <p className="font-bold text-white">{item.serviceTitle}</p>
                  <p className="text-slate-400 leading-normal">{item.disputeReason}</p>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Filed: {item.openedAt}</span>
                    <span className="text-amber-400 font-semibold">Under Admin Arbitration Desk</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Bank Disbursements Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Weekly Bank Disbursement History</h3>
              <span className="text-xs text-slate-400 font-mono">Direct NEFT / IMPS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Cycle Date</th>
                    <th className="px-4 py-3">UTR Reference</th>
                    <th className="px-4 py-3">Destination Account</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {SETTLEMENT_HISTORY.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono">{item.cycleDate}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{item.utrNumber}</td>
                      <td className="px-4 py-3">{item.accountMasked}</td>
                      <td className="px-4 py-3 font-mono">{item.ordersCount} files</td>
                      <td className="px-4 py-3 font-mono font-bold text-white text-right">
                        Rs. {(item.amountPaise / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          CLEARED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Commission Withdrawal & Bank Info (5 Columns) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Withdrawal Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Request Bank Disbursement</h3>
              </div>
              <span className="font-mono text-xs text-emerald-400 font-bold">Instant IMPS</span>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Available Commission
              </span>
              <p className="font-mono text-3xl font-black text-emerald-300">Rs. {walletBalance.toFixed(2)}</p>
              <p className="text-[11px] text-emerald-400/80">Minimum withdrawal threshold: Rs. 1,000.00</p>
            </div>

            {/* Linked Bank Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Building className="size-3.5 text-slate-400" />
                  Primary Settlement Account
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400">
                  Verified
                </span>
              </div>
              <div className="font-mono text-slate-300 space-y-0.5 text-[11px]">
                <p>A/c Name: SRI BALAJI SERVICES & XEROX</p>
                <p>Bank: State Bank of India (Ameerpet Branch)</p>
                <p>A/c Number: **** **** 4102</p>
                <p>IFSC: SBIN0001842</p>
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={handleRequestPayout}
              disabled={isRequesting || walletBalance < 1000}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Processing Transfer to Bank...</span>
                </>
              ) : payoutRequestedSuccess ? (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Disbursement Dispatched!</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="size-4" />
                  <span>Withdraw Rs. {walletBalance.toFixed(2)} to SBI Account</span>
                </>
              )}
            </button>

            {payoutRequestedSuccess && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-center text-xs text-emerald-300 font-bold animate-in fade-in">
                Disbursement of Rs. 3,420.00 initiated via IMPS. UTR will reflect in your bank account within 15 minutes.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
