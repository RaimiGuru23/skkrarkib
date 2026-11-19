import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { CODE_GS_TEMPLATE } from '../data/mockPortalData';

interface IntegrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationGuideModal({ isOpen, onClose }: IntegrationGuideModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CODE_GS_TEMPLATE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#111827]/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 id="setup-guide-title" className="text-sm font-semibold text-[#111827]">
              Skrip Google Apps Script (Sokongan Akses Admin)
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Kemas kini <code className="font-mono">Code.gs</code> dan terbitkan semula Web App untuk mengaktifkan muat naik pukal admin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan tetapan"
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm text-[#111827]">
          <div>
            <h3 className="text-xs font-semibold text-[#111827] mb-2">
              1. Struktur Lajur Google Sheet
            </h3>
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[#6B7280]">
                  <tr>
                    <th className="py-2 px-3 font-medium">Lajur A: AccessCode</th>
                    <th className="py-2 px-3 font-medium">Lajur B: Label</th>
                    <th className="py-2 px-3 font-medium">Lajur C: FolderId</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] font-mono text-[11px]">
                  <tr>
                    <td className="py-2 px-3 tabular-nums">482910</td>
                    <td className="py-2 px-3 font-sans text-xs">Ahmad Bin Ali</td>
                    <td className="py-2 px-3 text-[#6B7280]">1aBcDeFgHiJkLmNoPqRsTuVwXyZ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#111827] mb-2">
              2. Kemas Kini &amp; Terbitkan Semula Web App
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#6B7280] leading-relaxed">
              <li>
                Buka Google Sheet anda dan pergi ke{' '}
                <span className="text-[#111827] font-medium">Extensions → Apps Script</span>.
              </li>
              <li>
                Gantikan kod sedia ada dalam <code className="font-mono text-[#111827]">Code.gs</code> dengan skrip di bawah dan tukar{' '}
                <code className="font-mono text-[#111827]">ADMIN_ACCESS_CODE</code> (lalai: <code className="font-mono text-[#111827]">SKKR2026</code>).
              </li>
              <li>
                Klik <span className="text-[#111827] font-medium">Deploy → Manage deployments → Edit (ikon pensel)</span>, pilih{' '}
                <span className="text-[#111827] font-medium">New version</span>, dan klik <span className="text-[#111827] font-medium">Deploy</span>.
              </li>
              <li>
                Luluskan kebenaran Google Drive sekiranya diminta supaya admin boleh mencipta fail terus ke dalam folder.
              </li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-semibold text-[#111827]">3. Skrip Bahagian Pelayan (Code.gs)</h3>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                    <span>Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
                    <span>Salin Code.gs</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] text-[11px] leading-relaxed font-mono text-[#111827] overflow-x-auto max-h-64">
              <code>{CODE_GS_TEMPLATE}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
