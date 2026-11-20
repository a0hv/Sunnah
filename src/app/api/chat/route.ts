import { NextResponse } from 'next/server';
import {
  retrieveVerifiedContext,
  isConversationalOrGreeting,
  normalizeArabic,
  AssistantSearchMode,
} from '@/lib/rag';
import { queryDorarApi, extractDistinctiveHadithKeywords } from '@/lib/dorar-api';

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

const SYSTEM_INSTRUCTION = `
أنت «الباحث في السنة» (Al-Bahith fi Al-Sunnah) — باحث ومرجع إلكتروني ذكي، رصين، موثوق وهادئ في السنة النبوية الشريفة، وسيرة النبي ﷺ، والعقيدة، والآداب الإسلامية.

النبرة والأسلوب:
- تحدث باللغة العربية الفصحى الحديثة، الرصينة، الطبيعية، الهادئة، والمختصرة المباشرة دون تملق أو ألفاظ عامية مبتذلة (مثل: «يا غالي»، «من عيوني»، «أنا أخوك الصغير وتحت أمرك»، «يا هلا بالزين»).
- أسلوبك إنساني، ذكي، ومفيد؛ ادخل في صلب الجواب مباشرة دون مقدمات أو خواتيم متكلفة.
- صلِّ وسلم على رسول الله ﷺ كلما ذكر اسمه الشريف.

المعرفة والحرية العلمية المسؤولة:
- أجب بأريحية وذكاء وبصيرة في مجالات: السيرة النبوية الشريفة، العقيدة الإسلامية، الشروح التربوية، المعاني، الفوائد الإيمانية، والمعلومات العامة النافعة، ولا تكرر عبارات التحجير الجافة (مثل «لم يرد نص في المكتبة») إلا إذا سُئلت عن حديث بعينه لم يثبت.

الضابط العلمي الصارم للأحاديث النبوية والأذكار:
1. عند الاستشهاد بحديث أو ذكر وارد في «السياق الموثّق» المرفق: انقله بنصه وأمانته حرفيًا وضعه بين علامتي «...»، والآيات بين ﴿...﴾.
2. إذا كان «السياق الموثّق» يحتوي على [تنبيه علمي فوري من قسم تثبّت]:
   - بيّن باقتضاب أن هذا الحديث لا يصح أو موضوع/مكذوب وفق تحقيق مؤسسة الدرر السنية، واذكر علته وحكمه والبديل الصحيح.
3. إذا سألك المستخدم عن حديث أو ذكر ولم يكن موجودًا في «السياق الموثّق»:
   - لا تختلق لفظ حديث أو سندًا أو حكمًا من الذاكرة المجردة إطلاقًا (صيانةً للجناب النبوي).
   - اشرح المعنى العام للمسألة بأمانة ووضوح واقتضاب، وبيّن للسائل بأدب أنه يمكنه مراجعة النص والتحقق من صحته عبر روابط المصادر الموثقة المرفقة أسفل الجواب (الدرر السنية، الإسلام سؤال وجواب، إسلام ويب، موسوعة الحديث).
4. عند رد السلام أو التحية:
   - رُد السلام بأدب ووقار واقتضاب (مثل: «وعليكم السلام ورحمة الله وبركاته. أهلاً بك في الباحث في السنة، كيف يمكنني إعانتك؟»).
`.trim();

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
    const isGreetingOrChat = isConversationalOrGreeting(trimmedMessage);

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

    // إخفاء المصادر غير الملائمة إذا كانت الرسالة مجرد تحية أو دردشة عادية
    const returnedSources = isGreetingOrChat ? [] : ragResult.sources;

    // استخراج الكلمات المميزة من متن الحديث نفسه لبناء روابط المصادر الخارجية بدقة
    const hadithKeywords = extractDistinctiveHadithKeywords(
      ragResult.matchedHadithText || '',
      trimmedMessage
    );

    // بناء مصفوفة الروابط الخارجية الأربعة للمسائل العلمية والدينية
    const externalSources: ExternalSourceLink[] = isGreetingOrChat
      ? []
      : [
          {
            name: 'الدرر السنية',
            badge: 'الموسوعة الحديثية',
            url: ragResult.dorarSearchUrl,
          },
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
          {
            name: 'موسوعة الحديث',
            badge: 'HadeethEnc',
            url: `https://www.google.com/search?q=${encodeURIComponent('site:hadeethenc.com/ar ' + (hadithKeywords || trimmedMessage))}`,
          },
        ];

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
    // المحاولة 1: Groq API (فائق السرعة — مهلة 6 ثوانٍ فقط)
    // =========================================================================
    if (hasGroqKey) {
      const groqModel = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 ثوانٍ كحد أقصى لـ Groq

      try {
        // Groq يستخدم حصرياً الأدوار 'system' و 'user' و 'assistant' (ممنوع إرسال 'model')
        const groqMessages = [
          { role: 'system' as const, content: SYSTEM_INSTRUCTION },
          ...cleanedHistory.map((h) => ({
            role: h.role,
            content: h.text,
          })),
          { role: 'user' as const, content: userPromptWithContext },
        ];

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
          }
        } else {
          let errText = await groqRes.text().catch(() => '');
          if (groqKey) errText = errText.replaceAll(groqKey, '[REDACTED_KEY]');
          lastError = `Groq HTTP ${groqRes.status}: ${errText.slice(0, 120)}`;
          console.warn('Groq failed, switching to Gemini:', lastError);
        }
      } catch (err: any) {
        const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
        lastError = isTimeout ? 'Groq timeout (6s)' : (err?.message || String(err)).slice(0, 100);
        console.warn('Groq call exception, switching to Gemini:', lastError);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // =========================================================================
    // المحاولة 2: Google Gemini API (محاولة واحدة سريعة بمهلة 7 ثوانٍ فقط)
    // =========================================================================
    if (!aiResponseText && hasGeminiKey) {
      const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 ثوانٍ كحد أقصى لـ Gemini

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
        lastError = isTimeout ? 'Gemini timeout (7s)' : (err?.message || String(err)).slice(0, 100);
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

      if (isGreetingOrChat) {
        const norm = normalizeArabic(trimmedMessage);
        if (norm.includes('سلام') || norm.includes('مرحبا') || norm.includes('اهل')) {
          aiResponseText =
            'وعليكم السلام ورحمة الله وبركاته! أهلاً بك في «الباحث في السنة». كيف يمكنني إعانتك اليوم في هدي النبي ﷺ، أحاديثه الصحيحة، أو أذكار حصن المسلم؟';
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

    const latencyMs = Date.now() - requestStart;

    return NextResponse.json(
      {
        success: true,
        reply: aiResponseText,
        engineUsed,
        latencyMs,
        fallbackReason: engineUsed === 'fallback' ? (lastError || 'BOTH_ENGINES_UNAVAILABLE') : undefined,
        sources: returnedSources,
        externalSources,
        dorarUrl: isGreetingOrChat ? '' : ragResult.dorarSearchUrl,
        hasGroqKey,
        hasGeminiKey,
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
        primaryEngine: hasGroqKey ? 'groq (llama-3.3-70b-versatile)' : hasGeminiKey ? 'gemini (gemini-3.5-flash-lite)' : 'local-context',
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

  // فحص Groq الحي
  if (hasGroqKey) {
    const groqModel = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';
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

  // فحص Gemini الحي
  if (hasGeminiKey) {
    const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
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
        error: e?.message || 'Network/timeout error (7s)',
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
