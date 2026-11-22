import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export type SmartCategory = 'fatwa' | 'hadith' | 'seerah' | 'quran' | 'adhkar';

export interface SmartQueryData {
  category: SmartCategory;
  categoryLabel: string;
  smartKeywords: string;
  hadithKeywords: string;
  suggestedKeywords: string[];
  poweredBy: 'ai' | 'local';
}

const CATEGORY_LABELS: Record<SmartCategory, string> = {
  fatwa: 'فتوى وفقه',
  hadith: 'حديث نبوي',
  seerah: 'السيرة النبوية',
  quran: 'القرآن والتفسير',
  adhkar: 'أذكار وأدعية',
};

function buildSystemPrompt(forcedCategory?: SmartCategory): string {
  let forcedSection = '';
  if (forcedCategory) {
    forcedSection = `
تنبيه حاسم وإلزامي:
المستخدم اختار صراحةً تصنيف "${forcedCategory}" (${CATEGORY_LABELS[forcedCategory]}).
يجب أن يكون حقل "category" في الـ JSON مساويًا تمامًا لـ "${forcedCategory}"، وحقل "categoryLabel" مساويًا لـ "${CATEGORY_LABELS[forcedCategory]}".
ويجب أن تكون جميع الكلمات ("smartKeywords" و"hadithKeywords" و"suggestedKeywords") مصممة خصيصًا وموجهة لمصادر هذا التصنيف وحده!
`;
  }

  return `أنت خبير محرك بحث متخصص في العلوم الشرعية والحديثية والفقهية والقرآنية والسيرة النبوية.
مهمتك الصارمة: تحويل استعلام المستخدم (سواء كان سؤالاً طويلاً بلهجة عامية، أو مسألة فقهية، أو مجرد كلمة واحدة مبهمة مثل "الغضب"، "الصدقة"، "السفر"، "الربا") إلى أدق مصطلحات بحثية فصيحة ومصفاة تعطي نتائج حقيقية ومباشرة في الموسوعات الإسلامية المتخصصة.

قواعد المعالجة الإلزامية:
1. السؤال المفصّل:
   - صُغ أدق 2 إلى 4 كلمات بحث فصيحة تطابق جوهر المسألة المطروحة بدقة.
   - احذف تماماً كل كلمات الحشو والعامية مثل: "حديث"، "ما حكم"، "هل يجوز"، "عايز"، "أعمل إيه"، "وش"، "سؤال"، "بيقول".

2. الكلمة الواحدة أو الاستعلام المبهم (مثل: "الغضب"، "الصدقة"، "السفر"، "الربا"):
   توجّه فورًا إلى أشهر نص شرعي أو أشهر مسألة يبحث عنها الناس في ذلك الباب بحسب التصنيف المختار:
   - في "hadith" (حديث نبوي): اختر أشهر متن حديث نبوي صحيح ثابت في الباب.
     (مثال: "الغضب" ← smartKeywords: "لا تغضب"، hadithKeywords: "لا تغضب"، suggestedKeywords: ["ليس الشديد بالصرعة", "إذا غضب أحدكم فليسكت", "الاستعاذة عند الغضب"])
     (مثال: "الصدقة" ← smartKeywords: "ما نقصت صدقة من مال"، suggestedKeywords: ["سبعة يظلهم الله رجل تصدق", "داووا مرضاكم بالصدقة", "صدقة السر تطفئ غضب الرب"])
   - في "fatwa" (فتوى وفقه): اختر أشهر مسألة فقهية أو حكم عملي يبحث عنه المسلمون في الموضوع.
     (مثال: "السفر" ← smartKeywords: "أحكام قصر الصلاة للمسافر"، suggestedKeywords: ["شروط الجمع والقصر في السفر", "مسافة القصر وضوابطها", "صيام المسافر ورخصه"])
     (مثال: "الغضب" ← smartKeywords: "حكم طلاق الغضبان"، suggestedKeywords: ["حكم اليمين في حالة الغضب", "أثر الغضب على التصرفات", "كفارة يمين الغضب"])
   - في "adhkar" (أذكار وأدعية): اختر أشهر ذكر أو دعاء مأثور في الباب.
     (مثال: "السفر" ← smartKeywords: "دعاء السفر سبحان الذي سخر"، suggestedKeywords: ["أذكار ركوب الدابة والسفر", "دعاء المسافر للمقيم", "دعاء الرجوع من السفر"])
     (مثال: "الغضب" ← smartKeywords: "أعوذ بالله من الشيطان عند الغضب", suggestedKeywords: ["دعاء الغضب والغيظ", "أذكار تسكين الغضب", "الوضوء لإطفاء الغضب"])
   - في "quran" (القرآن والتفسير): اختر أشهر آية أو موضوع قرآني في الباب.
     (مثال: "الغضب" ← smartKeywords: "والكاظمين الغيظ والعافين عن الناس", suggestedKeywords: ["تفسير آية الكاظمين الغيظ", "وإذا ما غضبوا هم يغفرون", "مغفرة الغضب في القرآن"])
     (مثال: "الربا" ← smartKeywords: "وأحل الله البيع وحرم الربا", suggestedKeywords: ["تفسير آيات الربا في البقرة", "يمحق الله الربا ويربي الصدقات", "فأذنوا بحرب من الله ورسوله"])
   - في "seerah" (السيرة النبوية): اختر أشهر موقف أو حدث نبوي شريف مرتبط بالكلمة.
     (مثال: "الغضب" ← smartKeywords: "موقف النبي عند الغضب لله", suggestedKeywords: ["حلم النبي وصبره على الأذى", "غضب النبي لانتهاك حرمات الله", "عفو النبي يوم فتح مكة"])

3. حظر تام لتأليف نصوص شرعية جديدة: مهمتك استخراج مفاتيح وكلمات بحث فصيحة ومحددة فقط.

${forcedSection}

التصنيفات المسموحة:
- "fatwa": فتاوى، فقه، أحكام العبادات والمعاملات، طهارة، صلاة، صيام، معاملات.
- "hadith": أحاديث نبوية، صحة حديث، رواة، تخريج متون.
- "seerah": السيرة النبوية والمغازي والوقائع التاريخية للعهد النبوي والصحابة.
- "quran": القرآن الكريم، السور، الآيات، التفسير، علوم القرآن.
- "adhkar": الأذكار المأثورة، الأدعية، أذكار اليوم والليلة، حصن المسلم.

يجب أن تجيب بكائن JSON صالح فقط بدون أي شرح أو هوامش بهذا الهيكل:
{
  "category": "fatwa | hadith | seerah | quran | adhkar",
  "categoryLabel": "فتوى وفقه | حديث نبوي | السيرة النبوية | القرآن والتفسير | أذكار وأدعية",
  "smartKeywords": "2 إلى 4 كلمات فصيحة مصفاة تمثل جوهر المسألة",
  "hadithKeywords": "2 إلى 3 كلمات مميزة من أصل متن الحديث أو الذكر بدون كلمة حديث",
  "suggestedKeywords": ["اقتراح بديل 1", "اقتراح بديل 2", "اقتراح بديل 3"]
}`;
}

