import {
  CONFIG,
  type AdminFoldersResponse,
  type AdminUploadResponse,
  type DriveFileItem,
  type PortalVerifyResponse,
} from '../config';
import {
  MOCK_ADMIN_CODE,
  MOCK_FOLDERS_BY_CODE,
  addMockFileToFolder,
  getMockSheetEntries,
} from '../data/mockPortalData';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB (memastikan muatan base64 kekal di bawah had 50 MB Apps Script)

export async function verifyAccessCode(code: string): Promise<PortalVerifyResponse> {
  const normalized = code.replace(/\D/g, '');
  if (normalized.length !== 6) {
    return {
      ok: false,
      error: 'Sila masukkan kesemua 6 digit kod akses anda.',
    };
  }

  if (CONFIG.USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 420));
    const match = MOCK_FOLDERS_BY_CODE[normalized];
    if (!match) {
      return {
        ok: false,
        error: 'Kod akses tidak sah. Sila semak dan cuba lagi.',
      };
    }
    return {
      ok: true,
      label: match.label,
      folderId: match.folderId,
      files: match.files,
    };
  }

  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    return {
      ok: false,
      error: 'URL pelayan portal belum dikonfigurasi. Kemas kini CONFIG.APPS_SCRIPT_URL untuk menyambung.',
    };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const url = new URL(CONFIG.APPS_SCRIPT_URL);
    url.searchParams.set('code', normalized);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: 'Tidak dapat mengesahkan kod akses buat masa ini. Sila cuba lagi.',
      };
    }

    const data = (await response.json()) as PortalVerifyResponse;
    if (!data || typeof data.ok !== 'boolean') {
      return {
        ok: false,
        error: 'Respons tidak dijangka diterima daripada pelayan portal.',
      };
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        error: 'Permintaan pengesahan tamat masa. Sila cuba lagi.',
      };
    }
    return {
      ok: false,
      error: 'Ralat sambungan semasa mengesahkan kod akses. Sila semak rangkaian anda.',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function fetchAdminFolders(adminCode: string): Promise<AdminFoldersResponse> {
  const trimmed = adminCode.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: 'Sila masukkan kod laluan admin.',
    };
  }

  if (CONFIG.USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (trimmed !== MOCK_ADMIN_CODE) {
      return {
        ok: false,
        error: 'Kod laluan admin tidak sah. Sila semak dan cuba lagi.',
      };
    }
    return {
      ok: true,
      entries: getMockSheetEntries(),
    };
  }

  if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    return {
      ok: false,
      error: 'URL pelayan portal belum dikonfigurasi dalam CONFIG.APPS_SCRIPT_URL.',
    };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'adminFolders',
        adminCode: trimmed,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: 'Tidak dapat menyambung ke pelayan Apps Script. Sila cuba lagi.',
      };
    }

    const data = (await response.json()) as AdminFoldersResponse;
    if (!data || typeof data.ok !== 'boolean') {
      return {
        ok: false,
        error: 'Respons tidak dijangka diterima daripada pelayan.',
      };
    }

    // Kesan jika Web App masih menggunakan skrip Code.gs versi lama (yang menyangka semua POST ialah kod 6 digit)
    if (
      !data.ok &&
      (data.error.includes('6 digit') || data.error.includes('valid 6-digit'))
    ) {
      return {
        ok: false,
        needsScriptUpdate: true,
        error:
          'Skrip Code.gs pada Web App Google Apps Script anda perlu dikemas kini dan diterbitkan semula untuk menyokong Akses Admin.',
      };
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        error: 'Permintaan pengesahan admin tamat masa. Sila cuba lagi.',
      };
    }
    return {
      ok: false,
      error: 'Ralat sambungan semasa mengesahkan akses admin.',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = result.indexOf(',');
      if (commaIndex === -1) {
        reject(new Error('Gagal membaca kandungan fail.'));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    };
    reader.onerror = () => reject(new Error('Gagal membaca fail daripada peranti anda.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadFileToFolder(params: {
  adminCode: string;
  folderId: string;
  file: File;
}): Promise<AdminUploadResponse> {
  const { adminCode, folderId, file } = params;

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: 'Saiz fail melebihi had maksimum 25 MB bagi setiap muat naik.',
    };
  }

  if (CONFIG.USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const mockFile: DriveFileItem = {
      id: `mock-upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      updatedDate: new Date().toISOString(),
      webViewLink: 'https://drive.google.com',
      webContentLink: '',
      isMock: true,
      mockSummary: `Fail yang dimuat naik melalui Mod Demo Admin (${file.name}).`,
    };
    addMockFileToFolder(folderId, mockFile);
    return { ok: true, file: mockFile };
  }

  try {
    const base64Data = await readFileAsBase64(file);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'uploadFile',
          adminCode: adminCode.trim(),
          folderId,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Data,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          ok: false,
          error: 'Pelayan menolak permintaan muat naik fail.',
        };
      }

      const data = (await response.json()) as AdminUploadResponse;
      if (!data || typeof data.ok !== 'boolean') {
        return {
          ok: false,
          error: 'Respons muat naik tidak sah daripada pelayan.',
        };
      }

      return data;
    } finally {
      window.clearTimeout(timeoutId);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        error: 'Muat naik tamat masa. Cuba muat naik fail yang lebih kecil.',
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Ralat rangkaian semasa memuat naik fail.',
    };
  }
}

/**
 * Menjana muat turun sampel bersih untuk mod demo.
 */
export function triggerMockFileDownload(file: DriveFileItem): void {
  const contents = [
    `SKaR ArkibLab — Eksport Fail Demo`,
    `==================================`,
    `Nama Fail: ${file.name}`,
    `Jenis MIME: ${file.mimeType}`,
    `Dikemas Kini: ${file.updatedDate}`,
    ``,
    `Ringkasan:`,
    file.mockSummary || 'Fail sampel yang dijana daripada Mod Demo SKaR ArkibLab.',
  ].join('\n');

  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  anchor.href = blobUrl;
  anchor.download = `${baseName}-sampel.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
}
