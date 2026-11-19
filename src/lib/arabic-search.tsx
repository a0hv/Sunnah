import React from 'react';
import hadeethDataRaw from '@/data/hadeethenc.json';
import hisnDataRaw from '@/data/hisn-al-muslim.json';
import fakeDataRaw from '@/data/fake-hadiths.json';
import nawawiDataRaw from '@/data/nawawi40.json';
import seerahDataRaw from '@/data/seerah.json';
import { getDorarHadithUrl } from './external-refs';

// ================= TYPES =================
export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

export interface WordMeaningItem {
  word: string;
  meaning: string;
}

export interface HadeethSearchResult {
  id: string;
  title: string;
  categoryTitle: string;
  hadeeth: string;
  attribution: string;
  grade: string;
  explanation: string;
  hints: string[];
  wordsMeanings: WordMeaningItem[];
  dorarUrl: string;
  score: number;
}

export interface HisnSearchResult {
  id: number;
  categoryId: number;
  categoryTitle: string;
  text: string;
  count: number;
  reference: string;
  score: number;
  dorarUrl: string;
}

export interface NawawiSearchResult {
  id: number;
  title: string;
  text: string;
  narrator?: string;
  source?: string;
  score: number;
  dorarUrl: string;
}

export interface SeerahSearchResult {
  id: string;
  order: number;
  eraId: number;
  eraTitle: string;
  title: string;
  hijriDate: string;
  location: string;
  category: string;
  summary: string;
  lessons: string[];
  keyFigures: string[];
  score: number;
}

export interface FakeHadithSearchResult {
  id: number;
  hadithText: string;
  ruling: string;
  explanation: string;
  dorarUrl: string;
  score: number;
}

export interface BestMatchSummary {
  hadith?: HadeethSearchResult;
  dhikr?: HisnSearchResult;
  situationTitle?: string;
  guidanceText?: string;
}

export interface PlatformSearchResults {
  query: string;
  expandedTerms: string[];
  totalCount: number;
  bestMatch?: BestMatchSummary;
  hadiths: HadeethSearchResult[];
  hisn: HisnSearchResult[];
  nawawi: NawawiSearchResult[];
  seerah: SeerahSearchResult[];
  fake: FakeHadithSearchResult[];
}

// ================= ARABIC NORMALIZATION =================
/**
 * Normalizes Arabic text for uniform text searching:
 * - Strips Tashkeel (harakat), Tanween, Tatweel, and Quranic waqf marks
 * - Unifies Alef forms: [إأآٱ] -> ا
 * - Unifies Taa Marbuta: ة -> ه
 * - Unifies Alef Maksura: ى -> ي
 * - Cleans punctuation & collapses whitespace
 */
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
 * Strips light Arabic prefixes from tokens of length >= 4:
 * (ال، و، ف، ب، ك، ل)
 */
export function stripPrefixes(token: string): string {
  if (token.length < 4) return token;
  if (token.startsWith('ال') && token.length >= 4) {
    return token.slice(2);
  }
  if (/^[وفلبك]/.test(token) && token.length >= 4) {
    return token.slice(1);
  }
  return token;
}

// ================= SEMANTIC EXPANSIONS DICTIONARY (65+ SITUATIONS) =================
export interface SemanticExpansionRule {
  id: string;
  title: string;
  guidance: string;
  triggers: string[];
  expandedTerms: string[];
}

