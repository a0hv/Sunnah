/**
 * src/lib/instant-search.ts
 * محرك البحث الفوري الموثّق في 5 مصادر إسلامية محلية كاملة:
 * 1. القرآن الكريم (quran-index.json — 6,236 آية)
 * 2. أحاديث لا تصح للتنبيه منها (fake-hadiths.json — 150 حديثاً)
 * 3. حصن المسلم (hisn-al-muslim.json — 133 باباً و302 ذكراً)
 * 4. الأربعون النووية (nawawi40.json — 42 حديثاً)
 * 5. السيرة النبوية (seerah.json — 30 محطة)
 *
 * بدون أي استدعاء خارجي، وبسرعة لحظية مع صفر هلوسة وتوثيق قطعي.
 */

import quranIndexRaw from '@/data/quran-index.json';
import fakeHadithsRaw from '@/data/fake-hadiths.json';
import hisnDataRaw from '@/data/hisn-al-muslim.json';
import nawawiDataRaw from '@/data/nawawi40.json';
import seerahDataRaw from '@/data/seerah.json';

// =============================================================================
// الواجهات والأنماط (Types)
// =============================================================================

export interface QuranVerseMatch {
  type: 'quran';
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  text: string;
  url: string;
  isFamous?: string;
}

export interface FakeHadithMatch {
  type: 'fake-hadith';
  id: number;
  hadithText: string;
  ruling: string;
  explanation?: string;
  dorarUrl: string;
}

export interface DhikrMatch {
  type: 'adhkar';
  categoryId: number;
  categoryTitle: string;
  dhikrId: number;
  text: string;
  count: number;
  reference: string;
  url: string;
}

export interface NawawiMatch {
  type: 'nawawi';
  id: number;
  title: string;
  text: string;
  narrator: string;
  source: string;
  url: string;
}

export interface SeerahMatch {
  type: 'seerah';
  id: number;
  title: string;
  eraTitle: string;
  hijriDate: string;
  location: string;
  category: string;
  summary: string;
  lessons: string[];
  url: string;
}

export interface SearchResults {
  query: string;
  quran: QuranVerseMatch[];
  fakeHadiths: FakeHadithMatch[];
  adhkar: DhikrMatch[];
  nawawi: NawawiMatch[];
  seerah: SeerahMatch[];
  totalCount: number;
}

// =============================================================================
// جداول الأسماء والبيانات القرآنية
// =============================================================================

export const SURAH_NAMES: string[] = [
  '',
  'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس',
  'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه',
  'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم',
  'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر',
  'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق',
  'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة',
  'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج',
  'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس',
  'التكوير', 'الانفطار', 'المطففين', 'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد',
  'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات',
  'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر',
  'المسد', 'الإخلاص', 'الفلق', 'الناس'
];

interface QuranRawEntry {
  c: number;
  v: number;
  t: string;
}

const quranIndex: QuranRawEntry[] = quranIndexRaw as QuranRawEntry[];

// =============================================================================
// أدوات التطبيع والتجريد
// =============================================================================

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[«»"”'’[\](){}<>؛،.؟!/\\–—\n\r]/g, ' ')
    .replace(/[\s\u200c\u200d]+/g, ' ')
    .trim()
    .toLowerCase();
}

export function cleanStem(word: string): string {
  if (!word) return '';
  let w = word;
  if (
    (w.startsWith('وال') ||
      w.startsWith('فال') ||
      w.startsWith('بال') ||
      w.startsWith('كال') ||
      w.startsWith('ولل') ||
      w.startsWith('فلل')) &&
    w.length >= 5
  ) {
    w = w.slice(3);
  } else if ((w.startsWith('لل') || w.startsWith('ال')) && w.length >= 4) {
    w = w.slice(2);
  } else if (
    (w.startsWith('و') ||
      w.startsWith('ف') ||
      w.startsWith('ب') ||
      w.startsWith('ك') ||
      w.startsWith('ل')) &&
    w.length >= 4
  ) {
    w = w.slice(1);
  }
  return w;
}

