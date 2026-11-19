import { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FolderOpen,
  LayoutGrid,
  List,
  Lock,
  Search,
  X,
} from 'lucide-react';
import type { DriveFileItem } from '../config';
import { triggerMockFileDownload } from '../services/drivePortalService';
import {
  formatFileSize,
  formatUpdatedDate,
  getFileTypeDescriptor,
} from '../utils/fileFormatters';

interface FolderViewerScreenProps {
  label: string;
  files: DriveFileItem[];
  onLockExit: () => void;
  onPreviewFile: (file: DriveFileItem) => void;
}

type ViewMode = 'list' | 'grid';

export function FolderViewerScreen({
  label,
  files,
  onLockExit,
  onPreviewFile,
}: FolderViewerScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return files;
    return files.filter((file) => file.name.toLowerCase().includes(query));
  }, [files, searchQuery]);

  const handleDownload = (file: DriveFileItem) => {
    if (file.isMock) {
      triggerMockFileDownload(file);
    }
  };

  return (
    <section aria-label="Kandungan folder dikongsi" className="w-full">
      {/* Bar Atas */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111827] truncate">
            {label}
          </h1>
          <p className="mt-1 text-xs text-[#6B7280] tabular-nums">
            {files.length} item
            {searchQuery.trim() ? (
              <>
                <span className="mx-1.5" aria-hidden="true">
                  ·
                </span>
                <span>{filteredFiles.length} padanan</span>
              </>
            ) : null}
          </p>
        </div>

        <button
          type="button"
          onClick={onLockExit}
          className="self-start sm:self-auto inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] hover:bg-[#FAFAFA] hover:border-[#D1D5DB] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
        >
          <Lock className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
          <span>Kunci / Keluar</span>
        </button>
      </header>

      {/* Bar Alat: Carian + Penukar Senarai/Grid */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tapis fail mengikut nama..."
            aria-label="Tapis fail mengikut nama"
            className="w-full h-10 pl-9 pr-9 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-sm text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#18181B] focus:border-[#18181B] transition-colors duration-150"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Kosongkan carian"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:bg-[#FAFAFA] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          role="group"
          aria-label="Susun atur paparan"
          className="inline-flex items-center p-1 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] self-start sm:self-auto shrink-0"
        >
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={[
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]',
              viewMode === 'list'
                ? 'bg-[#18181B] text-[#FFFFFF]'
                : 'text-[#6B7280] hover:text-[#111827]',
            ].join(' ')}
          >
            <List className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Senarai</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            className={[
              'inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]',
              viewMode === 'grid'
                ? 'bg-[#18181B] text-[#FFFFFF]'
                : 'text-[#6B7280] hover:text-[#111827]',
            ].join(' ')}
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* Ruangan Fail */}
      <div className="mt-5">
        {files.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl py-16 px-6 text-center">
            <div className="w-10 h-10 mx-auto rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-center mb-4">
              <FolderOpen className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-[#111827]">
              Tiada fail tersedia dalam folder ini buat masa ini.
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              Fail yang ditambah ke folder Google Drive yang dipautkan akan dipaparkan di sini secara automatik.
            </p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl py-14 px-6 text-center">
            <p className="text-sm font-medium text-[#111827]">
              Tiada fail sepadan dengan &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 inline-flex items-center h-9 px-3.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] hover:bg-[#FAFAFA] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
            >
              Kosongkan carian
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-[#E5E7EB]">
            {filteredFiles.map((file) => {
              const descriptor = getFileTypeDescriptor(file);
              const FileIcon = descriptor.Icon;

              return (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-[#FAFAFA] transition-colors duration-150"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-center shrink-0">
                      <FileIcon className="w-4 h-4 text-[#111827]" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onPreviewFile(file)}
                        className="text-sm font-medium text-[#111827] hover:underline underline-offset-4 decoration-[#D1D5DB] truncate block max-w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] rounded"
                        title={file.name}
                      >
                        {file.name}
                      </button>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-[#6B7280] tabular-nums">
                        <span>{descriptor.label}</span>
                        {file.size !== null && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{formatFileSize(file.size)}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{formatUpdatedDate(file.updatedDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-12 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] hover:bg-[#FAFAFA] hover:border-[#D1D5DB] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
                      <span>{descriptor.isFolder ? 'Buka' : 'Pratonton'}</span>
                    </button>

                    {!descriptor.isFolder && (
                      file.isMock ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#18181B] text-[#FFFFFF] text-xs font-medium hover:bg-[#27272A] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#18181B]"
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
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#18181B] text-[#FFFFFF] text-xs font-medium hover:bg-[#27272A] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#18181B]"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Muat Turun</span>
                        </a>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const descriptor = getFileTypeDescriptor(file);
              const FileIcon = descriptor.Icon;

              return (
                <article
                  key={file.id}
                  className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between gap-5 hover:border-[#D1D5DB] transition-colors duration-150"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-9 h-9 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-center shrink-0">
                        <FileIcon className="w-4 h-4 text-[#111827]" strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <span className="font-mono text-[11px] font-medium text-[#6B7280] tabular-nums">
                        {descriptor.extension}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="text-sm font-medium text-[#111827] hover:underline underline-offset-4 decoration-[#D1D5DB] line-clamp-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B] rounded"
                      title={file.name}
                    >
                      {file.name}
                    </button>

                    <p className="mt-1.5 text-xs text-[#6B7280] tabular-nums">
                      {file.size !== null ? `${formatFileSize(file.size)} · ` : ''}
                      {formatUpdatedDate(file.updatedDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] hover:bg-[#FAFAFA] transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
                      <span>{descriptor.isFolder ? 'Buka' : 'Pratonton'}</span>
                    </button>

                    {!descriptor.isFolder && (
                      file.isMock ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-[#18181B] text-[#FFFFFF] text-xs font-medium hover:bg-[#27272A] transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
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
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-[#18181B] text-[#FFFFFF] text-xs font-medium hover:bg-[#27272A] transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Muat Turun</span>
                        </a>
                      )
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