export const SEMANTIC_EXPANSIONS: SemanticExpansionRule[] = [
  {
    id: 'anxiety-sadness',
    title: 'الهم والغم والكرب والضيق',
    guidance: 'الهدي النبوي في تفريج الكرب: سؤال الله العافية، ودعاء ذي النون «لا إله إلا أنت سبحانك إني كنت من الظالمين»، وملازمة الاستغفار والصلاة على النبي ﷺ.',
    triggers: [
      'مخنوق', 'زهقان', 'مكتئب', 'حزين', 'ضيق', 'مهموم', 'خنقة', 'خنقه', 'طاقة سلبية', 'تعبان نفسي',
      'مغموم', 'كرب', 'كربة', 'حزن', 'هم', 'ضيقة صدر', 'متضايق', 'ياأس', 'ياس', 'محبط'
    ],
    expandedTerms: ['هم', 'حزن', 'كرب', 'ضيق', 'فرج', 'صبر', 'طمأنينة', 'توكل', 'يسر', 'عسر', 'انشراح', 'صدر'],
  },
  {
    id: 'fear-stress',
    title: 'الخوف والقلق والامتحانات والتوتر',
    guidance: 'عند الخوف أو التوتر: «اللهم لا سهل إلا ما جعلته سهلاً، وأنت تجعل الحزن إذا شئت سهلاً»، وتفويض الأمر لله مع بذل الأسباب.',
    triggers: [
      'خايف', 'خائف', 'قلقان', 'توتر', 'امتحان', 'امتحانات', 'صعب', 'مرعوب', 'رهبة', 'فزع',
      'فوبيا', 'متردد', 'خوف', 'قلق', 'مشتت'
    ],
    expandedTerms: ['خوف', 'تيسير', 'سهل', 'استخارة', 'توكل', 'سكينة', 'أمن', 'يقين', 'اطمئنان', 'حفظ'],
  },
  {
    id: 'anger-fight',
    title: 'الغضب والانفعال والمشاجرات',
    guidance: 'العلاج النبوي للغضب: الاستعاذة بالله من الشيطان، والسكوت، والوضوء، وتغيير الهيئة بالجلوس أو الاضطجاع، ومجاهدة النفس على كظم الغيظ والعفو.',
    triggers: [
      'متعصب', 'غضبان', 'اتخانقت', 'خناقة', 'خناقه', 'زعلان من حد', 'عصبية', 'عصبيه', 'انفعال',
      'مشكلة مع حد', 'مشاجرة', 'غيظ', 'مشتعل', 'غضب', 'كظم الغيظ', 'شجار'
    ],
    expandedTerms: ['غضب', 'حلم', 'عفو', 'صفح', 'كظم', 'رفق', 'خصومة', 'سلام', 'تسامح', 'إحسان'],
  },
  {
    id: 'debt-money',
    title: 'الديون والرزق والفقر والعمل',
    guidance: 'أدعية قضاء الدين وسعة الرزق: «اللهم اكفني بحلالك عن حرامك، وأغنني بفضلك عمن سواك»، والاستعاذة من غلبة الدين وقهر الرجال، والتوكل الصادق.',
    triggers: [
      'فلوس', 'مديون', 'دين', 'رزق', 'شغل', 'فقر', 'معيشة', 'ديون', 'قرض', 'سلفة', 'سلفه',
      'عاطل', 'وظيفة', 'قضاء الدين', 'ضيق الرزق', 'معسر'
    ],
    expandedTerms: ['رزق', 'دين', 'قضاء', 'بركة', 'غنى', 'قناعة', 'كسب', 'عمل', 'حلال', 'عفاف', 'كفاية'],
  },
  {
    id: 'family-marriage',
    title: 'الأسرة والزوجين والأبناء والبيت',
    guidance: 'الهدي النبوي في البيت: «خيركم خيركم لأهله وأنا خيركم لأهلي»، وحسن العشرة، والرفق بالأهل، والتربية الصالحة القائمة على الرحمة.',
    triggers: [
      'جوزي', 'مراتي', 'زوجة', 'زوجه', 'زواج', 'مشاكل بيت', 'عيالي', 'أولادي', 'اولادي', 'تربية',
      'تربيه', 'طلاق', 'نكاح', 'خطوبة', 'خطوبه', 'أهل', 'اهل', 'خلافات زوجية'
    ],
    expandedTerms: ['نكاح', 'زوج', 'امرأة', 'أهل', 'أولاد', 'رحمة', 'بر', 'والدين', 'مودة', 'عشرة', 'رفق'],
  },
  {
    id: 'nightmare-sleep',
    title: 'الكوابيس والأرق والفزع في النوم',
    guidance: 'عند رؤية ما يكره في منامه: ينفث عن يساره ثلاثاً، ويتعوذ بالله من الشيطان ومن شرها، ولا يخبر بها أحداً، ويتحول إلى جنبه الآخر أو يقوم يصلي.',
    triggers: [
      'كابوس', 'حلم وحش', 'مش عارف انام', 'مش عارف أنام', 'أرق', 'ارق', 'فزع في النوم',
      'جاثوم', 'كوابيس', 'رؤيا', 'روءيا', 'وحشة في النوم'
    ],
    expandedTerms: ['نوم', 'رؤيا', 'حلم', 'فزع', 'استعاذة', 'يمين', 'يسار', 'نفث', 'أذكار النوم', 'مضجع'],
  },
  {
    id: 'sickness-evil-eye',
    title: 'المرض والألم والشفاء والحسد والرقى',
    guidance: 'الهدي النبوي عند الوجع: وضع اليد على موضع الألم وقول «بسم الله» ثلاثاً و«أعوذ بالله وقدرته من شر ما أجد وأحاذر» سبعاً، والدعاء: «لا بأس طهور إن شاء الله».',
    triggers: [
      'مريض', 'تعبان', 'وجع', 'مستشفى', 'حسد', 'عين', 'طبيب', 'دواء', 'علاج', 'مغص', 'صداع',
      'حمى', 'سحر', 'رقية', 'رقيه', 'ألم', 'الم', 'معيون', 'محسود'
    ],
    expandedTerms: ['مرض', 'شفاء', 'رقية', 'عيادة', 'عافية', 'عين', 'ألم', 'طهور', 'بأس', 'معافاة', 'صحة'],
  },
  {
    id: 'rain-thunder',
    title: 'المطر والريح والرعد والظواهر',
    guidance: 'عند نزول المطر: «اللهم صيباً نافعاً»، وعند سماع الرعد: «سبحان الذي يسبح الرعد بحمده والملائكة من خيفته»، وعند اشتداد المطر: «حوالينا ولا علينا».',
    triggers: ['مطر', 'شتا', 'شتاء', 'رعد', 'برق', 'ريح', 'رياح', 'عاصفة', 'عاصفه', 'غيث', 'سحاب'],
    expandedTerms: ['مطر', 'ريح', 'رعد', 'صيبا نافعا', 'غيث', 'رحمة', 'بركة', 'سقيا', 'استسقاء'],
  },
  {
    id: 'travel-transit',
    title: 'السفر وركوب الطائرة والسيارة',
    guidance: 'دعاء السفر: «سبحان الذي سخر لنا هذا وما كنا له مقرنين...»، والتكبير عند صعود المرتفعات والتسبيح عند الهبوط.',
    triggers: ['سفر', 'مسافر', 'طيارة', 'طياره', 'قطار', 'طريق', 'سيارة', 'سياره', 'دابة', 'شنطة سفر', 'رحلة'],
    expandedTerms: ['سفر', 'ركوب', 'دابة', 'تكبير', 'تسبيح', 'وداع', 'رد', 'أوبة', 'سلامة'],
  },
  {
    id: 'repentance-sins',
    title: 'التوبة من الذنب والندم والاستغفار',
    guidance: 'شروط التوبة النصوح: الإقلاع الفوري، والندم، والعزم على عدم العودة، ورد المظالم لأهلها، والإكثار من سيد الاستغفار «اللهم أنت ربي لا إله إلا أنت...».',
    triggers: [
      'عايز اتوب', 'عايز أتوب', 'ذنوب', 'معصية', 'معصيه', 'ندمان', 'غلطت', 'توبة', 'توبه',
      'استغفار', 'رجوع لله', 'تكفير الذنب', 'مستغفر'
    ],
    expandedTerms: ['توبة', 'استغفار', 'ندم', 'مغفرة', 'عفو', 'سيئات', 'حسنات', 'إنابة', 'سيد الاستغفار'],
  },
  {
    id: 'whispers-doubt',
    title: 'الوسوسة في الصلاة أو العقيدة',
    guidance: 'إذا وسوس الشيطان في الصلاة ينفث عن يساره ثلاثاً ويستعيذ بالله من خنزب. وإذا وسوس في الإيمان فليقل: «آمنت بالله ورسله» ولينته.',
    triggers: ['وسواس', 'وسوسة', 'وسوسه', 'شاكك', 'شك', 'شبهات', 'وسوسلي', 'سهو في الصلاة'],
    expandedTerms: ['وسوسة', 'خنزب', 'استعاذة', 'إيمان', 'يقين', 'سهو', 'شيطان', 'ثبات'],
  },
  {
    id: 'parents-kinship',
    title: 'بر الوالدين وصلة الأرحام',
    guidance: 'بر الوالدين من أعظم القربات وأحب الأعمال إلى الله: «الوالد أوسط أبواب الجنة»، وصلة الرحم تزيد في الرزق وتنسأ في الأثر.',
    triggers: ['امي', 'أمي', 'ابويا', 'أبي', 'اهلي', 'أهلي', 'قرايبي', 'قطيعة رحم', 'بر الوالدين', 'عقوق'],
    expandedTerms: ['والدين', 'أم', 'أب', 'رحم', 'صلة', 'بر', 'إحسان', 'عقوق', 'جناح الذل'],
  },
  {
    id: 'honesty-cheating',
    title: 'الصدق والأمانة والنهي عن الغش والكذب',
    guidance: '«إن الصدق يهدي إلى البر وإن البر يهدي إلى الجنة»، و«من غش فليس منا»، والأمانة أساس المعاملات الإسلامية.',
    triggers: ['غش', 'كذب', 'نصب', 'خيانة', 'خيانه', 'أمانة', 'امانه', 'صدق', 'حلفان كذب', 'يمين غموس'],
    expandedTerms: ['أمانة', 'صدق', 'غش', 'كذب', 'وفاء', 'عهد', 'بر', 'فجور'],
  },
  {
    id: 'backbiting-tongue',
    title: 'حفظ اللسان والنهي عن الغيبة والنميمة',
    guidance: '«من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت»، والغيبة والنميمة من كبائر الذنوب التي تمزق المجتمعات.',
    triggers: ['غيبة', 'غيبه', 'نميمة', 'نميمه', 'كلام في ضهري', 'سب', 'شتم', 'لسان', 'فتنة', 'فتنه'],
    expandedTerms: ['لسان', 'صمت', 'غيبة', 'نميمة', 'بهتان', 'إفك', 'حفظ اللسان', 'سلامة الصدر'],
  },
  {
    id: 'prayer-khushu',
    title: 'الصلاة والخشوع وقيام الليل',
    guidance: 'أول ما يحاسب عليه العبد يوم القيامة الصلاة، وأفضل الصلاة بعد الفريضة صلاة الليل، والخشوع روح الصلاة ولبّها.',
    triggers: ['مش عارف اخشع', 'قيام الليل', 'صلاة الفجر', 'كسلان عن الصلاة', 'تارك الصلاة', 'وتر', 'ضحى'],
    expandedTerms: ['صلاة', 'خشوع', 'فجر', 'قيام', 'نافلة', 'ركوع', 'سجود', 'طهارة', 'إسباغ الوضوء'],
  },
  {
    id: 'istikhara-choice',
    title: 'الحيرة والتردد وصلاة الاستخارة',
    guidance: 'ما ندم من استخار الخالق واستشار المخلوقين؛ ركعتان من غير الفريضة ثم الدعاء بالدعاء المأثور: «اللهم إني أستخيرك بعلمك...».',
    triggers: ['محتار', 'مش عارف اختار', 'قرار صعب', 'حيرة', 'حيره', 'استخارة', 'استخاره', 'تردد'],
    expandedTerms: ['استخارة', 'دعاء الاستخارة', 'استقدرك', 'توفيق', 'خيرة', 'قدر', 'رضا'],
  },
];