const STOP_WORDS = new Set([
  'في', 'من', 'إلى', 'الي', 'الى', 'على', 'علي', 'عن', 'مع', 'ما', 'هل', 'لا', 'لم', 'لن', 'ان', 'أن', 'إن',
  'هو', 'هي', 'هم', 'هن', 'ثم', 'أو', 'او', 'لو', 'ولو', 'يا', 'هذا', 'هذه', 'ذلك', 'تلك', 'الذي', 'التي',
  'ماذا', 'كيف', 'متى', 'كم', 'أي', 'اي', 'قال', 'رسول', 'الله', 'صلى', 'وسلم', 'النبي'
]);

// قاموس التوسيع الدلالي للمشاعر والمصطلحات الشائعة
const SEMANTIC_SYNONYMS: Record<string, string[]> = {
  'مخنوق': ['كرب', 'هم', 'حزن', 'غم', 'ضيق', 'صدر'],
  'حزين': ['هم', 'كرب', 'غم', 'حزن', 'ضيق'],
  'للميت': ['ميت', 'جنازة', 'قبر', 'دفن', 'تعزية'],
  'ميت': ['جنازة', 'قبر', 'دفن', 'تعزية'],
  'ثوب جديد': ['الثوب الجديد', 'لبس الثوب', 'ثوب', 'كساء'],
  'دين': ['الدين', 'قضاء الدين'],
  'ديون': ['الدين', 'قضاء الدين'],
  'استخارة': ['الاستخارة', 'استخير'],
  'سفر': ['السفر', 'مسافر', 'ركوب'],
  'مطر': ['المطر', 'الغيث', 'الرعد', 'البرق', 'السحاب'],
  'نوم': ['النوم', 'منام', 'استيقاظ', 'ارق'],
  'استيقاظ': ['الاستيقاظ', 'نوم', 'صحو'],
};

// =============================================================================
// محركات البحث المتخصصة
// =============================================================================

/**
 * 1. البحث في القرآن الكريم:
 * - فحص الآيات الشهيرة («آية الكرسي»، «آية الدين»)
 * - فحص أسماء السور («سورة الكوثر»، «الفاتحة»)
 * - فحص المتون والكلمات داخل 6,236 آية
 */
