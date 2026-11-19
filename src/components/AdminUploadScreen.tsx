import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FolderPlus,
  Loader2,
  LogOut,
  Search,
  Trash2,
  Upload,
  UploadCloud,
} from 'lucide-react';
import type { SheetFolderEntry } from '../config';
import { uploadFileToFolder } from '../services/drivePortalService';
import { formatFileSize } from '../utils/fileFormatters';
import { findBestFolderMatch } from '../utils/nameMatcher';

interface AdminUploadScreenProps {
  adminCode: string;
  entries: SheetFolderEntry[];
  onLogout: () => void;
}

type QueueItemStatus = 'ready' | 'uploading' | 'done' | 'error';

interface QueuedUploadItem {
  localId: string;
  file: File;
  targetFolderId: string;
  autoMatched: boolean;
  status: QueueItemStatus;
  errorMessage?: string;
}

export function AdminUploadScreen({
  adminCode,
  entries,
  onLogout,
}: AdminUploadScreenProps) {
  const [queue, setQueue] = useState<QueuedUploadItem[]>([]);
  const [defaultTargetFolderId, setDefaultTargetFolderId] = useState<string>('auto');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [pendingRowFolderId, setPendingRowFolderId] = useState<string | null>(null);

  const mainFileInputRef = useRef<HTMLInputElement | null>(null);
  const rowFileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredEntries = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.accessCode.toLowerCase().includes(q)
    );
  }, [entries, directorySearch]);

  const entryByFolderId = useMemo(() => {
    const map = new Map<string, SheetFolderEntry>();
    for (const entry of entries) {
      map.set(entry.folderId, entry);
    }
    return map;
  }, [entries]);

  const enqueueFiles = (fileList: FileList | File[], forcedFolderId?: string) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const newItems: QueuedUploadItem[] = incoming.map((file) => {
      if (forcedFolderId) {
        return {
          localId: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          targetFolderId: forcedFolderId,
          autoMatched: false,
          status: 'ready',
        };
      }

      if (defaultTargetFolderId !== 'auto') {
        return {
          localId: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          targetFolderId: defaultTargetFolderId,
          autoMatched: false,
          status: 'ready',
        };
      }

      const matched = findBestFolderMatch(file.name, entries);
      return {
        localId: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        targetFolderId: matched ? matched.folderId : '',
        autoMatched: Boolean(matched),
        status: 'ready',
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploadingBatch) return;
    if (event.dataTransfer.files?.length) {
      enqueueFiles(event.dataTransfer.files);
    }
  };

  const handleAssignTarget = (localId: string, folderId: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? {
              ...item,
              targetFolderId: folderId,
              autoMatched: false,
              status: item.status === 'error' ? 'ready' : item.status,
              errorMessage: undefined,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (localId: string) => {
    setQueue((prev) => prev.filter((item) => item.localId !== localId));
  };

  const handleClearDone = () => {
    setQueue((prev) => prev.filter((item) => item.status !== 'done'));
  };

  const handleClearAll = () => {
    if (isUploadingBatch) return;
    setQueue([]);
  };

  const handleApplyDefaultTargetToPending = (nextTarget: string) => {
    setDefaultTargetFolderId(nextTarget);
    if (nextTarget === 'auto') {
      setQueue((prev) =>
        prev.map((item) => {
          if (item.status === 'done' || item.status === 'uploading') return item;
          const matched = findBestFolderMatch(item.file.name, entries);
          return {
            ...item,
            targetFolderId: matched ? matched.folderId : '',
            autoMatched: Boolean(matched),
          };
        })
      );
    } else {
      setQueue((prev) =>
        prev.map((item) =>
          item.status === 'done' || item.status === 'uploading'
            ? item
            : { ...item, targetFolderId: nextTarget, autoMatched: false }
        )
      );
    }
  };

  const readyToUploadCount = queue.filter(
    (item) => (item.status === 'ready' || item.status === 'error') && Boolean(item.targetFolderId)
  ).length;
  const doneCount = queue.filter((item) => item.status === 'done').length;
  const unassignedCount = queue.filter(
    (item) => (item.status === 'ready' || item.status === 'error') && !item.targetFolderId
  ).length;

  const handleStartUpload = async () => {
    if (isUploadingBatch || readyToUploadCount === 0) return;
    setIsUploadingBatch(true);

    const itemsToUpload = queue.filter(
      (item) => (item.status === 'ready' || item.status === 'error') && Boolean(item.targetFolderId)
    );

    for (const currentItem of itemsToUpload) {
      const { localId } = currentItem;

      setQueue((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? { ...item, status: 'uploading', errorMessage: undefined }
            : item
        )
      );

      const res = await uploadFileToFolder({
        adminCode,
        folderId: currentItem.targetFolderId,
        file: currentItem.file,
      });

      setQueue((prev) =>
        prev.map((item) =>
          item.localId === localId
            ? res.ok
              ? { ...item, status: 'done', errorMessage: undefined }
              : { ...item, status: 'error', errorMessage: res.error }
            : item
        )
      );
    }

    setIsUploadingBatch(false);
  };

  const triggerRowUpload = (folderId: string) => {
    if (isUploadingBatch) return;
    setPendingRowFolderId(folderId);
    rowFileInputRef.current?.click();
  };

  return (
    <section aria-label="Panel muat naik pukal admin" className="w-full space-y-6">
      {/* Bar Atas Admin */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111827] truncate">
            Panel Admin · Muat Naik Pukal
          </h1>
          <p className="mt-1 text-xs text-[#6B7280] tabular-nums">
            {entries.length} nama folder dalam jadual Google Sheet
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            disabled={isUploadingBatch}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] hover:bg-[#FAFAFA] hover:border-[#D1D5DB] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </header>

      {/* Zon Pemilihan Fail & Sasaran */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#111827]">
              Muat Naik Fail Mengikut Nama
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Padankan nama fail secara automatik dengan lajur <span className="font-mono text-[#111827]">Label</span> atau pilih satu folder sasaran.
            </p>
          </div>

          <div className="sm:w-72 shrink-0">
            <label htmlFor="default-target-select" className="sr-only">
              Sasaran muat naik lalai
            </label>
            <select
              id="default-target-select"
              value={defaultTargetFolderId}
              disabled={isUploadingBatch}
              onChange={(e) => handleApplyDefaultTargetToPending(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#18181B] focus:border-[#18181B] disabled:opacity-60"
            >
              <option value="auto">Auto-padan mengikut nama fail</option>
              {entries.map((entry) => (
                <option key={entry.folderId} value={entry.folderId}>
                  Semua ke: {entry.label} ({entry.accessCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploadingBatch) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploadingBatch) mainFileInputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isUploadingBatch) {
              e.preventDefault();
              mainFileInputRef.current?.click();
            }
          }}
          className={[
            'border border-dashed rounded-xl py-9 px-6 text-center transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181B]',
            isDragging
              ? 'border-[#18181B] bg-[#FAFAFA]'
              : 'border-[#D1D5DB] bg-[#FAFAFA]/60 hover:bg-[#FAFAFA] hover:border-[#9CA3AF]',
            isUploadingBatch ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <input
            ref={mainFileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                enqueueFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <input
            ref={rowFileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length && pendingRowFolderId) {
                enqueueFiles(e.target.files, pendingRowFolderId);
              }
              setPendingRowFolderId(null);
              e.target.value = '';
            }}
          />

          <div className="w-10 h-10 mx-auto rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-center mb-3">
            <UploadCloud className="w-4 h-4 text-[#111827]" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[#111827]">
            Seret &amp; lepas fail di sini, atau klik untuk memilih fail pukal
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Contoh nama fail: <span className="font-mono text-[#111827]">Ahmad_Bin_Ali_Sijil.pdf</span> atau <span className="font-mono text-[#111827]">123456_Laporan.pdf</span> · Maksimum 25 MB setiap fail
          </p>
        </div>
      </div>

      {/* Baris Gilir Muat Naik */}
      {queue.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">
                Baris Gilir Muat Naik
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
                {queue.length} fail dipilih
                {doneCount > 0 ? ` · ${doneCount} selesai` : ''}
                {unassignedCount > 0 ? ` · ${unassignedCount} belum dipadankan` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {doneCount > 0 && !isUploadingBatch && (
                <button
                  type="button"
                  onClick={handleClearDone}
                  className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#FAFAFA] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Kosongkan Selesai
                </button>
              )}

              {!isUploadingBatch && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#FAFAFA] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Kosongkan Semua
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleStartUpload()}
                disabled={readyToUploadCount === 0 || isUploadingBatch}
                className={[
                  'inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  readyToUploadCount > 0 && !isUploadingBatch
                    ? 'bg-[#18181B] text-[#FFFFFF] hover:bg-[#27272A] cursor-pointer'
                    : 'bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB] cursor-not-allowed',
                ].join(' ')}
              >
                {isUploadingBatch ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Memuat naik...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Muat Naik ({readyToUploadCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {queue.map((item) => {
              const assignedEntry = item.targetFolderId
                ? entryByFolderId.get(item.targetFolderId)
                : undefined;

              return (
                <div
                  key={item.localId}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111827] truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6B7280] tabular-nums">
                      {formatFileSize(item.file.size)}
                      {item.autoMatched && assignedEntry ? (
                        <>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span className="text-[#111827]">Dipadankan automatik</span>
                        </>
                      ) : !item.targetFolderId ? (
                        <>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span className="text-[#D97706]">Tiada padanan nama — sila pilih folder</span>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                    <select
                      aria-label={`Folder sasaran untuk ${item.file.name}`}
                      value={item.targetFolderId}
                      disabled={isUploadingBatch || item.status === 'done'}
                      onChange={(e) => handleAssignTarget(item.localId, e.target.value)}
                      className={[
                        'h-8 px-2.5 rounded-lg border text-xs bg-[#FFFFFF] text-[#111827] max-w-[230px]',
                        'focus:outline-none focus:ring-2 focus:ring-[#18181B] disabled:bg-[#FAFAFA] disabled:text-[#6B7280]',
                        !item.targetFolderId ? 'border-[#D97706]' : 'border-[#E5E7EB]',
                      ].join(' ')}
                    >
                      <option value="">Pilih nama folder...</option>
                      {entries.map((entry) => (
                        <option key={entry.folderId} value={entry.folderId}>
                          {entry.label} ({entry.accessCode})
                        </option>
                      ))}
                    </select>

                    <div className="min-w-[100px] flex items-center justify-end text-xs">
                      {item.status === 'uploading' ? (
                        <span className="inline-flex items-center gap-1.5 text-[#111827]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          <span>Memuat naik</span>
                        </span>
                      ) : item.status === 'done' ? (
                        <span className="inline-flex items-center gap-1.5 text-[#16A34A] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Selesai</span>
                        </span>
                      ) : item.status === 'error' ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[#DC2626] font-medium"
                          title={item.errorMessage}
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate max-w-[140px]">
                            {item.errorMessage || 'Gagal'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">Sedia</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.localId)}
                      disabled={isUploadingBatch && item.status === 'uploading'}
                      aria-label={`Buang ${item.file.name}`}
                      className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-center text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FAFAFA] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Direktori Nama & Folder daripada Google Sheet */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-sm font-semibold text-[#111827]">
              Direktori Nama dalam Jadual
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Klik &ldquo;Muat Naik ke Folder&rdquo; pada mana-mana nama untuk memilih fail terus bagi penerima tersebut.
            </p>
          </div>

          <div className="relative sm:w-64">
            <Search
              className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              placeholder="Cari nama atau kod..."
              aria-label="Cari nama atau kod dalam jadual"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#18181B]"
            />
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-10 px-6 text-center text-xs text-[#6B7280]">
            {entries.length === 0
              ? 'Tiada baris folder sah ditemui dalam Google Sheet anda.'
              : `Tiada nama sepadan dengan "${directorySearch}".`}
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] max-h-[380px] overflow-y-auto">
            {filteredEntries.map((entry) => (
              <div
                key={`${entry.rowNumber}-${entry.folderId}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111827] truncate">{entry.label}</p>
                  <p className="mt-0.5 text-xs text-[#6B7280] tabular-nums">
                    Kod: <span className="font-mono text-[#111827]">{entry.accessCode || '—'}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="font-mono truncate">{entry.folderId}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => triggerRowUpload(entry.folderId)}
                  disabled={isUploadingBatch}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] text-xs font-medium text-[#111827] hover:bg-[#FAFAFA] hover:border-[#D1D5DB] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
                  <span>Muat Naik ke Folder</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
