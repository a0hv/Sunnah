/**
 * src/lib/external-refs.ts
 * Utilities for automatic verification and deep-linking to:
 * 1. Dorar.net (الدرر السنية - الموسوعة الحديثية) with &st=w and top 4 distinctive words
 * 2. Quran.com/ar (القرآن الكريم وتفاسيره) with automatic Surah/Ayah matching (quran.com/ar/SURAH/AYAH)
 */

import quranIndexRaw from '@/data/quran-index.json';

interface QuranIndexEntry {
  c: number;
  v: number;
  t: string;
}

const quranIndex: QuranIndexEntry[] = quranIndexRaw as QuranIndexEntry[];

// Table mapping normalized Surah names to their official Quranic number (1 - 114)
export const SURAH_NAME_TO_NUMBER: Record<string, number> = {
  'الفاتحة': 1,
  'البقرة': 2,
  'آل عمران': 3,
  'ال عمران': 3,
  'النساء': 4,
  'المائدة': 5,
  'الأنعام': 6,
  'الانعام': 6,
  'الأعراف': 7,
  'الاعراف': 7,
  'الأنفال': 8,
  'الانفال': 8,
  'التوبة': 9,
  'براءة': 9,
  'يونس': 10,
  'هود': 11,
  'يوسف': 12,
  'الرعد': 13,
  'إبراهيم': 14,
  'ابراهيم': 14,
  'الحجر': 15,
  'النحل': 16,
  'الإسراء': 17,
  'الاسراء': 17,
  'بني إسرائيل': 17,
  'بني اسرائيل': 17,
  'الكهف': 18,
  'مريم': 19,
  'طه': 20,
  'الأنبياء': 21,
  'الانبياء': 21,
  'الحج': 22,
  'المؤمنون': 23,
  'النور': 24,
  'الفرقان': 25,
  'الشعراء': 26,
  'النمل': 27,
  'القصص': 28,
  'العنكبوت': 29,
  'الروم': 30,
  'لقمان': 31,
  'السجدة': 32,
  'الأحزاب': 33,
  'الاحزاب': 33,
  'سبأ': 34,
  'سبا': 34,
  'فاطر': 35,
  'يس': 36,
  'الصافات': 37,
  'ص': 38,
  'الزمر': 39,
  'غافر': 40,
  'المؤمن': 40,
  'فصلت': 41,
  'الشورى': 42,
  'الزخرف': 43,
  'الدخان': 44,
  'الجاثية': 45,
  'الأحقاف': 46,
  'الاحقاف': 46,
  'محمد': 47,
  'الفتح': 48,
  'الحجرات': 49,
  'ق': 50,
  'الذاريات': 51,
  'الطور': 52,
  'النجم': 53,
  'القمر': 54,
  'الرحمن': 55,
  'الواقعة': 56,
  'الحديد': 57,
  'المجادلة': 58,
  'الحشر': 59,
  'الممتحنة': 60,
  'الصف': 61,
  'الجمعة': 62,
  'المنافقون': 63,
  'التغابن': 64,
  'الطلاق': 65,
  'التحريم': 66,
  'الملك': 67,
  'تبارك': 67,
  'القلم': 68,
  'الحاقة': 69,
  'المعارج': 70,
  'نوح': 71,
  'الجن': 72,
  'المزمل': 73,
  'المدثر': 74,
  'القيامة': 75,
  'الإنسان': 76,
  'الانسان': 76,
  'الدهر': 76,
  'المرسلات': 77,
  'النبأ': 78,
  'النبا': 78,
  'عم': 78,
  'النازعات': 79,
  'عبس': 80,
  'التكوير': 81,
  'الانفطار': 82,
  'الإفطار': 82,
  'المطففين': 83,
  'المطففون': 83,
  'الانشقاق': 84,
  'البروج': 85,
  'الطارق': 86,
  'الأعلى': 87,
  'الاعلى': 87,
  'الغاشية': 88,
  'الفجر': 89,
  'البلد': 90,
  'الشمس': 91,
  'الليل': 92,
  'الضحى': 93,
  'الشرح': 94,
  'الانشراح': 94,
  'التين': 95,
  'العلق': 96,
  'القدر': 97,
  'البينة': 98,
  'الزلزلة': 99,
  'العاديات': 100,
  'القارعة': 101,
  'التكاثر': 102,
  'العصر': 103,
  'الهمزة': 104,
  'الفيل': 105,
  'قريش': 106,
  'الماعون': 107,
  'الكوثر': 108,
  'الكافرون': 109,
  'النصر': 110,
  'المسد': 111,
  'تبت': 111,
  'الإخلاص': 112,
  'الاخلاص': 112,
  'الفلق': 113,
  'الناس': 114,
};