function extractJsonFromText(rawText: string): any {
  if (!rawText) return null;
  const cleaned = rawText.trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // continue
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonStr);
    } catch {
      // continue
    }
  }

  return null;
}

function normalizeParsedData(
  parsed: any,
  rawQuery: string,
  poweredBy: 'ai' | 'local',
  forcedCategory?: SmartCategory
): SmartQueryData {
  const validCategories: SmartCategory[] = [
    'fatwa',
    'hadith',
    'seerah',
    'quran',
    'adhkar',
  ];
  let cat: SmartCategory = validCategories.includes(parsed.category)
    ? (parsed.category as SmartCategory)
    : 'hadith';

  if (forcedCategory && validCategories.includes(forcedCategory)) {
    cat = forcedCategory;
  }

  let smart = String(parsed.smartKeywords || '').trim();
  let hadith = String(parsed.hadithKeywords || parsed.smartKeywords || '').trim();

  // تنظيف الكلمات إذا أعاد الموديل نص السؤال الخام
  if (!smart || smart === rawQuery.trim()) {
    const fallback = localAnalyzeQuery(rawQuery, cat);
    smart = fallback.smartKeywords;
  }

  if (!hadith) {
    hadith = smart;
  }

  let suggestions: string[] = [];
  if (Array.isArray(parsed.suggestedKeywords)) {
    suggestions = parsed.suggestedKeywords
      .map((s: any) => String(s || '').trim())
      .filter((s: string) => s.length >= 2 && s !== smart)
      .slice(0, 3);
  }

  if (suggestions.length === 0) {
    const fallback = localAnalyzeQuery(rawQuery, cat);
    suggestions = fallback.suggestedKeywords;
  }

  return {
    category: cat,
    categoryLabel: CATEGORY_LABELS[cat],
    smartKeywords: smart,
    hadithKeywords: hadith,
    suggestedKeywords: suggestions,
    poweredBy,
  };
}

