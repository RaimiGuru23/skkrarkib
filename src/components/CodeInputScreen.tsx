import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { CONFIG } from '../config';

interface CodeInputScreenProps {
  onVerify: (code: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

const CODE_LENGTH = 6;

export function CodeInputScreen({
  onVerify,
  isLoading,
  error,
  onClearError,
}: CodeInputScreenProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedRef = useRef<string>('');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const currentCode = digits.join('');
  const isComplete = currentCode.length === CODE_LENGTH && digits.every((d) => /^\d$/.test(d));

  const submitCode = (nextDigits: string[]) => {
    const joined = nextDigits.join('');
    if (joined.length === CODE_LENGTH && !isLoading) {
      lastSubmittedRef.current = joined;
      void onVerify(joined);
    }
  };

  const handleDigitChange = (index: number, rawValue: string) => {
    if (isLoading) return;
    if (error) onClearError();

    const numericOnly = rawValue.replace(/\D/g, '');
    if (!numericOnly) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      lastSubmittedRef.current = '';
      return;
    }

    if (numericOnly.length > 1) {
      const next = [...digits];
      const chars = numericOnly.slice(0, CODE_LENGTH - index).split('');
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });
      setDigits(next);
      const nextFocusIndex = Math.min(index + chars.length, CODE_LENGTH - 1);
      inputRefs.current[nextFocusIndex]?.focus();

      if (next.every((d) => /^\d$/.test(d))) {
        submitCode(next);
      }
      return;
    }

    const next = [...digits];
    next[index] = numericOnly;
    setDigits(next);

    if (index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => /^\d$/.test(d)) && next.join('') !== lastSubmittedRef.current) {
      submitCode(next);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoading) return;

    if (event.key === 'Backspace') {
      event.preventDefault();
      if (error) onClearError();
      lastSubmittedRef.current = '';

      const next = [...digits];
      if (next[index]) {
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
      return;
    }

    if (event.key === 'Enter' && isComplete) {
      event.preventDefault();
      submitCode(digits);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (isLoading) return;
    if (error) onClearError();

    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((char, idx) => {
      next[idx] = char;
    });
    setDigits(next);

    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === CODE_LENGTH) {
      submitCode(next);
    }
  };

  const handleDemoFill = (demoCode: string) => {
    if (isLoading) return;
    if (error) onClearError();
    const next = demoCode.split('').slice(0, CODE_LENGTH);
    setDigits(next);
    inputRefs.current[CODE_LENGTH - 1]?.focus();
    submitCode(next);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isComplete && !isLoading) {
      submitCode(digits);
    }
  };

  return (
    <section
      aria-labelledby="portal-heading"
      className="w-full max-w-[440px] mx-auto bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-6 sm:p-10"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full border border-[#E5E7EB] bg-[#000000] overflow-hidden flex items-center justify-center mb-5 shrink-0">
          <img
            src="/assets/aistudio/Gemini_Generated_Image_o3o04ko3o04ko3o0_d56532a1.jpeg"
            alt="Logo SKaR ArkibLab"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <h1
          id="portal-heading"
          className="text-2xl font-semibold tracking-tight text-[#111827] text-balance"
        >
          Arkib SKKR
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-[#6B7280] max-w-[34ch]">
          Masukkan 6 digit terakhir Kad Pengenalan anak anda untuk melihat fail yang diisi.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="mt-8" noValidate>
        <fieldset disabled={isLoading}>
          <legend className="sr-only">Kod akses 6 digit</legend>
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={CODE_LENGTH}
                value={digit}
                aria-label={`Digit ${index + 1} daripada ${CODE_LENGTH}`}
                aria-invalid={error ? 'true' : 'false'}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.currentTarget.select()}
                className={[
                  'w-11 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl font-medium tabular-nums',
                  'rounded-lg border bg-[#FFFFFF] text-[#111827] transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-[#18181B] focus:border-[#18181B]',
                  'disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:cursor-not-allowed',
                  error ? 'border-[#DC2626]' : 'border-[#E5E7EB] hover:border-[#D1D5DB]',
                ].join(' ')}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-4 min-h-[24px] flex items-center justify-center">
          {error ? (
            <p
              role="alert"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#DC2626] text-center"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : isLoading ? (
            <p
              aria-live="polite"
              className="inline-flex items-center gap-2 text-xs text-[#6B7280]"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#18181B]" aria-hidden="true" />
              <span>Mengesahkan kod akses...</span>
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!isComplete || isLoading}
          className={[
            'mt-4 w-full h-11 px-4 rounded-lg text-sm font-medium',
            'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0',
            'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#18181B]',
            isComplete && !isLoading
              ? 'bg-[#18181B] text-[#FFFFFF] hover:bg-[#27272A] cursor-pointer'
              : 'bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB] cursor-not-allowed',
          ].join(' ')}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Mengesahkan</span>
            </>
          ) : (
            <>
              <span>Akses Fail</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      {CONFIG.USE_MOCK_DATA && (
        <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
          <p className="text-xs text-[#6B7280]">
            Kod demo:{' '}
            <button
              type="button"
              onClick={() => handleDemoFill('123456')}
              className="font-mono tabular-nums text-[#111827] underline underline-offset-4 decoration-[#D1D5DB] hover:decoration-[#18181B] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] rounded"
            >
              123456
            </button>
            <span className="mx-1.5 text-[#D1D5DB]" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={() => handleDemoFill('654321')}
              className="font-mono tabular-nums text-[#111827] underline underline-offset-4 decoration-[#D1D5DB] hover:decoration-[#18181B] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] rounded"
            >
              654321
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
