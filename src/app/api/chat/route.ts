import { NextResponse } from 'next/server';
import {
  retrieveVerifiedContext,
  isIslamicOrReligiousQuery,
  isConversationalOrGreeting,
  normalizeArabic,
} from '@/lib/rag';
import { queryDorarApi } from '@/lib/dorar-api';

// ضبط أقصى مدة استجابة للمسار بـ 30 ثانية لتسريع الإجابة وتجنب التعليق
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
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
}

interface ModelConfig {
  name: string;
  thinkingLevel: 'minimal' | 'low';
}

const SYSTEM_INSTRUCTION = `
أنت «المساعد النبوي الذكي» في منصة «الباحث في السنة» (Al-Bahith fi Al-Sunnah).

شخصيتك وأسلوبك:
- أنت طالب علم مؤدب، لطيف، ودود، محب للخير، وقريب من السائل كأنه أخ أو صديق ناصح.
- تفهم اللهجات العامية (الخليجية، المصرية، الشامية، المغربية وغيرها) واللغة الفصحى بذكاء وسلاسة، وتتفاعل بعفوية وبشاشة مع التحيات والسلام والأسئلة الخفيفة أو التوضيحية (مثل: «السلام عليكم»، «عامل إيه؟»، «شلونك؟»، «ماذا؟»، «وضح لي أكثر»).
- أسلوبك طبيعي وسلس ومريح، بعيد عن القوالب الجافة أو الردود الآلية المكررة.

القاعدة العلمية الصارمة والأمانة في النقل:
1. يُمنع منعًا باتًا تأليف، أو توليد، أو استحضار أي نص حديث نبوي، أو ذكر، أو آية، أو فتوى من الذاكرة دون أن يكون مذكورًا في «السياق الموثّق» المرفق.
2. إذا كان «السياق الموثّق» يحتوي على [تنبيه علمي فوري من قسم تثبّت]:
   - نبّه السائل بلطف وأدب على الفور بأن هذا الحديث لا يصح أو موضوع/مكذوب بناءً على تحقيق الدرر السنية، واذكر علّته وحكمه والبديل الصحيح المذكور في السياق إن وجد.
3. إذا احتوى «السياق الموثّق» على أحاديث أو أذكار أو محطات سيرة:
   - اشرحها وقدمها بأسلوب تربوي لطيف وميسر، مع ذكر النص النبوي بدقة وعزوه لمصدره.
4. إذا سأل المستخدم عن نص حديث معين، أو دعاء محدد، أو حكم فقهي ولم تجده في «السياق الموثّق» المرفق:
   - لا تخترع نصًا ولا تتكلف إجابة من عندك؛ اعتذر له بلطف وبأسلوبك الودود الطبيعي موضحًا أن هذا النص غير متوفر حاليًا في قواعد البيانات الموثقة بالمنصة (الأربعون النووية، حصن المسلم، السيرة النبوية، وقسم تثبّت)، واقترح عليه البحث والتحقق في الموسوعة الحديثية بمؤسسة «الدرر السنية».
5. إذا كانت رسالة المستخدم دردشة عادية، سلامًا، شكرًا، أو سؤالًا عامًا استيضاحيًا:
   - رد عليه بعفوية ولطف وود كطالب علم نبيل، دون ذكر قوالب الاعتذار أو روابط المصادر.
6. الأسلوب والتنسيق:
   - الصلاة والسلام على رسول الله ﷺ كلما ورد ذكره.
   - تنسيق مريح بالقوائم والخط العريض عند الحاجة، ووضع الأحاديث بين قوسين «...» والآيات بين ﴿...﴾.
`;

