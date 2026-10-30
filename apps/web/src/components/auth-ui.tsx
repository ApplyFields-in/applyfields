'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, type LucideIcon } from 'lucide-react';

/* Shared look for the login and sign-up forms. */

export const LABEL = 'mb-1.5 block text-sm font-semibold text-teal';
export const PRIMARY =
  'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sea text-sm font-bold text-cream shadow-[0_12px_24px_-12px_var(--color-sea)] transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60';
export const SIDE_BTN =
  'h-12 shrink-0 rounded-xl border border-line bg-cream px-4 text-sm font-semibold text-sea transition hover:bg-tea/50 disabled:opacity-60';
export const TEXT_BTN = 'text-sm font-semibold text-sea hover:underline';

const INPUT =
  'h-12 w-full rounded-xl border border-line bg-cream pl-11 text-sm text-teal placeholder:text-teal/40 transition focus:border-sea focus:outline-none focus:ring-4 focus:ring-sea/10 disabled:opacity-60';
const ICON = 'pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-teal/45';

export function IconInput({ icon: Icon, ...props }: { icon: LucideIcon } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className={ICON} aria-hidden="true" />
      <input {...props} className={`${INPUT} pr-4`} />
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  icon: Icon = Lock,
  show: controlledShow,
  onToggleShow,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  show?: boolean;
  onToggleShow?: () => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const [internalShow, setInternalShow] = useState(false);
  const isShow = controlledShow !== undefined ? controlledShow : internalShow;
  const toggleShow = () => {
    if (onToggleShow) {
      onToggleShow();
    } else {
      setInternalShow(!internalShow);
    }
  };

  return (
    <div className="relative">
      <Icon className={ICON} aria-hidden="true" />
      <input
        {...props}
        type={isShow ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} pr-12`}
      />
      <button
        type="button"
        onClick={toggleShow}
        aria-label={isShow ? 'Hide password' : 'Show password'}
        title={isShow ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-teal/45 transition hover:text-teal"
      >
        {isShow ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}

export interface PasswordValidation {
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
  isValid: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  const hasLength = (password || '').length >= 8;
  const hasUpper = /[A-Z]/.test(password || '');
  const hasLower = /[a-z]/.test(password || '');
  const hasDigit = /[0-9]/.test(password || '');
  const hasSymbol = /[^A-Za-z0-9]/.test(password || '');
  return {
    hasLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSymbol,
    isValid: hasLength && hasUpper && hasLower && hasDigit && hasSymbol,
  };
}

export function PasswordRequirements({ password }: { password?: string }) {
  const v = validatePassword(password || '');

  const rules = [
    { label: '8+ chars', met: v.hasLength },
    { label: 'Capital (A-Z)', met: v.hasUpper },
    { label: 'Small (a-z)', met: v.hasLower },
    { label: 'Digit (0-9)', met: v.hasDigit },
    { label: 'Symbol (!@#$...)', met: v.hasSymbol },
  ];

  return (
    <div className="mt-2 rounded-xl border border-line/80 bg-paper/60 p-2.5 text-xs">
      <div className="flex items-center justify-between font-semibold text-teal/80">
        <span className="flex items-center gap-1.5">
          <Lock className="size-3.5 text-sea" />
          <span>Password Requirements</span>
        </span>
        <span className="text-[11px] font-normal text-teal/50">
          8+ chars, capital, small, digit &amp; symbol
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {rules.map((rule) => (
          <span
            key={rule.label}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              rule.met
                ? 'bg-sea/15 text-sea font-semibold'
                : 'bg-cream text-teal/50 border border-line/60'
            }`}
          >
            <span
              className={`inline-block size-1.5 rounded-full ${
                rule.met ? 'bg-sea' : 'bg-teal/30'
              }`}
            />
            {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Notice({ error, success }: { error: string | null; success: string | null }) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-xl border border-terracotta/20 bg-terracotta/5 px-4 py-3 text-sm font-medium text-terracotta"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-sea/20 bg-tea/50 px-4 py-3 text-sm font-medium text-teal">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
          {success}
        </p>
      )}
    </>
  );
}

export function DevCode({ code, onFill }: { code: string; onFill: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-sea/40 bg-tea/40 px-4 py-3">
      <div>
        <span className="block text-xs font-semibold text-teal/60">Dev mode code</span>
        <span className="font-mono text-lg font-bold tracking-[0.3em] text-teal">{code}</span>
      </div>
      <button
        type="button"
        onClick={onFill}
        className="rounded-lg bg-sea px-3 py-1.5 text-xs font-semibold text-cream transition hover:brightness-110"
      >
        Fill in
      </button>
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer select-none items-start gap-2.5 text-sm text-teal/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-sea"
      />
      <span>{children}</span>
    </label>
  );
}
