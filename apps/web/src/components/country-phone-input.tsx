'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
];

export function extractNationalDigits(fullPhone: string): string {
  if (!fullPhone) return '';
  const matched = COUNTRIES.find((c) => fullPhone.startsWith(c.dialCode));
  if (matched) {
    return fullPhone.slice(matched.dialCode.length).replace(/\D/g, '');
  }
  return fullPhone.replace(/^\+/, '').replace(/\D/g, '');
}

export function isValidPhone(fullPhone: string): boolean {
  if (!fullPhone) return false;
  const national = extractNationalDigits(fullPhone);
  return national.length >= 7 && /^\+[1-9]\d{7,14}$/.test(fullPhone.trim());
}

interface CountryPhoneInputProps {
  value: string; // Full e.164 string like "+919876543210" or empty
  onChange: (fullPhoneNumber: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

export function CountryPhoneInput({
  value,
  onChange,
  disabled = false,
  placeholder = '9876543210',
  id,
}: CountryPhoneInputProps) {
  // Determine country and phone number directly from value
  const matchedCountry = COUNTRIES.find((c) => value.startsWith(c.dialCode));
  const [selectedCountryState, setSelectedCountryState] = useState<Country>(COUNTRIES[0]);

  const selectedCountry = matchedCountry ?? selectedCountryState;

  // Derive phone digits directly from value
  const phoneNumber = extractNationalDigits(value);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleCountrySelect(country: Country) {
    setSelectedCountryState(country);
    setIsOpen(false);
    setSearch('');
    if (phoneNumber) {
      onChange(`${country.dialCode}${phoneNumber}`);
    } else {
      onChange(country.dialCode);
    }
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, ''); // Digits only
    if (raw) {
      onChange(`${selectedCountry.dialCode}${raw}`);
    } else {
      onChange(selectedCountry.dialCode);
    }
  }

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative flex h-12 rounded-xl border border-line bg-cream transition focus-within:border-sea focus-within:ring-4 focus-within:ring-sea/10">
      {/* Country Selector Trigger */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-full items-center gap-1.5 rounded-l-xl pl-4 pr-3 text-sm font-semibold text-teal transition hover:bg-paper disabled:opacity-60"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="text-base" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="tracking-tight">{selectedCountry.dialCode}</span>
          <ChevronDown className="size-3 text-teal/70" />
        </button>

        {/* Dropdown Menu with 3D Depth */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 max-h-64 w-68 overflow-hidden rounded-xl border border-line bg-cream shadow-[0_16px_36px_-12px_rgb(8_32_70/0.3)] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2.5 border-b border-line bg-tea/20">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-teal/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full rounded-lg border border-line bg-canvas pl-8 pr-2 py-1.5 text-xs text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea"
                  autoFocus
                />
              </div>
            </div>

            <ul className="max-h-48 overflow-y-auto py-1 text-xs">
              {filteredCountries.length === 0 ? (
                <li className="px-3 py-2 text-center text-teal/60">No country found</li>
              ) : (
                filteredCountries.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-tea/40 ${
                        c.code === selectedCountry.code ? 'bg-celadon/30 font-bold text-teal' : 'text-teal'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-teal/70 shrink-0">{c.dialCode}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Vertical separator */}
      <div className="h-6 self-center w-px bg-line" />

      {/* Phone Number Input */}
      <input
        id={id}
        type="tel"
        autoComplete="tel-national"
        disabled={disabled}
        value={phoneNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="h-full w-full min-w-0 rounded-r-xl bg-transparent px-3 text-sm text-teal placeholder:text-teal/40 focus:outline-none disabled:opacity-60"
      />
    </div>
  );
}
