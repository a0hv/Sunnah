import { NextResponse } from 'next/server';
import { retrieveVerifiedContext } from '@/lib/rag';
import { queryDorarApi } from '@/lib/dorar-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

القواعد العلمية والشرعية الإلزامية (Strict Scientific Guardrails):
1. الأمانة العلمية الصارمة: ممنوع منعًا باتًا تأليف، أو توليد، أو تخمين أي حديث نبوي، أو ذكر، أو آية، أو فتوى من ذاكرتك المجردة. كل معلومة أو نص يجب أن يكون مستندًا حصرًا إلى «السياق الموثّق» المرفق مع كل سؤال.
2. إذا كان السياق الموثّق يحتوي على [تنبيه علمي فوري من قسم تثبّت]:
   - يجب أن تبدأ إجابتك بتحذير صريح ومؤدب بأن هذا الحديث لا يصح أو مكذوب حسب تحقيق الموسوعة الحديثية بمؤسسة «الدرر السنية».
   - اذكر علّة الحديث أو حكمه والبيان المرفق في السياق.
   - اذكر البديل الصحيح إن وجد في السياق.
3. إذا احتوى السياق الموثّق على أحاديث أو أذكار أو مواقف سيرة ذات صلة:
   - قدّم الإجابة بأسلوب تربوي راقٍ وميسر باللغة العربية الفصيحة.
   - اذكر نصوص الأحاديث والأذكار بأمانة كما وردت، مع عزوها لمصدرها المعتمد (مثل: «الأربعون النووية — الحديث رقم X»، «حصن المسلم — باب X»، «السيرة النبوية المطهرة»).
4. إذا لم يحتوِ السياق الموثّق على نصوص كافية تغطي سؤال المستخدم:
   - لا تختلق ولا تفتِ من عندك أبدًا.
   - أجب بأمانة ووضوح: «لم يرد نص مباشر في هذا الموضوع ضمن قواعد البيانات الموثقة الحالية في المنصة (الأربعون النووية، حصن المسلم، السيرة النبوية، وقسم تثبّت)».
   - أرشد السائل إلى البحث والتحقق في الموسوعة الحديثية بمؤسسة «الدرر السنية» واستشارة أهل العلم الثقات في الفتاوى والأحكام.
5. الأسلوب والوقار:
   - التزام الوقار التام والصلاة والسلام على رسول الله ﷺ كلما ورد ذكره.
   - استخدام لغة عربية سليمة وتنسيق Markdown واضح ومريح للقراءة.
