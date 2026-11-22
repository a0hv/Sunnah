import { NextResponse } from 'next/server';
import {
  retrieveVerifiedContext,
  isConversationalOrGreeting,
  normalizeArabic,
  AssistantSearchMode,
} from '@/lib/rag';
import { queryDorarApi, extractDistinctiveHadithKeywords } from '@/lib/dorar-api';
import { sanitizeQuranQuotes } from '@/lib/quran-guard';
import {
  buildSystemInstruction,
  OUT_OF_SCOPE_APOLOGY,
  isOutOfScopeReply,
  stripOutOfScopeTag,
  isExplicitlyNonReligiousQuery,
} from '@/lib/assistant-persona';

// أقصى مدة استجابة للمسار 30 ثانية لتسريع الإجابة وتجنب التعليق على Vercel
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

interface ExternalSourceLink {
  name: string;
  badge: string;
  url: string;
}

const SYSTEM_INSTRUCTION = buildSystemInstruction();

// قائمة الألفاظ البذيئة والشتائم لحماية المنصة بشكل حتمي
const ABUSIVE_WORDS = new Set([
  'كلب', 'حمار', 'غبي', 'احمق', 'سفيه', 'لعنك', 'يلعن', 'قذر', 'وسخ', 'تافه', 'حقير', 'حيوان', 'زفت',
  'شرموط', 'شرموطه', 'عاهر', 'عاهره', 'قحبه', 'عرص', 'طيز', 'كس', 'زب', 'منيوك', 'منيك'
]);

function isAbusiveMessage(text: string): boolean {
  if (!text) return false;
  const norm = text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();

  if (
    norm.includes('ابن الكلب') ||
    norm.includes('ابن كلب') ||
    norm.includes('يا حمار') ||
    norm.includes('يا كلب') ||
    norm.includes('يا غبي') ||
    norm.includes('يا وسخ') ||
    norm.includes('يا تافه') ||
    norm.includes('يا حيوان') ||
    norm.includes('يا زفت') ||
    norm.includes('يلعن دينك') ||
    norm.includes('يلعنك')
  ) {
    return true;
  }

  const tokens = norm.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/);
  return tokens.some((t) => ABUSIVE_WORDS.has(t));
}

function isIdentityQuestion(text: string): boolean {
  const norm = normalizeArabic(text);
  const patterns = [
    /^(من انت|مين انت|انت مين|اي نموذج انت|ما هو نموذجك|ما اسمك|شو اسمك|ما انت|اي موديل انت)/,
    /^(هل انت (روبوت|ذكاء اصطناعي|انسان|شات|بوت))/,
    /\b(انت chatgpt|انت gpt|انت شات جي بي تي|اي نموذج انت|ما هو نموذجك|من برمجك|من صنعك|ما هذا الموقع|ما هذه المنصه)\b/,
  ];
  return (
    patterns.some((p) => p.test(norm)) ||
    norm.includes('اي نموذج انت') ||
    norm.includes('ما هو نموذجك') ||
    norm.includes('اي موديل انت') ||
    norm.includes('من انت') ||
    norm.includes('مين انت') ||
    norm.includes('شات جي بي تي') ||
    norm.includes('chatgpt')
  );
}

function isGibberishOrReaction(text: string): boolean {
  const norm = normalizeArabic(text);
  if (/^و+ا+و+$/.test(norm)) return true;
  if (/^ه+([اإأ]ه+|ه+)+$/.test(norm)) return true;
  if (/^([اإأ]ه+|اها|اوك|اوكي|تمام|ماشي|حسنا|طيب|ممتاز|جميل|حلو)$/.test(norm)) return true;
  if (/^(.)\1{3,}$/.test(norm.replace(/\s+/g, ''))) return true;
  return false;
}

function stripUnsolicitedSalam(reply: string, userMessage: string): string {
  if (!reply) return reply;
  const normUser = normalizeArabic(userMessage);
  const userSaidSalam = normUser.includes('سلام') || normUser.includes('السلام');
  if (userSaidSalam) return reply;

  return reply
    .replace(
      /^\s*(?:وعليكم\s+السلام(?:\s+ورحمة\s+الله(?:\s+وبركاته)?)?|اهلا\s+وسهلا\s+بك\s+وعليكم\s+السلام)[!.,،؛:\s]*/i,
      ''
    )
    .trim();
}

