/**
 * src/lib/rag.ts
 * نظام الاسترجاع الدلالي المعزز (RAG) المحصور بالبيانات الموثّقة لمشروع «الباحث في السنة».
 *
 * معايير الدقة العلمية:
 * 1. استبعاد كلمات التوقف العربية الشائعة وأدوات الاستفهام لحصر البحث بالكلمات الجوهرية.
 * 2. تطبيق حد تطابق صارم (Strict Match Threshold) واشتراط تطابق الكلمات الجوهرية كاملة في الاستفسارات المزدوجة لمنع التطابق العشوائي.
 * 3. الفحص الاستباقي للتحذير من الأحاديث المكذوبة والضعيفة فقط عند تطابق متن الحديث المكذوب بعينه أو السؤال الصريح عن صحته.
 */

import nawawiDataRaw from '@/data/nawawi40.json';
import hisnDataRaw from '@/data/hisn-al-muslim.json';
import seerahDataRaw from '@/data/seerah.json';
import fakeDataRaw from '@/data/fake-hadiths.json';
import dailyDataRaw from '@/data/daily-sunnah.json';
import { getDorarSearchUrl } from './dorar-api';

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

/**
 * تجريد السوابق الشائعة (والـ، فالـ، بالـ، كالـ، وللـ، فللـ، للـ، الـ، و، ف، ب، ك، ل)
 * لاستخلاص جذر الكلمة المقارن بدقة عالية
 */
