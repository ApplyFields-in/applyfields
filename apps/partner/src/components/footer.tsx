'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

// Public pages only; the operator and institution desks render their own footer.
const PUBLIC_PATHS = ['/', '/onboard', '/login', '/under-review', '/institution/onboard', '/institution/under-review'];

export function Footer() {
  const pathname = usePathname();
  if (!PUBLIC_PATHS.includes(pathname)) return null;

  const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || 'https://applyfields.com';
  const SERVICE_URL = process.env.NEXT_PUBLIC_SERVICE_PORTAL_URL || 'https://service.applyfields.com';

  return (
    <footer className="border-t border-[#0d2a58] bg-[#082046] text-xs text-[#a8c1de]">
      <div className="mx-auto max-w-[1360px] space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Image src="/logo-mark.png" alt="" width={32} height={32} className="size-8 object-contain" />
              <span className="text-base font-black tracking-tight text-white">ApplyFields Partners</span>
            </div>
            <p className="leading-relaxed">
              The operator desk for MeeSeva centres, CSC kiosks, xerox and typing shops, consultants and colleges.
            </p>
            <a href="mailto:support@applyfields.com" className="inline-block font-semibold text-white hover:underline">
              support@applyfields.com
            </a>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-white">Join</h4>
            <ul className="space-y-2">
              <li><Link href="/onboard" className="transition hover:text-white">Register your centre</Link></li>
              <li><Link href="/institution/onboard" className="transition hover:text-white">Register a college or university</Link></li>
              <li><Link href="/under-review" className="transition hover:text-white">Check verification status</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-white">Partners</h4>
            <ul className="space-y-2">
              <li><Link href="/login" className="transition hover:text-white">Operator login</Link></li>
              <li><Link href="/" className="transition hover:text-white">How it works</Link></li>
              <li><a href={`${MAIN_WEB_URL}/help`} className="transition hover:text-white">Help &amp; FAQs</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-white">ApplyFields</h4>
            <ul className="space-y-2">
              <li><a href={MAIN_WEB_URL} className="transition hover:text-white">Citizen Portal</a></li>
              <li><a href={SERVICE_URL} className="transition hover:text-white">Services Hub</a></li>
              <li><a href={`${MAIN_WEB_URL}/privacy`} className="transition hover:text-white">Privacy Policy</a></li>
              <li><a href={`${MAIN_WEB_URL}/cookie-policy`} className="transition hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#0d2a58] pt-6 text-[11px] text-[#7896bc]">
          <p>© 2026 ApplyFields Technologies Inc. · partners.applyfields.com</p>
        </div>
      </div>
    </footer>
  );
}
