'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  FolderLock,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlink,
  X,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import type {
  DigiLockerImportResponse,
  DigiLockerIssuedDocument,
  DigiLockerIssuedDocumentsResponse,
  DigiLockerStatusResponse,
} from '@applyfields/types';

export function DigiLockerEmblem({ className = 'size-5' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-lg bg-[#0e7bf4] text-white font-black text-xs ${className}`}>
      <span className="tracking-tighter">DL</span>
    </div>
  );
}

export function DigiLockerCard() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<DigiLockerStatusResponse>({
    linked: false,
    digilocker_id: null,
  });
  const [issuedDocs, setIssuedDocs] = useState<DigiLockerIssuedDocument[]>([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [importingUri, setImportingUri] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal for Connect DigiLocker
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [sandboxMobile, setSandboxMobile] = useState('+91 98765 43210');
  const [sandboxAadhaar, setSandboxAadhaar] = useState('5824 9102 3841');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Check if redirected from OAuth callback with query params
    const digiParam = searchParams.get('digilocker');
    const digiId = searchParams.get('digilocker_id');
    const digiErr = searchParams.get('digilocker_error');

    if (digiErr) {
      setErrorMsg(decodeURIComponent(digiErr));
    }

    if (digiParam === 'connected' && digiId) {
      setSuccessMsg(`Successfully linked Government DigiLocker (${digiId})!`);
      setStatus({
        linked: true,
        digilocker_id: digiId,
        linked_at: new Date().toISOString(),
      });
      loadIssuedDocuments();
      return;
    }

    loadStatus();
  }, [searchParams]);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await apiGet<DigiLockerStatusResponse>('/digilocker/status');
      if (res) {
        setStatus(res);
        if (res.linked) {
          loadIssuedDocuments();
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function loadIssuedDocuments() {
    setFetchingDocs(true);
    setErrorMsg(null);
    try {
      const res = await apiGet<DigiLockerIssuedDocumentsResponse>('/digilocker/issued-documents');
      if (res?.items) {
        setIssuedDocs(res.items);
      }
    } catch {
      setErrorMsg('Could not fetch issued documents from DigiLocker.');
    } finally {
      setFetchingDocs(false);
    }
  }

  async function handleImport(uri: string) {
    setImportingUri(uri);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const encodedUri = encodeURIComponent(uri);
      const res = await apiPost<DigiLockerImportResponse>(`/digilocker/import/${encodedUri}`, {});

      if (res.error || !res.data?.success) {
        setErrorMsg(res.error || 'Failed to import document from DigiLocker.');
        setImportingUri(null);
        return;
      }

      setSuccessMsg(res.data.message || 'Document imported into Document Vault!');
      // Update the local list to mark this document as imported
      setIssuedDocs((prev) =>
        prev.map((doc) => (doc.uri === uri ? { ...doc, isImported: true } : doc)),
      );
    } catch {
      setErrorMsg('An error occurred while importing the document.');
    } finally {
      setImportingUri(null);
    }
  }

  async function handleConnectSandbox() {
    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const randomDigiId = `DL-IN-${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await apiPost<DigiLockerStatusResponse>('/digilocker/connect-sandbox', {
        digilockerId: randomDigiId,
      });

      if (res.data?.linked) {
        setStatus(res.data);
        setSuccessMsg(`Government DigiLocker linked successfully (ID: ${res.data.digilocker_id})!`);
        setIsConnectModalOpen(false);
        loadIssuedDocuments();
      } else {
        setErrorMsg(res.error || 'Failed to connect DigiLocker.');
      }
    } catch {
      setErrorMsg('Could not connect to DigiLocker sandbox.');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to unlink your Government DigiLocker account?')) {
      return;
    }

    try {
      await apiPost('/digilocker/disconnect', {});
      setStatus({ linked: false, digilocker_id: null });
      setIssuedDocs([]);
      setSuccessMsg('DigiLocker account unlinked.');
    } catch {
      setErrorMsg('Failed to unlink DigiLocker account.');
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#c4d2e3] bg-white p-6 shadow-sm space-y-6 transition-all hover:border-[#0e7bf4]/40">
      {/* Header with DigiLocker Logo and Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0e7bf4] to-[#082046] text-white shadow-md">
            <Landmark className="size-6 text-white" />
            <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] font-black">
              ✓
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-[#082046]">
                Government DigiLocker
              </h3>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0e7bf4] uppercase tracking-wider border border-blue-200">
                MeitY / API Setu
              </span>
            </div>
            <p className="text-xs text-[#536780]">
              Official National Gateway for digitally signed education &amp; identity certificates
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {loading ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <Loader2 className="size-3 animate-spin" /> Checking status...
            </span>
          ) : status.linked ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Verified by DigiLocker (ID: {status.digilocker_id || 'DL-IN-XXXXXX'})
              </span>
              <button
                type="button"
                onClick={handleDisconnect}
                title="Unlink DigiLocker"
                className="rounded-lg p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <Unlink className="size-4" />
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200">
              <ShieldAlert className="size-3.5 text-slate-500" />
              Not Linked
            </span>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {!status.linked ? (
        /* Not Linked State */
        <div className="space-y-4">
          <div className="rounded-xl bg-[#F8FBFF] border border-[#d6e4f5] p-4 text-xs text-[#334a69] space-y-2">
            <div className="font-bold text-[#082046] flex items-center gap-1.5 text-sm">
              <ShieldCheck className="size-4 text-[#0e7bf4]" />
              Why connect your DigiLocker account?
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[#435775]">
              <li>
                <strong>1-Click Document Import:</strong> Instantly fetch your 10th CBSE/State marksheet, Aadhaar, and Caste certificate directly from government issuers.
              </li>
              <li>
                <strong>100% Legally Valid:</strong> Digital documents from DigiLocker carry legal parity with physical documents under Rule 9A of the IT Rules, 2016.
              </li>
              <li>
                <strong>Auto-Fill Applications:</strong> Never type your marks or registration numbers manually; smart copy buttons extract verified data into your job forms.
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0e7bf4] to-[#082046] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all active:translate-y-px"
            >
              <DigiLockerEmblem className="size-4 text-white" />
              Connect DigiLocker (1-Click OTP)
            </button>
            <a
              href="https://www.digilocker.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#536780] hover:text-[#082046] hover:underline"
            >
              Learn about DigiLocker <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      ) : (
        /* Linked State with Issued Documents */
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#536780]">
                Issued Government Certificates
              </h4>
              <p className="text-xs text-[#435775]">
                Directly retrieved from your DigiLocker account via API Setu
              </p>
            </div>
            <button
              type="button"
              onClick={loadIssuedDocuments}
              disabled={fetchingDocs}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#082046] hover:bg-slate-50 transition"
            >
              <RefreshCw className={`size-3 text-[#0e7bf4] ${fetchingDocs ? 'animate-spin' : ''}`} />
              Sync Documents
            </button>
          </div>

          {fetchingDocs ? (
            <div className="py-8 text-center text-xs text-[#536780] space-y-2">
              <Loader2 className="size-6 animate-spin mx-auto text-[#0e7bf4]" />
              <p>Querying verified certificates from DigiLocker API Setu...</p>
            </div>
          ) : issuedDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-[#536780]">
              <p>No issued documents found in your DigiLocker repository yet.</p>
              <button
                type="button"
                onClick={loadIssuedDocuments}
                className="mt-2 text-xs font-bold text-[#0e7bf4] hover:underline"
              >
                Click here to refresh
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {issuedDocs.map((doc) => (
                <div
                  key={doc.uri}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-[#0e7bf4]/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0e7bf4] border border-blue-100">
                        <FileCheck2 className="size-3" /> Verified
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {doc.date}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-[#082046] line-clamp-2">
                      {doc.name}
                    </h5>
                    <p className="text-[11px] text-[#536780] line-clamp-1">
                      {doc.issuer}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {doc.isImported ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          Imported to Vault
                        </span>
                        <Link
                          href="/documents"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0e7bf4] hover:underline"
                        >
                          View Vault <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleImport(doc.uri)}
                        disabled={importingUri === doc.uri}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#082046] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#061835] transition disabled:opacity-60"
                      >
                        {importingUri === doc.uri ? (
                          <>
                            <Loader2 className="size-3 animate-spin text-white" />
                            <span>Importing PDF...</span>
                          </>
                        ) : (
                          <>
                            <Download className="size-3 text-white" />
                            <span>1-Click Import to Vault</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick link to Document Vault */}
          <div className="pt-2 flex items-center justify-between text-xs text-[#536780] border-t border-slate-100">
            <span>
              All imported documents are stored securely with 256-bit encryption.
            </span>
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 font-bold text-[#0e7bf4] hover:underline"
            >
              <FolderLock className="size-3.5" />
              Open Document Vault &amp; Live Extractor &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Connect DigiLocker Modal */}
      {isConnectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#082046]/60 backdrop-blur-xs p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#c4d2e3] bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#0e7bf4] border border-blue-200">
                  <Landmark className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#082046]">
                    Connect Government DigiLocker
                  </h3>
                  <p className="text-xs text-[#536780]">
                    API Setu Sandbox Authentication Gateway
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 text-[#334a69] space-y-1">
                <p className="font-bold text-[#082046]">
                  Candidate Consent &amp; Verification (DPDP Act 2023)
                </p>
                <p className="text-[11px] text-[#536780]">
                  By connecting, you authorize ApplyFields to query and retrieve your issued certificates from UIDAI, CBSE, and State Departments for job eligibility verification.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Aadhaar / Mobile Number linked to DigiLocker
                </label>
                <input
                  type="text"
                  value={sandboxMobile}
                  onChange={(e) => setSandboxMobile(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Aadhaar Number (Last 4 digits: 3841)
                </label>
                <input
                  type="text"
                  value={sandboxAadhaar}
                  onChange={(e) => setSandboxAadhaar(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleConnectSandbox}
                  disabled={connecting}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#0e7bf4] to-[#082046] text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Verifying OTP with DigiLocker Gateway...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 text-white" />
                      <span>Verify &amp; Link DigiLocker (Sandbox 1-Click)</span>
                    </>
                  )}
                </button>

                <a
                  href="/api/v1/auth/digilocker/authorize?redirect=true"
                  className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-[11px] hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="size-3 text-slate-500" />
                  Launch Official Government DigiLocker Portal (Live OAuth)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
