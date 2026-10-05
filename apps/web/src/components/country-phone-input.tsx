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
}: CountryPhoneInputProps) {
  // Determine initial country based on value
  const initialCountry =
    COUNTRIES.find((c) => value.startsWith(c.dialCode)) ?? COUNTRIES[0];

  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (!value) return '';
    return value.startsWith(initialCountry.dialCode)
      ? value.slice(initialCountry.dialCode.length)
      : value.replace(/^\+\d+/, '');
  });

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
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    if (phoneNumber) {
      onChange(`${country.dialCode}${phoneNumber}`);
    } else {
      onChange('');
    }
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, ''); // Digits only
    setPhoneNumber(raw);
    if (raw) {
      onChange(`${selectedCountry.dialCode}${raw}`);
    } else {
      onChange('');
    }
  }

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative flex rounded-xl border border-line bg-canvas focus-within:border-sea">
      {/* Country Selector Trigger */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-10 items-center gap-1.5 rounded-l-xl px-3 text-xs font-semibold text-teal hover:bg-tea/30 disabled:opacity-60 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="text-base" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span>{selectedCountry.dialCode}</span>
          <ChevronDown className="size-3.5 text-teal/60" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-64 overflow-hidden rounded-xl border border-line bg-cream shadow-card">
            <div className="p-2 border-b border-line bg-tea/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-3.5 text-teal/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full rounded-lg border border-line bg-canvas pl-8 pr-2 py-1 text-xs text-teal placeholder:text-teal/40 focus:outline-none"
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
        type="tel"
        disabled={disabled}
        value={phoneNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="w-full rounded-r-xl bg-transparent px-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none disabled:opacity-60"
      />
    </div>
  );
}
