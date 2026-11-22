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

const SYSTEM_PROMPT = `أنت خبير محرك بحث متخصص في العلوم الشرعية والحديثية والفقهية.
مهمتك الصارمة: تحويل سؤال المستخدم (سواء كان بلهجة عامية، أو ركيكاً، أو يحكي قصة حديث، أو فيه خطأ إملائي) إلى أدق مصطلحات بحثية فصيحة ومصفاة تعطي نتائج حقيقية ومباشرة في الموسوعة الحديثية (الدرر السنية) ومواقع الفتاوى المعتمدة.

قواعد إلزامية صارمة:
1. يُمنع منعًا باتًا نسخ جملة المستخدم كما هي!
2. يُمنع منعًا باتًا الإبقاء على كلمات الحشو والعامية مثل: "حديث"، "ما حكم"، "هل يجوز"، "عايز"، "أعمل إيه"، "وش"، "سؤال"، "بيقول".
3. استخرج جوهر المسألة فقط بصيغة مركّزة ودقيقة في علم الفقه أو متون الأحاديث.
4. حظر تام لتوليد أي فتوى أو حكم أو آية أو متن جديد: وظيفتك استخراج كلمات بحث فقط.

التصنيفات المسموحة:
- "fatwa": فتاوى، فقه، أحكام العبادات والمعاملات، طهارة، صلاة، صيام، معاملات.
- "hadith": أحاديث نبوية، صحة حديث، رواة، تخريج متون.
- "seerah": السيرة النبوية والمغازي والوقائع التاريخية للعهد النبوي والصحابة.
- "quran": القرآن الكريم، السور، الآيات، التفسير، علوم القرآن.
- "adhkar": الأذكار المأثورة، الأدعية، أذكار اليوم والليلة، حصن المسلم.

أمثلة مرجعية واجب اتباع منهجها:
- المدخل: "لو نسيت التشهد الأوسط أعمل إيه"
  النتيجة: {"category": "fatwa", "categoryLabel": "فتوى وفقه", "smartKeywords": "نسيان التشهد الأوسط سجود السهو", "hadithKeywords": "التشهد الأول سجود السهو", "suggestedKeywords": ["سجود السهو التشهد الأول", "حكم ترك التشهد الأوسط", "صفة سجود السهو"]}
- المدخل: "الحديث اللي بيقول الابتسامة صدقة"
  النتيجة: {"category": "hadith", "categoryLabel": "حديث نبوي", "smartKeywords": "تبسمك في وجه أخيك صدقة", "hadithKeywords": "تبسمك في وجه أخيك", "suggestedKeywords": ["تبسمك في وجه أخيك", "فضل الابتسامة في السنة", "تبسمك صدقة تخريج"]}
- المدخل: "غزوة بدر متى كانت ومين استشهد فيها"
  النتيجة: {"category": "seerah", "categoryLabel": "السيرة النبوية", "smartKeywords": "تاريخ غزوة بدر شهداء بدر", "hadithKeywords": "يوم بدر الفرقان", "suggestedKeywords": ["تاريخ غزوة بدر الكبرى", "شهداء غزوة بدر", "أحداث غزوة بدر"]}
- المدخل: "تفسير آية الكرسي ومعنى القيوم"
  النتيجة: {"category": "quran", "categoryLabel": "القرآن والتفسير", "smartKeywords": "تفسير آية الكرسي الحي القيوم", "hadithKeywords": "الله لا إله إلا هو الحي القيوم", "suggestedKeywords": ["تفسير آية الكرسي السعدي", "معنى اسم الله القيوم", "فضل آية الكرسي"]}
- المدخل: "دعاء الهم والحزن اللي يريح القلب"
  النتيجة: {"category": "adhkar", "categoryLabel": "أذكار وأدعية", "smartKeywords": "دعاء الهم والحزن والكرب", "hadithKeywords": "اللهم إني أعوذ بك من الهم والحزن", "suggestedKeywords": ["أذكار تفريج الكرب", "دعاء الهم والغم والحزن", "سيد الاستغفار"]}

يجب أن تجيب بصيغة JSON فقط بهذا الهيكل:
{
  "category": "fatwa | hadith | seerah | quran | adhkar",
  "categoryLabel": "فتوى وفقه | حديث نبوي | السيرة النبوية | القرآن والتفسير | أذكار وأدعية",
  "smartKeywords": "2 إلى 4 كلمات فصيحة مصفاة تمثل جوهر المسألة",
  "hadithKeywords": "2 إلى 3 كلمات مميزة من أصل متن الحديث أو الذكر بدون كلمة حديث",
  "suggestedKeywords": ["اقتراح بديل 1", "اقتراح بديل 2", "اقتراح بديل 3"]
}`;

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
  poweredBy: 'ai' | 'local'
): SmartQueryData {
  const validCategories: SmartCategory[] = [
    'fatwa',
    'hadith',
    'seerah',
    'quran',
    'adhkar',
  ];
  const cat = validCategories.includes(parsed.category)
    ? (parsed.category as SmartCategory)
    : 'hadith';

  let smart = String(parsed.smartKeywords || '').trim();
  let hadith = String(parsed.hadithKeywords || parsed.smartKeywords || '').trim();

  // تنظيف الكلمات إذا أعاد الموديل نص السؤال الخام
  if (!smart || smart === rawQuery.trim()) {
    const fallback = localAnalyzeQuery(rawQuery);
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
    const fallback = localAnalyzeQuery(rawQuery);
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

/**
 * تحليل محلي فوري فائق السرعة (< 5ms) عند غياب مفاتيح الـ AI
 */
function localAnalyzeQuery(rawQuery: string): SmartQueryData {
  const q = rawQuery.trim();
  const lowerQ = q.toLowerCase();

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

  let category: SmartCategory = 'hadith';

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

  const words = cleanKeywords.split(/\s+/).filter((w) => w.length >= 2);
  const core = words.slice(0, 4).join(' ') || q;

  const smartKeywords = core;
  const hadithKeywords = words.slice(0, 3).join(' ') || core;
  let suggestedKeywords: string[] = [];

  if (category === 'fatwa') {
    suggestedKeywords = [
      `حكم ${core}`,
      `مسألة ${words.slice(0, 2).join(' ')}`,
      `فتاوى ${core}`,
    ];
  } else if (category === 'hadith') {
    suggestedKeywords = [
      `تخريج ${core}`,
      `صحة حديث ${words.slice(0, 2).join(' ')}`,
      `روايات ${core}`,
    ];
  } else if (category === 'seerah') {
    suggestedKeywords = [
      `أحداث ${core}`,
      `تاريخ ${words.slice(0, 2).join(' ')}`,
      `دروس وعبر ${core}`,
    ];
  } else if (category === 'quran') {
    suggestedKeywords = [
      `تفسير ${core}`,
      `معاني ${words.slice(0, 2).join(' ')}`,
      `أسباب نزول ${core}`,
    ];
  } else {
    suggestedKeywords = [
      `فضل ${core}`,
      `صيغة ${words.slice(0, 2).join(' ')}`,
      `أدعية وأذكار ${core}`,
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
 * 1. استدعاء Groq مع رفع max_tokens إلى 600 وإتاحة التفكير الخفيف
 */
async function callGroqForSmartQuery(
  apiKey: string,
  modelName: string,
  query: string,
  timeoutMs: number
): Promise<SmartQueryData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: any = {
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `سؤال المستخدم: "${query}"` },
      ],
      temperature: 0.1,
      max_tokens: 600,
    };

    // إضافة reasoning_effort لموديلات gpt-oss
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
      // محاولة سريعة بدون reasoning_effort إذا أعاد السيرفر 400
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
          if (retryParsed && retryParsed.category && retryParsed.smartKeywords) {
            return normalizeParsedData(retryParsed, query, 'ai');
          }
        }
      }
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = extractJsonFromText(content);
    if (!parsed || !parsed.category || !parsed.smartKeywords) {
      return null;
    }

    return normalizeParsedData(parsed, query, 'ai');
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 2. استدعاء Gemini كاحتياطي ثانٍ ذكي
 */
async function callGeminiForSmartQuery(
  apiKey: string,
  modelName: string,
  query: string,
  timeoutMs: number
): Promise<SmartQueryData | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const prompt = `${SYSTEM_PROMPT}\n\nسؤال المستخدم: "${query}"\nأجب بكائن JSON صالح فقط:`;
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
      // محاولة بديلة دون thinkingConfig إذا رفض الموديل المعامل
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
      if (fallbackParsed && fallbackParsed.category && fallbackParsed.smartKeywords) {
        return normalizeParsedData(fallbackParsed, query, 'ai');
      }
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = extractJsonFromText(text);
    if (!parsed || !parsed.category || !parsed.smartKeywords) {
      return null;
    }

    return normalizeParsedData(parsed, query, 'ai');
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

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // 1. تجربة Groq أولاً
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
      const primaryResult = await callGroqForSmartQuery(groqKey, primaryModel, query, 5000);
      if (primaryResult) {
        return NextResponse.json(primaryResult);
      }

      const backupModel = 'openai/gpt-oss-20b';
      const backupResult = await callGroqForSmartQuery(groqKey, backupModel, query, 4000);
      if (backupResult) {
        return NextResponse.json(backupResult);
      }
    }

    // 2. تجربة Gemini كاحتياطي ثانٍ ذكي
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
      const geminiResult = await callGeminiForSmartQuery(geminiKey, geminiModel, query, 5000);
      if (geminiResult) {
        return NextResponse.json(geminiResult);
      }

      // تجربة gemini-2.5-flash
      const geminiBackupResult = await callGeminiForSmartQuery(geminiKey, 'gemini-2.5-flash', query, 4000);
      if (geminiBackupResult) {
        return NextResponse.json(geminiBackupResult);
      }
    }

    // 3. البديل المحلي الفوري الصارم (< 5 مللي ثانية)
    const localResult = localAnalyzeQuery(query);
    return NextResponse.json(localResult);
  } catch {
    return NextResponse.json(localAnalyzeQuery('السنة النبوية'));
  }
}
