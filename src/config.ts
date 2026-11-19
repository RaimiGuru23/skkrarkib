/**
 * Centralized configuration for SKaR ArkibLab.
 *
 * To connect your live Google Sheet and Google Drive folders:
 * 1. Deploy the included `Code.gs` script as a Google Apps Script Web App.
 * 2. Paste the resulting `/exec` Web App URL into `APPS_SCRIPT_URL` below.
 * 3. Set `USE_MOCK_DATA` to `false`.
 */
export const CONFIG = {
  USE_MOCK_DATA: false,
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbw4amN5Tvp41Ykt_iLjJ89Bk0Xqf47YE32yCMJ7ZnyswCickwfNXK4JhjqXoefjhBAB/exec",
  PORTAL_TITLE: 'SKaR ArkibLab',
} as const;

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  updatedDate: string;
  webViewLink: string;
  webContentLink: string;
  isMock?: boolean;
  mockSummary?: string;
}

export interface PortalVerifySuccess {
  ok: true;
  label: string;
  folderId: string;
  files: DriveFileItem[];
}

export interface PortalVerifyFailure {
  ok: false;
  error: string;
}

export type PortalVerifyResponse = PortalVerifySuccess | PortalVerifyFailure;

export interface SheetFolderEntry {
  rowNumber: number;
  accessCode: string;
  label: string;
  folderId: string;
}

export type AdminFoldersResponse =
  | {
      ok: true;
      entries: SheetFolderEntry[];
    }
  | {
      ok: false;
      error: string;
      needsScriptUpdate?: boolean;
    };

export type AdminUploadResponse =
  | {
      ok: true;
      file: DriveFileItem;
    }
  | {
      ok: false;
      error: string;
    };

