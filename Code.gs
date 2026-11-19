/**
 * Skrip Bahagian Pelayan Google Apps Script (`Code.gs`)
 *
 * Struktur Google Sheet yang Dijangka (helaian pertama atau dinamakan SHEET_NAME):
 * - Baris 1 (Pengepala): AccessCode | Label | FolderId
 * - Lajur A: AccessCode (rentetan 6 digit, cth. "482910")
 * - Lajur B: Label (Nama penerima atau folder paparan, cth. "Ahmad Bin Ali")
 * - Lajur C: FolderId (ID Folder Google Drive yang diperuntukkan bagi kod tersebut)
 *
 * Arahan Penerbitan:
 * 1. Buka Google Sheet anda -> Extensions -> Apps Script.
 * 2. Tampal keseluruhan fail ini ke dalam Code.gs dan tukar ADMIN_ACCESS_CODE mengikut keperluan.
 * 3. Klik Deploy -> Manage deployments -> Edit (atau New deployment) -> Web app.
 * 4. Execute as: "Me" | Who has access: "Anyone".
 * 5. Sahkan kebenaran (termasuk akses baca/tulis Google Drive) dan simpan URL /exec dalam CONFIG.APPS_SCRIPT_URL.
 */

var SHEET_NAME = 'AccessCodes';
var ADMIN_ACCESS_CODE = 'SKKR2026'; // Tukar kod laluan admin ini sebelum menerbitkan skrip

function doGet(e) {
  var code = (e && e.parameter && e.parameter.code) ? String(e.parameter.code) : '';
  return handleCodeVerification_(code);
}

function doPost(e) {
  var body = null;
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'Muatan permintaan tidak sah.' });
  }

  if (body && body.action === 'adminFolders') {
    return handleAdminFolders_(body.adminCode);
  }

  if (body && body.action === 'uploadFile') {
    return handleAdminUpload_(body);
  }

  var code = (body && body.code)
    ? String(body.code)
    : ((e && e.parameter && e.parameter.code) ? String(e.parameter.code) : '');

  return handleCodeVerification_(code);
}

function isValidAdminCode_(rawAdminCode) {
  var provided = String(rawAdminCode || '').trim();
  return provided.length > 0 && provided === ADMIN_ACCESS_CODE;
}

function getSheetEntries_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  var rows = sheet.getDataRange().getDisplayValues();
  var entries = [];

  for (var i = 1; i < rows.length; i++) {
    var rowCode = String(rows[i][0] || '').trim();
    if (/^\d{1,6}$/.test(rowCode)) {
      rowCode = ('000000' + rowCode).slice(-6);
    }
    var label = String(rows[i][1] || '').trim();
    var folderId = String(rows[i][2] || '').trim();

    if (rowCode || label || folderId) {
      entries.push({
        rowNumber: i + 1,
        accessCode: rowCode,
        label: label || 'Folder Dikongsi',
        folderId: folderId
      });
    }
  }

  return entries;
}

function handleAdminFolders_(rawAdminCode) {
  if (!isValidAdminCode_(rawAdminCode)) {
    return jsonResponse_({
      ok: false,
      error: 'Kod laluan admin tidak sah. Sila semak dan cuba lagi.'
    });
  }

  try {
    var entries = getSheetEntries_().filter(function (entry) {
      return Boolean(entry.folderId);
    });

    return jsonResponse_({
      ok: true,
      entries: entries
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: 'Tidak dapat membaca jadual Google Sheet. Sila semak kebenaran skrip.'
    });
  }
}

