'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  BookOpen,
  Scroll,
  CalendarCheck,
  Compass,
  Sparkles,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { getQuranComUrl } from '@/lib/external-refs';
import { BrandLogoIcon } from './BrandLogo';

export interface AssistantSource {
  title: string;
  category: string;
  source: string;
  url: string;
  type: 'nawawi' | 'hisn' | 'seerah' | 'fake-hadith' | 'daily-tracker';
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: AssistantSource[];
  dorarUrl?: string;
  isFakeWarning?: boolean;
}

const QUICK_PROMPTS = [
  'دعاء الهم والحزن وضيق الصدر',
  'شرح حديث إنما الأعمال بالنيات',
  'هل حديث اطلبوا العلم ولو بالصين صحيح؟',
  'أذكار الاستيقاظ والنوم من حصن المسلم',
];

interface SunnahAssistantProps {
  compact?: boolean;
  onClose?: () => void;
}

/**
 * دالة آمنة لتحويل نصوص Markdown البسيطة ([روابط]، **خط عريض**، «أحاديث»، ﴿آيات﴾)
 * إلى عناصر React تفاعلية دون ظهور رموز الماركداون الخام.
 */
function renderRichMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Regex لالتقاط: الروابط [title](url)، والخط العريض **bold**، والآيات ﴿...﴾، والأقوال «...»
  const TOKEN_REGEX =
    /((?:\[[^\]]+\]\([^)]+\))|(?:\*\*[^*]+\*\*)|(?:﴿[^﴾]+﴾)|(?:«[^»]+»))/g;

  const parts = text.split(TOKEN_REGEX);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. رابط ماركداون [نص](رابط)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        const [, linkTitle, linkHref] = match;
        const isInternal = linkHref.startsWith('/');
        if (isInternal) {
          return (
            <Link
              key={index}
              href={linkHref}
              className="text-emerald-brand dark:text-emerald-brand-dark font-bold underline decoration-emerald-brand/40 underline-offset-4 hover:opacity-80 transition-opacity mx-0.5"
            >
              {linkTitle}
            </Link>
          );
        }
        return (
          <a
            key={index}
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-brand dark:text-emerald-brand-dark font-bold underline decoration-emerald-brand/40 underline-offset-4 hover:opacity-80 transition-opacity inline-flex items-center gap-0.5 mx-0.5"
          >
            <span>{linkTitle}</span>
            <ExternalLink className="w-3 h-3 inline ms-0.5" />
          </a>
        );
      }
    }

    // 2. خط عريض **نص**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {boldText}
        </strong>
      );
    }

    // 3. آية قرآنية ﴿...﴾
    if (part.startsWith('﴿') && part.endsWith('﴾')) {
      const quranUrl = getQuranComUrl(part);
      return (
        <a
          key={index}
          href={quranUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="اقرأ الآية وتفسيرها في Quran.com"
          className="font-quran font-bold text-gold-accent dark:text-amber-300 text-[1.12em] px-0.5 select-text hover:underline decoration-gold-accent/50 underline-offset-4 transition-colors"
        >
          {part}
        </a>
      );
    }

    // 4. حديث أو قول نبوي «...»
    if (part.startsWith('«') && part.endsWith('»')) {
      return (
        <span
          key={index}
          className="font-hadith font-semibold text-emerald-950 dark:text-emerald-200 px-0.5 text-[1.08em]"
        >
          {part}
        </span>
      );
    }

    // نص عادي
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * دالة مساعدة لتجزئة نصوص الرد إلى فقرات، وعناوين، وتنبيهات، وقوائم نقطية منسقة.
 */
function AssistantContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-3 text-sm sm:text-base leading-relaxed text-charcoal-light dark:text-charcoal-dark font-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // عناوين الماركداون ###
        if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4
              key={idx}
              className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white pt-2 pb-0.5 border-b border-subtle-light/40 dark:border-subtle-dark/40"
            >
              {renderRichMarkdown(headingText)}
            </h4>
          );
        }

        // تنبيهات هامة وقسم تثبّت
        if (trimmed.startsWith('⚠️') || trimmed.includes('تنبيه علمي')) {
          return (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-medium leading-relaxed my-2 flex items-start gap-2.5"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                {renderRichMarkdown(trimmed.replace(/^⚠️\s*/, ''))}
              </div>
            </div>
          );
        }

        // عناصر القوائم (• أو - أو * أو رقم.)
        if (
          trimmed.startsWith('•') ||
          trimmed.startsWith('-') ||
          trimmed.startsWith('* ') ||
          /^\d+\./.test(trimmed)
        ) {
          const listText = trimmed.replace(/^[•\-\*]|\d+\.\s*/, '').trim();
          return (
            <div key={idx} className="flex items-start gap-2.5 ps-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-brand shrink-0 mt-2.5" />
              <div className="flex-1 leading-[2.1]">
                {renderRichMarkdown(listText)}
              </div>
            </div>
          );
        }

        // فقرة عادية
        return (
          <p key={idx} className="leading-[2.1]">
            {renderRichMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function SunnahAssistant({ compact = false, onClose }: SunnahAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  // إغلاق وضع الشاشة الكاملة بـ Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // تعديل ارتفاع حقل الإدخال تلقائيًا
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }
  };

  const copyMessage = (id: string, text: string) => {
    // تنظيف الماركداون عند النسخ للحافظة
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: AssistantMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 20000);

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP_${res.status}`);
      }

      const data = await res.json();

      const cleanReply = (data.reply || '')
        .replace(/>\s*⚠️\s*\*\*تشخيص تقني.*$/gim, '')
        .replace(/تشخيص تقني مؤقت:.*$/gim, '')
        .trim();

      const assistantMsg: AssistantMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content:
          cleanReply ||
          'لم نجد نصاً مباشراً في هذا الموضوع ضمن قواعد بيانات الباحث في السنة المعتمدة حالياً.',
        sources: data.sources || [],
        dorarUrl: data.dorarUrl,
        isFakeWarning: data.sources?.some((s: AssistantSource) => s.type === 'fake-hadith'),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError' || abortController.signal.aborted;
      const errorMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: isTimeout
          ? 'تعذر استكمال الاتصال بالمساعد الذكي بسبب انتهاء المهلة المحددة (20 ثانية). يرجى المحاولة مرة أخرى أو التأكد من اتصالك بالإنترنت.'
          : 'تعذر استكمال الاتصال بالخدمة الذكية مؤقتاً. يرجى إعادة المحاولة أو التحقق من اتصالك بالإنترنت.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const getSourceIcon = (type: AssistantSource['type']) => {
    switch (type) {
      case 'nawawi':
        return <Scroll className="w-3.5 h-3.5 text-emerald-brand dark:text-emerald-brand-dark" />;
      case 'hisn':
        return <Sparkles className="w-3.5 h-3.5 text-gold-accent dark:text-amber-300" />;
      case 'seerah':
        return <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />;
      case 'fake-hadith':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'daily-tracker':
        return <CalendarCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-emerald-brand" />;
    }
  };

  // حاوية الشاشة الكاملة
  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-md p-4 sm:p-6 md:p-8 flex flex-col justify-between w-full h-screen overflow-hidden'
    : compact
    ? 'h-full max-h-[85vh] p-4 sm:p-5 rounded-3xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark shadow-xs flex flex-col justify-between overflow-hidden transition-all text-start w-full max-w-full'
    : 'p-4 sm:p-8 max-w-3xl mx-auto rounded-3xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark shadow-xs flex flex-col justify-between overflow-hidden transition-all text-start w-full max-w-full';

  return (
    <div className={containerClasses}>
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-subtle-light/60 dark:border-subtle-dark/60 pb-3 mb-3 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center shrink-0">
            <BrandLogoIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>الباحث الذكي في السنة</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-brand/10 text-emerald-brand dark:text-emerald-brand-dark border border-emerald-brand/20">
                RAG موثّق
              </span>
            </h3>
            <p className="text-[11px] text-muted-light dark:text-muted-dark">
              مكتبة موثّقة • أمانة علمية • محادثة عصرية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-xl text-xs text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-white border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/40 transition-colors flex items-center gap-1.5"
              title="بدء محادثة جديدة"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">محادثة جديدة</span>
            </button>
          )}

          {/* زر تكبير / تصغير الشاشة الكاملة */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-xl text-muted-light hover:text-charcoal-light hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة الكاملة'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-light hover:text-charcoal-light hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages List or Clean Welcome State */}
      <div
        className={`flex-1 overflow-y-auto space-y-5 pe-1 w-full max-w-full ${
          isFullscreen
            ? 'max-w-3xl mx-auto my-2 px-2'
            : compact
            ? 'min-h-[260px]'
            : messages.length > 0
            ? 'min-h-[300px] max-h-[500px]'
            : ''
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 sm:py-14 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center shadow-2xs">
              <BrandLogoIcon className="w-7 h-7" />
            </div>

            <div className="space-y-2 max-w-md mx-auto px-3">
              <h4 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                أهلاً بك في الباحث الذكي
              </h4>
              <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
                اسأل في الأحاديث الصحيحة وشروحها، أذكار اليوم والليلة، السيرة العطرة، أو تحقق من صحة أي حديث منتشر.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 w-full">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className="w-full">
                  {isUser ? (
                    // فقاعة رسالة المستخدم (Soft Bubble)
                    <div className="flex justify-end">
                      <div className="bg-emerald-brand text-white dark:bg-emerald-brand-dark dark:text-slate-950 px-4 py-2.5 rounded-2xl rounded-be-xs text-sm sm:text-base font-text max-w-[85%] sm:max-w-[75%] shadow-2xs break-words leading-relaxed">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    // رد المساعد المباشر والمنسق (Claude / Gemini Style)
                    <div className="flex items-start gap-3 w-full">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark shrink-0 flex items-center justify-center mt-1 p-1">
                        <BrandLogoIcon className="w-full h-full" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <AssistantContent content={m.content} />

                        {/* شرائح المصادر الموثّقة المدمجة (تظهر فقط عند وجود مصادر) */}
                        {m.sources && m.sources.length > 0 && (
                          <div className="pt-2 space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-brand dark:text-emerald-brand-dark block">
                              المصادر الموثّقة:
                            </span>

                            <div className="flex flex-wrap gap-2">
                              {m.sources.map((s, sIdx) => (
                                <Link
                                  key={sIdx}
                                  href={s.url}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/50 text-xs transition-colors group text-start shadow-2xs"
                                >
                                  <span className="shrink-0">{getSourceIcon(s.type)}</span>
                                  <span className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-brand transition-colors">
                                    {s.title}
                                  </span>
                                  <span className="text-[10px] text-muted-light dark:text-muted-dark">
                                    • {s.category}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* شريط الأدوات الخفيف (زر نسخ + التحقق في الدرر السنية) */}
                        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-light dark:text-muted-dark">
                          <button
                            onClick={() => copyMessage(m.id, m.content)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[11px]"
                            title="نسخ الإجابة"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-semibold">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>

                          {m.dorarUrl && (
                            <a
                              href={m.dorarUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-brand dark:text-emerald-brand-dark hover:underline font-semibold"
                            >
                              <span>التحقق في الدرر السنية</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* مؤشر التحميل الأنيق (3 نقاط نابضة) */}
            {isLoading && (
              <div className="flex items-start gap-3 w-full animate-in fade-in">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark shrink-0 flex items-center justify-center mt-1 p-1">
                  <BrandLogoIcon className="w-full h-full" />
                </div>
                <div className="flex items-center gap-1.5 py-3 px-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-brand animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-brand animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-brand animate-bounce" />
                  <span className="text-xs text-muted-light dark:text-muted-dark ms-2 font-text">
                    جاري التفكير وصياغة الرد الموثّق...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Composer (Input Form + Quick Suggestions in Welcome State) */}
      <div
        className={`mt-3 pt-3 border-t border-subtle-light/60 dark:border-subtle-dark/60 space-y-2.5 w-full ${
          isFullscreen ? 'max-w-3xl mx-auto' : ''
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-end gap-2 p-1.5 sm:p-2 rounded-3xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark focus-within:ring-2 focus-within:ring-emerald-brand/30 shadow-xs transition-all w-full"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="اسأل المساعد في الحديث، الأذكار، السيرة، أو صحة حديث..."
            disabled={isLoading}
            className="flex-1 py-2 ps-3.5 pe-2 bg-transparent text-xs sm:text-sm md:text-base text-slate-900 dark:text-white placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-hidden font-sans resize-none max-h-36 leading-relaxed"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-brand text-white flex items-center justify-center shrink-0 hover:bg-emerald-brand/90 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-xs active:scale-95"
            title="إرسال (Enter)"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </form>

        {/* الاقتراحات السريعة (تظهر فقط في البداية عندما messages.length === 0) */}
        {messages.length === 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-full bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/40 text-[11px] sm:text-xs text-muted-light hover:text-charcoal-light dark:text-muted-dark dark:hover:text-white font-medium transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-start shadow-2xs"
              >
                «{prompt}»
              </button>
            ))}
          </div>
        )}

        {/* Disclaimer Footer */}
        <p className="text-center text-[10px] text-muted-light/80 dark:text-muted-dark/80 font-text pt-0.5">
          إجابات مستندة إلى نصوص السنة والأذكار والسيرة الموثقة • للتحقق الموسع: الدرر السنية
        </p>
      </div>
    </div>
  );
}
