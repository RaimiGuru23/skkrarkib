import type { SheetFolderEntry } from '../config';

const STOP_WORDS = new Set([
  'bin',
  'binti',
  'bt',
  'a/l',
  'a/p',
  'anak',
  'al',
  'ap',
  'encik',
  'puan',
  'cik',
  'ustaz',
  'ustazah',
  'dr',
  'sk',
  'sdn',
  'bhd',
  'the',
  'and',
  'dan',
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // Buang sambungan fail seperti .pdf, .docx
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenizeSignificant(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

/**
 * Memadankan nama fail dengan baris `Label` (atau `AccessCode`) daripada jadual Google Sheet.
 * Mengembalikan folder terbaik yang sepadan, atau `null` jika tiada padanan meyakinkan.
 */
export function findBestFolderMatch(
  fileName: string,
  entries: SheetFolderEntry[]
): SheetFolderEntry | null {
  if (entries.length === 0) return null;

  const normalizedFile = normalizeText(fileName);
  const fileTokens = new Set(tokenizeSignificant(fileName));

  let bestMatch: SheetFolderEntry | null = null;
  let bestScore = 0;

  for (const entry of entries) {
    const normalizedLabel = normalizeText(entry.label);
    if (!normalizedLabel) continue;

    // 1. Padanan kod akses 6 digit di dalam nama fail (cth. "482910_Laporan.pdf")
    if (entry.accessCode && normalizedFile.includes(entry.accessCode.toLowerCase())) {
      return entry;
    }

    // 2. Padanan tepat atau frasa penuh nama `Label` di dalam nama fail
    if (normalizedFile.includes(normalizedLabel)) {
      const score = 100 + normalizedLabel.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
      continue;
    }

    // 3. Padanan token perkataan penting (mengabaikan "bin", "binti", dll.)
    const labelTokens = tokenizeSignificant(entry.label);
    if (labelTokens.length === 0) continue;

    let matchedTokens = 0;
    let matchedChars = 0;
    for (const token of labelTokens) {
      if (fileTokens.has(token)) {
        matchedTokens += 1;
        matchedChars += token.length;
      }
    }

    if (matchedTokens === 0) continue;

    const coverage = matchedTokens / labelTokens.length;
    // Memerlukan sekurang-kurangnya semua token penting padan (jika label pendek) atau >= 50% token & >= 2 token (atau label 1 perkataan)
    if (
      coverage === 1 ||
      (matchedTokens >= 2 && coverage >= 0.5) ||
      (labelTokens.length === 1 && matchedTokens === 1)
    ) {
      const score = coverage * 60 + matchedTokens * 10 + matchedChars;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }
  }

  return bestMatch;
}
