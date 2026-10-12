'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function DarkNavyFooter() {
  function setDemoSignedIn() {
    if (typeof window !== 'undefined') {
      const demoUser = {
        id: 'usr_demo_arvind',
        email: 'arvind.kumar@example.com',
        full_name: 'Arvind Kumar',
        phone: '+91 98765 43210',
      };
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
      window.dispatchEvent(new Event('auth-changed'));
      window.location.reload();
    }
  }

  function setDemoPublic() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new Event('auth-changed'));
      window.location.reload();
    }
  }

  return (
    <footer className="mt-12 border-t border-white/10 bg-[#0B2240] text-[#c8d5e6]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Image src="/logo-mark.png" alt="" width={40} height={32} className="h-8 w-10 object-contain" />
              <span className="text-lg font-bold tracking-tight text-white">Apply<span className="text-[#0e7bf4]">Fields</span></span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-[#c8d5e6]">
              Discover, understand and prepare for public opportunities — in one place.
            </p>

            <div className="pt-1">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Prototype Screens
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#c8d5e6]">
                <button
                  type="button"
                  onClick={setDemoPublic}
                  className="hover:text-white"
                >
                  Citizen - public
                </button>
                <button
                  type="button"
                  onClick={setDemoSignedIn}
                  className="hover:text-white"
                >
                  Citizen - signed in
                </button>
                <a
                  href="http://localhost:3001/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Internal - login
                </a>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Internal - workspace
                </a>
              </div>
            </div>
          </div>

          {/* Column 1: Apply */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">Apply</p>
            <ul className="space-y-1.5 text-xs text-[#c8d5e6]">
              <li>
                <Link href="/jobs" className="hover:text-white transition-colors">
                  Government Jobs
                </Link>
              </li>
              <li>
                <Link href="/exams" className="hover:text-white transition-colors">
                  Exams
                </Link>
              </li>
              <li>
                <Link href="/scholarships" className="hover:text-white transition-colors">
                  Scholarships
                </Link>
              </li>
              <li>
                <Link href="/admissions" className="hover:text-white transition-colors">
                  Admissions
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Career */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">Career</p>
            <ul className="space-y-1.5 text-xs text-[#c8d5e6]">
              <li>
                <Link href="/career" className="hover:text-white transition-colors">
                  Explore careers
                </Link>
              </li>
              <li>
                <Link href="/career/courses" className="hover:text-white transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="/career/colleges" className="hover:text-white transition-colors">
                  Colleges &amp; universities
                </Link>
              </li>
              <li>
                <Link href="/career/skills" className="hover:text-white transition-colors">
                  Skills
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: ApplyFields */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white">ApplyFields</p>
            <ul className="space-y-1.5 text-xs text-[#c8d5e6]">
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  How we verify
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-3.5 text-[11px] text-[#c8d5e6]">
          <p className="leading-relaxed">
            © 2026 ApplyFields. An independent information platform — not affiliated with any government department.
          </p>
        </div>
      </div>
    </footer>
  );
}
