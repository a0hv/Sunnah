/**
 * src/lib/quran-guard.ts
 * فلتر التحقق الإجباري الحاسم من الآيات القرآنية وصيانتها من التأليف أو الاختلاق.
 * يعتمد على المصحف الشريف الكامل (6,236 آية) في src/data/quran-index.json.
 */

import quranIndexRaw from '@/data/quran-index.json';
import { normalizeArabic } from './rag';

interface QuranIndexItem {
  c: number;
  v: number;
  t: string;
}

const quranIndex = quranIndexRaw as QuranIndexItem[];

// تجميع نصوص كل سورة من سور القرآن الـ 114 لتسريع البحث وضمان مطابقة الآيات الكاملة والجزئية والمتصلة عبر الفواصل
const surahCorpus: string[] = (() => {
  const surahs: Record<number, string[]> = {};
  for (const item of quranIndex) {
    if (!surahs[item.c]) surahs[item.c] = [];
    surahs[item.c].push(item.t);
  }
  return Object.values(surahs).map((verses) => verses.join(' '));
})();

/**
 * تنقية نص الآية من الأرقام والرموز والأشكال الشائعة قبل المطابقة
 */
export function cleanAyahForVerification(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/[0-9٠-٩]/g, ' ')
    .replace(/[۝۞۩*]/g, ' ')
    .replace(/داود/g, 'داوود')
    .replace(/السموات/g, 'السماوات');
}

/**
 * فحص ما إذا كان النص القرآني حقيقياً وموجوداً في المصحف الشريف
 */
export function isRealQuranSnippet(rawText: string): boolean {
  if (!rawText || !rawText.trim()) return false;

  // إذا كان النص يحتوي على نقاط حذف (...) نفحص كل شطر مستقل
  const segments = rawText
    .split(/(?:\.{3,}|…)/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) return false;

  for (const seg of segments) {
    const cleaned = cleanAyahForVerification(seg);
    const norm = normalizeArabic(cleaned);
    if (!norm || norm.length < 3) continue;

    const found = surahCorpus.some((surahText) => surahText.includes(norm));
    if (!found) return false;
  }

  return true;
}

// نمط لاكتشاف عبارات التقديم التي تسبق الآية (مثل: قال الله تعالى:، قوله تعالى: إلخ)
const INTRO_PHRASE_REGEX =
  /(?:(?:كما\s+جاء\s+في|وفي\s+التنزيل\s+الحكيم|مصداقاً|مصداقا|استناداً|استنادا|وفق|كقوله|ولقوله|لقوله|وقوله|قوله|كما\s+قال|وقال|قال)\s+(?:الله\s+تعالى|الله\s+عز\s*وجل|الله|ربنا|الحق|عز\s*وجل|سبحانه(?:\s+وتعالى)?|تبارك\s+وتعالى|تعالى)(?:\s+(?:في\s+محكم\s+كتابه|في\s+القرآن(?:\s+الكريم)?))?\s*[:،,-]?\s*)$/;

// نمط لاكتشاف الإحالة القرآنية الملحقة بالآية مثل [البقرة: 255] أو (سورة آل عمران: 18)
const CITATION_REGEX =
  /^\s*(?:\[|\()(?:\s*سورة\s*)?[^\]\)\r\n]{2,30}(?:[:،,]\s*[0-9٠-٩\-\s]+|[0-9٠-٩]+)(?:\s*آية)?(?:\s*\]|\))/;

/**
 * فلتر التحقق الإجباري من الآيات القرآنية:
 * 1. يلتقط كل نص محصور بين ﴿...﴾ وما يتبعه مباشرة من إشارة مثل [السورة: رقم] أو (السورة: رقم).
 * 2. يتحقق من صحة النص في المصحف.
 * 3. يحذف الآية المختلقة والإحالة وعبارة «قال الله تعالى:» السابقة لها.
 */
export function sanitizeQuranQuotes(reply: string): string {
  if (!reply || typeof reply !== 'string') return reply || '';

  const quoteRegex = /﴿([^﴾]+)﴾/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = quoteRegex.exec(reply)) !== null) {
    const fullQuote = match[0];
    const ayahContent = match[1];
    const matchIndex = match.index;

    // فحص ما إذا كان يتبع الآية مباشرة إحالة مثل [البقرة: 255]
    const remaining = reply.slice(matchIndex + fullQuote.length);
    const citMatch = remaining.match(CITATION_REGEX);
    const citationLength = citMatch ? citMatch[0].length : 0;
    const fullCitation = citMatch ? citMatch[0] : '';
    const totalMatchLength = fullQuote.length + citationLength;

    let preceding = reply.slice(lastIndex, matchIndex);

    if (isRealQuranSnippet(ayahContent)) {
      // آية حقيقية صحيحة: الإبقاء عليها مع إحالتها كاملة
      result += preceding + fullQuote + fullCitation;
    } else {
      // آية مختلقة/غير صحيحة: حذف الآية والإحالة وعبارة «قال تعالى:» السابقة لها
      preceding = preceding.replace(INTRO_PHRASE_REGEX, '');
      preceding = preceding.replace(/[:،,-]\s*$/, '');
      result += preceding;
    }

    lastIndex = matchIndex + totalMatchLength;
    quoteRegex.lastIndex = lastIndex;
  }

  result += reply.slice(lastIndex);

  // تنظيف علامات الترقيم المزدوجة والفراغات والأسطر الفارغة الناجمة عن الحذف
  return result
    .replace(/\.\s*\./g, '.')
    .replace(/([،,؛:])\s*([.?!؛،:])/g, '$2')
    .replace(/([.?!])\s*([،,؛:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/^[ \t]*[:.،؛-][ \t]*$/gm, '')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