function handleAdminUpload_(body) {
  if (!isValidAdminCode_(body.adminCode)) {
    return jsonResponse_({
      ok: false,
      error: 'Sesi admin tidak sah atau tamat tempoh.'
    });
  }

  var folderId = String(body.folderId || '').trim();
  var fileName = String(body.fileName || '').trim();
  var mimeType = String(body.mimeType || 'application/octet-stream').trim();
  var base64Data = String(body.base64Data || '');

  if (!folderId || !fileName || !base64Data) {
    return jsonResponse_({
      ok: false,
      error: 'Maklumat fail atau Folder ID tidak lengkap.'
    });
  }

  try {
    // Pastikan FolderId wujud di dalam jadual Google Sheet
    var entries = getSheetEntries_();
    var allowed = false;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].folderId === folderId) {
        allowed = true;
        break;
      }
    }

    if (!allowed) {
      return jsonResponse_({
        ok: false,
        error: 'Folder ID sasaran tidak ditemui dalam jadual Google Sheet.'
      });
    }

    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);
    var folder = DriveApp.getFolderById(folderId);
    var created = folder.createFile(blob);
    var createdId = created.getId();

    return jsonResponse_({
      ok: true,
      file: {
        id: createdId,
        name: created.getName(),
        mimeType: created.getMimeType(),
        size: created.getSize(),
        updatedDate: created.getLastUpdated().toISOString(),
        webViewLink: created.getUrl(),
        webContentLink: getDirectDownloadUrl_(createdId, created.getMimeType())
      }
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: 'Gagal memuat naik fail ke Google Drive. Pastikan skrip mempunyai kebenaran edit Drive.'
    });
  }
}

function handleCodeVerification_(rawCode) {
  var code = String(rawCode || '').replace(/\D/g, '');
  if (code.length !== 6) {
    return jsonResponse_({
      ok: false,
      error: 'Sila masukkan kod akses 6 digit yang sah.'
    });
  }

  try {
    var entries = getSheetEntries_();
    var matchedRow = null;

    for (var i = 0; i < entries.length; i++) {
      if (entries[i].accessCode === code) {
        matchedRow = entries[i];
        break;
      }
    }

    if (!matchedRow || !matchedRow.folderId) {
      return jsonResponse_({
        ok: false,
        error: 'Kod akses tidak sah. Sila semak dan cuba lagi.'
      });
    }

    var folder = DriveApp.getFolderById(matchedRow.folderId);
    var files = [];

    var subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
      var sub = subFolders.next();
      files.push({
        id: sub.getId(),
        name: sub.getName(),
        mimeType: 'application/vnd.google-apps.folder',
        size: null,
        updatedDate: sub.getLastUpdated().toISOString(),
        webViewLink: sub.getUrl(),
        webContentLink: ''
      });
    }

    var fileIterator = folder.getFiles();
    while (fileIterator.hasNext()) {
      var file = fileIterator.next();
      var id = file.getId();
      var mimeType = file.getMimeType();
      var isGoogleNative = mimeType.indexOf('application/vnd.google-apps.') === 0;

      files.push({
        id: id,
        name: file.getName(),
        mimeType: mimeType,
        size: isGoogleNative ? null : file.getSize(),
        updatedDate: file.getLastUpdated().toISOString(),
        webViewLink: file.getUrl(),
        webContentLink: getDirectDownloadUrl_(id, mimeType)
      });
    }

    files.sort(function (a, b) {
      var aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
      var bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
      if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return jsonResponse_({
      ok: true,
      label: matchedRow.label,
      folderId: matchedRow.folderId,
      files: files
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: 'Tidak dapat mengakses folder. Sila semak kebenaran dan Folder ID.'
    });
  }
}

function getDirectDownloadUrl_(fileId, mimeType) {
  if (mimeType === 'application/vnd.google-apps.document') {
    return 'https://docs.google.com/document/d/' + fileId + '/export?format=pdf';
  }
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    return 'https://docs.google.com/spreadsheets/d/' + fileId + '/export?format=xlsx';
  }
  if (mimeType === 'application/vnd.google-apps.presentation') {
    return 'https://docs.google.com/presentation/d/' + fileId + '/export?format=pdf';
  }
  return 'https://drive.google.com/uc?export=download&id=' + fileId;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
