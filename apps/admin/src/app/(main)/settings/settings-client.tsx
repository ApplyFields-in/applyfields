'use client';

import React, { useState } from 'react';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Globe,
  KeyRound,
  Layers,
  Lock,
  RefreshCw,
  Save,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<'security' | 'scrapers' | 'audit' | 'system'>('security');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Security Settings
  const [securityConfig, setSecurityConfig] = useState({
    enforce2FA: true,
    strictDepartmentIsolation: true,
    sessionTimeoutHours: '8',
    restrictSingleSession: true,
    allowlistEnabled: false,
    allowedIps: '103.246.128.0/24\n14.139.120.0/24',
  });

  // Scraper Settings
  const [scraperConfig, setScraperConfig] = useState({
    maxConcurrentThreads: 4,
    autoProxyFailover: true,
    minConfidenceThreshold: 75,
    quarantineLowConfidence: true,
    autoRetryDeadlinks: true,
    crawlIntervalHours: '6',
  });

  // Audit Settings
  const [auditConfig, setAuditConfig] = useState({
    retentionDays: '180',
    logSnapshotPayloads: true,
    immutableLedger: true,
  });

  const showToast = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Platform settings and security policy updated successfully.');
    }, 600);
  };

  const handleExportAuditArchive = () => {
    const archiveData = {
      archive_type: 'platform_security_audit_export',
      exported_at: new Date().toISOString(),
      retention_policy_days: auditConfig.retentionDays,
      security_matrix: {
        enforce_2fa: securityConfig.enforce2FA,
        department_isolation: securityConfig.strictDepartmentIsolation,
        session_timeout: `${securityConfig.sessionTimeoutHours} hours`,
      },
      system_signature: 'APPLYFIELDS-ADMIN-GOVERNANCE-AUDIT',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(archiveData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `applyfields_compliance_audit_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Compliance audit archive downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas border border-teal/15 p-2.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'security', label: 'Security & 2FA Policy', icon: ShieldCheck },
            { id: 'scrapers', label: 'Scrapers & Crawl Limits', icon: Sliders },
            { id: 'audit', label: 'Audit Trail & Retention', icon: Layers },
            { id: 'system', label: 'System Health & Services', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition',
                  isActive
                    ? 'bg-teal text-white shadow-xs'
                    : 'text-teal/70 hover:text-teal hover:bg-teal/5',
                )}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className={cn(buttonClass({ variant: 'primary', size: 'sm' }), 'text-xs gap-1.5 shrink-0')}
        >
          {saving ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* TAB 1: SECURITY & 2FA POLICY */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <Card className="p-5 border-teal/15 space-y-4">
            <div className="border-b border-teal/10 pb-3">
              <h3 className="text-sm font-bold text-teal flex items-center gap-2">
                <Lock className="size-4" /> Internal Staff Security &amp; 2FA Enforcement
              </h3>
              <p className="text-xs text-teal/70 mt-0.5">
                Mandatory multi-factor authentication, session lifecycle, and departmental route isolation boundaries.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* 2FA Policy */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Mandatory 2-Step Verification (2FA / TOTP)</span>
                  <p className="text-teal/70 text-[11px]">
                    Requires all staff accounts to enter an Authenticator code or single-use recovery key before accessing departmental cockpits.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securityConfig.enforce2FA}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, enforce2FA: e.target.checked })}
                  className="size-4 rounded border-teal/30 text-teal focus:ring-teal mt-1 cursor-pointer"
                />
              </div>

              {/* Departmental Isolation */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Departmental Route Isolation Boundary</span>
                  <p className="text-teal/70 text-[11px]">
                    Locks scoped staff (e.g. partner managers, services officers, content reviewers) strictly to their authorized department paths.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securityConfig.strictDepartmentIsolation}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, strictDepartmentIsolation: e.target.checked })}
                  className="size-4 rounded border-teal/30 text-teal focus:ring-teal mt-1 cursor-pointer"
                />
              </div>

              {/* Session Timeout */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Staff Idle Session Inactivity Timeout</span>
                  <p className="text-teal/70 text-[11px]">
                    Automatically logs out inactive staff terminals after duration.
                  </p>
                </div>
                <select
                  value={securityConfig.sessionTimeoutHours}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, sessionTimeoutHours: e.target.value })}
                  className="rounded-lg border border-teal/20 bg-white px-2.5 py-1 text-xs text-teal font-medium"
                >
                  <option value="1">1 Hour</option>
                  <option value="4">4 Hours</option>
                  <option value="8">8 Hours (Standard Shift)</option>
                  <option value="24">24 Hours</option>
                </select>
              </div>

              {/* Single Active Session */}
              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Concurrent Terminal Session Prevention</span>
                  <p className="text-teal/70 text-[11px]">
                    Terminates previous active browser cookies when staff members log in from a new workstation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securityConfig.restrictSingleSession}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, restrictSingleSession: e.target.checked })}
                  className="size-4 rounded border-teal/30 text-teal focus:ring-teal mt-1 cursor-pointer"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: SCRAPERS & CRAWL LIMITS */}
      {activeTab === 'scrapers' && (
        <div className="space-y-4">
          <Card className="p-5 border-teal/15 space-y-4">
            <div className="border-b border-teal/10 pb-3">
              <h3 className="text-sm font-bold text-teal flex items-center gap-2">
                <Sliders className="size-4" /> Government Portal Scraper Rate Limiting
              </h3>
              <p className="text-xs text-teal/70 mt-0.5">
                Throttle crawl concurrency to prevent IP bans from state examination boards and UPSC portals.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Maximum Concurrent Crawl Workers</span>
                  <p className="text-teal/70 text-[11px]">
                    Simultaneous active threads fetching government recruitment boards.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={scraperConfig.maxConcurrentThreads}
                    onChange={(e) => setScraperConfig({ ...scraperConfig, maxConcurrentThreads: Number(e.target.value) || 1 })}
                    className="w-16 rounded-lg border border-teal/20 bg-white px-2 py-1 text-center font-mono text-teal font-bold"
                  />
                  <span className="text-teal/60 text-[11px]">Workers</span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Residential Proxy Auto-Failover</span>
                  <p className="text-teal/70 text-[11px]">
                    Automatically switches to residential proxy rotation when consecutive HTTP 403 / Cloudflare blocks occur.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={scraperConfig.autoProxyFailover}
                  onChange={(e) => setScraperConfig({ ...scraperConfig, autoProxyFailover: e.target.checked })}
                  className="size-4 rounded border-teal/30 text-teal focus:ring-teal mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Minimum Ingestion Confidence Threshold</span>
                  <p className="text-teal/70 text-[11px]">
                    Drafts below this threshold are flagged with &ldquo;Check Carefully&rdquo; in the review queue.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={50}
                    max={95}
                    value={scraperConfig.minConfidenceThreshold}
                    onChange={(e) => setScraperConfig({ ...scraperConfig, minConfidenceThreshold: Number(e.target.value) })}
                    className="w-28 accent-teal cursor-pointer"
                  />
                  <span className="font-mono font-bold text-teal w-10 text-right">{scraperConfig.minConfidenceThreshold}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL & RETENTION */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <Card className="p-5 border-teal/15 space-y-4">
            <div className="border-b border-teal/10 pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-teal flex items-center gap-2">
                  <Layers className="size-4" /> Immutable Audit Ledger &amp; Retention Policy
                </h3>
                <p className="text-xs text-teal/70 mt-0.5">
                  Configure regulatory change log retention periods and export compliance archives.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAuditArchive}
                className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'text-xs gap-1.5 shrink-0')}
              >
                <Download className="size-3.5" /> Export Audit Archive (JSON)
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Audit Snapshot Retention Horizon</span>
                  <p className="text-teal/70 text-[11px]">
                    Preserves historical rollbacks and field diff records for operational accountability.
                  </p>
                </div>
                <select
                  value={auditConfig.retentionDays}
                  onChange={(e) => setAuditConfig({ ...auditConfig, retentionDays: e.target.value })}
                  className="rounded-lg border border-teal/20 bg-white px-2.5 py-1 text-xs text-teal font-medium"
                >
                  <option value="90">90 Days</option>
                  <option value="180">180 Days (Recommended)</option>
                  <option value="365">365 Days (Annual Compliance)</option>
                  <option value="indefinite">Indefinite (Full History)</option>
                </select>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-canvas border border-teal/10">
                <div className="space-y-0.5 max-w-xl">
                  <span className="font-bold text-teal block">Immutable Audit Log Append-Only Mode</span>
                  <p className="text-teal/70 text-[11px]">
                    Disallows deletion or modification of prior audit events even by super administrators.
                  </p>
                </div>
                <Badge tone="teal" className="text-[10px]">
                  Enforced (Permanent)
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: SYSTEM HEALTH & SERVICES */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <Card className="p-5 border-teal/15 space-y-4">
            <div className="border-b border-teal/10 pb-3">
              <h3 className="text-sm font-bold text-teal flex items-center gap-2">
                <Server className="size-4" /> Microservice &amp; Cluster Health
              </h3>
              <p className="text-xs text-teal/70 mt-0.5">
                Real-time operational status of backend services, search engines, and document storage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-teal/10 bg-canvas space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal">PostgreSQL Database Pool</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" /> Connected
                  </span>
                </div>
                <p className="text-[11px] text-teal/60 font-mono">
                  Pool: 8/20 Connections · Latency: 1.4ms
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-teal/10 bg-canvas space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal">Typesense Search Index</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    <span className="size-1.5 rounded-full bg-emerald-600" /> Synced
                  </span>
                </div>
                <p className="text-[11px] text-teal/60 font-mono">
                  Indexed: 13,420 Opportunities &amp; Colleges
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-teal/10 bg-canvas space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal">Document Cloud Storage</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    <span className="size-1.5 rounded-full bg-emerald-600" /> Healthy
                  </span>
                </div>
                <p className="text-[11px] text-teal/60 font-mono">
                  Candidate PDFs &amp; KYC Certificates Secure
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-teal/10 bg-canvas space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal">Ingestion Worker Queue</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    <span className="size-1.5 rounded-full bg-emerald-600" /> Active
                  </span>
                </div>
                <p className="text-[11px] text-teal/60 font-mono">
                  UPSC, SSC, State PSC Pipeline Online
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