// Common Arabic stop words to filter out when extracting distinctive hadith search keywords
const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'إلى', 'الي', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'هؤلاء',
  'أن', 'إن', 'ان', 'كان', 'كانت', 'يكون', 'تكون', 'كانوا', 'وهو', 'وهي', 'وهم',
  'الذي', 'التي', 'الذين', 'اللاتي', 'اللواتي', 'ما', 'لا', 'لم', 'لن', 'ثم', 'أو', 'او',
  'إذا', 'اذا', 'حتى', 'كل', 'غير', 'قد', 'بين', 'فإن', 'فان', 'ولكن', 'لكن', 'بل',
  'أنه', 'انه', 'أنها', 'انها', 'أنهم', 'انهم', 'به', 'بها', 'بهم', 'فيه', 'فيها', 'فيهم',
  'منه', 'منها', 'منهم', 'عليه', 'عليها', 'عليهم', 'إليه', 'اليه', 'إليها', 'اليها', 'إليهم',
  'قال', 'قالت', 'يقول', 'سمعت', 'حدثنا', 'أخبرنا', 'اخبرنا', 'عنه', 'عنها', 'عنهم',
  'رسول', 'الله', 'النبي', 'صلى', 'وسلم', 'رضي', 'تعالى', 'تبارك', 'عز', 'وجل'
]);

/**
 * Converts Eastern Arabic numerals (٠-٩) to standard ASCII digits (0-9)
 */
export function convertArabicDigitsToAscii(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (d) => {
    const idx = arabicDigits.indexOf(d);
    return idx !== -1 ? String(idx) : d;
  });
}

/**
 * Remove Arabic Tashkeel, Tatweel, and Quranic stop marks
 */
export function stripTashkeel(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Harakat & Tatweel
    .replace(/[\u06D6-\u06ED]/g, '')             // Quranic annotation signs
    .trim();
}

/**
 * Normalize Arabic text for reliable indexing and matching
 */
export function normalizeQuranText(text: string): string {
  return stripTashkeel(text)
    .replace(/[﴿﴾[\](){}<>«»"'؛،.؟!/\\–—\n\r]/g, ' ')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\s\u200c\u200d]+/g, ' ')
    .trim();
}

/**
 * 1. getDorarHadithUrl:
 * Generates an accurate search URL on dorar.net/hadith/search
 * Strips Isnad prefixes, ignores stop words, extracts the top 4 distinctive words (length >= 3)
 * and appends the words-search parameter &st=w.
 */
export function getDorarHadithUrl(hadithText: string): string {
  if (!hadithText) return 'https://www.dorar.net/hadith/search?st=w';

  const plain = stripTashkeel(hadithText);

  // Strategy A: Quoted matn «...» or "..." or ”...”
  const quoteMatch = plain.match(/["«”]([^"»”]{8,})["»”]/);
  let candidate = '';

  if (quoteMatch && quoteMatch[1].trim().length > 0) {
    candidate = quoteMatch[1];
  } else {
    // Strategy B: Detect and bypass isnad introductory clauses
    const colonIndices = [...plain.matchAll(/[:،]/g)].map((m) => m.index);
    let splitIndex = -1;

    for (const idx of colonIndices) {
      if (idx > 10 && idx < 180) {
        splitIndex = idx + 1;
      }
    }

    if (splitIndex !== -1 && splitIndex < plain.length - 10) {
      candidate = plain.slice(splitIndex);
    } else {
      candidate = plain.replace(
        /^(وعن|عن|قال|قالت|روى|سمعت)\s+[^\n]{10,120}?(قال رسول الله|قال النبي|يقول رسول الله|سمعت رسول الله)[\s\S]*?(قال|يقول|:\s*)/,
        ''
      );
    }
  }

  // Clean candidate from trailing book citations and symbols
  const cleaned = candidate
    .replace(/\([^)]*متفق[^)]*\)/g, '')
    .replace(/\([^)]*رواه[^)]*\)/g, '')
    .replace(/\([^)]*أخرجه[^)]*\)/g, '')
    .replace(/[[\](){}<>«»"”'،.؛؟!/\\–—\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract top 4 distinctive words (length >= 3, skipping stop words)
  const rawWords = cleaned
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);

  const distinctiveWords: string[] = [];

  for (const w of rawWords) {
    const withoutPrefix = w.replace(/^[وفلبك]/, '');
    if (!ARABIC_STOP_WORDS.has(w) && !ARABIC_STOP_WORDS.has(withoutPrefix)) {
      if (!distinctiveWords.includes(w)) {
        distinctiveWords.push(w);
      }
    }
    if (distinctiveWords.length === 4) break;
  }

  // Fallback if fewer than 4 distinctive words found
  if (distinctiveWords.length < 4) {
    for (const w of rawWords) {
      if (!distinctiveWords.includes(w)) {
        distinctiveWords.push(w);
      }
      if (distinctiveWords.length === 4) break;
    }
  }

  const query = distinctiveWords.join(' ');
  return `https://www.dorar.net/hadith/search?q=${encodeURIComponent(query || cleaned.slice(0, 30))}&st=w`;
}

