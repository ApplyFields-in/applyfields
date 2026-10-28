'use client';

import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  Send,
  Share2,
  X,
} from 'lucide-react';
import { showAppToast } from '@/components/toast-notification-provider';

export interface ShareModalProps {
  title: string;
  subtitle?: string;
  url?: string;
  category?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  variant?: 'outline' | 'solid' | 'icon';
}

export function ShareModal({
  title,
  subtitle,
  url,
  category = 'Opportunity',
  buttonLabel = 'Share',
  buttonClassName = '',
  variant = 'outline',
}: ShareModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (url) return url;
    if (typeof window !== 'undefined') return window.location.href;
    return '';
  };

  const shareUrl = getShareUrl();
  const shareText = `Check out ${title}${subtitle ? ` - ${subtitle}` : ''} on ApplyFields:`;

  const copyToClipboard = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        showAppToast({
          message: 'Link copied to clipboard!',
          type: 'success',
        });
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // Fallback or ignore
      }
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch {
        // User cancelled or unsupported
      }
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareChannels = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="size-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-4.418 0-8 3.582-8 8 0 1.411.365 2.738 1.002 3.896l-1.064 3.888 3.987-1.045c1.121.611 2.404.961 3.775.961 4.418 0 8-3.582 8-8 0-4.418-3.582-8-8-8z" />
        </svg>
      ),
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      tone: 'hover:bg-emerald-50 hover:border-[#25D366]',
    },
    {
      name: 'Telegram',
      icon: (
        <svg className="size-5 text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.942z" />
        </svg>
      ),
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      tone: 'hover:bg-sky-50 hover:border-[#229ED9]',
    },
    {
      name: 'Email',
      icon: <Mail className="size-5 text-[#EA4335]" />,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`,
      tone: 'hover:bg-red-50 hover:border-[#EA4335]',
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="size-5 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      tone: 'hover:bg-blue-50 hover:border-[#0077B5]',
    },
    {
      name: 'X (Twitter)',
      icon: (
        <svg className="size-5 text-[#0f1419]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      tone: 'hover:bg-slate-100 hover:border-[#0f1419]',
    },
  ];

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Share with friends or family"
          className={`grid size-9 place-items-center rounded-md border border-[#dec9a5] bg-[#f8f5ef] text-[#082046] hover:bg-[#ffffff] transition-colors shadow-sm ${buttonClassName}`}
          aria-label="Share"
        >
          <Share2 className="size-4 text-[#0e7bf4]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Share with friends or family"
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3.5 text-xs font-semibold transition-colors shadow-sm cursor-pointer ${
            variant === 'solid'
              ? 'border border-[#dec9a5] bg-[#F4E8D1] text-[#082046] hover:bg-[#ebdcc0]'
              : 'border border-[#dec9a5] bg-[#f8f5ef] text-[#082046] hover:bg-[#ffffff]'
          } ${buttonClassName}`}
        >
          <Share2 className="size-3.5 text-[#0e7bf4]" />
          <span>{buttonLabel}</span>
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082046]/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-md rounded-md border border-[#dec9a5] bg-[#ffffff] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#dec9a5] bg-[#F4E8D1] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Share2 className="size-4 text-[#76562d]" />
                <h3 id="share-modal-title" className="text-sm font-bold text-[#082046]">
                  Share {category}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-[#76562d] hover:bg-[#ffffff] hover:text-[#082046] transition-colors"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Item Card Preview */}
            <div className="p-5 space-y-4">
              <div className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-3 text-xs space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#76562d]">
                  {category}
                </span>
                <p className="font-bold text-[#082046] line-clamp-2">{title}</p>
                {subtitle && <p className="text-[#536780] line-clamp-1">{subtitle}</p>}
              </div>

              {/* Direct Channel Buttons */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#76562d] mb-2.5">
                  Share via channel:
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {shareChannels.map((ch) => (
                    <a
                      key={ch.name}
                      href={ch.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 rounded-md border border-[#dec9a5] bg-[#ffffff] p-2.5 text-xs font-semibold text-[#082046] transition-all shadow-2xs ${ch.tone}`}
                    >
                      {ch.icon}
                      <span>{ch.name}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Copy Direct Link Input Bar */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#76562d] block mb-1.5">
                  Or copy link:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="h-9 flex-1 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3 text-xs font-mono text-[#082046] focus:outline-none"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#082046] bg-[#082046] px-3 text-xs font-semibold text-[#ffffff] hover:bg-[#0c2e63] transition-colors shrink-0 cursor-pointer shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Native Share Trigger if supported */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] py-2 text-xs font-semibold text-[#082046] hover:bg-[#F4E8D1] transition-colors"
                >
                  <ExternalLink className="size-3.5 text-[#0e7bf4]" /> More Device Share Options
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

