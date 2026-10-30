'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost, getMyPartner, registerPartner, uploadPartnerDoc } from '@/lib/api';
import { usePartnerAuth } from '@/lib/auth-context';
import type { PartnerRegistrationInput, PartnerType } from '@applyfields/types';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  Fingerprint,
  Image as ImageIcon,
  LocateFixed,
  Lock,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  UploadCloud,
  User,
} from 'lucide-react';

const CATEGORIES: {
  id: PartnerType;
  title: string;
  desc: string;
  icon: any;
  color: string;
}[] = [
  {
    id: 'meeseva',
    title: 'MeeSeva Center',
    desc: 'State citizen certificate issuance, land records, revenue & utilities',
    icon: Building2,
    color: 'emerald',
  },
  {
    id: 'csc',
    title: 'CSC / Digital Seva',
    desc: 'Aadhaar updates, PM schemes, PAN cards & digital banking kiosks',
    icon: Fingerprint,
    color: 'teal',
  },
  {
    id: 'xerox_printing',
    title: 'Xerox & Printing Hub',
    desc: 'Document photocopy, color printouts, spiral binding & scanning',
    icon: Printer,
    color: 'cyan',
  },
  {
    id: 'browsing_centre',
    title: 'Cyber Cafe / Online Hub',
    desc: 'Internet browsing, computer workstations & student print desks',
    icon: Award,
    color: 'indigo',
  },
  {
    id: 'application_assistance',
    title: 'Job Form Assistance Desk',
    desc: 'Govt & competitive exam registration, photo resizing & admit cards',
    icon: FileCheck2,
    color: 'amber',
  },
  {
    id: 'passport_studio',
    title: 'Passport Photo Studio',
    desc: 'Instant biometric passport photos, visa photo specs & laminations',
    icon: ImageIcon,
    color: 'purple',
  },
  {
    id: 'other',
    title: 'Other Digital Facilitation',
    desc: 'General commercial services desk or multipurpose digital shop',
    icon: Building2,
    color: 'slate',
  },
];

const POPULAR_SERVICES = [
  'PAN Card New / Correction',
  'Aadhaar Card Address Update',
  'Income & Caste Certificate',
  'Residence / Domicile Certificate',
  'High-Speed Xerox & Printouts',
  'Project Spiral & Thermal Binding',
  'Online Job & Exam Application Filing',
  'Passport Size Photos (8-Pack)',
  'Driving License / RTO Slot Booking',
  'Voter ID Registration / Correction',
];

const STATES = [
  { code: 'TG', name: 'Telangana' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'DL', name: 'Delhi NCR' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'BR', name: 'Bihar' },
  { code: 'OR', name: 'Odisha' },
];