export function cleanStem(word: string): string {
  if (!word) return '';
  let w = word;

  // 1. السوابق المركبة ثلاثية الحروف (والـ، فالـ، بالـ، كالـ، وللـ، فللـ)
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
  }
  // 2. السوابق الثنائية (للـ، الـ)
  else if ((w.startsWith('لل') || w.startsWith('ال')) && w.length >= 4) {
    w = w.slice(2);
  }

  // 3. السوابق الأحادية (و، ف، ب، ك، ل) إذا كان طول الكلمة المتبقية لا يقل عن 3 أحرف
  if (
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

/**
 * قاموس التوسيع الدلالي للمرادفات والمفاهيم النبوية الشائعة
 */
export const SEMANTIC_EXPANSIONS: Record<string, string[]> = {
  // الجنائز والموت والتعزية
  جنازه: ['ميت', 'دفن', 'قبر', 'تعزيه', 'صلاه الجنازه', 'اموات', 'وفاه'],
  جنائز: ['ميت', 'دفن', 'قبر', 'تعزيه', 'اموات', 'صلاه الجنازه'],
  ميت: ['جنازه', 'قبر', 'دفن', 'تعزيه', 'موت', 'احتضار', 'تلقين', 'وفاه'],
  موت: ['ميت', 'جنازه', 'احتضار', 'قبر', 'دفن', 'وفاه'],
  وفاه: ['ميت', 'جنازه', 'عزاء', 'تعزيه', 'موت'],
  تعزيه: ['ميت', 'مصيبه', 'صبر', 'جنازه', 'عزاء'],
  قبر: ['ميت', 'زياره القبور', 'دفن', 'لحد', 'جنازه'],
  دفن: ['ميت', 'قبر', 'جنازه', 'لحد'],
  احتضار: ['موت', 'ميت', 'تلقين الشهاده'],

  // أبواب الأذكار والسنن الشهيرة
  استخاره: ['استخير', 'مشوره', 'تردد', 'حيره'],
  سفر: ['مسافر', 'رحله', 'طريق', 'ركوب', 'وداع'],
  نوم: ['منام', 'استيقاظ', 'ارق', 'فراش', 'احلام', 'رؤيا'],
  استيقاظ: ['نوم', 'منام', 'صحو'],
  مرض: ['مريض', 'شفاء', 'عياده', 'وجع', 'حمى', 'ر Banca', 'عافيه'],
  هم: ['حزن', 'كرب', 'غم', 'فرج', 'ضيق', 'صدر'],
  حزن: ['هم', 'كرب', 'غم', 'فرج', 'ضيق'],
  كرب: ['هم', 'حزن', 'غم', 'فرج', 'شده'],
  رزق: ['بركه', 'دين', 'قضاء الدين', 'فقر', 'غنى'],
  مطر: ['غيث', 'رعد', 'برق', 'سحاب', 'ريح'],
  وضوء: ['طهاره', 'سواك'],
  صلاه: ['سجود', 'ركوع', 'تشهد', 'استفتاح', 'وتر'],
  صيام: ['افطار', 'صائم', 'سحور', 'رمضان'],
  صباح: ['مساء', 'اذكار الصباح'],
  مساء: ['صباح', 'اذكار المساء'],
};

/**
 * قائمة كلمات التوقف العربية الشائعة وأدوات الاستفهام وكلمات السرد والرواية
 */
const ARABIC_STOP_WORDS = new Set([
  // أدوات الاستفهام والطلب والضمائر
  'هل', 'ما', 'من', 'في', 'على', 'الي', 'الى', 'إلى', 'عن', 'ان', 'أن', 'إن',
  'هو', 'هي', 'هم', 'هن', 'ماذا', 'كيف', 'متى', 'أين', 'اين', 'كم', 'لماذا', 'أي', 'اي',
  'أريد', 'اريد', 'عايز', 'عايزة', 'ابغى', 'أبغى', 'وش', 'إيه', 'ايه',
  'ثم', 'أو', 'او', 'لو', 'ولو', 'مع', 'عند', 'بعد', 'قبل', 'كل', 'ذلك', 'هذا', 'هذه', 'تلك', 'يا',
  'سيدنا', 'الشيخ', 'ملخص', 'شرح', 'تفسير', 'ما هو', 'ما هي',
  'حديث', 'الحديث', 'احاديث', 'الأحاديث', 'الاحاديث',
  'صحيح', 'الصحيح', 'ضعيف', 'موضوع', 'مكذوب', 'باطل', 'حكم', 'درجة', 'درجه', 'صحة', 'صحه', 'تثبت',
  // كلمات السرد والرواية الشائعة في الأحاديث
  'قال', 'يقول', 'قالوا', 'قالت', 'بينما', 'نحن', 'كان', 'كانت',
  'بن', 'ابن', 'ابي', 'أبي', 'ابو', 'أبو',
  'رضي', 'عنه', 'عنها', 'عنهما', 'عنهم',
  'الله', 'صلى', 'صلي', 'عليه', 'وسلم', 'النبي', 'نبي', 'رسول', 'الرسول'
]);

/**
 * استخراج الكلمات الجوهرية (Core Keywords) بعد إزالة كلمات التوقف
 */
export function extractCoreTokens(query: string): string[] {
  const norm = normalizeArabic(query);
  if (!norm) return [];

  const rawTokens = norm.split(' ').filter((t) => t.length >= 2);
  const filtered = rawTokens.filter((t) => !ARABIC_STOP_WORDS.has(t));

  // إذا كانت جميع الكلمات كلمات توقف، نعود للكلمات التي يزيد طولها عن حرفين
  if (filtered.length === 0) {
    return rawTokens.filter((t) => t.length >= 3);
  }

  return filtered;
}

/**
 * التحقق مما إذا كان السؤال يتعلق بحديث أو مسألة شرعية أو إسلامية عامة
 */
export function isIslamicOrReligiousQuery(text: string): boolean {
  if (!text) return false;
  const norm = normalizeArabic(text);
  const keywords = [
    'حديث', 'احاديث', 'سنه', 'السنه', 'نبي', 'النبي', 'رسول', 'الرسول',
    'صحابي', 'صحابه', 'اسلام', 'الاسلام', 'دين', 'الدين', 'شرع', 'الشرع',
    'حكم', 'فتوى', 'فتاوى', 'حلال', 'حرام', 'واجب', 'مستحب', 'مكروه',
    'صلاه', 'الصلاه', 'صيام', 'الصيام', 'زكاه', 'الزكاه', 'حج', 'الحج',
    'عمره', 'العمره', 'دعاء', 'الدعاء', 'ادعيه', 'الادعيه', 'اذكار', 'الاذكار',
    'ذكر', 'الذكر', 'قران', 'القران', 'ايه', 'سوره', 'تفسير', 'سيره', 'السيره',
    'غزوه', 'غزوات', 'نووي', 'بخاري', 'مسلم', 'ترمذي', 'ابو داود', 'نسائي',
    'ابن ماجه', 'مسند', 'تثبت', 'مكذوب', 'موضوع', 'ضعيف', 'صحيح', 'اسناد',
    'سند', 'راوي', 'تخريج', 'وضوء', 'طهاره', 'جنابه', 'جنه', 'نار', 'قيامه',
    'جبريل', 'ملائكه', 'عائشه', 'فاطمه', 'علي', 'عمر', 'ابو بكر', 'عثمان',
    'شهاده', 'توحيد', 'ايمان', 'احسان', 'رب', 'الله', 'استغفار', 'تسبيح',
    'اذان', 'اقامه', 'مسجد', 'وتر', 'تراويح', 'تهجد', 'عاشوراء', 'عرفه'
  ];
  return keywords.some((kw) => norm.includes(kw));
}

/**
 * التحقق مما إذا كانت الرسالة تحية أو شكرًا أو سؤالًا تعريفيًا أو دردشة عادية
 */
export function isConversationalOrGreeting(text: string): boolean {
  if (!text) return false;
  const norm = normalizeArabic(text);

  // إذا كانت الرسالة كلمة أو كلمتين استيضاحيتين أو عاميتين
  const shortQueries = new Set([
    'ماذا', 'ماذا؟', 'ايش', 'وش', 'عامل ايه', 'عامل ايه؟', 'عامل ايه خوي',
    'ازيك', 'شلونك', 'شخبارك', 'كيفك', 'كيف الحال', 'كيف حالك',
    'تمام', 'الحمد لله', 'خير', 'مرحبا', 'هلا', 'يا هلا', 'اهلين',
    'السلام عليكم', 'سلام عليكم', 'وعليكم السلام', 'سلام', 'سلامات',
    'شكرا', 'مشكور', 'تسلم', 'يعطيك العافيه', 'جزاك الله خير', 'جزاك الله خيرا',
    'احسنت', 'ممتاز', 'وضح', 'وضح لي', 'فهمت', 'ما فهمت', 'مين انت', 'من انت'
  ]);
  if (shortQueries.has(norm)) return true;

  const conversationalPhrases = [
    'سلام عليكم', 'السلام عليكم', 'مرحبا', 'مرحبا بك', 'اهلا بك', 'اهلين',
    'صباح الخير', 'مساء الخير', 'حياك الله', 'يا هلا', 'سلامات',
    'عامل ايه', 'شلونك', 'كيف حالك', 'كيفك', 'ازيك', 'اخبارك',
    'من انت', 'ما انت', 'عرف بنفسك', 'ماذا تفعل', 'كيف تساعدني', 'ما عملك', 'ما وظيفتك', 'ما فائدتك',
    'شكرا', 'شكرا لك', 'مشكور', 'جزاك الله خيرا', 'بارك الله فيك', 'يعطيك العافيه',
    'تسلم', 'احسنت', 'شكرا جزيلا'
  ];
  return conversationalPhrases.some((phrase) => norm.includes(normalizeArabic(phrase)));
}

export interface RagSource {
  title: string;
  category: string;
  source: string;
  url: string;
  type: 'nawawi' | 'hisn' | 'seerah' | 'fake-hadith' | 'daily-tracker';
}

export type AssistantSearchMode = 'all' | 'adhkar' | 'seerah' | 'hadith' | 'general';

export interface RagRetrievalResult {
  hasVerifiedContext: boolean;
  contextText: string;
  sources: RagSource[];
  isFakeWarning: boolean;
  dorarSearchUrl: string;
  matchedHadithText?: string;
}

/**
 * حساب درجة التطابق بين نص وسؤال مع دعم المرادفات الدلالية وتطابق عناوين الأبواب
 */
export function calculateMatchScore(
  text: string,
  title: string,
  coreTokens: string[],
  fullNormQuery: string
): number {
  if (coreTokens.length === 0) return 0;

  const normText = normalizeArabic(text);
  const normTitle = normalizeArabic(title);

  let score = 0;

  // تطابق العبارة الكاملة
  if (fullNormQuery.length >= 5) {
    if (normTitle.includes(fullNormQuery)) {
      score += 300;
    } else if (normText.includes(fullNormQuery)) {
      score += 150;
    }
  }

  let titleMatches = 0;
  let textMatches = 0;
  const matchedTokenIndices = new Set<number>();

  for (let i = 0; i < coreTokens.length; i++) {
    const token = coreTokens[i];
    const stem = cleanStem(token);
    const expansions = SEMANTIC_EXPANSIONS[stem] || SEMANTIC_EXPANSIONS[token] || [];

    // فحص التطابق المباشر والتوسيع الدلالي في العنوان
    const inTitleDirect = normTitle.includes(token) || (stem.length >= 3 && normTitle.includes(stem));
    const inTitleExpansion = expansions.some(
      (exp) => normTitle.includes(exp) || (cleanStem(exp).length >= 3 && normTitle.includes(cleanStem(exp)))
    );
    const inTitle = inTitleDirect || inTitleExpansion;

    // فحص التطابق المباشر والتوسيع الدلالي في المتن
    const inTextDirect = normText.includes(token) || (stem.length >= 3 && normText.includes(stem));
    const inTextExpansion = expansions.some(
      (exp) => normText.includes(exp) || (cleanStem(exp).length >= 3 && normText.includes(cleanStem(exp)))
    );
    const inText = inTextDirect || inTextExpansion;

    if (inTitle) {
      titleMatches++;
      matchedTokenIndices.add(i);
    }
    if (inText) {
      textMatches++;
      matchedTokenIndices.add(i);
    }
  }

  // إذا تطابق عنوان الباب مع كلمة جوهرية قوية (مثل: الميت، الاستخارة، الكسوف، بدر)
  const hasStrongTitleMatch =
    titleMatches >= 1 &&
    Array.from(matchedTokenIndices).some((idx) => {
      const t = coreTokens[idx];
      const s = cleanStem(t);
      return s.length >= 3 && !['دعاء', 'ذكر', 'سنه', 'عمل', 'قول'].includes(s);
    });

  // حد التطابق الأدنى:
  // - عند وجود تطابق قوي في عنوان الباب: يكتفى بـ 2 كلمة (أو كلمة واحدة إذا كان السؤال كلمتين)
  // - عدا ذلك: يلزم تطابق كلمتين أو 60% من الكلمات لمنع التداخل العشوائي
  const requiredHits = hasStrongTitleMatch
    ? Math.min(2, coreTokens.length)
    : coreTokens.length <= 1
    ? 1
    : coreTokens.length === 2
    ? 2
    : Math.min(3, Math.ceil(coreTokens.length * 0.6));

  if (matchedTokenIndices.size < requiredHits) {
    return 0; // استبعاد فوري
  }

  score += titleMatches * 80 + textMatches * 20;

  // عقوبة النصوص الضخمة (تجنب تصدر القصص الطويلة التي تحتوي صدفة على كلمات شائعة)
  if (normText.length > 1000) {
    score -= Math.min(50, Math.floor(normText.length / 500));
  }

  return Math.max(0, score);
}

export function retrieveVerifiedContext(
  query: string,
  mode: AssistantSearchMode = 'all'
): RagRetrievalResult {
  const normQuery = normalizeArabic(query);

  if (!normQuery || normQuery.length < 2) {
    return {
      hasVerifiedContext: false,
      contextText: '',
      sources: [],
      isFakeWarning: false,
      dorarSearchUrl: getDorarSearchUrl(query),
    };
  }

  // إذا كانت الرسالة مجرد تحية أو دردشة أو سؤال خفيف دون طلب نص شرعي محدد، لا نرفق أي مصادر لتجنب ظهور بطاقات غير ملائمة
  const hasExplicitTopic =
    normQuery.includes('حديث') ||
    normQuery.includes('دعاء') ||
    normQuery.includes('ذكر') ||
    normQuery.includes('سوره') ||
    normQuery.includes('ايه') ||
    normQuery.includes('صلاه') ||
    normQuery.includes('صيام') ||
    normQuery.includes('حكم') ||
    normQuery.includes('غزوه') ||
    normQuery.includes('ميت') ||
    normQuery.includes('جناز') ||
    normQuery.includes('استخار') ||
    normQuery.includes('سفر') ||
    normQuery.includes('ثوب') ||
    normQuery.includes('لبس');

  if (isConversationalOrGreeting(normQuery) && !hasExplicitTopic) {
    return {
      hasVerifiedContext: false,
      contextText: '',
      sources: [],
      isFakeWarning: false,
      dorarSearchUrl: '',
    };
  }

  const coreTokens = extractCoreTokens(query);
  const sources: RagSource[] = [];
  const contextParts: string[] = [];
  let isFakeWarning = false;
  let primaryMatchedText = '';

  const shouldSearchFakes = mode === 'all' || mode === 'general' || mode === 'hadith';
  const shouldSearchNawawi = mode === 'all' || mode === 'general' || mode === 'hadith';
  const shouldSearchHisn = mode === 'all' || mode === 'general' || mode === 'adhkar';
  const shouldSearchDaily = mode === 'all' || mode === 'general' || mode === 'adhkar';
  const shouldSearchSeerah = mode === 'all' || mode === 'general' || mode === 'seerah';

  // فحص ما إذا كان المستخدم يسأل صراحة عن صحة أو ثبوت حديث
  const isExplicitAuthenticityQuery =
    normQuery.includes('هل') ||
    normQuery.includes('صحيح') ||
    normQuery.includes('ضعيف') ||
    normQuery.includes('مكذوب') ||
    normQuery.includes('باطل') ||
    normQuery.includes('تثبت') ||
    normQuery.includes('حكم') ||
    normQuery.includes('درجه') ||
    normQuery.includes('صحه');

  interface ScoredItem<T = any> {
    item: T;
    score: number;
    extra?: any;
  }

  // 1. فحص قسم «تثبّت» أولاً لكشف الأحاديث المكذوبة والضعيفة
  const scoredFakes: ScoredItem[] = [];
  if (shouldSearchFakes) {
    const fakeData = fakeDataRaw as any;
    const fakeList = Array.isArray(fakeData?.hadiths)
      ? fakeData.hadiths
      : Array.isArray(fakeData?.fakeHadiths)
      ? fakeData.fakeHadiths
      : [];

    for (const item of fakeList) {
      const hadithText = item.hadithText || '';
      const shortTitle = hadithText.slice(0, 140);
      const score = calculateMatchScore(hadithText, shortTitle, coreTokens, normQuery);

      if (score >= 100) {
        const normShort = normalizeArabic(shortTitle);
        const normFull = normalizeArabic(hadithText);
        const isExactPhrase =
          (normQuery.length >= 6 && normShort.includes(normQuery)) ||
          (normQuery.length >= 8 && normFull.includes(normQuery));

        let matchedTokensCount = 0;
        for (const t of coreTokens) {
          const stem = cleanStem(t);
          if (
            normShort.includes(t) ||
            (stem.length >= 3 && normShort.includes(stem)) ||
            normFull.includes(t) ||
            (stem.length >= 3 && normFull.includes(stem))
          ) {
            matchedTokensCount++;
          }
        }

        if (!isExactPhrase) {
          if (coreTokens.length >= 2 && matchedTokensCount < 2) {
            continue;
          }
          if (coreTokens.length === 1) {
            const singleToken = coreTokens[0];
            if (singleToken.length < 5 || !normShort.includes(singleToken)) {
              continue;
            }
          }
        }

        scoredFakes.push({ item, score });
      }
    }
    scoredFakes.sort((a, b) => b.score - a.score);
  }

  // 2. البحث في الأربعين النووية (نصوص كاملة وأرقام)
  const scoredNawawi: ScoredItem[] = [];
  if (shouldSearchNawawi) {
    const nawawiData = nawawiDataRaw as any;
    if (Array.isArray(nawawiData?.hadiths)) {
      for (const item of nawawiData.hadiths) {
        const score = calculateMatchScore(
          item.text || '',
          item.title || '',
          coreTokens,
          normQuery
        );

        if (score > 0) {
          scoredNawawi.push({ item, score });
        }
      }
      scoredNawawi.sort((a, b) => b.score - a.score);
    }
  }

  // 3. البحث في حصن المسلم (أذكار وأدعية موثقة)
  const scoredHisn: ScoredItem[] = [];
  if (shouldSearchHisn) {
    const hisnData = hisnDataRaw as any;
    if (Array.isArray(hisnData?.categories)) {
      for (const cat of hisnData.categories) {
        const catItems = cat.items || cat.adhkar || [];
        for (const dhikr of catItems) {
          const score = calculateMatchScore(
            dhikr.text || '',
            cat.title || '',
            coreTokens,
            normQuery
          );

          if (score > 0) {
            scoredHisn.push({ item: dhikr, score, extra: cat });
          }
        }
      }
      scoredHisn.sort((a, b) => b.score - a.score);
    }
  }

  // 4. البحث في السيرة النبوية (محطات ودروس الرحيق المختوم)
  const scoredSeerah: ScoredItem[] = [];
  if (shouldSearchSeerah) {
    const seerahData = seerahDataRaw as any;
    const seerahMilestones = Array.isArray(seerahData?.milestones)
      ? seerahData.milestones
      : Array.isArray(seerahData?.stations)
      ? seerahData.stations
      : [];

    for (const m of seerahMilestones) {
      const fullText = `${m.summary || ''} ${(m.details || []).join(' ')} ${(m.lessons || []).join(' ')}`;
      const score = calculateMatchScore(
        fullText,
        m.title || '',
        coreTokens,
        normQuery
      );

      if (score > 0) {
        scoredSeerah.push({ item: m, score });
      }
    }
    scoredSeerah.sort((a, b) => b.score - a.score);
  }

  // 5. البحث في متتبع سنن اليوم والليلة
  const scoredDaily: ScoredItem[] = [];
  if (shouldSearchDaily) {
    const dailyData = dailyDataRaw as any;
    if (Array.isArray(dailyData?.stations)) {
      for (const d of dailyData.stations) {
        const fullText = `${d.description || ''} ${d.hadithQuote || ''} ${(d.sunnahActions || []).join(' ')}`;
        const score = calculateMatchScore(
          fullText,
          d.title || '',
          coreTokens,
          normQuery
        );

        if (score > 0) {
          scoredDaily.push({ item: d, score });
        }
      }
      scoredDaily.sort((a, b) => b.score - a.score);
    }
  }

  // حساب أعلى درجة في المصادر المعتمدة الصحيحة
  const authenticTopScore = Math.max(
    scoredNawawi[0]?.score || 0,
    scoredHisn[0]?.score || 0,
    scoredSeerah[0]?.score || 0,
    scoredDaily[0]?.score || 0
  );

  const overallTopScore = Math.max(
    authenticTopScore,
    scoredFakes[0]?.score || 0
  );
  const minRelevanceScore = Math.max(60, overallTopScore * 0.55);

  // اتخاذ قرار التحذير من الحديث المكذوب:
  if (
    scoredFakes.length > 0 &&
    (isExplicitAuthenticityQuery || scoredFakes[0].score >= authenticTopScore)
  ) {
    const topFake = scoredFakes[0].item;
    isFakeWarning = true;
    primaryMatchedText = topFake.hadithText || '';
    contextParts.push(
      `[تنبيه علمي فوري من قسم تثبّت]\n` +
      `الحديث المذكور: «${topFake.hadithText}»\n` +
      `الحكم والدرجة: ${topFake.ruling}\n` +
      `المصدر: الموسوعة الحديثية بمؤسسة «الدرر السنية»`
    );
    sources.push({
      title: `تنبيه حديثي: «${topFake.hadithText.slice(0, 45)}...» لا يصح`,
      category: 'تثبّت — الدرر السنية',
      source: topFake.ruling,
      url: topFake.dorarUrl || getDorarSearchUrl(query, topFake.hadithText),
      type: 'fake-hadith',
    });
  }

  // إضافة الأربعين النووية إن وُجدت
  for (const { item } of scoredNawawi.filter((s) => s.score >= minRelevanceScore).slice(0, 2)) {
    if (!primaryMatchedText) {
      primaryMatchedText = item.text || '';
    }
    contextParts.push(
      `[حديث نبوي شريف — الأربعون النووية]\n` +
      `الحديث رقم (${item.id}): ${item.title}\n` +
      `المتن: ${item.text}\n` +
      `الراوي: ${item.narrator || 'صحابي جليل'}\n` +
      `التخريج والمصدر: ${item.source || 'رواه البخاري ومسلم'}`
    );
    sources.push({
      title: `الحديث (${item.id}): ${item.title}`,
      category: 'الأربعون النووية',
      source: item.source || 'الإمام النووي',
      url: `/nawawi40#hadith-${item.id}`,
      type: 'nawawi',
    });
  }

  // إضافة حصن المسلم إن وُجدت
  const addedCatIds = new Set<number>();
  for (const { item: dhikr, extra: cat } of scoredHisn.filter((s) => s.score >= minRelevanceScore)) {
    if (addedCatIds.has(cat.id)) continue;
    addedCatIds.add(cat.id);

    if (!primaryMatchedText) {
      primaryMatchedText = dhikr.text || '';
    }

    contextParts.push(
      `[ذكر مأثور — حصن المسلم]\n` +
      `الباب: ${cat.title}\n` +
      `الذكر: ${dhikr.text}\n` +
      `التخريج: ${dhikr.reference || 'صحيح الأذكار'}\n` +
      (dhikr.count > 1 ? `عدد التكرار: ${dhikr.count} مرات` : '')
    );
    sources.push({
      title: cat.title,
      category: 'حصن المسلم',
      source: dhikr.reference || 'الشيخ سعيد بن وهف القحطاني',
      url: `/adhkar?cat=${cat.id}`,
      type: 'hisn',
    });

    if (sources.filter((s) => s.type === 'hisn').length >= 2) break;
  }

  // إضافة السيرة النبوية إن وُجدت
  for (const { item: m } of scoredSeerah.filter((s) => s.score >= minRelevanceScore).slice(0, 2)) {
    if (!primaryMatchedText) {
      primaryMatchedText = m.summary || '';
    }
    contextParts.push(
      `[موقف من السيرة النبوية — الرحيق المختوم]\n` +
      `المحطة: ${m.title} (${m.eraTitle || ''})\n` +
      `التاريخ والمكان: ${m.hijriDate || ''} — ${m.location || ''}\n` +
      `الملخص: ${m.summary}\n` +
      `أبرز الدروس والعبر: ${(m.lessons || []).slice(0, 3).join(' • ')}`
    );
    sources.push({
      title: m.title,
      category: 'السيرة النبوية المطهرة',
      source: 'الرحيق المختوم',
      url: `/seerah#${m.id}`,
      type: 'seerah',
    });
  }

  // إضافة سنن اليوم والليلة إن وُجدت
  for (const { item: d } of scoredDaily.filter((s) => s.score >= minRelevanceScore).slice(0, 1)) {
    if (!primaryMatchedText) {
      primaryMatchedText = d.hadithQuote || '';
    }
    contextParts.push(
      `[سنة يومية عملية — متتبع سنن اليوم والليلة]\n` +
      `المحطة: ${d.title} (${d.timeOfDay || ''})\n` +
      `الهدي النبوي: ${d.hadithQuote || ''}\n` +
      `السنن التطبيقية: ${(d.sunnahActions || []).slice(0, 4).join(' • ')}`
    );
    sources.push({
      title: d.title,
      category: 'سنن اليوم والليلة',
      source: d.hadithQuote || 'سنة نبوية مؤكدة',
      url: '/daily-tracker',
      type: 'daily-tracker',
    });
  }

  const hasVerifiedContext = contextParts.length > 0;
  const contextText = contextParts.join('\n\n---\n\n');
  const dorarSearchUrl = getDorarSearchUrl(query, primaryMatchedText);

  return {
    hasVerifiedContext,
    contextText,
    sources: sources.slice(0, 3),
    isFakeWarning,
    dorarSearchUrl,
    matchedHadithText: primaryMatchedText,
  };
}