/**
 * 2. getQuranComUrl:
 * Generates direct ayah URL on quran.com/ar/SURAH/AYAH or fallback search URL.
 * 1) Checks for explicit surahNumber and ayahNumber.
 * 2) Detects citation patterns like [البقرة: ٢٥٥] or (آل عمران: 190).
 * 3) Performs instant client-side lookup in the 6,236 Quran verses index.
 * 4) Falls back to search URL only if the snippet cannot be uniquely resolved.
 */
export function getQuranComUrl(
  verseText: string,
  surahNumber?: number,
  ayahNumber?: number
): string {
  // If explicitly passed
  if (surahNumber && ayahNumber) {
    return `https://quran.com/ar/${surahNumber}/${ayahNumber}`;
  }

  if (!verseText) return 'https://quran.com/ar';

  const raw = verseText.trim();

  // Pattern A: Detect explicit citation like [البقرة: 255] or [سورة آل عمران: 190]
  const citationRegex = /(?:\[|\(|\{)?(?:سورة\s+)?([^\d:،,\-–[\]()]{2,25})[:،,]\s*([٠-٩\d]+)/;
  const match = raw.match(citationRegex);

  if (match) {
    const rawSurahName = match[1].trim();
    const rawAyahNum = match[2].trim();

    const cleanSurahName = rawSurahName
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/^(سورة|سوره)\s+/, '')
      .trim();

    const asciiAyah = convertArabicDigitsToAscii(rawAyahNum);
    const parsedAyah = parseInt(asciiAyah, 10);

    const foundSurahNum =
      SURAH_NAME_TO_NUMBER[cleanSurahName] ||
      SURAH_NAME_TO_NUMBER[`ال${cleanSurahName}`] ||
      SURAH_NAME_TO_NUMBER[cleanSurahName.replace(/^ال/, '')];

    if (foundSurahNum && !isNaN(parsedAyah) && parsedAyah > 0) {
      return `https://quran.com/ar/${foundSurahNum}/${parsedAyah}`;
    }
  }

  // Pattern B: Normalized text lookup in quranIndex
  const normalizedQuery = normalizeQuranText(raw);

  if (normalizedQuery.length >= 5 && quranIndex && quranIndex.length > 0) {
    // 1. Exact match
    const exact = quranIndex.find((item) => item.t === normalizedQuery);
    if (exact) {
      return `https://quran.com/ar/${exact.c}/${exact.v}`;
    }

    // 2. Substring match (ayah contains query or query contains ayah)
    const substring = quranIndex.find(
      (item) => item.t.includes(normalizedQuery) || (normalizedQuery.length >= 12 && normalizedQuery.includes(item.t))
    );
    if (substring) {
      return `https://quran.com/ar/${substring.c}/${substring.v}`;
    }
  }

  // Fallback: search query on quran.com
  const cleanSnippet = stripTashkeel(raw)
    .replace(/[﴿﴾[\](){}<>«»"'؛،.؟!/\\–—\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 6)
    .join(' ');

  return `https://quran.com/ar/search?q=${encodeURIComponent(cleanSnippet || normalizedQuery)}`;
}