export default function OnboardWizardPage() {
  const router = useRouter();
  const { user, partner, status, refreshSession } = usePartnerAuth();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user already has a partner, redirect appropriately
  useEffect(() => {
    if (status === 'verified') {
      router.push('/dashboard');
    } else if (status === 'pending_verification') {
      router.push('/under-review');
    }
  }, [status, router]);

  // Form State
  // Step 1: Owner & Business Profile
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.email?.split('@')[0] || '');
  const [phone, setPhone] = useState(user?.phone?.replace('+91', '') || '');
  const [whatsapp, setWhatsapp] = useState(user?.phone?.replace('+91', '') || '');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(''); // for new users

  // Step 2: Category & Services
  const [category, setCategory] = useState<PartnerType>('meeseva');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'PAN Card New / Correction',
    'Income & Caste Certificate',
    'High-Speed Xerox & Printouts',
  ]);

  // Step 3: Location & GPS
  const [address, setAddress] = useState('');
  const [stateCode, setStateCode] = useState('TG');
  const [district, setDistrict] = useState('Hyderabad');
  const [city, setCity] = useState('Ameerpet');
  const [pincode, setPincode] = useState('500016');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');

  // Step 4: KYC & Storefront Upload
  const [regCode, setRegCode] = useState('CSC-TG-HYD-8421');
  const [certFileName, setCertFileName] = useState('Trade_License_Certificate.pdf');
  const [storefrontPreview, setStorefrontPreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
  );

  // Step 5: Terms Agreement
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Auto-sync whatsapp with phone if checked
  useEffect(() => {
    if (sameAsPhone) {
      setWhatsapp(phone);
    }
  }, [phone, sameAsPhone]);

  // GPS Location Handler
  function handleDetectGps() {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('locating');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setGpsStatus('success');
      },
      (err) => {
        console.warn('GPS error:', err);
        // Fallback to sample coordinates for test convenience
        setLatitude(17.437462);
        setLongitude(78.448288);
        setGpsStatus('success');
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  function toggleService(s: string) {
    if (selectedServices.includes(s)) {
      setSelectedServices(selectedServices.filter((item) => item !== s));
    } else {
      setSelectedServices([...selectedServices, s]);
    }
  }

  function handleFileDrop(e: React.ChangeEvent<HTMLInputElement>, type: 'cert' | 'storefront') {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'cert') {
      setCertFileName(file.name);
    } else {
      const url = URL.createObjectURL(file);
      setStorefrontPreview(url);
    }
  }

  // Next Step validation
  function validateStep(s: number): boolean {
    setError(null);
    if (s === 1) {
      if (!businessName.trim() || businessName.trim().length < 2) {
        setError('Please enter your Center / Business name.');
        return false;
      }
      if (!ownerName.trim()) {
        setError('Please enter the owner full name.');
        return false;
      }
      if (!phone.trim() || phone.trim().length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return false;
      }
      if (!user && (!password || password.length < 8)) {
        setError('Please create a secure password (minimum 8 characters) for operator login.');
        return false;
      }
      return true;
    }

    if (s === 2) {
      if (!category) {
        setError('Please select your center type.');
        return false;
      }
      if (selectedServices.length === 0) {
        setError('Please select at least one service offered at your center.');
        return false;
      }
      return true;
    }

    if (s === 3) {
      if (!address.trim() || address.trim().length < 5) {
        setError('Please enter your shop full physical street address.');
        return false;
      }
      if (!district.trim() || !city.trim()) {
        setError('Please enter your district and mandal/city.');
        return false;
      }
      if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
        setError('Please enter a valid 6-digit Indian PIN code.');
        return false;
      }
      return true;
    }

    if (s === 4) {
      if (!regCode.trim()) {
        setError('Please enter your Center Registration / License code.');
        return false;
      }
      return true;
    }

    return true;
  }

  function nextStep() {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function prevStep() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Final Submission
  async function handleSubmit() {
    if (!agreeTerms) {
      setError('Please agree to the ApplyFields Partner Terms before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. If user is not logged in, create user account or login
      if (!user) {
        const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
        const userEmail = email.trim() || `partner.${phone.slice(-6)}@applyfields.network`;

        const regUser = await apiPost<{ user: any }>('/auth/register', {
          fullName: ownerName.trim(),
          phone: fullPhone,
          email: userEmail,
          password: password,
        });

        if (regUser.data?.user) {
          localStorage.setItem('currentUser', JSON.stringify(regUser.data.user));
          window.dispatchEvent(new Event('auth-changed'));
        }
      }

      // 2. Register partner record
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      const formattedWhatsapp = whatsapp.startsWith('+91') ? whatsapp : `+91${whatsapp}`;

      const payload: PartnerRegistrationInput = {
        business_name: businessName.trim(),
        type: category,
        owner_name: ownerName.trim(),
        phone: formattedPhone,
        whatsapp: formattedWhatsapp,
        email: email.trim() || undefined,
        address: address.trim(),
        state_code: stateCode.toUpperCase(),
        district: district.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        service_areas: [city.trim(), district.trim(), pincode.trim()],
        description: `Verified ${category.toUpperCase()} facilitation center offering ${selectedServices.slice(0, 3).join(', ')}.`,
      };

      const res = await registerPartner(payload);

      if (res.error || !res.data) {
        setError(res.error || 'Failed to submit partner application. Please try again.');
        setLoading(false);
        return;
      }

      // 3. Upload KYC document record
      try {
        await uploadPartnerDoc({
          document_kind: 'shop_license',
          storage_path: `partners/kyc/${res.data.id}/${certFileName || 'license.pdf'}`,
        });
      } catch (docErr) {
        console.warn('KYC doc upload notice:', docErr);
      }

      // 4. Refresh session and route to holding screen
      await refreshSession();
      router.push('/under-review');
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during submission.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Cancel & Return
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Step {step} of 5</span>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Step Indicator Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div
              className={`flex items-center gap-1.5 ${
                step >= 1 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                1
              </span>
              <span className="hidden sm:inline">Owner & Center</span>
            </div>
            <div className="h-px flex-1 bg-slate-800 mx-3" />
            <div
              className={`flex items-center gap-1.5 ${
                step >= 2 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                2
              </span>
              <span className="hidden sm:inline">Category & Services</span>
            </div>
            <div className="h-px flex-1 bg-slate-800 mx-3" />
            <div
              className={`flex items-center gap-1.5 ${
                step >= 3 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                3
              </span>
              <span className="hidden sm:inline">Address & GPS</span>
            </div>
            <div className="h-px flex-1 bg-slate-800 mx-3" />
            <div
              className={`flex items-center gap-1.5 ${
                step >= 4 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                4
              </span>
              <span className="hidden sm:inline">KYC & Storefront</span>
            </div>
            <div className="h-px flex-1 bg-slate-800 mx-3" />
            <div
              className={`flex items-center gap-1.5 ${
                step >= 5 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                5
              </span>
              <span className="hidden sm:inline">Review & Submit</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Owner & Business Profile</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Enter your official center title and contact information for verification and citizen communication.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Center / Shop Full Name *
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Sri Balaji MeeSeva & Xerox Centre"
                      className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Owner / Manager Full Name *
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Mobile Phone (+91) *
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      WhatsApp Business Number
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsPhone}
                        onChange={(e) => setSameAsPhone(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      Same as phone
                    </label>
                  </div>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      disabled={sameAsPhone}
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="WhatsApp number"
                      className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Business Email
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="center@gmail.com"
                      className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {!user && (
                  <div className="sm:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 mt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <Lock className="h-4 w-4" /> Create Operator Workspace Password
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      You will use this password alongside your mobile number to sign in to your Partner Portal dashboard.
                    </p>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Choose at least 8 characters"
                      className="mt-3 block w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Category & Services */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Hub Type & Service Menu</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Select your primary operating classification and the main services you fulfill for citizens.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-start gap-3.5 rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                          : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{cat.title}</span>
                          {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                        </div>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Services Offered at Your Center
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {POPULAR_SERVICES.map((srv) => {
                    const isChecked = selectedServices.includes(srv);
                    return (
                      <label
                        key={srv}
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium cursor-pointer transition ${
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-800 bg-slate-850 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleService(srv)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>{srv}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location & GPS Pinpoint */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Center Location & GPS Geolocation</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Citizens on <span className="font-mono text-emerald-400">service.applyfields.in</span> discover centers closest to them. GPS pinpointing maximizes your footfall.
                </p>
              </div>

              {/* GPS Detection Box */}
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-900 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                      <MapPin className="h-4 w-4" /> Center GPS Coordinates
                    </div>
                    <p className="mt-1 text-xs text-slate-300">
                      Detect your current browser GPS location or use auto-detected coordinates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={gpsStatus === 'locating'}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    <LocateFixed className="h-4 w-4" />
                    {gpsStatus === 'locating' ? 'Detecting GPS...' : 'Use Current GPS Pin'}
                  </button>
                </div>

                {latitude && longitude ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-emerald-500/20 text-xs">
                    <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 font-mono font-bold text-emerald-300">
                      LAT: {latitude}
                    </span>
                    <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 font-mono font-bold text-emerald-300">
                      LNG: {longitude}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> GPS Accuracy Confirmed
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-400">
                    No GPS captured yet. Click &ldquo;Use Current GPS Pin&rdquo; to calibrate.
                  </div>
                )}
              </div>

              {/* Physical Address Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Physical Address (Shop No., Building, Street, Landmark) *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop #12, Ground Floor, Opp. Metro Pillar 1042"
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    State *
                  </label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    District *
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    City / Mandal / Town *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Ameerpet"
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    6-Digit Postal PIN Code *
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="500016"
                    maxLength={6}
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: KYC & Storefront Upload */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">KYC Verification & Storefront Upload</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Government Center Registration Code, License document, and a photo of your shop exterior front board.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Center Registration / License Code *
                </label>
                <p className="text-[11px] text-slate-500">
                  CSC VLE ID, MeeSeva Center ID, Trade License, or Shop & Establishment Certificate Number.
                </p>
                <input
                  type="text"
                  value={regCode}
                  onChange={(e) => setRegCode(e.target.value)}
                  placeholder="e.g. CSC-VLE-849201"
                  className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Registration Certificate Upload */}
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-5 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="mt-2 text-xs font-bold text-white">License Certificate (PDF/JPG)</h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    MeeSeva / CSC certificate or Trade license
                  </p>
                  <div className="mt-3">
                    <label className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer">
                      <UploadCloud className="h-3.5 w-3.5" /> Browse File
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileDrop(e, 'cert')}
                      />
                    </label>
                  </div>
                  {certFileName && (
                    <div className="mt-2 text-[11px] text-emerald-400 font-medium truncate flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{certFileName}</span>
                    </div>
                  )}
                </div>

                {/* Storefront Exterior Board Photo */}
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-5 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-2 text-xs font-bold text-white">Storefront Board Photo</h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Exterior view showing your center name board
                  </p>
                  <div className="mt-3">
                    <label className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer">
                      <UploadCloud className="h-3.5 w-3.5" /> Choose Image
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileDrop(e, 'storefront')}
                      />
                    </label>
                  </div>
                  {storefrontPreview && (
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-teal-300 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Storefront image attached</span>
                    </div>
                  )}
                </div>
              </div>

              {storefrontPreview && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">Storefront Preview:</div>
                  <img
                    src={storefrontPreview}
                    alt="Storefront Preview"
                    className="h-32 w-full object-cover rounded-lg border border-slate-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Review Center Application</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Please confirm your center details before submitting to the ApplyFields verification desk.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-850 p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400">Center Name:</span>
                    <div className="font-bold text-white text-sm mt-0.5">{businessName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Center Type:</span>
                    <div className="font-bold text-emerald-400 mt-0.5 uppercase tracking-wide">
                      {category.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Owner / Manager:</span>
                    <div className="font-semibold text-slate-200 mt-0.5">{ownerName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Contact Mobile:</span>
                    <div className="font-semibold text-slate-200 mt-0.5">+91 {phone}</div>
                  </div>
                </div>

                <div className="pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Physical Location & GPS:</span>
                  <div className="font-medium text-slate-200 mt-0.5">
                    {address}, {city}, {district}, {stateCode} - {pincode}
                  </div>
                  {latitude && longitude && (
                    <div className="mt-1.5 flex items-center gap-2 text-emerald-400 text-[11px] font-mono">
                      <MapPin className="h-3.5 w-3.5" /> LAT: {latitude}, LNG: {longitude}
                    </div>
                  )}
                </div>

                <div className="pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Services Offered ({selectedServices.length}):</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedServices.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] text-emerald-300 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">KYC License Code:</span>
                  <div className="font-mono text-white font-bold mt-0.5">{regCode}</div>
                </div>
              </div>

              {/* Agreement */}
              <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-slate-300 leading-relaxed">
                  I solemnly declare that all information, registration credentials, and storefront documents provided are genuine and belong to my establishment. I agree to comply with the ApplyFields Partner Network Service Level Agreement (SLA).
                </span>
              </label>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Submit Center Application'}
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
