import { useEffect } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import type { DriveFileItem } from '../config';
import { triggerMockFileDownload } from '../services/drivePortalService';
import {
  formatFileSize,
  formatUpdatedDate,
  getFileTypeDescriptor,
  getGoogleDriveEmbedUrl,
} from '../utils/fileFormatters';

interface FilePreviewModalProps {
  file: DriveFileItem | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  useEffect(() => {
    if (!file) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const descriptor = getFileTypeDescriptor(file);
  const FileIcon = descriptor.Icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#111827]/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pengepala Modal */}
        <div className="flex items-start sm:items-center justify-between gap-4 px-5 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-center shrink-0">
              <FileIcon className="w-4 h-4 text-[#111827]" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="preview-modal-title"
                className="text-sm font-semibold text-[#111827] truncate"
                title={file.name}
              >
                {file.name}
              </h2>
              <p className="text-xs text-[#6B7280] tabular-nums">
                {descriptor.label}
                {file.size !== null ? ` · ${formatFileSize(file.size)}` : ''}
                {` · Dikemas kini ${formatUpdatedDate(file.updatedDate)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!file.isMock && (
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] hover:bg-[#FAFAFA] transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
                <span className="hidden sm:inline">Buka di Drive</span>
              </a>
            )}

            {!descriptor.isFolder && (
              file.isMock ? (
                <button
                  type="button"
                  onClick={() => triggerMockFileDownload(file)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#18181B] text-[#FFFFFF] text-xs font-medium hover:bg-[#27272A] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Muat Turun</span>
                </button>
              ) : (
                <a
                  href={file.webContentLink || file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#18181B] text-[#FFFFFF] text-xs font-medium hover:bg-[#27272A] transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Muat Turun</span>
                </a>
              )
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratonton"
              className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Kandungan Modal */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-5 sm:p-8">
          {file.isMock ? (
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-6 sm:p-8 max-w-xl mx-auto">
              <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB]">
                <FileIcon className="w-5 h-5 text-[#111827]" strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <p className="text-xs text-[#6B7280]">Pratonton Fail Demo</p>
                  <p className="text-sm font-medium text-[#111827]">{file.name}</p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-[#111827]">
                {file.mockSummary || 'Contoh kandungan pratonton untuk tujuan demonstrasi.'}
              </p>

              <dl className="mt-6 pt-5 border-t border-[#E5E7EB] grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-[#6B7280]">Jenis Fail</dt>
                  <dd className="mt-1 font-medium text-[#111827]">{descriptor.label}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Saiz</dt>
                  <dd className="mt-1 font-medium text-[#111827] tabular-nums">
                    {formatFileSize(file.size)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Tarikh Kemas Kini</dt>
                  <dd className="mt-1 font-medium text-[#111827] tabular-nums">
                    {formatUpdatedDate(file.updatedDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280]">Jenis MIME</dt>
                  <dd className="mt-1 font-mono text-[11px] text-[#111827] truncate" title={file.mimeType}>
                    {file.mimeType}
                  </dd>
                </div>
              </dl>

              <p className="mt-6 text-xs text-[#6B7280]">
                Apabila disambungkan ke URL Web App Google Apps Script anda, tetingkap ini akan memaparkan pratonton fail Google Drive secara terus.
              </p>
            </div>
          ) : descriptor.isFolder ? (
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-8 text-center max-w-md mx-auto">
              <FileIcon className="w-6 h-6 text-[#111827] mx-auto mb-3" strokeWidth={1.75} aria-hidden="true" />
              <p className="text-sm font-medium text-[#111827]">{file.name}</p>
              <p className="mt-1.5 text-xs text-[#6B7280]">
                Subfolder dibuka terus di dalam Google Drive.
              </p>
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#18181B] text-[#FFFFFF] text-xs font-medium hover:bg-[#27272A] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Buka Folder di Drive</span>
              </a>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg overflow-hidden h-[56vh] min-h-[360px]">
              <iframe
                src={getGoogleDriveEmbedUrl(file)}
                title={`Pratonton ${file.name}`}
                className="w-full h-full border-0"
                allow="autoplay"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