function searchQuran(rawQuery: string): QuranVerseMatch[] {
  const normQ = normalizeArabic(rawQuery);
  if (!normQ || normQ.length < 2) return [];

  const results: QuranVerseMatch[] = [];

  // أ. الآيات الشهيرة
  if (normQ.includes('الكرسي') || normQ.includes('ايه الكرسي') || normQ.includes('اية الكرسي')) {
    const verse = quranIndex.find((item) => item.c === 2 && item.v === 255);
    if (verse) {
      results.push({
        type: 'quran',
        surahNumber: 2,
        ayahNumber: 255,
        surahName: 'البقرة',
        text: verse.t,
        url: 'https://quran.com/ar/2/255',
        isFamous: 'آية الكرسي',
      });
      return results;
    }
  }

  if (normQ.includes('الدين') && (normQ.includes('ايه') || normQ.includes('اية'))) {
    const verse = quranIndex.find((item) => item.c === 2 && item.v === 282);
    if (verse) {
      results.push({
        type: 'quran',
        surahNumber: 2,
        ayahNumber: 282,
        surahName: 'البقرة',
        text: verse.t,
        url: 'https://quran.com/ar/2/282',
        isFamous: 'آية الدين (أطول آية في القرآن)',
      });
      return results;
    }
  }

  // ب. البحث باسم السورة (مثلاً «سورة الكوثر» أو «الكوثر»)
  let targetSurahName = normQ.replace(/^(سوره|سورة)\s+/, '').trim();
  targetSurahName = cleanStem(targetSurahName);

  let matchedSurahNum = 0;
  for (let i = 1; i < SURAH_NAMES.length; i++) {
    const sNameNorm = normalizeArabic(SURAH_NAMES[i]);
    const sNameStem = cleanStem(sNameNorm);
    if (
      sNameNorm === targetSurahName ||
      sNameStem === targetSurahName ||
      (normQ.startsWith('سوره') && sNameNorm.includes(targetSurahName))
    ) {
      matchedSurahNum = i;
      break;
    }
  }

  if (matchedSurahNum > 0) {
    const surahVerses = quranIndex.filter((item) => item.c === matchedSurahNum);
    // إذا كانت السورة قصيرة نعرض آياتها كاملة، وإلا نعرض أول 6 آيات
    const sliceCount = surahVerses.length <= 15 ? surahVerses.length : 6;
    for (let idx = 0; idx < sliceCount; idx++) {
      const v = surahVerses[idx];
      results.push({
        type: 'quran',
        surahNumber: v.c,
        ayahNumber: v.v,
        surahName: SURAH_NAMES[v.c],
        text: v.t,
        url: `https://quran.com/ar/${v.c}/${v.v}`,
      });
    }
    return results;
  }

  // ج. البحث والترتيب الصارم في نص 6,236 آية
  const queryWords = normQ.split(/\s+/).filter((w) => w.length > 0);
  if (queryWords.length === 0) return [];

  const paddedQuery = ' ' + normQ + ' ';

  interface ScoredVerse {
    item: QuranRawEntry;
    score: number;
    rank: number; // 1: phrase, 2: in-order words, 3: all words any order, 4: partial
  }

  const scoredVerses: ScoredVerse[] = [];

  for (const item of quranIndex) {
    const verseNorm = normalizeArabic(item.t);
    const paddedVerse = ' ' + verseNorm + ' ';

    let score = 0;
    let rank = 99;

    // 1. المرتبة الأولى: تطابق العبارة الكاملة المتتالية (أعلى وزن)
    if (paddedVerse.includes(paddedQuery)) {
      // تطابق العبارة مع حدود الكلمات من الطرفين
      rank = 1;
      const pos = paddedVerse.indexOf(paddedQuery);
      score =
        100_000 +
        (2000 - Math.min(1900, verseNorm.length)) +
        (1000 - Math.min(999, pos));
    } else if (verseNorm.includes(normQ)) {
      // تطابق العبارة المتتالية كجزء من الكلمات
      rank = 1;
      const pos = verseNorm.indexOf(normQ);
      score =
        80_000 +
        (2000 - Math.min(1900, verseNorm.length)) +
        (1000 - Math.min(999, pos));
    } else if (queryWords.length >= 2) {
      // 2. إذا كان الاستعلام من كلمتين فأكثر
      // حساب عدد الكلمات المطابقة
      let matchCount = 0;
      for (const w of queryWords) {
        if (verseNorm.includes(w)) {
          matchCount++;
        }
      }

      // شرط إجباري: تجاهل النتائج الضعيفة التي لا تحتوي إلا على كلمة واحدة فقط من الاستعلام
      if (matchCount < 2) {
        continue;
      }

      // فحص إذا كانت كل كلمات البحث موجودة بالترتيب نفسه داخل الآية (المرتبة الثانية)
      let inOrder = true;
      let lastPos = 0;
      let allWordBoundaries = true;

      for (const word of queryWords) {
        const foundAt = verseNorm.indexOf(word, lastPos);
        if (foundAt === -1) {
          inOrder = false;
          break;
        }
        const isWbStart = foundAt === 0 || verseNorm[foundAt - 1] === ' ';
        const isWbEnd =
          foundAt + word.length === verseNorm.length ||
          verseNorm[foundAt + word.length] === ' ';
        if (!isWbStart || !isWbEnd) {
          allWordBoundaries = false;
        }
        lastPos = foundAt + word.length;
      }

      if (inOrder) {
        rank = 2;
        score =
          (allWordBoundaries ? 50_000 : 40_000) +
          (1000 - Math.min(900, verseNorm.length));
      } else if (matchCount === queryWords.length) {
        // كل كلمات البحث موجودة بأي ترتيب (المرتبة الثالثة)
        rank = 3;
        const allWb = queryWords.every((w) => paddedVerse.includes(' ' + w + ' '));
        score =
          (allWb ? 25_000 : 15_000) +
          (1000 - Math.min(900, verseNorm.length));
      } else if (queryWords.length >= 3 && matchCount >= 2) {
        // تطابق جزئي لا يُقبل إلا عند غياب التطابقات الصريحة
        rank = 4;
        score = 1_000 * matchCount + (500 - Math.min(450, verseNorm.length));
      }
    } else {
      // حالة البحث بكلمة واحدة فقط
      const singleWord = queryWords[0];
      if (paddedVerse.includes(' ' + singleWord + ' ')) {
        rank = 1;
        score = 10_000 + (1000 - Math.min(900, verseNorm.length));
      } else if (verseNorm.includes(singleWord)) {
        rank = 2;
        score = 5_000 + (1000 - Math.min(900, verseNorm.length));
      }
    }

    if (score > 0) {
      scoredVerses.push({ item, score, rank });
    }
  }

  // إذا وُجدت نتائج قوية (المراتب 1-3)، نستبعد تماماً أي نتائج جزئية في المرتبة 4
  const hasStrongMatches = scoredVerses.some((v) => v.rank <= 3);
  const eligibleVerses = hasStrongMatches
    ? scoredVerses.filter((v) => v.rank <= 3)
    : scoredVerses;

  // ترتيب تنازلي حسب الدرجة
  eligibleVerses.sort((a, b) => b.score - a.score);

  // أخذ أفضل 10 آيات
  const topVerses = eligibleVerses.slice(0, 10);
  for (const { item } of topVerses) {
    results.push({
      type: 'quran',
      surahNumber: item.c,
      ayahNumber: item.v,
      surahName: SURAH_NAMES[item.c] || `السورة ${item.c}`,
      text: item.t,
      url: `https://quran.com/ar/${item.c}/${item.v}`,
    });
  }

  return results;
}

