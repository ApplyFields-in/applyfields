import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — ApplyFields',
  description: 'ApplyFields privacy policy and citizen data protection principles.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-line bg-canvas p-8 shadow-clay sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-sea">Legal & Security</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-teal sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[#536780]">
          Last updated: October 2026 · ApplyFields Data Integrity Charter
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#536780]">
          <section>
            <h2 className="text-base font-bold text-teal">1. Direct & Official Links Only</h2>
            <p className="mt-1">
              ApplyFields connects Indian citizens directly to verified official government recruitment portals and educational institutions. We never act as an intermediary for submitting applications or handling examination fee payments.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-teal">2. Your Documents Stay Private</h2>
            <p className="mt-1">
              Any documents you upload to your private Citizen Vault are strictly encrypted and accessible solely by your authenticated session. We do not sell, rent, or share candidate documents with third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-teal">3. Truth in Data</h2>
            <p className="mt-1">
              All notifications, deadlines, and eligibility criteria displayed on ApplyFields are verified against official gazette notifications and department circulars. If a field is not published in the official notice, we state it transparently rather than guessing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-teal">4. Account Deletion & Rights</h2>
            <p className="mt-1">
              You may delete your account and all associated profile preferences at any time from your Account Settings. All local session tokens and stored vault records will be permanently removed.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