const COMMON_TOPIC_MAP: Record<
  string,
  Record<SmartCategory, { smart: string; hadith: string; suggestions: string[] }>
> = {
  غضب: {
    hadith: {
      smart: 'لا تغضب',
      hadith: 'لا تغضب',
      suggestions: ['ليس الشديد بالصرعة', 'إذا غضب أحدكم فليسكت', 'الاستعاذة عند الغضب'],
    },
    fatwa: {
      smart: 'حكم طلاق الغضبان',
      hadith: 'لا طلاق في إغلاق',
      suggestions: ['حكم اليمين في حالة الغضب', 'أثر الغضب على التصرفات', 'كفارة يمين الغضب'],
    },
    adhkar: {
      smart: 'أعوذ بالله من الشيطان عند الغضب',
      hadith: 'إني لأعلم كلمة لو قالها لذهب عنه ما يجد',
      suggestions: ['دعاء الغضب والغيظ', 'أذكار تسكين الغضب', 'الوضوء لإطفاء الغضب'],
    },
    quran: {
      smart: 'والكاظمين الغيظ والعافين عن الناس',
      hadith: 'والكاظمين الغيظ',
      suggestions: ['تفسير آية الكاظمين الغيظ', 'وإذا ما غضبوا هم يغفرون', 'مغفرة الغضب في القرآن'],
    },
    seerah: {
      smart: 'موقف النبي عند الغضب لله',
      hadith: 'ما انتقم رسول الله لنفسه',
      suggestions: ['حلم النبي وصبره على الأذى', 'غضب النبي لانتهاك محارم الله', 'عفو النبي يوم فتح مكة'],
    },
  },
  سفر: {
    hadith: {
      smart: 'السفر قطعة من العذاب',
      hadith: 'السفر قطعة من العذاب',
      suggestions: ['إذا سافرتم فاستأمروا', 'لا يحل لامرأة تسافر مسيرة يوم', 'سافروا تصحوا وتغنموا'],
    },
    fatwa: {
      smart: 'أحكام قصر الصلاة للمسافر',
      hadith: 'قصر الصلاة في السفر',
      suggestions: ['شروط الجمع والقصر في السفر', 'مسافة القصر وضوابطها', 'صيام المسافر ورخصه'],
    },
    adhkar: {
      smart: 'دعاء السفر سبحان الذي سخر',
      hadith: 'سبحان الذي سخر لنا هذا',
      suggestions: ['دعاء ركوب الدابة والسفر', 'دعاء المسافر للمقيم', 'دعاء الرجوع من السفر'],
    },
    quran: {
      smart: 'فمن كان منكم مريضا أو على سفر',
      hadith: 'رخصة السفر في القرآن',
      suggestions: ['تفسير آيات رخصة السفر', 'وإذا ضربتم في الأرض فليس عليكم جناح', 'قصر الصلاة في القرآن'],
    },
    seerah: {
      smart: 'هجرة النبي إلى المدينة المنورة',
      hadith: 'الهجرة النبوية الشريفة',
      suggestions: ['سفر الهجرة وغار ثور', 'رحلة الإسراء والمعراج', 'غزوة تبوك سفر العسرة'],
    },
  },
  صدقة: {
    hadith: {
      smart: 'ما نقصت صدقة من مال',
      hadith: 'ما نقصت صدقة من مال',
      suggestions: ['سبعة يظلهم الله رجل تصدق', 'داووا مرضاكم بالصدقة', 'صدقة السر تطفئ غضب الرب'],
    },
    fatwa: {
      smart: 'أحكام صدقة التطوع ومصارفها',
      hadith: 'مصارف الصدقة وأحكامها',
      suggestions: ['الفرق بين الزكاة والصدقة', 'فضل صدقة السر على العلن', 'الصدقة على الأقارب والفقراء'],
    },
    adhkar: {
      smart: 'دعاء المتصدق بالقبول والبركة',
      hadith: 'اللهم أعط منفقا خلفا',
      suggestions: ['دعاء إخراج الصدقة', 'دعاء البركة في المال', 'أذكار الإنفاق في سبيل الله'],
    },
    quran: {
      smart: 'مثل الذين ينفقون أموالهم في سبيل الله',
      hadith: 'الإنفاق في سبيل الله',
      suggestions: ['تفسير آيات الصدقة في سورة البقرة', 'يمحق الله الربا ويربي الصدقات', 'إن تبدوا الصدقات فنعما هي'],
    },
    seerah: {
      smart: 'صدقات الصحابة ونفقة عثمان في جيش العسرة',
      hadith: 'تصدق أبو بكر بماله كله',
      suggestions: ['جود النبي في رمضان كالريح المرسلة', 'تجهيز جيش العسرة بتبوك', 'وقف بئر رومة'],
    },
  },
  ربا: {
    hadith: {
      smart: 'لعن الله آكل الربا وموكله',
      hadith: 'آكل الربا وموكله وكاتبه وشاهديه',
      suggestions: ['اجتنبوا السبع الموبقات الشرك والربا', 'الربا ثلاثة وسبعون بابا', 'الذهب بالذهب ربا إلا هاء وهاء'],
    },
    fatwa: {
      smart: 'حكم الفوائد البنكية والمعاملات الربوية',
      hadith: 'تحريم الربا وأحكامه',
      suggestions: ['الفرق بين البيع والربا', 'شبهات الفوائد البنكية المعاصرة', 'حكم الاقتراض بالربا للضرورة'],
    },
    adhkar: {
      smart: 'دعاء الاستعاذة من الحرام وأكل الربا',
      hadith: 'اللهم اكفني بحلالك عن حرامك',
      suggestions: ['دعاء قضاء الدين', 'دعاء طلب الرزق الحلال', 'الاستعاذة من المأثم والمغرم'],
    },
    quran: {
      smart: 'وأحل الله البيع وحرم الربا',
      hadith: 'حرمة الربا في القرآن',
      suggestions: ['تفسير آيات الربا في سورة البقرة', 'يمحق الله الربا ويربي الصدقات', 'فأذنوا بحرب من الله ورسوله'],
    },
    seerah: {
      smart: 'إلغاء النبي ربا الجاهلية في خطبة الوداع',
      hadith: 'ألا وإن كل ربا موضوع وربا العباس',
      suggestions: ['خطبة حجة الوداع وتحريم الربا', 'تنظيم المعاملات المالية في المدينة', 'تحريم ربا الجاهلية'],
    },
  },
};