/**
 * 2. فحص الأحاديث التي لا تصح (fake-hadiths.json)
 */
function searchFakeHadiths(rawQuery: string): FakeHadithMatch[] {
  const normQ = normalizeArabic(rawQuery);
  if (!normQ || normQ.length < 3) return [];

  const items = (fakeHadithsRaw as any).hadiths || [];
  const results: FakeHadithMatch[] = [];

  const tokens = normQ
    .split(' ')
    .map(cleanStem)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  for (const item of items) {
    const textNorm = normalizeArabic(item.hadithText || '');

    // 1. تطابق العبارة كاملة
    if (textNorm.includes(normQ)) {
      results.push({
        type: 'fake-hadith',
        id: item.id,
        hadithText: item.hadithText,
        ruling: item.ruling,
        explanation: item.explanation,
        dorarUrl: item.dorarUrl || `https://dorar.net/fake-hadith/${item.id}`,
      });
      continue;
    }

    // 2. تطابق الكلمات المميزة (مثل «اطلبوا العلم ولو بالصين» أو «صوموا تصحوا»)
    if (tokens.length >= 2) {
      const matchCount = tokens.filter((tok) => textNorm.includes(tok)).length;
      if (matchCount >= Math.min(tokens.length, 3)) {
        results.push({
          type: 'fake-hadith',
          id: item.id,
          hadithText: item.hadithText,
          ruling: item.ruling,
          explanation: item.explanation,
          dorarUrl: item.dorarUrl || `https://dorar.net/fake-hadith/${item.id}`,
        });
      }
    }
  }

  return results.slice(0, 3);
}

/**
 * 3. البحث في حصن المسلم (hisn-al-muslim.json)
 */
function searchAdhkar(rawQuery: string): DhikrMatch[] {
  const normQ = normalizeArabic(rawQuery);
  if (!normQ || normQ.length < 2) return [];

  const categories = (hisnDataRaw as any).categories || [];
  const results: DhikrMatch[] = [];

  // جمع المرادفات الدلالية
  const searchTerms = [normQ];
  for (const [key, syns] of Object.entries(SEMANTIC_SYNONYMS)) {
    if (normQ.includes(key)) {
      searchTerms.push(...syns);
    }
  }

  const queryStems = normQ
    .split(' ')
    .map(cleanStem)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  for (const cat of categories) {
    const catTitleNorm = normalizeArabic(cat.title || '');

    // مطابقة عنوان الباب
    const catMatched =
      searchTerms.some((term) => catTitleNorm.includes(term)) ||
      (queryStems.length >= 2 && queryStems.every((tok) => catTitleNorm.includes(tok)));

    for (const it of cat.items || []) {
      const itemTextNorm = normalizeArabic(it.text || '');

      let isMatch = false;
      if (catMatched) {
        isMatch = true;
      } else if (itemTextNorm.includes(normQ)) {
        isMatch = true;
      } else if (queryStems.length >= 2 && queryStems.every((tok) => itemTextNorm.includes(tok))) {
        isMatch = true;
      }

      if (isMatch) {
        results.push({
          type: 'adhkar',
          categoryId: cat.id,
          categoryTitle: cat.title,
          dhikrId: it.id,
          text: it.text,
          count: it.count || 1,
          reference: it.reference || '',
          url: `/adhkar?cat=${cat.id}`,
        });
        if (results.length >= 10) break;
      }
    }
    if (results.length >= 10) break;
  }

  return results;
}

