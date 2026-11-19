'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Loader2,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  BookOpen,
  ArrowRight,
  Scroll,
  CalendarCheck,
  Compass,
  Check,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { FormattedArabicText } from './FormattedArabicText';

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
  'دعاء الهم والحزن',
  'هل حديث اطلبوا العلم ولو بالصين صحيح؟',
  'أذكار قبل النوم',
  'ملخص غزوة بدر',
];

interface SunnahAssistantProps {
  compact?: boolean;
  onClose?: () => void;
}

/**
 * دالة مساعدة لتنسيق وتجزئة نصوص الرد إلى فقرات، وأحاديث «...»، وآيات ﴿...﴾، وقوائم نقطية.
 */
function AssistantContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-2.5 text-sm sm:text-base leading-relaxed text-charcoal-light dark:text-charcoal-dark font-text">
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
              {headingText}
            </h4>
          );
        }

        // تنبيهات هامة
        if (trimmed.startsWith('⚠️') || trimmed.includes('تنبيه علمي')) {
          return (
            <div
              key={idx}
              className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium leading-relaxed my-2"
            >
              <FormattedArabicText text={trimmed} />
            </div>
          );
        }

        // عناصر القوائم
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
          const listText = trimmed.replace(/^[•\-\d.]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 ps-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-brand shrink-0 mt-2.5" />
              <div className="flex-1">
                <FormattedArabicText text={listText} />
              </div>
            </div>
          );
        }

        // فقرة عادية
        return (
          <p key={idx} className="leading-[2.1]">
            <FormattedArabicText text={trimmed} />
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
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
    setIsLoading(true);

    try {
      // إرسال طلب المحادثة إلى مسار API بـ trailing slash (لأن trailingSlash: true)
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
      });

      if (!res.ok) {
        throw new Error(`خطأ في الاتصال بالخادم (${res.status})`);
      }

      const data = await res.json();

      const assistantMsg: AssistantMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          'لم نجد نصاً مباشراً في هذا الموضوع ضمن قواعد بيانات المنصة الموثقة الحالية.',
        sources: data.sources || [],
        dorarUrl: data.dorarUrl,
        isFakeWarning: data.sources?.some((s: AssistantSource) => s.type === 'fake-hadith'),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          'تعذر استكمال الاتصال بالخدمة الذكية مؤقتاً. يرجى إعادة المحاولة أو التحقق من اتصالك بالإنترنت.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
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

  return (
    <div
      className={`rounded-3xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark shadow-xs flex flex-col justify-between overflow-hidden transition-all text-start ${
        compact ? 'h-full max-h-[85vh] p-4 sm:p-5' : 'p-5 sm:p-8 max-w-3xl mx-auto'
      }`}
    >
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-subtle-light/60 dark:border-subtle-dark/60 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>المساعد النبوي الذكي</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-brand/10 text-emerald-brand dark:text-emerald-brand-dark">
                RAG موثّق
              </span>
            </h3>
            <p className="text-[11px] text-muted-light dark:text-muted-dark">
              مكتبة موثّقة • أمانة علمية • ربط بالدرر السنية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-xl text-xs text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-white border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/40 transition-colors flex items-center gap-1.5"
              title="بدء محادثة جديدة"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[11px] font-medium hidden sm:inline">محادثة جديدة</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-light hover:text-charcoal-light hover:bg-black/5 dark:hover:bg-white/5"
              title="إغلاق النافذة"
            >
              <span className="text-lg leading-none">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages List or Empty State */}
      <div
        className={`flex-1 overflow-y-auto space-y-4 pe-1 ${
          compact ? 'min-h-[260px]' : messages.length > 0 ? 'min-h-[300px] max-h-[500px]' : ''
        }`}
      >
        {messages.length === 0 ? (
          <div className="text-center py-6 sm:py-8 space-y-4">
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h4 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                بماذا يمكنني أن أعينك في هدي النبوة اليوم؟
              </h4>
              <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
                اسأل في الأحاديث الصحيحة، الأدعية والأذكار، مواقف السيرة النبوية، أو تحقق من صحة أي حديث منتشر.
              </p>
            </div>

            {/* Quick Prompts Pills */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-muted-light dark:text-muted-dark block mb-2">
                جرّب السؤال بنقرة واحدة:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/50 text-xs text-charcoal-light dark:text-charcoal-dark font-medium transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    «{prompt}»
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col space-y-2 animate-in fade-in duration-200 ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender label */}
                  <span className="text-[10px] font-semibold text-muted-light dark:text-muted-dark px-1">
                    {isUser ? 'سؤالك' : 'إجابة المساعد النبوي'}
                  </span>

                  {/* Bubble */}
                  <div
                    className={`p-4 rounded-3xl max-w-[90%] sm:max-w-[85%] ${
                      isUser
                        ? 'bg-emerald-brand text-white rounded-te-xs shadow-xs text-sm sm:text-base'
                        : 'bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark rounded-ts-xs shadow-2xs space-y-3'
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed font-medium">{m.content}</p>
                    ) : (
                      <>
                        <AssistantContent content={m.content} />

                        {/* Verified Sources Cards */}
                        {m.sources && m.sources.length > 0 && (
                          <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 space-y-2">
                            <span className="text-[11px] font-bold text-emerald-brand dark:text-emerald-brand-dark block">
                              المصادر الموثّقة المستند إليها:
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {m.sources.map((s, sIdx) => (
                                <Link
                                  key={sIdx}
                                  href={s.url}
                                  className="p-2.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/60 transition-colors flex items-start gap-2 group text-xs"
                                >
                                  <div className="p-1 rounded-lg bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 shrink-0 mt-0.5">
                                    {getSourceIcon(s.type)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-bold text-emerald-brand dark:text-emerald-brand-dark">
                                        {s.category}
                                      </span>
                                    </div>
                                    <h5 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-brand transition-colors">
                                      {s.title}
                                    </h5>
                                    <p className="text-[10px] text-muted-light dark:text-muted-dark truncate">
                                      {s.source}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons (Copy + Dorar) */}
                        <div className="flex items-center justify-between pt-1 text-xs text-muted-light dark:text-muted-dark">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => copyMessage(m.id, m.content)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[11px]"
                              title="نسخ الإجابة"
                            >
                              {copiedId === m.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-semibold">تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>نسخ</span>
                                </>
                              )}
                            </button>
                          </div>

                          {m.dorarUrl && (
                            <a
                              href={m.dorarUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-brand hover:underline font-semibold"
                            >
                              <span>التحقق في الدرر السنية</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start space-y-1.5 animate-in fade-in">
                <span className="text-[10px] font-semibold text-muted-light dark:text-muted-dark px-1">
                  المساعد النبوي
                </span>
                <div className="p-3.5 rounded-3xl rounded-ts-xs bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark flex items-center gap-2.5 text-xs text-muted-light dark:text-muted-dark">
                  <Loader2 className="w-4 h-4 text-emerald-brand animate-spin" />
                  <span>جاري البحث في مصادر المنصة الموثّقة وصياغة الرد...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Input Form */}
      <div className="mt-4 pt-3 border-t border-subtle-light/60 dark:border-subtle-dark/60 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center shadow-xs rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark focus-within:ring-2 focus-within:ring-emerald-brand transition-all overflow-hidden"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسأل المساعد في الحديث، الأذكار، السيرة، أو صحة حديث..."
            disabled={isLoading}
            className="w-full py-3.5 ps-4 pe-14 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-hidden font-sans"
          />

          <div className="absolute end-2">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl bg-emerald-brand text-white flex items-center justify-center hover:bg-emerald-brand/90 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-2xs group"
              title="إرسال السؤال"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 rtl:rotate-180 group-hover:scale-105 transition-transform" />
              )}
            </button>
          </div>
        </form>

        {/* Disclaimer Footer */}
        <p className="text-center text-[11px] text-muted-light/80 dark:text-muted-dark/80 font-text">
          إجابات من مكتبة المنصة الموثّقة فقط • ليس مفتيًا شرعيًا
        </p>
      </div>
    </div>
  );
}
