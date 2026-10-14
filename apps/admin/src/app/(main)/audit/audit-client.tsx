'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { AdminAuditLogItem } from '@applyfields/types';
import { Badge, Card, buttonClass, cn } from '@applyfields/ui';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  History,
  Layers,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';

interface AuditClientProps {
  initialItems: AdminAuditLogItem[];
  total: number;
}

export function AuditClient({ initialItems, total }: AuditClientProps) {
  const [items] = useState<AdminAuditLogItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredItems = items.filter((item) => {
    if (actionFilter !== 'all') {
      if (actionFilter === 'publish' && !item.action.includes('publish')) return false;
      if (actionFilter === 'update' && !item.action.includes('update')) return false;
      if (actionFilter === 'create' && !item.action.includes('create')) return false;
      if (actionFilter === 'restore' && !item.action.includes('restore')) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const detailsStr = item.details ? JSON.stringify(item.details).toLowerCase() : '';
      return (
        item.action.toLowerCase().includes(q) ||
        Boolean(item.actor_email && item.actor_email.toLowerCase().includes(q)) ||
        Boolean(item.target_type && item.target_type.toLowerCase().includes(q)) ||
        Boolean(item.target_id && item.target_id.toLowerCase().includes(q)) ||
        detailsStr.includes(q)
      );
    }

    return true;
  });

  const getActionBadgeTone = (action: string): 'teal' | 'tea' | 'outline' => {
    if (action.includes('publish')) return 'teal';
    if (action.includes('restore')) return 'tea';
    if (action.includes('create')) return 'teal';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header controls: Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[280px] max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by staff email, action, target ID or change note..."
            className="h-10 w-full rounded-2xl border border-teal/20 bg-canvas pl-9 pr-4 text-xs font-medium text-teal shadow-xs outline-none focus:border-teal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActionFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              actionFilter === 'all'
                ? 'bg-teal text-white shadow-xs'
                : 'bg-canvas text-teal/70 hover:bg-teal/10'
            }`}
          >
            All Actions ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActionFilter('publish')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              actionFilter === 'publish'
                ? 'bg-teal text-white shadow-xs'
                : 'bg-canvas text-teal/70 hover:bg-teal/10'
            }`}
          >
            Publish Events
          </button>
          <button
            type="button"
            onClick={() => setActionFilter('update')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              actionFilter === 'update'
                ? 'bg-teal text-white shadow-xs'
                : 'bg-canvas text-teal/70 hover:bg-teal/10'
            }`}
          >
            Edits &amp; Updates
          </button>
          <button
            type="button"
            onClick={() => setActionFilter('restore')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              actionFilter === 'restore'
                ? 'bg-teal text-white shadow-xs'
                : 'bg-canvas text-teal/70 hover:bg-teal/10'
            }`}
          >
            Version Restores
          </button>
        </div>
      </div>

      {/* Audit Log Table / Stream */}
      {filteredItems.length === 0 ? (
        <Card className="rounded-3xl border border-line p-12 text-center">
          <ShieldCheck className="mx-auto size-12 text-teal/30" />
          <h3 className="mt-3 text-sm font-bold text-teal">No audit events match your criteria</h3>
          <p className="mt-1 text-xs text-teal/70">
            {searchTerm
              ? 'Try adjusting your search keywords.'
              : 'Audit events will appear as team members create, edit, and publish opportunities.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((log) => {
            const hasOppTarget = log.target_type === 'opportunity';
            const hasServiceTarget = log.target_type === 'gov_service';

            return (
              <Card
                key={log.id}
                className="rounded-2xl border border-line/70 bg-canvas/80 p-4 shadow-clay transition hover:border-teal/30"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={getActionBadgeTone(log.action)} className="text-[11px] font-bold">
                        {log.action.replace('_', ' ').toUpperCase()}
                      </Badge>

                      <Badge tone="outline" className="font-mono text-[11px] uppercase tracking-wider">
                        {log.target_type}
                      </Badge>

                      <span className="flex items-center gap-1 text-xs font-semibold text-teal">
                        <User className="size-3.5 text-teal/60" />
                        {log.actor_email || 'System / Staff'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-teal/70 pt-1">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-teal/60">
                        Target ID: {log.target_id}
                      </span>

                      {log.ip_address && (
                        <span className="font-mono text-[11px] text-teal/50">
                          IP: {log.ip_address}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-[11px] text-teal/60">
                        <Clock className="size-3" />
                        {new Date(log.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Metadata details / change summaries */}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 rounded-xl bg-teal/5 p-2.5 text-xs text-teal border border-teal/10">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(log.details).map(([key, val]) => (
                            <span key={key} className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium border border-teal/15">
                              <strong>{key}:</strong>{' '}
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Edit Action */}
                  <div className="shrink-0 pt-1 sm:pt-0">
                    {hasOppTarget && (
                      <Link
                        href={`/opportunities/${log.target_id}`}
                        className={buttonClass({
                          variant: 'ghost',
                          size: 'sm',
                          className: 'gap-1.5 text-xs text-teal hover:bg-teal/10 border border-teal/20',
                        })}
                      >
                        <ExternalLink className="size-3.5" />
                        View Opportunity
                      </Link>
                    )}
                    {hasServiceTarget && (
                      <Link
                        href={`/services/${log.target_id}`}
                        className={buttonClass({
                          variant: 'ghost',
                          size: 'sm',
                          className: 'gap-1.5 text-xs text-teal hover:bg-teal/10 border border-teal/20',
                        })}
                      >
                        <ExternalLink className="size-3.5" />
                        View Service
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