/**
 * 4. البحث في الأربعين النووية (nawawi40.json)
 */
function searchNawawi(rawQuery: string): NawawiMatch[] {
  const normQ = normalizeArabic(rawQuery);
  if (!normQ || normQ.length < 2) return [];

  const hadiths = (nawawiDataRaw as any).hadiths || [];
  const results: NawawiMatch[] = [];

  const stems = normQ
    .split(' ')
    .map(cleanStem)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  for (const h of hadiths) {
    const titleNorm = normalizeArabic(h.title || '');
    const textNorm = normalizeArabic(h.text || '');
    const narratorNorm = normalizeArabic(h.narrator || '');

    if (
      titleNorm.includes(normQ) ||
      textNorm.includes(normQ) ||
      narratorNorm.includes(normQ) ||
      (stems.length >= 2 && stems.every((s) => textNorm.includes(s) || titleNorm.includes(s)))
    ) {
      results.push({
        type: 'nawawi',
        id: h.id,
        title: h.title,
        text: h.text,
        narrator: h.narrator,
        source: h.source,
        url: `/nawawi40#hadith-${h.id}`,
      });
      if (results.length >= 6) break;
    }
  }

  return results;
}

/**
 * 5. البحث في السيرة النبوية (seerah.json)
 */
function searchSeerah(rawQuery: string): SeerahMatch[] {
  const normQ = normalizeArabic(rawQuery);
  if (!normQ || normQ.length < 2) return [];

  const milestones = (seerahDataRaw as any).milestones || [];
  const results: SeerahMatch[] = [];

  const stems = normQ
    .split(' ')
    .map(cleanStem)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  for (const m of milestones) {
    const titleNorm = normalizeArabic(m.title || '');
    const summaryNorm = normalizeArabic(m.summary || '');
    const detailsNorm = normalizeArabic((m.details || []).join(' '));
    const lessonsNorm = normalizeArabic((m.lessons || []).join(' '));

    const allCombined = `${titleNorm} ${summaryNorm} ${detailsNorm} ${lessonsNorm}`;

    if (
      titleNorm.includes(normQ) ||
      summaryNorm.includes(normQ) ||
      allCombined.includes(normQ) ||
      (stems.length >= 2 && stems.every((s) => allCombined.includes(s)))
    ) {
      results.push({
        type: 'seerah',
        id: m.id,
        title: m.title,
        eraTitle: m.eraTitle,
        hijriDate: m.hijriDate,
        location: m.location,
        category: m.category,
        summary: m.summary,
        lessons: m.lessons || [],
        url: `/seerah`,
      });
      if (results.length >= 6) break;
    }
  }

  return results;
}

// =============================================================================
// الدالة الموحدة الرئيسية للبحث الفوري الموثّق
// =============================================================================

export function executeInstantSearch(query: string): SearchResults {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return {
      query: trimmed,
      quran: [],
      fakeHadiths: [],
      adhkar: [],
      nawawi: [],
      seerah: [],
      totalCount: 0,
    };
  }

  const quran = searchQuran(trimmed);
  const fakeHadiths = searchFakeHadiths(trimmed);
  const adhkar = searchAdhkar(trimmed);
  const nawawi = searchNawawi(trimmed);
  const seerah = searchSeerah(trimmed);

  const totalCount =
    quran.length + fakeHadiths.length + adhkar.length + nawawi.length + seerah.length;

  return {
    query: trimmed,
    quran,
    fakeHadiths,
    adhkar,
    nawawi,
    seerah,
    totalCount,
  };
}
