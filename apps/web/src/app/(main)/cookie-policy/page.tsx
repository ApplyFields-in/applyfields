import { Badge, buttonClass, Card, PageHeader } from '@applyfields/ui';
import {
  CheckCircle2,
  Cookie,
  ExternalLink,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';
import { CookiePreferencesTrigger } from '@/components/cookie-banner';

export const metadata = {
  title: 'Cookie & Tracking Policy',
  description:
    'Comprehensive disclosure of cookies, local storage, and privacy controls on ApplyFields under the Digital Personal Data Protection Act (DPDP Act 2023, India).',
};

export default function CookiePolicyPage() {
  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Privacy & Compliance"
        title="Cookie & Tracking Policy"
        description="Comprehensive disclosure of how ApplyFields uses cookies, sessions, and device storage in compliance with the Digital Personal Data Protection Act (DPDP Act 2023, India)."
        icon={<Cookie />}
        actions={
          <div className="flex items-center gap-2">
            <CookiePreferencesTrigger
              className={buttonClass({
                variant: 'primary',
                size: 'sm',
                className: 'gap-1.5 shadow-clay',
              })}
            >
              <Sliders className="size-3.5" /> Manage Cookie Preferences
            </CookiePreferencesTrigger>
          </div>
        }
      />

      {/* Overview Card */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-teal flex items-center gap-2">
          <Shield className="size-5 text-teal" /> 1. Commitment to Citizen Data Privacy
        </h2>
        <p className="text-xs text-teal/80 leading-relaxed">
          At ApplyFields, we are committed to upholding transparency, fairness, and strict data minimization. As a national career and education discovery platform serving citizens, students, and partners across India, we adhere strictly to the provisions of the <strong>Digital Personal Data Protection Act (DPDP Act 2023, India)</strong>, Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and international privacy standards.
        </p>
        <p className="text-xs text-teal/80 leading-relaxed">
          We do not sell student data, we do not engage in third-party behavioral profiling, and we do not use cross-site tracking cookies.
        </p>
      </Card>

      {/* What are Cookies */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-teal flex items-center gap-2">
          <Cookie className="size-5 text-teal" /> 2. What are Cookies and Local Storage?
        </h2>
        <p className="text-xs text-teal/80 leading-relaxed">
          Cookies are small text files placed on your browser or device when you visit our website. They allow the platform to verify your identity across pages, remember your chosen regional language, maintain security protections, and deliver responsive navigation.
        </p>
        <p className="text-xs text-teal/80 leading-relaxed">
          In addition to HTTP cookies, we also use browser <strong>Local Storage</strong> and <strong>Session Storage</strong> to ensure fast client-side responsiveness (such as college comparison trays and offline draft inquiries) without constantly burdening your mobile network data.
        </p>
      </Card>

      {/* Inventory Table */}
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-teal">3. Detailed Cookie Inventory</h2>
          <p className="text-xs text-teal/70 mt-0.5">
            Full transparency on every cookie name, purpose, duration, and classification.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line/60">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line/60 bg-cream/40 text-[11px] font-bold uppercase tracking-wider text-teal/80">
              <tr>
                <th className="px-4 py-3">Cookie Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Duration</th>
                <th className="px-3 py-3">Security & Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 font-medium">
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-teal">accessToken</td>
                <td className="px-3 py-3">
                  <Badge tone="teal" className="text-[10px]">Strictly Necessary</Badge>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">15 Minutes</td>
                <td className="px-3 py-3 text-teal/80">
                  Secure cryptographic JWT token that verifies authenticated citizen or partner identity. Guarded by <code className="font-mono text-[10px] bg-tea/40 px-1 py-0.5 rounded">HttpOnly; Secure; SameSite=Lax</code> to prevent cross-site scripting (XSS) extraction.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-mono font-bold text-teal">refreshToken</td>
                <td className="px-3 py-3">
                  <Badge tone="teal" className="text-[10px]">Strictly Necessary</Badge>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">30 Days</td>
                <td className="px-3 py-3 text-teal/80">
                  Cryptographically hashed refresh token that renews expired access tokens automatically without requiring you to re-type passwords on every visit. Guarded by <code className="font-mono text-[10px] bg-tea/40 px-1 py-0.5 rounded">HttpOnly; Secure; SameSite=Lax</code>.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-mono font-bold text-teal">cookie_consent_v1</td>
                <td className="px-3 py-3">
                  <Badge tone="tea" className="text-[10px]">Functional</Badge>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">12 Months</td>
                <td className="px-3 py-3 text-teal/80">
                  Stores your explicit cookie consent preferences (Strictly Necessary, Functional, Analytics) so you are not prompted with a consent banner on every page.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-mono font-bold text-teal">NEXT_LOCALE</td>
                <td className="px-3 py-3">
                  <Badge tone="tea" className="text-[10px]">Functional</Badge>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">12 Months</td>
                <td className="px-3 py-3 text-teal/80">
                  Preserves your selected regional language preference (e.g. English, Hindi, Telugu, Tamil, Marathi, Bengali) across platform visits.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 font-mono font-bold text-teal">_af_analytics (Optional)</td>
                <td className="px-3 py-3">
                  <Badge tone="outline" className="text-[10px]">Analytics</Badge>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">12 Months</td>
                <td className="px-3 py-3 text-teal/80">
                  Stores an anonymous random session identifier used strictly for measuring aggregate search queries, error rates, and load performance. Only set if explicitly accepted in preferences.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Your Rights Under DPDP Act */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-teal flex items-center gap-2">
          <ShieldAlert className="size-5 text-teal" /> 4. Your Rights Under DPDP Act 2023
        </h2>
        <div className="space-y-3 text-xs text-teal/80 leading-relaxed">
          <p>
            Under Section 6 and Section 11 of the Digital Personal Data Protection Act (2023), every citizen data principal possesses the following statutory rights:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Right to Withdraw Consent:</strong> You have the right to withdraw optional cookie consent at any time as easily as giving it, without affecting lawful processing prior to withdrawal.
            </li>
            <li>
              <strong>Right to Access Information:</strong> You may request a summary of personal data processed by ApplyFields and identity of third-party processors.
            </li>
            <li>
              <strong>Right to Correction & Erasure:</strong> You can edit inaccurate information or request deletion of account records not required by statutory audit retention rules.
            </li>
            <li>
              <strong>Right of Grievance Redressal:</strong> Direct recourse to the Data Protection Board of India after contacting our designated Grievance Officer.
            </li>
          </ul>
        </div>
      </Card>

      {/* How to Manage */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-teal flex items-center gap-2">
          <Sliders className="size-5 text-teal" /> 5. How to Change or Revoke Your Choices
        </h2>
        <p className="text-xs text-teal/80 leading-relaxed">
          You can adjust your cookie choices at any time using our on-page selector:
        </p>

        <div className="pt-1">
          <CookiePreferencesTrigger
            className={buttonClass({
              variant: 'primary',
              size: 'sm',
              className: 'gap-1.5 shadow-clay',
            })}
          >
            <Sliders className="size-3.5" /> Re-Open Cookie Preferences
          </CookiePreferencesTrigger>
        </div>

        <p className="text-xs text-teal/70 leading-relaxed pt-2">
          Additionally, you can control or delete cookies directly in your browser settings (Chrome, Edge, Safari, Firefox). Please note that disabling strictly necessary cookies in your browser settings will prevent you from signing in to ApplyFields.
        </p>
      </Card>

      {/* Contact & Grievance */}
      <Card className="p-6 space-y-3">
        <h2 className="text-base font-bold text-teal flex items-center gap-2">
          <Mail className="size-5 text-teal" /> 6. Grievance Officer & Contact Information
        </h2>
        <p className="text-xs text-teal/80 leading-relaxed">
          For any questions regarding this Cookie Policy or to exercise your rights under the DPDP Act 2023, please reach out to:
        </p>
        <div className="rounded-2xl border border-line/60 bg-tea/30 p-4 text-xs space-y-1 text-teal">
          <p className="font-bold">Grievance Officer: Arvind Kumar</p>
          <p>ApplyFields Technologies Private Limited</p>
          <p>Email: <a href="mailto:privacy@applyfields.in" className="font-bold underline text-teal">privacy@applyfields.in</a></p>
          <p className="text-[11px] text-teal/70 pt-1">Response turnaround time: Within 48 business hours.</p>
        </div>
      </Card>
    </div>
  );
}
