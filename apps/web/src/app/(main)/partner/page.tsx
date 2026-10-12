'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  Send,
  ArrowRight,
  HandHelping,
  FileCheck2,
} from 'lucide-react';

export default function PartnerPage() {
  const [partnerType, setPartnerType] = useState('csc');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stateName, setStateName] = useState('Telangana');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <Store className="size-4" />
          <span>Partner Network · Centers &amp; Institutions</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          Partner Portal
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          Empower citizens in your locality. Register your facilitation center, college, or service desk on ApplyFields to manage admissions, receive walk-ins, and build verified local trust.
        </p>
      </div>

      {/* Track Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0e7bf4]">
            <Store className="size-5" />
          </div>
          <h2 className="text-base font-bold text-[#082046]">Citizen Service Centers</h2>
          <p className="text-xs text-[#536780]">
            For CSC, MeeSeva, cyber cafes, and xerox shops offering computer form filling, scanning, and certificate assistance.
          </p>
          <ul className="space-y-1.5 text-xs text-[#435775]">
            <li className="flex items-center gap-1.5">✓ Verified location badge</li>
            <li className="flex items-center gap-1.5">✓ Direct local walk-in requests</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
            <Building2 className="size-5" />
          </div>
          <h2 className="text-base font-bold text-[#082046]">Colleges &amp; Universities</h2>
          <p className="text-xs text-[#536780]">
            For higher education institutions seeking verified candidate admission inquiries and program profile listings.
          </p>
          <ul className="space-y-1.5 text-xs text-[#435775]">
            <li className="flex items-center gap-1.5">✓ Official degree profiles</li>
            <li className="flex items-center gap-1.5">✓ Student comparison matrix</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="size-5" />
          </div>
          <h2 className="text-base font-bold text-[#082046]">Counselors &amp; Mentors</h2>
          <p className="text-xs text-[#536780]">
            For certified educational counselors and career guides providing one-on-one student pathway navigation.
          </p>
          <ul className="space-y-1.5 text-xs text-[#435775]">
            <li className="flex items-center gap-1.5">✓ Verified credential audit</li>
            <li className="flex items-center gap-1.5">✓ Career mode integration</li>
          </ul>
        </div>
      </div>

      {/* Onboarding Form */}
      <div className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#082046]">Partner Registration &amp; Verification</h2>
            <p className="mt-1 text-xs text-[#536780]">
              Submit your center details for verification. Once approved, your center appears in the Citizen Assistance Directory.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-sm text-emerald-900 space-y-2">
              <h3 className="font-bold flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" /> Registration Received
              </h3>
              <p className="text-xs text-emerald-800">
                Thank you, <strong>{ownerName || 'Partner'}</strong>. Our network verification coordinator will review your documents and contact you at <strong>{phone}</strong> within 2 business days.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-3 text-xs font-semibold text-emerald-700 underline"
              >
                Submit another location
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="partnerType" className="block text-xs font-bold text-[#082046]">
                    Partner Category
                  </label>
                  <select
                    id="partnerType"
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  >
                    <option value="csc">MeeSeva / Common Service Center (CSC)</option>
                    <option value="cyber">Cyber Point &amp; Online Services Desk</option>
                    <option value="institution">College / Educational Institution</option>
                    <option value="counselor">Career Counselor / Consultant</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-xs font-bold text-[#082046]">
                    Center / Business Name
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    required
                    placeholder="e.g. Sri Balaji Digital Seva Kendra"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="ownerName" className="block text-xs font-bold text-[#082046]">
                    Owner / Contact Person
                  </label>
                  <input
                    id="ownerName"
                    type="text"
                    required
                    placeholder="Full name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-[#082046]">
                    Mobile Number (SMS / WhatsApp)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-[#082046]">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="contact@center.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="stateName" className="block text-xs font-bold text-[#082046]">
                    Operating State
                  </label>
                  <select
                    id="stateName"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  >
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#082046] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#061835]"
                >
                  Submit Center for Verification
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
