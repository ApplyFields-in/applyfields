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
    <div className="flex justify-between items-center gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => {
        const isFilled = Boolean(digits[i]);
        return (
          <div key={i} className="relative flex-1">
            <input
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              disabled={disabled}
              value={digits[i] || ''}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-full aspect-square text-center font-mono text-xl sm:text-2xl font-black rounded-xl border-2 transition-all duration-150 outline-none select-none disabled:opacity-50 ${
                isFilled
                  ? 'border-sea bg-cream text-teal shadow-[0_4px_0_0_#1a936f,0_6px_12px_rgba(26,147,111,0.2)] -translate-y-0.5'
                  : 'border-line/80 bg-canvas text-teal shadow-[0_3px_0_0_#114b5f,0_4px_8px_rgba(17,75,95,0.08)] hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_#114b5f]'
              } focus:border-sea focus:-translate-y-1 focus:shadow-[0_5px_0_0_#1a936f,0_8px_16px_rgba(26,147,111,0.25)]`}
            />
            {/* 3D bottom bevel highlight */}
            <div className="pointer-events-none absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-teal/10" />
          </div>
        );
      })}
    </div>
  );
}