// ================= SEARCH ALGORITHM =================
/**
 * Main search function across Explained Hadiths (HadeethEnc), Hisn al-Muslim,
 * Nawawi 40, Prophetic Seerah, and Fake Hadiths Verification.
 */
export function searchPlatform(query: string): PlatformSearchResults {
  const normalizedQuery = normalizeArabic(query);
  const emptyResult: PlatformSearchResults = {
    query,
    expandedTerms: [],
    totalCount: 0,
    hadiths: [],
    hisn: [],
    nawawi: [],
    seerah: [],
    fake: [],
  };

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return emptyResult;
  }

  const queryTokens = normalizedQuery.split(' ').filter((t) => t.length > 0);
  const strippedTokens = queryTokens.map((t) => stripPrefixes(t));

  // 1. Expand query using Semantic Expansions Dictionary
  const expandedTermsSet = new Set<string>();
  let matchedRule: SemanticExpansionRule | undefined;

  for (const rule of SEMANTIC_EXPANSIONS) {
    let triggered = false;
    for (const trig of rule.triggers) {
      const normTrig = normalizeArabic(trig);
      if (
        normalizedQuery.includes(normTrig) ||
        normTrig.includes(normalizedQuery) ||
        queryTokens.some((t) => normTrig.includes(t) && t.length >= 3)
      ) {
        triggered = true;
        break;
      }
    }

    if (triggered) {
      if (!matchedRule) matchedRule = rule;
      for (const term of rule.expandedTerms) {
        expandedTermsSet.add(normalizeArabic(term));
      }
    }
  }

  const expandedTerms = Array.from(expandedTermsSet);

  // 2. Search Explained Hadiths (HadeethEnc.com)
  const hadeethResults: HadeethSearchResult[] = [];
  const hadeethData = hadeethDataRaw as any;
  if (hadeethData?.hadiths) {
    for (const h of hadeethData.hadiths) {
      const normTitle = normalizeArabic(h.title || '');
      const normText = normalizeArabic(h.hadeeth || '');
      const normExpl = normalizeArabic(h.explanation || '');
      const normCat = normalizeArabic(h.categoryTitle || '');
      const normHints = normalizeArabic((h.hints || []).join(' '));
      const normWords = normalizeArabic(
        (h.wordsMeanings || []).map((w: any) => `${w.word} ${w.meaning}`).join(' ')
      );

      let score = 0;

      // Exact phrase match
      if (normTitle.includes(normalizedQuery)) {
        score += 85;
      } else if (normText.includes(normalizedQuery)) {
        score += 65;
      } else if (normExpl.includes(normalizedQuery)) {
        score += 50;
      } else if (normHints.includes(normalizedQuery)) {
        score += 45;
      }

      // Token overlap
      if (queryTokens.every((t) => normText.includes(t) || normExpl.includes(t) || normHints.includes(t))) {
        score += 40;
      } else if (strippedTokens.some((st) => st.length >= 3 && (normText.includes(st) || normExpl.includes(st)))) {
        score += 20;
      }

      if (normCat.includes(normalizedQuery)) {
        score += 25;
      }
      if (normWords.includes(normalizedQuery)) {
        score += 30;
      }

      // Semantic expansion boost
      if (expandedTerms.length > 0) {
        let titleHits = 0;
        let textHits = 0;
        let otherHits = 0;
        for (const term of expandedTerms) {
          if (normTitle.includes(term)) titleHits++;
          if (normText.includes(term)) textHits++;
          if (normExpl.includes(term) || normHints.includes(term)) otherHits++;
        }
        if (titleHits > 0) score += Math.min(60, titleHits * 25);
        if (textHits > 0) score += Math.min(45, textHits * 18);
        if (otherHits > 0) score += Math.min(30, otherHits * 10);
      }

      if (score > 0) {
        hadeethResults.push({
          id: String(h.id),
          title: h.title,
          categoryTitle: h.categoryTitle,
          hadeeth: h.hadeeth,
          attribution: h.attribution,
          grade: h.grade,
          explanation: h.explanation,
          hints: h.hints || [],
          wordsMeanings: h.wordsMeanings || [],
          dorarUrl: getDorarHadithUrl(h.hadeeth),
          score,
        });
      }
    }
  }
  hadeethResults.sort((a, b) => b.score - a.score);

  // 3. Search Hisn al-Muslim (أذكار وأدعية)
  const hisnResults: HisnSearchResult[] = [];
  const hisnData = hisnDataRaw as any;
  if (hisnData?.categories) {
    for (const cat of hisnData.categories) {
      const normCatTitle = normalizeArabic(cat.title || '');
      const dhikrList = cat.items || cat.adhkar || [];
      for (const dhikr of dhikrList) {
        const normText = normalizeArabic(dhikr.text || '');
        const normRef = normalizeArabic(dhikr.reference || '');

        let score = 0;
        if (normCatTitle.includes(normalizedQuery)) {
          score += 100;
        }
        if (normText.includes(normalizedQuery)) {
          score += 60;
        } else if (queryTokens.every((t) => normText.includes(t) || normCatTitle.includes(t))) {
          score += 35;
        } else if (strippedTokens.some((st) => st.length >= 3 && normText.includes(st))) {
          score += 18;
        }

        if (normRef.includes(normalizedQuery)) {
          score += 5;
        }

        // Semantic expansion boost: Category title matches get high priority!
        if (expandedTerms.length > 0) {
          let catExpansionHits = 0;
          let textExpansionHits = 0;
          for (const term of expandedTerms) {
            if (normCatTitle.includes(term)) {
              catExpansionHits++;
            }
            if (normText.includes(term)) {
              textExpansionHits++;
            }
          }
          if (catExpansionHits > 0) {
            score += Math.min(80, catExpansionHits * 35);
          }
          if (textExpansionHits > 0) {
            score += Math.min(30, textExpansionHits * 10);
          }
        }

        if (score > 0) {
          hisnResults.push({
            id: dhikr.id,
            categoryId: cat.id,
            categoryTitle: cat.title,
            text: dhikr.text,
            count: dhikr.count || 1,
            reference: dhikr.reference || '',
            score,
            dorarUrl: getDorarHadithUrl(dhikr.text),
          });
        }
      }
    }
  }
  hisnResults.sort((a, b) => b.score - a.score);

  // 4. Search Nawawi 40 Hadiths
  const nawawiResults: NawawiSearchResult[] = [];
  const nawawiData = nawawiDataRaw as any;
  if (nawawiData?.hadiths) {
    for (const item of nawawiData.hadiths) {
      const normText = normalizeArabic(item.text || '');
      const normTitle = normalizeArabic(item.title || '');
      const normNarrator = normalizeArabic(item.narrator || '');

      let score = 0;
      if (normText.includes(normalizedQuery)) {
        score += 50;
      } else if (queryTokens.every((t) => normText.includes(t))) {
        score += 30;
      } else if (strippedTokens.some((st) => st.length >= 3 && normText.includes(st))) {
        score += 15;
      }

      if (normTitle.includes(normalizedQuery)) {
        score += 30;
      }
      if (normNarrator.includes(normalizedQuery)) {
        score += 10;
      }
      if (String(item.id) === normalizedQuery || normalizedQuery === `الحديث ${item.id}`) {
        score += 60;
      }

      // Semantic expansion boost
      if (expandedTerms.length > 0) {
        if (expandedTerms.some((t) => normTitle.includes(t) || normText.includes(t))) {
          score += 15;
        }
      }

      if (score > 0) {
        nawawiResults.push({
          id: item.id,
          title: item.title,
          text: item.text,
          narrator: item.narrator,
          source: item.source,
          score,
          dorarUrl: getDorarHadithUrl(item.text),
        });
      }
    }
  }
  nawawiResults.sort((a, b) => b.score - a.score);

  // 5. Search Seerah Milestones
  const seerahResults: SeerahSearchResult[] = [];
  const seerahData = seerahDataRaw as any;
  if (seerahData?.milestones) {
    for (const item of seerahData.milestones) {
      const normTitle = normalizeArabic(item.title || '');
      const normSummary = normalizeArabic(item.summary || '');
      const normLocation = normalizeArabic(item.location || '');
      const normEra = normalizeArabic(item.eraTitle || '');
      const normFigures = normalizeArabic((item.keyFigures || []).join(' '));
      const normLessons = normalizeArabic((item.lessons || []).join(' '));
      const normDetails = normalizeArabic((item.details || []).join(' '));

      let score = 0;
      if (normTitle.includes(normalizedQuery)) {
        score += 55;
      } else if (normSummary.includes(normalizedQuery)) {
        score += 40;
      } else if (queryTokens.every((t) => normTitle.includes(t) || normSummary.includes(t))) {
        score += 30;
      } else if (normFigures.includes(normalizedQuery) || normLocation.includes(normalizedQuery)) {
        score += 25;
      } else if (normLessons.includes(normalizedQuery) || normDetails.includes(normalizedQuery)) {
        score += 15;
      } else if (strippedTokens.some((st) => st.length >= 3 && (normTitle.includes(st) || normSummary.includes(st)))) {
        score += 15;
      }

      if (normEra.includes(normalizedQuery)) {
        score += 10;
      }

      // Semantic expansion boost
      if (expandedTerms.length > 0) {
        if (expandedTerms.some((t) => normTitle.includes(t) || normSummary.includes(t) || normLessons.includes(t))) {
          score += 15;
        }
      }

      if (score > 0) {
        seerahResults.push({
          id: item.id,
          order: item.order,
          eraId: item.eraId,
          eraTitle: item.eraTitle,
          title: item.title,
          hijriDate: item.hijriDate,
          location: item.location,
          category: item.category,
          summary: item.summary,
          lessons: item.lessons || [],
          keyFigures: item.keyFigures || [],
          score,
        });
      }
    }
  }
  seerahResults.sort((a, b) => b.score - a.score);

  // 6. Search Fake Hadiths
  const fakeResults: FakeHadithSearchResult[] = [];
  const fakeData = fakeDataRaw as any;
  if (fakeData?.hadiths) {
    for (const item of fakeData.hadiths) {
      const normText = normalizeArabic(item.hadithText || '');
      const normRuling = normalizeArabic(item.ruling || '');
      const normExpl = normalizeArabic(item.explanation || '');

      let score = 0;
      if (normText.includes(normalizedQuery)) {
        score += 50;
      } else if (queryTokens.every((t) => normText.includes(t))) {
        score += 30;
      } else if (strippedTokens.some((st) => st.length >= 3 && normText.includes(st))) {
        score += 15;
      }

      if (normRuling.includes(normalizedQuery) || normExpl.includes(normalizedQuery)) {
        score += 10;
      }

      if (score > 0) {
        fakeResults.push({
          id: item.id,
          hadithText: item.hadithText,
          ruling: item.ruling,
          explanation: item.explanation,
          dorarUrl: item.dorarUrl || getDorarHadithUrl(item.hadithText),
          score,
        });
      }
    }
  }
  fakeResults.sort((a, b) => b.score - a.score);

  // 7. Assemble Best Match (أقرب حديث بشرحه وفوائده + أقرب ذكر من حصن المسلم)
  let bestMatch: BestMatchSummary | undefined;
  if (hadeethResults.length > 0 || hisnResults.length > 0) {
    bestMatch = {
      hadith: hadeethResults[0],
      dhikr: hisnResults[0],
      situationTitle: matchedRule?.title || (hadeethResults[0] ? hadeethResults[0].title : undefined),
      guidanceText: matchedRule?.guidance,
    };
  }

  const totalCount =
    hadeethResults.length +
    hisnResults.length +
    nawawiResults.length +
    seerahResults.length +
    fakeResults.length;

  return {
    query,
    expandedTerms,
    totalCount,
    bestMatch,
    hadiths: hadeethResults,
    hisn: hisnResults,
    nawawi: nawawiResults,
    seerah: seerahResults,
    fake: fakeResults,
  };
}

// ================= HIGHLIGHTING COMPONENT =================
export interface HighlightArabicTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightArabicText({
  text,
  query,
  className = '',
}: HighlightArabicTextProps) {
  if (!text) return null;
  const cleanQ = query.trim();
  if (!cleanQ) return <span className={className}>{text}</span>;

  // Split tokens (>= 2 chars)
  const normTokens = cleanQ
    .split(/\s+/)
    .map((t) => normalizeArabic(t))
    .filter((t) => t.length >= 2);

  if (normTokens.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Regex based matching on normalized words
  try {
    const escaped = normTokens
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const regex = new RegExp(`(${escaped})`, 'gi');

    // Split preserving separators
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          const isMatch = normTokens.some((t) => normalizeArabic(part).includes(t));
          if (isMatch) {
            return (
              <mark
                key={index}
                className="bg-gold-accent/25 dark:bg-gold-accent-dark/30 text-charcoal-light dark:text-charcoal-dark font-semibold px-0.5 rounded-sm"
              >
                {part}
              </mark>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </span>
    );
  } catch {
    return <span className={className}>{text}</span>;
  }
}
