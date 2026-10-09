'use client';

import { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  length = 6,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split string into array of characters
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newCode = newDigits.join('');
    onChange(newCode);

    // If filled, move to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of ${length}`}
          maxLength={1}
          disabled={disabled}
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`h-12 min-w-0 flex-1 rounded-xl border text-center font-mono text-lg font-bold text-teal outline-none transition focus:border-sea focus:ring-4 focus:ring-sea/10 disabled:opacity-50 sm:h-14 sm:text-xl ${
            digits[i] ? 'border-sea bg-tea/40' : 'border-line bg-cream'
          }`}
        />
      ))}
    </div>
  );
}
