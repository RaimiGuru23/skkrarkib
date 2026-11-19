import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  FileCode2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { CONFIG } from '../config';
import { MOCK_ADMIN_CODE } from '../data/mockPortalData';

interface AdminAccessScreenProps {
  onLogin: (adminCode: string) => Promise<void>;
  onBackToPortal: () => void;
  onOpenGuide: () => void;
  isLoading: boolean;
  error: string | null;
  needsScriptUpdate: boolean;
  onClearError: () => void;
}

export function AdminAccessScreen({
  onLogin,
  onBackToPortal,
  onOpenGuide,
  isLoading,
  error,
  needsScriptUpdate,
  onClearError,
}: AdminAccessScreenProps) {
  const [adminCode, setAdminCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminCode.trim() || isLoading) return;
    void onLogin(adminCode.trim());
  };

  const handleDemoFill = () => {
    if (isLoading) return;
    if (error) onClearError();
    setAdminCode(MOCK_ADMIN_CODE);
    void onLogin(MOCK_ADMIN_CODE);
  };

  return (
    <section
      aria-labelledby="admin-heading"
      className="w-full max-w-[440px] mx-auto bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-6 sm:p-10"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-10 h-10 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-center mb-6">
          <ShieldCheck className="w-4 h-4 text-[#111827]" strokeWidth={1.75} aria-hidden="true" />
        </div>

        <h1
          id="admin-heading"
          className="text-2xl font-semibold tracking-tight text-[#111827] text-balance"
        >
          Akses Admin
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-[#6B7280] max-w-[34ch]">
          Masukkan kod laluan admin untuk memuat naik fail pukal ke folder mengikut nama dalam jadual.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8" noValidate>
        <div>
          <label htmlFor="admin-passcode-input" className="sr-only">
            Kod laluan admin
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              id="admin-passcode-input"
              type={showCode ? 'text' : 'password'}
              value={adminCode}
              disabled={isLoading}
              placeholder="Kod laluan admin"
              autoComplete="current-password"
              onChange={(e) => {
                if (error) onClearError();
                setAdminCode(e.target.value);
              }}
              className={[
                'w-full h-11 pl-3.5 pr-10 rounded-lg border bg-[#FFFFFF] text-sm font-mono text-[#111827] placeholder:font-sans placeholder:text-[#6B7280]',
                'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#18181B] focus:border-[#18181B]',
                'disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:cursor-not-allowed',
                error ? 'border-[#DC2626]' : 'border-[#E5E7EB] hover:border-[#D1D5DB]',
              ].join(' ')}
            />
            <button
              type="button"
              onClick={() => setShowCode((prev) => !prev)}
              aria-label={showCode ? 'Sembunyikan kod laluan' : 'Tunjukkan kod laluan'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center text-[#6B7280] hover:text-[#111827] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
            >
              {showCode ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 min-h-[24px] flex flex-col items-center justify-center gap-2">
          {error ? (
            <p
              role="alert"
              className="inline-flex items-start gap-1.5 text-xs font-medium text-[#DC2626] text-center"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : isLoading ? (
            <p
              aria-live="polite"
              className="inline-flex items-center gap-2 text-xs text-[#6B7280]"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#18181B]" aria-hidden="true" />
              <span>Memuatkan direktori folder...</span>
            </p>
          ) : null}

          {needsScriptUpdate && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-xs font-medium text-[#111827] hover:bg-[#FFFFFF] transition-colors cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
              <span>Salin Code.gs Terkini</span>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!adminCode.trim() || isLoading}
          className={[
            'mt-4 w-full h-11 px-4 rounded-lg text-sm font-medium',
            'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0',
            'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#18181B]',
            adminCode.trim() && !isLoading
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
              <span>Masuk Panel Admin</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBackToPortal}
          disabled={isLoading}
          className="mt-3 w-full h-10 px-4 rounded-lg text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#FAFAFA] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Kembali ke Portal Pengguna</span>
        </button>
      </form>

      {CONFIG.USE_MOCK_DATA && (
        <div className="mt-5 pt-5 border-t border-[#E5E7EB] text-center">
          <p className="text-xs text-[#6B7280]">
            Kod admin demo:{' '}
            <button
              type="button"
              onClick={handleDemoFill}
              className="font-mono text-[#111827] underline underline-offset-4 decoration-[#D1D5DB] hover:decoration-[#18181B] cursor-pointer"
            >
              {MOCK_ADMIN_CODE}
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
