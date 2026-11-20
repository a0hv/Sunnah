import { NextResponse } from 'next/server';
import {
  retrieveVerifiedContext,
  isIslamicOrReligiousQuery,
  isConversationalOrGreeting,
  normalizeArabic,
} from '@/lib/rag';
import { queryDorarApi } from '@/lib/dorar-api';

// تعطيل الكاش نهائيًا لضمان استجابات محدثة دائماً وعدم تخزين نتائج التشخيص
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

const SYSTEM_INSTRUCTION = `
أنت «المساعد النبوي الذكي» التابع لـ «منصة السنة» (Sunnah Platform).
مهمتك خدمة المسلمين بالإرشاد النبوي المستمد حصريًا من نصوص السنة الصحيحة، والأذكار المأثورة، والسيرة النبوية المطهرة.

قواعد المحادثة والأمانة الشرعية:
1. التفاعل الطبيعي والتحية:
   - بادل المستخدم التحية والترحيب بأسلوب راقٍ ومؤدب (مثل: «وعليكم السلام ورحمة الله وبركاته، أهلاً بك في منصة السنة...»).
   - أجب عن الشكر والثناء بأدب ودعاء (مثل: «وجزاكم الله خيرًا وبارك فيكم»).
   - عرّف بنفسك وبدورك بوضوح عند السؤال عن هويتك أو كيفية المساعدة.
2. الأمانة العلمية الصارمة (للأحاديث والأحكام الشرعية):
   - ممنوع منعًا باتًا تأليف، أو توليد، أو تخمين أي حديث نبوي، أو ذكر، أو آية، أو فتوى من ذاكرتك المجردة. كل معلومة أو نص شرعي يجب أن يكون مستندًا حصرًا إلى «السياق الموثّق» المرفق مع كل سؤال.
3. إذا كان السياق الموثّق يحتوي على [تنبيه علمي فوري من قسم تثبّت]:
   - يجب أن تبدأ إجابتك بتحذير صريح ومؤدب بأن هذا الحديث لا يصح أو مكذوب حسب تحقيق الموسوعة الحديثية بمؤسسة «الدرر السنية».
   - اذكر علّة الحديث أو حكمه والبيان المرفق في السياق والبديل الصحيح إن وجد.
4. إذا احتوى السياق الموثّق على أحاديث أو أذكار أو مواقف سيرة ذات صلة:
   - قدّم الإجابة بأسلوب تربوي راقٍ وميسر باللغة العربية الفصيحة، واذكر النصوص بأمانة كما وردت مع عزوها لمصدرها المعتمد.
5. إذا سُئلت عن مسألة شرعية أو حديث محدد ولم يحتوِ السياق الموثّق على نصوص تغطيها:
   - أجب بأمانة: «لم يرد نص مباشر في هذا الموضوع ضمن قواعد البيانات الموثقة الحالية في المنصة (الأربعون النووية، حصن المسلم، السيرة النبوية، وقسم تثبّت)».
   - أرشد السائل إلى البحث والتحقق في الموسوعة الحديثية بمؤسسة «الدرر السنية».
6. الأسلوب والوقار:
   - التزام الوقار التام والصلاة والسلام على رسول الله ﷺ كلما ورد ذكره.
   - استخدام لغة عربية سليمة وتنسيق Markdown واضح ومريح للقراءة.
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

    // 3. التحقق مما إذا كان السؤال خارج نطاق السنة تماماً مع عدم وجود أي سياق موثق محلي
    if (!ragResult.hasVerifiedContext && (!dorarResults || dorarResults.length === 0)) {
      const isReligiousTopic = isIslamicOrReligiousQuery(trimmedMessage);
      if (!isReligiousTopic && !isGreetingOrChat) {
        // سؤال خارج النطاق (مثل الطبخ أو الرياضة): رد لطيف ومباشر بدون استدعاء Gemini وبدون رابط الدرر
        return NextResponse.json(
          {
            success: true,
            reply:
              'أنا مساعد متخصص في مكتبة منصة السنة الموثّقة (الأربعون النووية، حصن المسلم، السيرة، وتثبّت) فقط، ولم أجد ما يطابق سؤالك في المكتبة حاليًا.',
            sources: [],
            dorarUrl: '',
            isVerifiedOnly: true,
            hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
            aiConfigured: false,
            isOutOfScope: true,
          },
          { headers: NO_CACHE_HEADERS }
        );
      }
    }

    // 4. التحقق من وجود مفتاح GEMINI_API_KEY في البيئة
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === '' || apiKey === 'your_gemini_api_key_here') {
      // الرد بالنتائج الموثقة المسترجعة مباشرة في حال عدم توفر المفتاح محليًا
      let fallbackReply = '';

      if (isGreetingOrChat) {
        const norm = normalizeArabic(trimmedMessage);
        if (norm.includes('سلام') || norm.includes('مرحبا') || norm.includes('اهل')) {
          fallbackReply =
            'وعليكم السلام ورحمة الله وبركاته! أهلاً وسهلاً بك في منصة السنة. كيف يمكنني مساعدتك اليوم في نصوص الأحاديث النبوية، الأذكار المأثورة، السيرة النبوية، أو التحقق من صحة الأحاديث؟';
        } else if (norm.includes('شكر') || norm.includes('جزاك')) {
          fallbackReply =
            'وجزاكم الله خيرًا وبارك فيكم وتقبل منا ومنكم صالح الأعمال. أنا في خدمتكم دائمًا في رحاب هدي النبوة.';
        } else {
          fallbackReply =
            'أهلاً بك! أنا «المساعد النبوي الذكي» لمنصة السنة، مهمتي إعانتك في تصفح وبحث كتاب الأربعون النووية، أذكار حصن المسلم، محطات السيرة النبوية العطرة، والتحقق من صحة الأحاديث المنتشرة عبر قسم تثبّت.';
        }
      } else if (ragResult.isFakeWarning) {
        fallbackReply = `⚠️ **تنبيه علمي من قسم «تثبّت»:**\n\nوردت في سؤالك عبارة تطابق حديثاً مدرجاً في الأحاديث المنتشرة التي لا تصح حسب تحقيق مؤسسة «الدرر السنية».\n\nيمكنك مراجعة التفاصيل الكاملة والبدائل الصحيحة عبر [قسم تثبّت](/verify) أو البحث في [الموسوعة الحديثية](${ragResult.dorarSearchUrl}).`;
      } else if (ragResult.hasVerifiedContext) {
        fallbackReply = `تم العثور على نصوص موثقة مطابقة لسؤالك في مصادر المنصة المعتمدة:\n\n${ragResult.sources.map((s) => `• **[${s.category}]** [${s.title}](${s.url}) — ${s.source}`).join('\n')}\n\n*(ملاحظة: يمكنك ضبط مفتاح GEMINI_API_KEY لتفعيل التحليل والتفسير الذكي الموسع).*`;
      } else {
        fallbackReply = `لم نجد نصاً مباشراً في هذا الموضوع ضمن قواعد بيانات منصة السنة المعتمدة حالياً (الأربعون النووية، حصن المسلم، السيرة النبوية، وتثبّت).\n\nيمكنك البحث والتحقق مباشرة في [الموسوعة الحديثية بمؤسسة «الدرر السنية»](${ragResult.dorarSearchUrl}).`;
      }

      return NextResponse.json(
        {
          success: true,
          reply: fallbackReply,
          sources: ragResult.sources,
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

    const payload = {
      contents,
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 700,
      },
    };

    // تجربة قائمة الموديلات الافتراضية مع fallback تلقائي (gemini-2.5-flash ثم gemini-2.5-flash-lite)
    const primaryModel = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
    const candidateModels = Array.from(
      new Set([primaryModel, 'gemini-2.5-flash-lite', 'gemini-2.0-flash'])
    );

    let aiResponseText = '';
    let lastErrorCode = 'NETWORK';
    let lastDebugReason = '';

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
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
        lastErrorCode = 'NETWORK';
        let netMsg = err?.message || String(err);
        if (apiKey) {
          netMsg = netMsg.replaceAll(apiKey, '[REDACTED_KEY]');
        }
        lastDebugReason = `${model} -> Network error: ${netMsg}`.slice(0, 250);
        console.error(`Network error calling Gemini model "${model}":`, netMsg);
      }
    }

    if (!aiResponseText) {
      // إظهار سبب الخطأ مؤقتًا في نص الرد لتسهيل التشخيص للمستخدم والمطور
      const debugNote = lastDebugReason
        ? `\n\n> ⚠️ **تشخيص تقني مؤقت:** \`${lastDebugReason}\``
        : lastErrorCode !== 'NETWORK'
        ? `\n\n> ⚠️ **تشخيص تقني مؤقت:** \`${lastErrorCode}\``
        : '';

      const baseReply = ragResult.hasVerifiedContext
        ? `تعذر استكمال التحليل الذكي مؤقتاً، ولكن هذه هي النصوص الموثقة المطابقة لسؤالك في المنصة:\n\n${ragResult.sources.map((s) => `• **[${s.category}]** [${s.title}](${s.url})`).join('\n')}`
        : isGreetingOrChat
        ? 'أهلاً بك في منصة السنة النبوية الشاملة! نسعد بخدمتكم في رحاب هدي المصطفى ﷺ.'
        : `تعذر الاتصال بخدمة الذكاء الاصطناعي مؤقتاً. يمكنك التحقق مباشرة من الحديث في [الموسوعة الحديثية بالدرر السنية](${ragResult.dorarSearchUrl}).`;

      return NextResponse.json(
        {
          success: true,
          reply: baseReply + debugNote,
          sources: ragResult.sources,
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
        sources: ragResult.sources,
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
        service: 'Sunnah Platform AI Assistant API (RAG Engine)',
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

  // وضع الفحص التشخيصي الحقيقي (?diag=1)
  const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
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

  for (const model of candidateModels) {
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
          generationConfig: { maxOutputTokens: 20 },
        }),
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
      let netMsg = e?.message || 'Network connection failed';
      if (apiKey) {
        netMsg = netMsg.replaceAll(apiKey, '[REDACTED_KEY]');
      }
      diagResults.push({
        model,
        httpStatus: 0,
        ok: false,
        googleError: netMsg,
      });
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
