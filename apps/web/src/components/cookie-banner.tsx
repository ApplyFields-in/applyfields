'use client';

import { useEffect, useState } from 'react';
import { Badge, buttonClass, cn } from '@applyfields/ui';
import {
  Check,
  ChevronRight,
  Cookie,
  ExternalLink,
  Info,
  Lock,
  Settings,
  ShieldCheck,
  Sliders,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  openCookiePreferencesModal,
  useCookieConsent,
} from '@/lib/cookies/use-cookie-consent';

export function CookieConsentBanner() {
  const { consent, loaded, hasConsented, acceptAll, rejectNonEssential, saveConsent } =
    useCookieConsent();

  // Modal & Banner state
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  // Sync state when consent loads
  useEffect(() => {
    if (consent) {
      setFunctionalEnabled(consent.functional);
      setAnalyticsEnabled(consent.analytics);
    }
  }, [consent]);

  // Listen for 'open-cookie-preferences' custom event from footer or policy page
  useEffect(() => {
    const handleOpen = () => setShowPreferencesModal(true);
    window.addEventListener('open-cookie-preferences', handleOpen);
    return () => window.removeEventListener('open-cookie-preferences', handleOpen);
  }, []);

  if (!loaded) return null;

  // If user already consented and modal isn't manually opened, render nothing
  if (hasConsented && !showPreferencesModal) {
    return null;
  }

  const handleSaveCustom = () => {
    saveConsent({
      functional: functionalEnabled,
      analytics: analyticsEnabled,
    });
    setShowPreferencesModal(false);
  };

  return (
    <>
      {/* 1. Main Bottom Cookie Banner (Only shows if no consent recorded yet) */}
      {!hasConsented && !showPreferencesModal && (
        <aside
          aria-label="Cookie Consent Banner"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[95%] max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-3xl border border-white/20 bg-[#0B2240]/95 p-5 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-[#0e7bf4]/20 text-[#0e7bf4] border border-[#0e7bf4]/30">
                <Cookie className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Cookie & Privacy Choices</h3>
                  <Badge tone="teal" className="text-[10px] uppercase font-bold bg-[#0e7bf4]/20 text-[#93c5fd] border-none">
                    DPDP Act 2023
                  </Badge>
                </div>
                <p className="text-xs text-[#c8d5e6] leading-relaxed">
                  We use strictly necessary cookies to keep you signed in securely and protect your session. With your consent, we also use optional cookies to remember your language preferences and understand how ApplyFields is used.{' '}
                  <Link
                    href="/cookie-policy"
                    className="text-[#93c5fd] underline hover:text-white transition-colors"
                  >
                    Read Cookie Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end shrink-0 pt-1 lg:pt-0">
              <button
                type="button"
                onClick={() => setShowPreferencesModal(true)}
                className={buttonClass({
                  variant: 'secondary',
                  size: 'sm',
                  className: 'bg-white/10 hover:bg-white/20 text-white border-white/10 text-xs gap-1.5',
                })}
              >
                <Sliders className="size-3.5" />
                Customize
              </button>

              <button
                type="button"
                onClick={rejectNonEssential}
                className={buttonClass({
                  variant: 'secondary',
                  size: 'sm',
                  className: 'bg-white/10 hover:bg-white/20 text-white border-white/10 text-xs',
                })}
              >
                Reject Non-Essential
              </button>

              <button
                type="button"
                onClick={acceptAll}
                className={buttonClass({
                  variant: 'primary',
                  size: 'sm',
                  className: 'bg-[#0e7bf4] text-white hover:bg-[#0e7bf4]/90 text-xs font-bold shadow-clay',
                })}
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Detailed Cookie Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-white/20 bg-[#0B2240] text-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-[#0e7bf4]/20 text-[#0e7bf4] border border-[#0e7bf4]/30">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Cookie Consent Preferences</h2>
                  <p className="text-xs text-[#c8d5e6]">
                    Manage and control which cookies you permit on ApplyFields
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body / Preferences Toggles */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-xs text-[#c8d5e6] leading-relaxed">
                In compliance with the <strong>Digital Personal Data Protection Act (DPDP Act 2023, India)</strong>, you have full control over optional data storage. Strictly necessary cookies cannot be disabled as they are required for security, authentication, and core functionality.
              </p>

              {/* Category 1: Strictly Necessary */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-[#93c5fd]" />
                    <span className="text-sm font-bold text-white">1. Strictly Necessary Cookies</span>
                  </div>
                  <Badge tone="teal" className="text-[10px] font-bold bg-[#0e7bf4]/20 text-[#93c5fd] border-none">
                    Always Active
                  </Badge>
                </div>
                <p className="text-xs text-[#c8d5e6] leading-relaxed">
                  Essential for secure login (<code className="text-[#93c5fd] font-mono text-[11px]">accessToken</code>, <code className="text-[#93c5fd] font-mono text-[11px]">refreshToken</code>), CSRF defense, and session persistence. These cookies do not store personally identifiable promotional tracking.
                </p>
              </div>

              {/* Category 2: Functional & Preferences */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="size-4 text-[#93c5fd]" />
                    <span className="text-sm font-bold text-white">2. Functional & Language Preferences</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={functionalEnabled}
                      onChange={(e) => setFunctionalEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7bf4]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#c8d5e6] leading-relaxed">
                  Remembers your regional language preference (<code className="text-[#93c5fd] font-mono text-[11px]">NEXT_LOCALE</code>), college comparison selections, and saved interface preferences between visits.
                </p>
              </div>

              {/* Category 3: Analytics */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-[#93c5fd]" />
                    <span className="text-sm font-bold text-white">3. Analytics & Platform Performance</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e7bf4]"></div>
                  </label>
                </div>
                <p className="text-xs text-[#c8d5e6] leading-relaxed">
                  Helps us measure anonymized aggregate feature usage, broken search queries, and performance bottlenecks to deliver a faster experience for students across India.
                </p>
              </div>

              <div className="text-[11px] text-[#c8d5e6]/70 pt-2 border-t border-white/10 flex items-center justify-between">
                <span>Consent Version 1.0 · Stored securely for 12 months</span>
                <Link
                  href="/cookie-policy"
                  onClick={() => setShowPreferencesModal(false)}
                  className="text-[#93c5fd] hover:underline inline-flex items-center gap-1"
                >
                  View Full Policy <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  rejectNonEssential();
                  setShowPreferencesModal(false);
                }}
                className={buttonClass({
                  variant: 'secondary',
                  size: 'sm',
                  className: 'bg-white/10 hover:bg-white/20 text-white border-white/10 text-xs',
                })}
              >
                Reject All Optional
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    acceptAll();
                    setShowPreferencesModal(false);
                  }}
                  className={buttonClass({
                    variant: 'secondary',
                    size: 'sm',
                    className: 'bg-white/15 hover:bg-white/25 text-white border-white/10 text-xs font-semibold',
                  })}
                >
                  Accept All
                </button>

                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className={buttonClass({
                    variant: 'primary',
                    size: 'sm',
                    className: 'bg-[#0e7bf4] text-white hover:bg-[#0e7bf4]/90 text-xs font-bold shadow-clay gap-1',
                  })}
                >
                  <Check className="size-3.5" />
                  Save My Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Standalone button to trigger the cookie preferences modal from anywhere */
export function CookiePreferencesTrigger({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={openCookiePreferencesModal}
      className={className || 'hover:text-white transition-colors'}
    >
      {children || 'Cookie Preferences'}
    </button>
  );
}