`;

export async function POST(req: Request) {
  try {
    let body: ChatRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'صيغة الطلب غير صالحة (Invalid JSON)' },
        { status: 400 }
      );
    }

    const { message, history = [] } = body;

    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      return NextResponse.json(
        { error: 'يرجى إدخال نص بحث أو سؤال لا يقل عن حرفين' },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim().slice(0, 500);

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

    // 3. التحقق من وجود مفتاح GEMINI_API_KEY في البيئة
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      // الرد بالنتائج الموثقة المسترجعة مباشرة في حال عدم توفر المفتاح محليًا
      let fallbackReply = '';

      if (ragResult.isFakeWarning) {
        fallbackReply = `⚠️ **تنبيه علمي من قسم «تثبّت»:**\n\nوردت في سؤالك عبارة تطابق حديثاً مدرجاً في الأحاديث المنتشرة التي لا تصح حسب تحقيق مؤسسة «الدرر السنية».\n\nيمكنك مراجعة التفاصيل الكاملة والبدائل الصحيحة عبر [قسم تثبّت](/verify) أو البحث في [الموسوعة الحديثية](${ragResult.dorarSearchUrl}).`;
      } else if (ragResult.hasVerifiedContext) {
        fallbackReply = `تم العثور على نصوص موثقة مطابقة لسؤالك في مصادر المنصة المعتمدة:\n\n${ragResult.sources.map((s) => `• **[${s.category}]** [${s.title}](${s.url}) — ${s.source}`).join('\n')}\n\n*(ملاحظة: يمكنك ضبط مفتاح GEMINI_API_KEY لتفعيل التحليل والتفسير الذكي الموسع).*`;
      } else {
        fallbackReply = `لم نجد نصاً مباشراً في هذا الموضوع ضمن قواعد بيانات منصة السنة المعتمدة حالياً (الأربعون النووية، حصن المسلم، السيرة النبوية، وتثبّت).\n\nيمكنك البحث والتحقق مباشرة في [الموسوعة الحديثية بمؤسسة «الدرر السنية»](${ragResult.dorarSearchUrl}).`;
      }

      return NextResponse.json({
        success: true,
        reply: fallbackReply,
        sources: ragResult.sources,
        dorarUrl: ragResult.dorarSearchUrl,
        isVerifiedOnly: true,
        aiConfigured: false,
      });
    }

    // 4. بناء طلب Gemini API مع السياق الموثق الصارم
    const userPromptWithContext = `السياق الموثّق المتاح:\n${fullContext ? fullContext : 'لا يوجد سياق موثّق متاح في قواعد البيانات الحالية لهذه المسألة.'}\n\nسؤال المستخدم:\n«${trimmedMessage}»`;

    // تكوين سجل المحادثة السابق (حتى 4 رسائل لضمان السرعة والدقة)
    const contents: any[] = [];
    const validHistory = (history || []).slice(-4);
    for (const h of validHistory) {
      if (h.role === 'user' || h.role === 'assistant') {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: userPromptWithContext }],
    });

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1500,
      },
    };

    // تجربة النموذج السريع gemini-2.5-flash مع العودة لـ gemini-1.5-flash كاحتياط
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let aiResponseText = '';
    let lastError = '';

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiResponseText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (aiResponseText) break;
        } else {
          const errBody = await geminiRes.text();
          lastError = `Model ${model} failed with ${geminiRes.status}: ${errBody}`;
          console.warn(lastError);
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`Error calling model ${model}:`, lastError);
      }
    }

    if (!aiResponseText) {
      // في حال تعذر الاتصال بـ Gemini، لا نترك المستخدم بلا إجابة بل نرجع النتائج الموثقة المسترجعة
      return NextResponse.json({
        success: true,
        reply: ragResult.hasVerifiedContext
          ? `تعذر استكمال التوليد بالذكاء الاصطناعي مؤقتاً، ولكن هذه هي النصوص الموثقة المطابقة لسؤالك في المنصة:\n\n${ragResult.sources.map((s) => `• **[${s.category}]** [${s.title}](${s.url})`).join('\n')}`
          : `تعذر الاتصال بخدمة الذكاء الاصطناعي مؤقتاً. يمكنك التحقق مباشرة من الحديث في [الموسوعة الحديثية بالدرر السنية](${ragResult.dorarSearchUrl}).`,
        sources: ragResult.sources,
        dorarUrl: ragResult.dorarSearchUrl,
        isVerifiedOnly: true,
        aiConfigured: true,
      });
    }

    return NextResponse.json({
      success: true,
      reply: aiResponseText,
      sources: ragResult.sources,
      dorarUrl: ragResult.dorarSearchUrl,
      isVerifiedOnly: true,
      aiConfigured: true,
    });
  } catch (error: any) {
    console.error('API /api/chat error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );
  const dorarConfigured = Boolean(process.env.DORAR_API_KEY);

  return NextResponse.json({
    status: 'ok',
    service: 'Sunnah Platform AI Assistant API (RAG Engine)',
    version: '1.0.0',
    ragEnabled: true,
    geminiConfigured,
    dorarConfigured,
    verifiedDatabases: [
      'الأربعون النووية (Nawawi 40)',
      'حصن المسلم (Hisn al-Muslim)',
      'السيرة النبوية المطهرة (Seerah)',
      'قسم تثبّت للأحاديث التي لا تصح (Dorar.net Fake Hadiths)',
      'متتبع سنن اليوم والليلة (Daily Sunnah)',
    ],
  });
}