function sanitizeFinalReply(reply: string, userMessage: string): string {
  if (!reply) return reply;
  // 1. فلتر حماية القرآن الإجباري (حذف الآيات المختلقة والإحالة وعبارة قال تعالى)
  let cleaned = sanitizeQuranQuotes(reply);

  // 2. إزالة وعليكم السلام إذا لم يلق المستخدم السلام صراحة
  cleaned = stripUnsolicitedSalam(cleaned, userMessage);

  // 3. حظر ذكر ChatGPT / OpenAI / GPT-4 وتأكيد هوية الباحث في السنة
  cleaned = cleaned
    .replace(/\b(ChatGPT|GPT-4o?|GPT-3\.5|OpenAI)\b/gi, 'الباحث في السنة')
    .replace(/شات\s*جي\s*بي\s*تي/g, 'الباحث في السنة');

  // 4. حذف الوسم الخفي [OUT_OF_SCOPE] من نص الرد المعروض
  cleaned = stripOutOfScopeTag(cleaned);

  return cleaned.trim();
}

export async function POST(req: Request) {
  const requestStart = Date.now();

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'صيغة الطلب غير صالحة (Invalid JSON)', errorCode: 'INVALID_JSON' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const message: string =
      (typeof body.message === 'string' && body.message) ||
      (Array.isArray(body.messages) && typeof body.messages[body.messages.length - 1]?.content === 'string'
        ? body.messages[body.messages.length - 1].content
        : '');

    const history: ChatMessage[] =
      Array.isArray(body.history)
        ? body.history
        : Array.isArray(body.messages)
        ? body.messages.slice(0, -1)
        : [];

    if (!message || message.trim().length < 2) {
      return NextResponse.json(
        { error: 'يرجى إدخال نص بحث أو سؤال لا يقل عن حرفين', errorCode: 'EMPTY_QUERY' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const mode = (typeof body.mode === 'string' ? body.mode : 'all') as AssistantSearchMode;
    const trimmedMessage = message.trim().slice(0, 500);

    // التحقق الحتمي المباشر من الألفاظ النابية والإساءة
    if (isAbusiveMessage(trimmedMessage)) {
      return NextResponse.json(
        {
          success: true,
          reply: 'أرجو الالتزام بأدب الحديث، هذه المنصة مخصصة لخدمة السنة النبوية والعلوم الشرعية.',
          engineUsed: 'fallback',
          latencyMs: Date.now() - requestStart,
          sources: [],
          externalSources: [],
          dorarUrl: '',
          hasGroqKey: Boolean(process.env.GROQ_API_KEY?.trim()),
          hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
          isFakeWarning: false,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const isIdentity = isIdentityQuestion(trimmedMessage);
    const isGibberish = isGibberishOrReaction(trimmedMessage);
    const isGreetingOrChat = isConversationalOrGreeting(trimmedMessage) || isIdentity || isGibberish;
    const isExplicitlyNonReligious = isExplicitlyNonReligiousQuery(trimmedMessage);
    const isNonKnowledge = isGreetingOrChat || isIdentity || isGibberish || isExplicitlyNonReligious;

    // 1. الاسترجاع المعزز الموثّق (RAG) من قواعد بيانات المنصة المحلية حسب النطاق المختار
    const ragResult = retrieveVerifiedContext(trimmedMessage, mode);

    // 2. التحقق من جاهزية API الدرر السنية (في حال تم تفعيل المفتاح)
    const dorarResults = await queryDorarApi(trimmedMessage);

    // دمج نتائج الدرر السنية إن وُجدت
    let fullContext = ragResult.contextText;
    if (dorarResults && dorarResults.length > 0) {
      const dorarBlock = dorarResults
        .slice(0, 3)
        .map(
          (d) =>
            `[حديث من الموسوعة الحديثية — الدرر السنية]\n` +
            `المتن: «${d.hadith}»\n` +
            `الراوي: ${d.rawi} | المحدث: ${d.muhaddith} | المصدر: ${d.book} (${d.numberOrPage})\n` +
            `الحكم: ${d.grade}`
        )
        .join('\n\n');
      fullContext = fullContext ? `${fullContext}\n\n---\n\n${dorarBlock}` : dorarBlock;
    }

    // إخفاء المصادر غير الملائمة إذا كانت الرسالة مجرد تحية أو دردشة عادية أو سؤال هوية أو غير دينية
    let returnedSources = isNonKnowledge ? [] : ragResult.sources;

    // هل السؤال يخص الحديث الشريف أو التثبّت أو الأذكار أو الأدعية؟
    const normMsg = normalizeArabic(trimmedMessage);
    const isHadithOrAdhkar =
      mode === 'hadith' ||
      mode === 'adhkar' ||
      ragResult.isFakeWarning ||
      Boolean(ragResult.matchedHadithText) ||
      ragResult.sources.some(
        (s) => s.type === 'hisn' || s.type === 'nawawi' || s.type === 'fake-hadith'
      ) ||
      /(حديث|احاديث|صحه حديث|صحيح|ضعيف|موضوع|مكذوب|رواه|سند|اسناد|تخريج|البخاري|مسلم|الترمذي|الالباني|ابن باز|ابن عثيمين|ذكر|اذكار|دعاء|ادعيه|حصن المسلم|استغفار|تسبيح|سنه|سنن|قال رسول الله|النبي قال|تثبت)/.test(
        normMsg
      );

    // بناء مصفوفة الروابط الخارجية بذكاء مخصّص:
    // 1. صفر تبويبات: في التحيات، أسئلة الهوية، الكلام العشوائي، وغير الشرعي/المعرفي
    // 2. تبويبان فقط للحديث والتثبّت والأذكار: الدرر السنية + موسوعة الحديث
    // 3. تبويبان فقط للأسئلة العامة والفقه والعقيدة والسيرة: الإسلام سؤال وجواب + إسلام ويب
    let externalSources: ExternalSourceLink[] = [];
    if (isNonKnowledge) {
      externalSources = [];
    } else if (isHadithOrAdhkar && mode !== 'seerah' && mode !== 'general') {
      const hadithKeywords = extractDistinctiveHadithKeywords(
        ragResult.matchedHadithText || '',
        trimmedMessage
      );
      const searchTerm = hadithKeywords || trimmedMessage;
      externalSources = [
        {
          name: 'الدرر السنية',
          badge: 'الموسوعة الحديثية',
          url: ragResult.dorarSearchUrl,
        },
        {
          name: 'موسوعة الحديث',
          badge: 'HadeethEnc',
          url: `https://www.google.com/search?q=${encodeURIComponent('site:hadeethenc.com/ar ' + searchTerm)}`,
        },
      ];
    } else {
      externalSources = [
        {
          name: 'الإسلام سؤال وجواب',
          badge: 'فتاوى وتأصيل',
          url: `https://islamqa.info/ar/search?q=${encodeURIComponent(trimmedMessage)}`,
        },
        {
          name: 'إسلام ويب',
          badge: 'استشارات وأحكام',
          url: `https://www.google.com/search?q=${encodeURIComponent('site:islamweb.net/ar ' + trimmedMessage)}`,
        },
      ];
    }

    // إعداد مفاتيح البيئة
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const hasGroqKey = Boolean(groqKey && groqKey !== '' && groqKey !== 'your_groq_api_key_here');

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const hasGeminiKey = Boolean(geminiKey && geminiKey !== '' && geminiKey !== 'your_gemini_api_key_here');

    const userPromptWithContext = isGreetingOrChat
      ? trimmedMessage
      : `السياق الموثّق المتاح:\n${fullContext ? fullContext : 'لا يوجد نص مباشر مطابق في قواعد البيانات الحالية لهذه المسألة.'}\n\nسؤال المستخدم:\n«${trimmedMessage}»`;

    // تنقية سجل المحادثة للأدوار القياسية (user و assistant)
    const cleanedHistory: Array<{ role: 'user' | 'assistant'; text: string }> = [];
    for (const h of (history || []).slice(-6)) {
      const text = typeof h.content === 'string' ? h.content.trim() : '';
      if (!text) continue;
      const role: 'user' | 'assistant' =
        h.role === 'assistant' || (h.role as string) === 'model'
          ? 'assistant'
          : 'user';
      cleanedHistory.push({ role, text });
    }

    let aiResponseText = '';
    let engineUsed: 'groq' | 'gemini' | 'fallback' = 'fallback';
    let lastError = '';

    // =========================================================================
    // المحاولة 1: Groq API (فائق السرعة — openai/gpt-oss-120b ثم openai/gpt-oss-20b مهلة 6 ثوانٍ لكل منهما)
    // =========================================================================
    if (hasGroqKey) {
      const groqPrimary = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';
      const groqModels = [groqPrimary, 'openai/gpt-oss-20b'].filter((v, i, a) => a.indexOf(v) === i);

      // Groq يستخدم حصرياً الأدوار 'system' و 'user' و 'assistant' (ممنوع إرسال 'model')
      const groqMessages = [
        { role: 'system' as const, content: SYSTEM_INSTRUCTION },
        ...cleanedHistory.map((h) => ({
          role: h.role,
          content: h.text,
        })),
        { role: 'user' as const, content: userPromptWithContext },
      ];

      for (const groqModel of groqModels) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 ثوانٍ كحد أقصى لكل محاولة على Groq

        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: groqModel,
              messages: groqMessages,
              temperature: 0.25,
              max_tokens: 800,
            }),
            signal: controller.signal,
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            aiResponseText = groqData?.choices?.[0]?.message?.content?.trim() || '';
            if (aiResponseText) {
              engineUsed = 'groq';
              break;
            }
          } else {
            let errText = await groqRes.text().catch(() => '');
            if (groqKey) errText = errText.replaceAll(groqKey, '[REDACTED_KEY]');
            lastError = `Groq (${groqModel}) HTTP ${groqRes.status}: ${errText.slice(0, 120)}`;
            console.warn(`Groq (${groqModel}) failed:`, lastError);
          }
        } catch (err: any) {
          const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
          lastError = isTimeout ? `Groq (${groqModel}) timeout (6s)` : (err?.message || String(err)).slice(0, 100);
          console.warn(`Groq (${groqModel}) exception:`, lastError);
        } finally {
          clearTimeout(timeoutId);
        }
      }
    }

    // =========================================================================
    // المحاولة 2: Google Gemini API (محاولة احتياطية بمهلة 12 ثانية)
    // =========================================================================
    if (!aiResponseText && hasGeminiKey) {
      const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 ثانية كحد أقصى لـ Gemini

      try {
        // Gemini يستخدم حصرياً الأدوار 'user' و 'model' بالتناوب الصارم والبدء بـ 'user'
        const geminiContents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
        let nextExpected: 'user' | 'model' = 'user';
        for (const item of cleanedHistory) {
          const role: 'user' | 'model' = item.role === 'assistant' ? 'model' : 'user';
          if (role === nextExpected) {
            geminiContents.push({ role, parts: [{ text: item.text }] });
            nextExpected = nextExpected === 'user' ? 'model' : 'user';
          }
        }
        if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'user') {
          geminiContents.pop();
        }
        geminiContents.push({
          role: 'user',
          parts: [{ text: userPromptWithContext }],
        });

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey!,
          },
          body: JSON.stringify({
            contents: geminiContents,
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 800,
              thinkingConfig: { thinkingLevel: 'minimal' },
            },
          }),
          signal: controller.signal,
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiResponseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          if (aiResponseText) {
            engineUsed = 'gemini';
          }
        } else {
          let errData = await geminiRes.text().catch(() => '');
          if (geminiKey) errData = errData.replaceAll(geminiKey, '[REDACTED_KEY]');
          lastError = `Gemini HTTP ${geminiRes.status}: ${errData.slice(0, 120)}`;
          console.warn('Gemini failed:', lastError);
        }
      } catch (err: any) {
        const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
        lastError = isTimeout ? 'Gemini timeout (12s)' : (err?.message || String(err)).slice(0, 100);
        console.warn('Gemini call exception:', lastError);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // =========================================================================
    // الرد الاحتياطي الموثق محلياً (يصل فوراً قبل الثانية 14 في جميع الأحوال)
    // =========================================================================
    if (!aiResponseText) {
      engineUsed = 'fallback';

      if (isExplicitlyNonReligious) {
        aiResponseText = OUT_OF_SCOPE_APOLOGY;
      } else if (isIdentity) {
        aiResponseText =
          'أهلاً بك! أنا «الباحث في السنة»، مرجعك الرقمي الموثق في نصوص الأحاديث النبوية، كتاب حصن المسلم، الأربعين النووية، والسيرة العطرة.';
      } else if (isGibberish) {
        aiResponseText =
          'أهلاً بك! كيف يمكنني إعانتك اليوم في رحاب السنة النبوية الشريفة وأحاديثها وأذكارها؟';
      } else if (isGreetingOrChat) {
        const norm = normalizeArabic(trimmedMessage);
        const hasSalam = norm.includes('سلام') || norm.includes('السلام');
        if (hasSalam) {
          aiResponseText =
            'وعليكم السلام ورحمة الله وبركاته! أهلاً بك في «الباحث في السنة». كيف يمكنني إعانتك اليوم في هدي النبي ﷺ، أحاديثه الصحيحة، أو أذكار حصن المسلم؟';
        } else if (norm.includes('مرحبا') || norm.includes('اهل') || norm.includes('صباح') || norm.includes('مساء')) {
          aiResponseText =
            'أهلاً وسهلاً بك في «الباحث في السنة»! كيف يمكنني إعانتك اليوم في هدي النبي ﷺ، أحاديثه الصحيحة، أو أذكار حصن المسلم؟';
        } else if (norm.includes('شكر') || norm.includes('جزاك')) {
          aiResponseText =
            'وجزاكم الله خيرًا وبارك فيكم. أنا في خدمتكم دائمًا في رحاب هدي النبوة الشريفة.';
        } else {
          aiResponseText =
            'أهلاً بك! أنا «الباحث في السنة»، مرجعك الرقمي الموثق في نصوص الأحاديث النبوية، كتاب حصن المسلم، الأربعين النووية، والسيرة العطرة.';
        }
      } else if (ragResult.isFakeWarning) {
        aiResponseText = `⚠️ **تنبيه علمي في صيانة الحديث:**\n\nوردت في سؤالك عبارة تطابق حديثاً مدرجاً في الأحاديث المنتشرة التي لا تصح حسب تحقيق مؤسسة «الدرر السنية».\n\nيمكنك التحقق المباشر من حكم الحديث وبدائله الصحيحة عبر [الموسوعة الحديثية بالدرر السنية](${ragResult.dorarSearchUrl}).`;
      } else if (ragResult.hasVerifiedContext) {
        aiResponseText = `تم العثور على نصوص موثقة مطابقة لمسألتك في مصادر المنصة المعتمدة:\n\n${returnedSources.map((s) => `• **[${s.category}]** [${s.title}](${s.url}) — ${s.source}`).join('\n')}`;
      } else {
        aiResponseText = `يمكنك مراجعة المسألة والتأكد من نصوص الأحاديث النبوية المرتبطة بها عبر روابط التوسع المعتمدة أسفل الجواب (الدرر السنية، الإسلام سؤال وجواب، إسلام ويب، وموسوعة الحديث).`;
      }
    }

    // تطبيق فلتر حماية القرآن الإجباري وتصفية التحية وحظر ذكر النماذج الخارجية
    aiResponseText = sanitizeFinalReply(aiResponseText, trimmedMessage);
    if (!aiResponseText) {
      aiResponseText = 'لم نجد نصاً مباشراً في هذا الموضوع ضمن قواعد بيانات الباحث في السنة المعتمدة حالياً.';
    }

    // فحص ما إذا كان الرد اعتذاراً عن الخروج عن التخصص الديني أو يحمل الوسم [OUT_OF_SCOPE]
    const isOutOfScope = isOutOfScopeReply(aiResponseText) || isExplicitlyNonReligious;

    if (isOutOfScope) {
      // إزالة أي أثر للوسم الخفي وتوحيد صيغة الاعتذار إذا لم تكن مضبوطة
      aiResponseText = stripOutOfScopeTag(aiResponseText);
      if (isExplicitlyNonReligious && (!aiResponseText || !aiResponseText.includes('مخصص للأسئلة الدينية'))) {
        aiResponseText = OUT_OF_SCOPE_APOLOGY;
      }
      // إخفاء روابط المصادر تماماً
      returnedSources = [];
      externalSources = [];
    }

    const latencyMs = Date.now() - requestStart;

    return NextResponse.json(
      {
        success: true,
        reply: aiResponseText,
        engineUsed,
        latencyMs,
        fallbackReason: engineUsed === 'fallback' ? (lastError || 'BOTH_ENGINES_UNAVAILABLE') : undefined,
        sources: isOutOfScope ? [] : returnedSources,
        externalSources: isOutOfScope ? [] : externalSources,
        dorarUrl: isNonKnowledge || isOutOfScope ? '' : ragResult.dorarSearchUrl,
        hasGroqKey,
        hasGeminiKey,
        isFakeWarning: isOutOfScope ? false : ragResult.isFakeWarning,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Unhandled API /api/chat error:', error?.message || String(error));
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء معالجة الطلب', errorCode: 'INTERNAL_ERROR' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isDiag = searchParams.get('diag') === '1';

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const hasGroqKey = Boolean(groqKey && groqKey !== '' && groqKey !== 'your_groq_api_key_here');

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const hasGeminiKey = Boolean(geminiKey && geminiKey !== '' && geminiKey !== 'your_gemini_api_key_here');

  const dorarConfigured = Boolean(process.env.DORAR_API_KEY?.trim());

  if (!isDiag) {
    return NextResponse.json(
      {
        status: 'ok',
        service: 'Al-Bahith fi Al-Sunnah AI Assistant API (Dual-Engine RAG: Groq + Gemini)',
        version: '2.1.0',
        primaryEngine: hasGroqKey ? 'groq (openai/gpt-oss-120b)' : hasGeminiKey ? 'gemini (gemini-3.5-flash-lite)' : 'local-context',
        hasGroqKey,
        hasGeminiKey,
        dorarConfigured,
        verifiedDatabases: [
          'الأربعون النووية (Nawawi 40)',
          'حصن المسلم (Hisn al-Muslim)',
          'السيرة النبوية المطهرة (Seerah)',
          'فحص تثبّت للأحاديث المنتشرة التي لا تصح (Dorar.net)',
          'متتبع سنن اليوم والليلة (Daily Sunnah)',
        ],
      },
      { headers: NO_CACHE_HEADERS }
    );
  }

  // وضع الفحص التشخيصي الحي مع قياس زمن الاستجابة بدقة (?diag=1)
  const diagResults: Array<{
    engine: 'groq' | 'gemini';
    model: string;
    httpStatus: number;
    ok: boolean;
    latencyMs: number;
    replyPreview?: string;
    error?: string;
  }> = [];

  // فحص Groq الحي لكلا الموديلين (openai/gpt-oss-120b و openai/gpt-oss-20b)
  if (hasGroqKey) {
    const groqModelsToTest = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
    for (const groqModel of groqModelsToTest) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const t0 = Date.now();

      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: groqModel,
            messages: [{ role: 'user', content: 'قل مرحبًا' }],
            max_tokens: 20,
          }),
          signal: controller.signal,
        });

        const latencyMs = Date.now() - t0;

        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content?.trim() || 'OK';
          diagResults.push({
            engine: 'groq',
            model: groqModel,
            httpStatus: res.status,
            ok: true,
            latencyMs,
            replyPreview: text.slice(0, 80),
          });
        } else {
          let errText = (await res.text().catch(() => '')).slice(0, 120);
          if (groqKey) errText = errText.replaceAll(groqKey, '[REDACTED_KEY]');
          diagResults.push({
            engine: 'groq',
            model: groqModel,
            httpStatus: res.status,
            ok: false,
            latencyMs,
            error: errText,
          });
        }
      } catch (e: any) {
        diagResults.push({
          engine: 'groq',
          model: groqModel,
          httpStatus: 0,
          ok: false,
          latencyMs: Date.now() - t0,
          error: e?.message || 'Network/timeout error (6s)',
        });
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // فحص Gemini الحي (gemini-3.5-flash-lite بمهلة 12 ثانية)
  if (hasGeminiKey) {
    const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const t0 = Date.now();

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey!,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'قل مرحبًا' }] }],
          generationConfig: { maxOutputTokens: 20 },
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - t0;

      if (res.ok) {
        const data = await res.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';
        diagResults.push({
          engine: 'gemini',
          model: geminiModel,
          httpStatus: res.status,
          ok: true,
          latencyMs,
          replyPreview: replyText.slice(0, 80),
        });
      } else {
        let errData = (await res.text().catch(() => '')).slice(0, 120);
        if (geminiKey) errData = errData.replaceAll(geminiKey, '[REDACTED_KEY]');
        diagResults.push({
          engine: 'gemini',
          model: geminiModel,
          httpStatus: res.status,
          ok: false,
          latencyMs,
          error: errData,
        });
      }
    } catch (e: any) {
      diagResults.push({
        engine: 'gemini',
        model: geminiModel,
        httpStatus: 0,
        ok: false,
        latencyMs: Date.now() - t0,
        error: e?.message || 'Network/timeout error (12s)',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return NextResponse.json(
    {
      status: 'diagnostic_complete',
      hasGroqKey,
      groqKeyLength: groqKey ? groqKey.length : 0,
      hasGeminiKey,
      geminiKeyLength: geminiKey ? geminiKey.length : 0,
      diagResults,
    },
    { headers: NO_CACHE_HEADERS }
  );
}
