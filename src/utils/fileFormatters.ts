import {
  Archive,
  File,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Film,
  Folder,
  Image as ImageIcon,
  Music,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import type { DriveFileItem } from '../config';

export interface FileTypeDescriptor {
  label: string;
  extension: string;
  Icon: LucideIcon;
  isFolder: boolean;
}

export function getFileTypeDescriptor(file: DriveFileItem): FileTypeDescriptor {
  const mime = file.mimeType.toLowerCase();
  const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toUpperCase() : '';

  if (mime === 'application/vnd.google-apps.folder') {
    return { label: 'Folder', extension: 'FOLDER', Icon: Folder, isFolder: true };
  }
  if (mime === 'application/pdf' || ext === 'PDF') {
    return { label: 'Dokumen PDF', extension: 'PDF', Icon: FileText, isFolder: false };
  }
  if (
    mime === 'application/vnd.google-apps.document' ||
    mime.includes('wordprocessingml') ||
    mime === 'application/msword' ||
    ext === 'DOCX' ||
    ext === 'DOC'
  ) {
    return {
      label: mime.includes('google-apps') ? 'Dokumen Google' : 'Dokumen Word',
      extension: ext || 'DOC',
      Icon: FileText,
      isFolder: false,
    };
  }
  if (
    mime === 'application/vnd.google-apps.spreadsheet' ||
    mime.includes('spreadsheetml') ||
    mime === 'text/csv' ||
    ext === 'XLSX' ||
    ext === 'CSV'
  ) {
    return {
      label: mime.includes('google-apps') ? 'Helaian Google' : ext === 'CSV' ? 'Jadual CSV' : 'Hamparan',
      extension: ext || 'SHEET',
      Icon: FileSpreadsheet,
      isFolder: false,
    };
  }
  if (
    mime === 'application/vnd.google-apps.presentation' ||
    mime.includes('presentationml') ||
    ext === 'PPTX' ||
    ext === 'KEY'
  ) {
    return {
      label: mime.includes('google-apps') ? 'Slaid Google' : 'Pembentangan',
      extension: ext || 'SLIDES',
      Icon: Presentation,
      isFolder: false,
    };
  }
  if (mime.startsWith('image/')) {
    return { label: `Imej ${ext || 'Gambar'}`, extension: ext || 'IMG', Icon: ImageIcon, isFolder: false };
  }
  if (mime.startsWith('video/')) {
    return { label: `Video ${ext || ''}`.trim(), extension: ext || 'VID', Icon: Film, isFolder: false };
  }
  if (mime.startsWith('audio/')) {
    return { label: `Audio ${ext || ''}`.trim(), extension: ext || 'AUD', Icon: Music, isFolder: false };
  }
  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    ext === 'ZIP' ||
    ext === 'RAR'
  ) {
    return { label: 'Arkib', extension: ext || 'ZIP', Icon: Archive, isFolder: false };
  }
  if (
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('xml') ||
    mime.startsWith('text/')
  ) {
    return { label: ext ? `Fail ${ext}` : 'Fail Teks', extension: ext || 'TXT', Icon: FileCode2, isFolder: false };
  }

  return {
    label: ext ? `Fail ${ext}` : 'Fail',
    extension: ext || 'FILE',
    Icon: File,
    isFolder: false,
  };
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return '—';
  }
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  const decimals = index === 0 ? 0 : value >= 100 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[index]}`;
}

export function formatUpdatedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getGoogleDriveEmbedUrl(file: DriveFileItem): string {
  if (file.mimeType === 'application/vnd.google-apps.document') {
    return `https://docs.google.com/document/d/${file.id}/preview`;
  }
  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    return `https://docs.google.com/spreadsheets/d/${file.id}/preview`;
  }
  if (file.mimeType === 'application/vnd.google-apps.presentation') {
    return `https://docs.google.com/presentation/d/${file.id}/preview`;
  }
  return `https://drive.google.com/file/d/${file.id}/preview`;
}