export async function POST(req: Request) {
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

    const trimmedMessage = message.trim().slice(0, 500);
    const isGreetingOrChat = isConversationalOrGreeting(trimmedMessage);

    // 1. الاسترجاع المعزز الموثّق (RAG) من قواعد بيانات المنصة المحلية
    const ragResult = retrieveVerifiedContext(trimmedMessage);

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

    // إخفاء المصادر غير الملائمة إذا كانت الرسالة مجرد تحية أو دردشة عادية
    const returnedSources = isGreetingOrChat ? [] : ragResult.sources;

    // 3. التحقق من وجود مفتاح GEMINI_API_KEY في البيئة
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === '' || apiKey === 'your_gemini_api_key_here') {
      // الرد بالنتائج الموثقة المسترجعة مباشرة في حال عدم توفر المفتاح محليًا
      let fallbackReply = '';

      if (isGreetingOrChat) {
        const norm = normalizeArabic(trimmedMessage);
        if (norm.includes('سلام') || norm.includes('مرحبا') || norm.includes('اهل')) {
          fallbackReply =
            'وعليكم السلام ورحمة الله وبركاته! أهلاً وسهلاً بك في «الباحث في السنة». كيف يمكنني مساعدتك اليوم في نصوص الأحاديث النبوية، الأذكار المأثورة، السيرة النبوية، أو التحقق من صحة الأحاديث؟';
        } else if (norm.includes('شكر') || norm.includes('جزاك')) {
          fallbackReply =
            'وجزاكم الله خيرًا وبارك فيكم وتقبل منا ومنكم صالح الأعمال. أنا في خدمتكم دائمًا في رحاب هدي النبوة.';
        } else {
          fallbackReply =
            'أهلاً بك! أنا «المساعد النبوي الذكي» التابع لـ «الباحث في السنة»، مهمتي إعانتك في تصفح وبحث كتاب الأربعون النووية، أذكار حصن المسلم، محطات السيرة النبوية العطرة، والتحقق من صحة الأحاديث المنتشرة عبر قسم تثبّت.';
        }
      } else if (ragResult.isFakeWarning) {
        fallbackReply = `⚠️ **تنبيه علمي من قسم «تثبّت»:**\n\nوردت في سؤالك عبارة تطابق حديثاً مدرجاً في الأحاديث المنتشرة التي لا تصح حسب تحقيق مؤسسة «الدرر السنية».\n\nيمكنك مراجعة التفاصيل الكاملة والبدائل الصحيحة عبر [قسم تثبّت](/verify) أو البحث في [الموسوعة الحديثية](${ragResult.dorarSearchUrl}).`;
      } else if (ragResult.hasVerifiedContext) {
        fallbackReply = `تم العثور على نصوص موثقة مطابقة لسؤالك في مصادر المنصة المعتمدة:\n\n${returnedSources.map((s) => `• **[${s.category}]** [${s.title}](${s.url}) — ${s.source}`).join('\n')}\n\n*(ملاحظة: يمكنك ضبط مفتاح GEMINI_API_KEY لتفعيل التحليل والتفسير الذكي الموسع).*`;
      } else {
        fallbackReply = `لم نجد نصاً مباشراً في هذا الموضوع ضمن قواعد بيانات الباحث في السنة المعتمدة حالياً (الأربعون النووية، حصن المسلم، السيرة النبوية، وتثبّت).\n\nيمكنك البحث والتحقق مباشرة في [الموسوعة الحديثية بمؤسسة «الدرر السنية»](${ragResult.dorarSearchUrl}).`;
      }

      return NextResponse.json(
        {
          success: true,
          reply: fallbackReply,
          sources: returnedSources,
          dorarUrl: isGreetingOrChat ? '' : ragResult.dorarSearchUrl,
          isVerifiedOnly: true,
          hasGeminiKey: false,
          aiConfigured: false,
          isFakeWarning: ragResult.isFakeWarning,
          errorCode: 'MISSING_KEY',
          debugReason: 'GEMINI_API_KEY_NOT_CONFIGURED',
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 5. بناء طلب Gemini API مع السياق الموثق الصارم
    const userPromptWithContext = isGreetingOrChat
      ? trimmedMessage
      : `السياق الموثّق المتاح:\n${fullContext ? fullContext : 'لا يوجد سياق موثّق متاح في قواعد البيانات الحالية لهذه المسألة.'}\n\nسؤال المستخدم:\n«${trimmedMessage}»`;

    // تكوين سجل المحادثة مع ضمان استخدام 'user' و 'model' فقط والبدء بـ 'user' والتناوب التام
    const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

    // تنقية السجل: تحويل 'assistant' إلى 'model'، وحذف أي رسائل فارغة
    const cleanedHistory: Array<{ role: 'user' | 'model'; text: string }> = [];
    for (const h of (history || []).slice(-6)) {
      const text = typeof h.content === 'string' ? h.content.trim() : '';
      if (!text) continue;
      const role: 'user' | 'model' = h.role === 'assistant' || (h.role as string) === 'model' ? 'model' : 'user';
      cleanedHistory.push({ role, text });
    }

    // بناء تسلسل متناوب يبدأ بـ user
    let nextExpected: 'user' | 'model' = 'user';
    for (const item of cleanedHistory) {
      if (item.role === nextExpected) {
        contents.push({
          role: item.role,
          parts: [{ text: item.text }],
        });
        nextExpected = nextExpected === 'user' ? 'model' : 'user';
      }
    }

    // إذا كانت آخر رسالة مضافة هي user، نحذفها لضمان إلحاق رسالة المستخدم الحالية كسياق user نهائي
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents.pop();
    }

    // إضافة السؤال الحالي مع السياق الموثق كـ user في نهاية المصفوفة
    contents.push({
      role: 'user',
      parts: [{ text: userPromptWithContext }],
    });

    // قائمة الموديلات المرتبة بحسب السرعة (الأسرع أولاً لمنع التعليق)
    const primaryName = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
    const candidateConfigs: ModelConfig[] = [
      { name: primaryName, thinkingLevel: 'minimal' },
      { name: 'gemini-3.6-flash', thinkingLevel: 'minimal' },
      { name: 'gemini-3.8-flash', thinkingLevel: 'low' },
    ];

    // تصفية التكرارات مع الحفاظ على الترتيب
    const seenNames = new Set<string>();
    const candidateModels: ModelConfig[] = [];
    for (const c of candidateConfigs) {
      if (!seenNames.has(c.name)) {
        seenNames.add(c.name);
        candidateModels.push(c);
      }
    }

    let aiResponseText = '';
    let lastErrorCode = 'NETWORK';
    let lastDebugReason = '';

    for (const modelOpt of candidateModels) {
      const model = modelOpt.name;
      const modelPayload = {
        contents,
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 700,
          thinkingConfig: {
            thinkingLevel: modelOpt.thinkingLevel,
          },
        },
      };

      // مهلة 12 ثانية لكل محاولة لمنع التعليق
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(modelPayload),
          signal: controller.signal,
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiResponseText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (aiResponseText) break;
        } else {
          lastErrorCode = `HTTP_${geminiRes.status}`;
          let errorMsg = '';
          try {
            const errJson = await geminiRes.json();
            errorMsg = errJson?.error?.message || errJson?.error?.status || `HTTP_${geminiRes.status}`;
          } catch {
            errorMsg = (await geminiRes.text().catch(() => `HTTP_${geminiRes.status}`)).slice(0, 150);
          }
          if (apiKey) {
            errorMsg = errorMsg.replaceAll(apiKey, '[REDACTED_KEY]');
          }
          lastDebugReason = `${model} -> HTTP ${geminiRes.status}: ${errorMsg}`.slice(0, 250);
          console.error(
            `Gemini model "${model}" failed with status ${geminiRes.status}: ${errorMsg}`
          );
        }
      } catch (err: any) {
        const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
        lastErrorCode = isTimeout ? 'TIMEOUT_12S' : 'NETWORK';
        let netMsg = isTimeout
          ? 'تجاوزت مهلة الاتصال بالموديل 12 ثانية'
          : err?.message || String(err);
        if (apiKey) {
          netMsg = netMsg.replaceAll(apiKey, '[REDACTED_KEY]');
        }
        lastDebugReason = `${model} -> ${isTimeout ? 'Timeout (12s)' : 'Network error'}: ${netMsg}`.slice(0, 250);
        console.error(`Gemini model "${model}" error:`, netMsg);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!aiResponseText) {
      const baseReply = ragResult.hasVerifiedContext
        ? `تعذر استكمال التحليل الذكي مؤقتاً، ولكن هذه هي النصوص الموثقة المطابقة لسؤالك في المنصة:\n\n${returnedSources.map((s) => `• **[${s.category}]** [${s.title}](${s.url})`).join('\n')}`
        : isGreetingOrChat
        ? 'أهلاً بك في «الباحث في السنة»! نسعد بخدمتكم في رحاب هدي المصطفى ﷺ.'
        : `تعذر الاتصال بخدمة الذكاء الاصطناعي مؤقتاً. يمكنك التحقق مباشرة من الحديث في [الموسوعة الحديثية بالدرر السنية](${ragResult.dorarSearchUrl}).`;

      return NextResponse.json(
        {
          success: true,
          reply: baseReply,
          sources: returnedSources,
          dorarUrl: isGreetingOrChat ? '' : ragResult.dorarSearchUrl,
          isVerifiedOnly: true,
          hasGeminiKey: true,
          aiConfigured: false,
          isFakeWarning: ragResult.isFakeWarning,
          errorCode: lastErrorCode,
          debugReason: lastDebugReason || 'NO_RESPONSE_TEXT',
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reply: aiResponseText,
        sources: returnedSources,
        dorarUrl: isGreetingOrChat ? '' : ragResult.dorarSearchUrl,
        isVerifiedOnly: true,
        hasGeminiKey: true,
        aiConfigured: true,
        isFakeWarning: ragResult.isFakeWarning,
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

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const hasGeminiKey = Boolean(
    apiKey &&
    apiKey !== '' &&
    apiKey !== 'your_gemini_api_key_here'
  );
  const keyLength = apiKey ? apiKey.length : 0;
  const dorarConfigured = Boolean(process.env.DORAR_API_KEY?.trim());

  if (!isDiag) {
    return NextResponse.json(
      {
        status: 'ok',
        service: 'Al-Bahith fi Al-Sunnah AI Assistant API (RAG Engine)',
        version: '1.0.0',
        ragEnabled: true,
        hasGeminiKey,
        geminiConfigured: hasGeminiKey,
        dorarConfigured,
        verifiedDatabases: [
          'الأربعون النووية (Nawawi 40)',
          'حصن المسلم (Hisn al-Muslim)',
          'السيرة النبوية المطهرة (Seerah)',
          'قسم تثبّت للأحاديث التي لا تصح (Dorar.net Fake Hadiths)',
          'متتبع سنن اليوم والليلة (Daily Sunnah)',
        ],
      },
      { headers: NO_CACHE_HEADERS }
    );
  }

  // وضع الفحص التشخيصي الحقيقي المحدث (?diag=1)
  const candidateModels: ModelConfig[] = [
    { name: 'gemini-3.5-flash-lite', thinkingLevel: 'minimal' },
    { name: 'gemini-3.6-flash', thinkingLevel: 'minimal' },
    { name: 'gemini-3.8-flash', thinkingLevel: 'low' },
  ];

  const diagResults: Array<{
    model: string;
    httpStatus: number;
    ok: boolean;
    replyPreview?: string;
    googleError?: string;
  }> = [];

  if (!hasGeminiKey) {
    return NextResponse.json(
      {
        status: 'diagnostic_complete',
        hasGeminiKey: false,
        keyLength: 0,
        note: 'مفتاح GEMINI_API_KEY غير مهيأ في متغيرات البيئة.',
        diagResults: [],
      },
      { headers: NO_CACHE_HEADERS }
    );
  }

  for (const modelOpt of candidateModels) {
    const model = modelOpt.name;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey!,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'قل مرحبًا' }] }],
          generationConfig: {
            maxOutputTokens: 20,
            thinkingConfig: {
              thinkingLevel: modelOpt.thinkingLevel,
            },
          },
        }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const replyText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';
        diagResults.push({
          model,
          httpStatus: res.status,
          ok: true,
          replyPreview: replyText.slice(0, 100),
        });
      } else {
        let errorMsg = '';
        try {
          const errData = await res.json();
          errorMsg = errData?.error?.message || errData?.error?.status || `HTTP_${res.status}`;
        } catch {
          errorMsg = (await res.text().catch(() => `HTTP_${res.status}`)).slice(0, 150);
        }
        if (apiKey) {
          errorMsg = errorMsg.replaceAll(apiKey, '[REDACTED_KEY]');
        }
        diagResults.push({
          model,
          httpStatus: res.status,
          ok: false,
          googleError: errorMsg.slice(0, 250),
        });
      }
    } catch (e: any) {
      const isTimeout = e?.name === 'AbortError' || controller.signal.aborted;
      let netMsg = isTimeout
        ? 'انتهت مهلة الاتصال التشخيصي (12 ثانية)'
        : e?.message || 'Network connection failed';
      if (apiKey) {
        netMsg = netMsg.replaceAll(apiKey, '[REDACTED_KEY]');
      }
      diagResults.push({
        model,
        httpStatus: 0,
        ok: false,
        googleError: netMsg,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return NextResponse.json(
    {
      status: 'diagnostic_complete',
      hasGeminiKey: true,
      keyLength,
      diagResults,
    },
    { headers: NO_CACHE_HEADERS }
  );
}
