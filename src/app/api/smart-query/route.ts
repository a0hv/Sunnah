import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export type SmartCategory = 'fatwa' | 'hadith' | 'seerah' | 'quran' | 'adhkar';

export interface SmartQueryData {
  category: SmartCategory;
  categoryLabel: string;
  smartKeywords: string;
  hadithKeywords: string;
}

const CATEGORY_LABELS: Record<SmartCategory, string> = {
  fatwa: 'فتوى وفقه',
  hadith: 'حديث نبوي',
  seerah: 'السيرة النبوية',
  quran: 'القرآن والتفسير',
  adhkar: 'أذكار وأدعية',
};

/**
 * تحليل محلي فوري فائق السرعة (< 5ms) لتصنيف السؤال واستخراج الكلمات المفتاحية
 * يعمل كبديل تلقائي عند غياب مفتاح Groq أو تأخر الاستجابة
 */
function localAnalyzeQuery(rawQuery: string): SmartQueryData {
  const q = rawQuery.trim();
  const lowerQ = q.toLowerCase();

  // تنظيف عبارات البداية العامية والتساؤلية
  const cleanKeywords = q
    .replace(
      /^(هل\s+يجوز\s+لي|هل\s+يجوز|ما\s+حكم|حكم|هل\s+حرام|هل\s+يصح|وش\s+حكم|ايش\s+حكم|شو\s+حكم|ازاي|ازي|شلون|كيف|عايز\s+اعرف|اريد\s+ان\s+اعرف|ابغى\s+اعرف|ودي\s+اعرف|بدي\s+اعرف|سؤال\s+عن|ما\s+هي|ما\s+هو|متى\s+كان|متى\s+كانت|اين\s+وقعت|اين\s+وقع)\s+/i,
      ''
    )
    .replace(/[؟?.,!،؛"«»()]+/g, ' ')
    .trim();

  // تحديد التصنيف
  let category: SmartCategory = 'hadith';

  if (
    /(حكم|يجوز|حرام|حلال|مكروه|واجب|مستحب|بدعة|بدعه|صلاة|صلاه|صيام|رمضان|زكاة|زكاه|طهارة|طهاره|وضوء|غسل|تيمم|جنابة|جنابه|حيض|نفاس|طلاق|نكاح|زواج|مهر|خلع|عدة|عده|حجاب|نقاب|عورة|عوره|بيع|شراء|ربا|قرض|فائدة|فائده|يمين|كفارة|كفاره|نذر|حج|عمرة|عمره|أضحية|اضحيه|صيد|ذبح|تأمين|معاملات|فقه|فتوى|افتاء|إفتاء)/i.test(
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
    /(حديث|حديثه|صحيح|ضعيف|مكذوب|موضوع|لا يصح|أخرجه|اخرجه|رواه|البخاري|مسلم|الترمذي|النسائي|أبو داود|ابن ماجه|الدرر السنية|متن|إسناد|اسناد|راوي|تخريج)/i.test(
      lowerQ
    )
  ) {
    category = 'hadith';
  } else if (/^(هل|ما\s+حكم|كيف|أين|اين)/.test(q)) {
    category = 'fatwa';
  }

  // استخراج 2 إلى 4 كلمات جوهرية
  const words = cleanKeywords.split(/\s+/).filter((w) => w.length >= 2);
  const smartWords = words.slice(0, 4);
  const smartKeywords = smartWords.join(' ') || q;

  // استخراج 2 إلى 3 كلمات للمتون
  const hadithKeywords = words.slice(0, 3).join(' ') || smartKeywords;

  return {
    category,
    categoryLabel: CATEGORY_LABELS[category],
    smartKeywords,
    hadithKeywords,
  };
}

/**
 * استدعاء Groq لتصنيف السؤال واستخراج كلمات البحث الفصيحة فقط
 * صفر توليد فتاوى أو أحكام أو آيات أو أحاديث
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
    const systemPrompt = `أنت مصنف ذكي لمحرك بحث في العلوم الشرعية والسنة النبوية.
مهمتك الوحيدة: تصنيف سؤال المستخدم إلى أحد التصنيفات الخمسة التالية، واستخراج كلمات بحث عربية فصيحة وموجزة من السؤال نفسه.
يُمنع منعًا باتًا توليد أي فتوى أو حكم فقهي أو متن حديث أو آية قرآنية.

التصنيفات المسموحة فقط:
- "fatwa": فتاوى، فقه، أحكام العبادات والمعاملات، الحلال والحرام، هل يجوز، ما حكم.
- "hadith": أحاديث نبوية، صحة حديث، رواة، تخريج، أسانيد.
- "seerah": السيرة النبوية، مغازي النبي ﷺ، الصحابة، أحداث تاريخ الإسلام النبوي.
- "quran": القرآن الكريم، السور، الآيات، التفسير، علوم القرآن.
- "adhkar": الأذكار، الأدعية المأثورة، حصن المسلم، أذكار اليوم والليلة.

يجب أن ترجع JSON فقط بدون أي نص إضافي أو علامات markdown بالصيغة التالية:
{
  "category": "fatwa" | "hadith" | "seerah" | "quran" | "adhkar",
  "categoryLabel": "فتوى وفقه" | "حديث نبوي" | "السيرة النبوية" | "القرآن والتفسير" | "أذكار وأدعية",
  "smartKeywords": "2 إلى 4 كلمات فصيحة دقيقة تمثل جوهر السؤال للبحث",
  "hadithKeywords": "2 إلى 3 كلمات مميزة للبحث في متون الأحاديث"
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `السؤال: ${query}` },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed || !parsed.category || !parsed.smartKeywords) {
      return null;
    }

    const validCategories: SmartCategory[] = ['fatwa', 'hadith', 'seerah', 'quran', 'adhkar'];
    const cat = validCategories.includes(parsed.category) ? (parsed.category as SmartCategory) : 'hadith';

    return {
      category: cat,
      categoryLabel: CATEGORY_LABELS[cat],
      smartKeywords: String(parsed.smartKeywords || '').trim() || query,
      hadithKeywords: String(parsed.hadithKeywords || parsed.smartKeywords || '').trim() || query,
    };
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

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const primaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
      const backupModel = 'openai/gpt-oss-20b';

      // المحاولة الأولى: الموديل الأساسي (مهلة 5 ثوانٍ)
      const primaryResult = await callGroqForSmartQuery(groqKey, primaryModel, query, 5000);
      if (primaryResult) {
        return NextResponse.json(primaryResult);
      }

      // المحاولة الثانية: الموديل الاحتياطي السريع (مهلة 3 ثوانٍ)
      const backupResult = await callGroqForSmartQuery(groqKey, backupModel, query, 3000);
      if (backupResult) {
        return NextResponse.json(backupResult);
      }
    }

    // البديل المحلي الفوري الصارم في أقل من 5 مللي ثانية
    const localResult = localAnalyzeQuery(query);
    return NextResponse.json(localResult);
  } catch {
    return NextResponse.json(localAnalyzeQuery('السنة النبوية'));
  }
}