/**
 * تحليل محلي فوري فائق السرعة (< 5ms) عند غياب مفاتيح الـ AI
 */
function localAnalyzeQuery(rawQuery: string, forcedCategory?: SmartCategory): SmartQueryData {
  const q = rawQuery.trim();
  const lowerQ = q.toLowerCase();

  // فحص الكلمات الشهيرة في جدول المصطلحات الشائعة
  for (const [topic, map] of Object.entries(COMMON_TOPIC_MAP)) {
    if (lowerQ.includes(topic)) {
      const targetCat: SmartCategory = forcedCategory || (topic === 'غضب' ? 'hadith' : topic === 'سفر' ? 'fatwa' : topic === 'صدقة' ? 'hadith' : 'fatwa');
      const data = map[targetCat];
      return {
        category: targetCat,
        categoryLabel: CATEGORY_LABELS[targetCat],
        smartKeywords: data.smart,
        hadithKeywords: data.hadith,
        suggestedKeywords: data.suggestions,
        poweredBy: 'local',
      };
    }
  }

  // تنظيف عبارات البداية العامية والتساؤلية والكلمات العامة
  const cleanKeywords = q
    .replace(
      /^(هل\s+يجوز\s+لي|هل\s+يجوز|ما\s+حكم|حكم|هل\s+حرام|هل\s+يصح|وش\s+حكم|ايش\s+حكم|شو\s+حكم|ازاي|ازي|شلون|كيف|عايز\s+اعرف|اريد\s+ان\s+اعرف|ابغى\s+اعرف|ودي\s+اعرف|بدي\s+اعرف|سؤال\s+عن|ما\s+هي|ما\s+هو|متى\s+كان|متى\s+كانت|اين\s+وقعت|اين\s+وقع|الحديث\s+اللي\s+بيقول|الحديث\s+عن|حديث\s+عن|حديث)\s+/i,
      ''
    )
    .replace(/(حديث|ما\s+حكم|هل\s+يجوز|عايز\s+اعرف|أعمل\s+إيه|اعمل\s+ايه|سؤال)/gi, ' ')
    .replace(/[؟?.,!،؛"«»()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let category: SmartCategory = forcedCategory || 'hadith';

  if (!forcedCategory) {
    if (
      /(حكم|يجوز|حرام|حلال|مكروه|واجب|مستحب|بدعة|بدعه|صلاة|صلاه|صيام|رمضان|زكاة|زكاه|طهارة|طهاره|وضوء|غسل|تيمم|جنابة|جنابه|حيض|نفاس|طلاق|نكاح|زواج|مهر|خلع|عدة|عده|حجاب|نقاب|عورة|عوره|بيع|شراء|ربا|قرض|فائدة|فائده|يمين|كفارة|كفاره|نذر|حج|عمرة|عمره|أضحية|اضحيه|صيد|ذبح|تأمين|معاملات|فقه|فتوى|افتاء|إفتاء|نسيت\s+التشهد|سجود\s+السهو)/i.test(
        lowerQ
      )
    ) {
      category = 'fatwa';
    } else if (
      /(ذكر|اذكار|أذكار|دعاء|ادعية|أدعية|ورد|استغفار|تسبيح|تهليل|تحميد|حصن المسلم|سيد الاستغفار|صباح|مساء|نوم|استيقاظ|سفر|كرب|هم|حزن|قنوت)/i.test(
        lowerQ
      )
    ) {
      category = 'adhkar';
    } else if (
      /(قرآن|قران|مصحف|سورة|سوره|آية|ايه|تفسير|معنى قوله|سبب نزول|تجويد|الكرسي|الفاتحة|البقرة|الكهف|يس|تبارك|الملك|الكوثر|الإخلاص|الفلق|الناس)/i.test(
        lowerQ
      )
    ) {
      category = 'quran';
    } else if (
      /(سيرة|سيره|نبي|رسول|مصطفى|غزوة|غزوه|سرية|سريه|بدر|أحد|احد|الخندق|حنين|تبوك|مؤتة|موته|خيبر|فتح مكة|الحديبية|الحديبيه|الهجرة|الهجره|بيعة|بيعه|العقبة|عام الفيل|حجة الوداع|الرحيق المختوم|الصحابة|الصحابه|أبو بكر|ابو بكر|عمر بن الخطاب|عثمان بن عفان|علي بن أبي طالب|خديجة|عائشة|فاطمة|حمزة|خالد بن الوليد)/i.test(
        lowerQ
      )
    ) {
      category = 'seerah';
    } else if (
      /(صحيح|ضعيف|مكذوب|موضوع|لا يصح|أخرجه|اخرجه|رواه|البخاري|مسلم|الترمذي|النسائي|أبو داود|ابن ماجه|الدرر السنية|متن|إسناد|اسناد|راوي|تخريج|تبسمك|الصدقة)/i.test(
        lowerQ
      )
    ) {
      category = 'hadith';
    } else if (/^(هل|ما\s+حكم|كيف|أين|اين)/.test(q)) {
      category = 'fatwa';
    }
  }

  const words = cleanKeywords.split(/\s+/).filter((w) => w.length >= 2);
  const core = words.slice(0, 4).join(' ') || q;

  let smartKeywords = core;
  let hadithKeywords = words.slice(0, 3).join(' ') || core;
  let suggestedKeywords: string[] = [];

  if (category === 'fatwa') {
    smartKeywords = words.length === 1 ? `أحكام ${core}` : core;
    suggestedKeywords = [
      `حكم ${core}`,
      `مسائل فقهية في ${words.slice(0, 2).join(' ')}`,
      `فتاوى ${core}`,
    ];
  } else if (category === 'hadith') {
    smartKeywords = core;
    suggestedKeywords = [
      `تخريج حديث ${core}`,
      `صحة حديث ${words.slice(0, 2).join(' ')}`,
      `روايات ${core}`,
    ];
  } else if (category === 'seerah') {
    smartKeywords = words.length === 1 ? `موقف النبي في ${core}` : core;
    suggestedKeywords = [
      `أحداث ${core} في السيرة`,
      `هدي النبي في ${words.slice(0, 2).join(' ')}`,
      `دروس وعبر ${core}`,
    ];
  } else if (category === 'quran') {
    smartKeywords = words.length === 1 ? `آيات ${core}` : core;
    suggestedKeywords = [
      `تفسير آيات ${core}`,
      `معاني ${words.slice(0, 2).join(' ')} في القرآن`,
      `أسباب نزول ${core}`,
    ];
  } else {
    smartKeywords = words.length === 1 ? `دعاء وذكر ${core}` : core;
    suggestedKeywords = [
      `فضل ${core}`,
      `أدعية مأثورة في ${words.slice(0, 2).join(' ')}`,
      `أذكار ${core}`,
    ];
  }

  return {
    category,
    categoryLabel: CATEGORY_LABELS[category],
    smartKeywords,
    hadithKeywords,
    suggestedKeywords,
    poweredBy: 'local',
  };
}

/**
 * 1. استدعاء Groq مع دعم forcedCategory
 */
async function callGroqForSmartQuery(
  apiKey: string,
  modelName: string,
  query: string,
  timeoutMs: number,
  forcedCategory?: SmartCategory
): Promise<SmartQueryData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const userPrompt = forcedCategory
      ? `سؤال المستخدم: "${query}"\nالتصنيف المطلوب حصرًا: "${forcedCategory}" (${CATEGORY_LABELS[forcedCategory]})`
      : `سؤال المستخدم: "${query}"`;

    const payload: any = {
      model: modelName,
      messages: [
        { role: 'system', content: buildSystemPrompt(forcedCategory) },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 600,
    };

    if (modelName.includes('gpt-oss') || modelName.includes('openai')) {
      payload.reasoning_effort = 'low';
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (payload.reasoning_effort) {
        delete payload.reasoning_effort;
        const retryRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryContent = retryData?.choices?.[0]?.message?.content;
          const retryParsed = extractJsonFromText(retryContent);
          if (retryParsed && (retryParsed.category || forcedCategory) && retryParsed.smartKeywords) {
            return normalizeParsedData(retryParsed, query, 'ai', forcedCategory);
          }
        }
      }
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = extractJsonFromText(content);
    if (!parsed || (!parsed.category && !forcedCategory) || !parsed.smartKeywords) {
      return null;
    }

    return normalizeParsedData(parsed, query, 'ai', forcedCategory);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 2. استدعاء Gemini كاحتياطي ثانٍ ذكي مع دعم forcedCategory
 */
async function callGeminiForSmartQuery(
  apiKey: string,
  modelName: string,
  query: string,
  timeoutMs: number,
  forcedCategory?: SmartCategory
): Promise<SmartQueryData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const userPrompt = forcedCategory
      ? `سؤال المستخدم: "${query}"\nالتصنيف المطلوب حصرًا: "${forcedCategory}" (${CATEGORY_LABELS[forcedCategory]})\nأجب بكائن JSON صالح فقط:`
      : `سؤال المستخدم: "${query}"\nأجب بكائن JSON صالح فقط:`;

    const prompt = `${buildSystemPrompt(forcedCategory)}\n\n${userPrompt}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 600,
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: 'minimal',
          },
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const fallbackRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 600,
          },
        }),
        signal: controller.signal,
      });

      if (!fallbackRes.ok) return null;
      const fallbackData = await fallbackRes.json();
      const fallbackText = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text;
      const fallbackParsed = extractJsonFromText(fallbackText);
      if (fallbackParsed && (fallbackParsed.category || forcedCategory) && fallbackParsed.smartKeywords) {
        return normalizeParsedData(fallbackParsed, query, 'ai', forcedCategory);
      }
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = extractJsonFromText(text);
    if (!parsed || (!parsed.category && !forcedCategory) || !parsed.smartKeywords) {
      return null;
    }

    return normalizeParsedData(parsed, query, 'ai', forcedCategory);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const forcedCategory = (
      ['fatwa', 'hadith', 'seerah', 'quran', 'adhkar'].includes(body?.forcedCategory)
    )
      ? (body.forcedCategory as SmartCategory)
      : undefined;

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // 1. تجربة Groq أولاً
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
      const primaryResult = await callGroqForSmartQuery(groqKey, primaryModel, query, 5000, forcedCategory);
      if (primaryResult) {
        return NextResponse.json(primaryResult);
      }

      const backupModel = 'openai/gpt-oss-20b';
      const backupResult = await callGroqForSmartQuery(groqKey, backupModel, query, 4000, forcedCategory);
      if (backupResult) {
        return NextResponse.json(backupResult);
      }
    }

    // 2. تجربة Gemini كاحتياطي ثانٍ ذكي
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
      const geminiResult = await callGeminiForSmartQuery(geminiKey, geminiModel, query, 5000, forcedCategory);
      if (geminiResult) {
        return NextResponse.json(geminiResult);
      }

      const geminiBackupResult = await callGeminiForSmartQuery(geminiKey, 'gemini-2.5-flash', query, 4000, forcedCategory);
      if (geminiBackupResult) {
        return NextResponse.json(geminiBackupResult);
      }
    }

    // 3. البديل المحلي الفوري الصارم (< 5 مللي ثانية)
    const localResult = localAnalyzeQuery(query, forcedCategory);
    return NextResponse.json(localResult);
  } catch {
    return NextResponse.json(localAnalyzeQuery('السنة النبوية'));
  }
}
