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
  Mic,
  MicOff,
  History,
  Trash2,
  Plus,
} from 'lucide-react';
import { getQuranComUrl } from '@/lib/external-refs';
import { BrandLogoIcon } from './BrandLogo';

export type AssistantMode = 'all' | 'adhkar' | 'seerah' | 'hadith' | 'general';

export interface ExternalSourceLink {
  name: string;
  badge: string;
  url: string;
}

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
  externalSources?: ExternalSourceLink[];
  dorarUrl?: string;
  isFakeWarning?: boolean;
}

export interface SavedConversation {
  id: string;
  title: string;
  createdAt: number;
  messages: AssistantMessage[];
  mode?: AssistantMode;
}

const STORAGE_KEY = 'sunnah_assistant_conversations_v2';
const CURRENT_ID_KEY = 'sunnah_assistant_current_conv_id';

const SCOPE_MODES: { id: AssistantMode; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'adhkar', label: 'الأذكار' },
  { id: 'seerah', label: 'السيرة' },
  { id: 'hadith', label: 'الحديث' },
  { id: 'general', label: 'معلومات عامة' },
];

const QUICK_PROMPTS = [
  'دعاء لبس ثوب جديد',
  'شرح حديث إنما الأعمال بالنيات',
  'أذكار الاستيقاظ والنوم من حصن المسلم',
  'هل حديث اطلبوا العلم ولو بالصين صحيح؟',
];

interface SunnahAssistantProps {
  compact?: boolean;
  onClose?: () => void;
}

/**
 * دالة آمنة لتحويل نصوص Markdown البسيطة ([روابط]، **خط عريض**، *مائل*، «أحاديث»، ﴿آيات﴾)
 * إلى عناصر React تفاعلية دون ظهور رموز الماركداون الخام.
 */
function renderRichMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Regex لالتقاط: الروابط [title](url)، والخط العريض **bold**، والخط المائل *(italic)* أو *italic*، والآيات ﴿...﴾، والأقوال «...»
  const TOKEN_REGEX =
    /((?:\[[^\]]+\]\([^)]+\))|(?:\*\*[^*]+\*\*)|(?:\*(?:\([^)]+\)|[^*]+)\*)|(?:﴿[^﴾]+﴾)|(?:«[^»]+»))/g;

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

    // 3. خط مائل وتخريج بين نجوم *(نص)* أو *نص* دون ظهور النجوم الخام
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const italicText = part.slice(1, -1);
      return (
        <span
          key={index}
          className="text-xs sm:text-sm text-muted-light dark:text-muted-dark font-medium italic px-0.5"
        >
          {italicText}
        </span>
      );
    }

    // 4. آية قرآنية ﴿...﴾
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

    // 5. حديث أو قول نبوي «...»
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
          trimmed.startsWith('- ') ||
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
  const [selectedMode, setSelectedMode] = useState<AssistantMode>('all');

  // سجل المحادثات (localStorage)
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // التعرف الصوتي (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

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

  // تحميل المحادثات السابقة من localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedConversation[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedConversations(parsed);
          const activeId = localStorage.getItem(CURRENT_ID_KEY);
          if (activeId) {
            const found = parsed.find((c) => c.id === activeId);
            if (found && Array.isArray(found.messages) && found.messages.length > 0) {
              setCurrentConvId(found.id);
              setMessages(found.messages);
              if (found.mode) setSelectedMode(found.mode);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // إعداد التعرف الصوتي Web Speech API باللغة العربية
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event?.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setInput((prev) => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
            if (textareaRef.current) {
              setTimeout(() => {
                textareaRef.current?.focus();
                adjustTextareaHeight();
              }, 50);
            }
          }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // إغلاق وضع الشاشة الكاملة بـ Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (historyOpen) {
          setHistoryOpen(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, historyOpen]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }
  };

  // تحديث وحفظ المحادثة في localStorage
  const persistConversation = (newMessages: AssistantMessage[], convId?: string) => {
    if (newMessages.length === 0) return;

    setSavedConversations((prev) => {
      const targetId = convId || currentConvId || `conv-${Date.now()}`;
      const firstUserMsg = newMessages.find((m) => m.role === 'user');
      const title =
        firstUserMsg?.content.slice(0, 36) +
        ((firstUserMsg?.content.length || 0) > 36 ? '...' : '') ||
        'محادثة جديدة';

      const existingIndex = prev.findIndex((c) => c.id === targetId);
      let updated: SavedConversation[];

      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          messages: newMessages,
          mode: selectedMode,
        };
      } else {
        const newConv: SavedConversation = {
          id: targetId,
          title,
          createdAt: Date.now(),
          messages: newMessages,
          mode: selectedMode,
        };
        updated = [newConv, ...prev];
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 30)));
        localStorage.setItem(CURRENT_ID_KEY, targetId);
      } catch {
        // ignore
      }

      if (!currentConvId) {
        setCurrentConvId(targetId);
      }

      return updated;
    });
  };

  const copyMessage = (id: string, text: string) => {
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const userMessageId = `user-${Date.now()}`;
    const userMsg: AssistantMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
    };

    const targetConvId = currentConvId || `conv-${Date.now()}`;
    if (!currentConvId) {
      setCurrentConvId(targetConvId);
    }

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    persistConversation(nextMessages, targetConvId);

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // مهلة 30 ثانية لاستيعاب رد السيرفر بأمان مع الاحتياطي المزدوج

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          mode: selectedMode,
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
        externalSources: data.externalSources || [],
        dorarUrl: data.dorarUrl,
        isFakeWarning: data.sources?.some((s: AssistantSource) => s.type === 'fake-hadith'),
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      persistConversation(finalMessages, targetConvId);
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError' || abortController.signal.aborted;
      const errorMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: isTimeout
          ? 'تعذر استكمال الاتصال بالمساعد الذكي بسبب بطء شبكة الاتصال. يرجى إعادة المحاولة أو التحقق من اتصالك بالإنترنت.'
          : 'تعذر استكمال الاتصال بالخدمة الذكية مؤقتاً. يرجى إعادة المحاولة أو التحقق من اتصالك بالإنترنت.',
      };
      const finalMessages = [...nextMessages, errorMsg];
      setMessages(finalMessages);
      persistConversation(finalMessages, targetConvId);
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
    setCurrentConvId(null);
    try {
      localStorage.removeItem(CURRENT_ID_KEY);
    } catch {
      // ignore
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const loadConversation = (conv: SavedConversation) => {
    setCurrentConvId(conv.id);
    setMessages(conv.messages);
    if (conv.mode) setSelectedMode(conv.mode);
    setHistoryOpen(false);
    try {
      localStorage.setItem(CURRENT_ID_KEY, conv.id);
    } catch {
      // ignore
    }
  };

  const deleteConversation = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    setSavedConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== convId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        if (currentConvId === convId) {
          localStorage.removeItem(CURRENT_ID_KEY);
          setCurrentConvId(null);
          setMessages([]);
        }
      } catch {
        // ignore
      }
      return filtered;
    });
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

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-paper-light dark:bg-paper-dark p-4 sm:p-6 md:p-8 flex flex-col justify-between w-full h-screen overflow-hidden'
    : compact
    ? 'relative h-full max-h-[85vh] p-4 sm:p-5 rounded-3xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark shadow-xs flex flex-col justify-between overflow-hidden transition-all text-start w-full max-w-full'
    : 'relative p-4 sm:p-8 max-w-3xl mx-auto rounded-3xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark shadow-xs flex flex-col justify-between overflow-hidden transition-all text-start w-full max-w-full';

  return (
    <div className={containerClasses}>
      {/* درج / شريط المحادثات السابقة الجانبي */}
      {historyOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
          <div className="w-72 sm:w-80 h-full bg-paper-light dark:bg-paper-dark border-e border-subtle-light dark:border-subtle-dark shadow-2xl p-4 flex flex-col justify-between animate-in slide-in-from-start duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-subtle-light dark:border-subtle-dark pb-3">
                <div className="flex items-center gap-2 text-sm font-bold font-display text-slate-900 dark:text-white">
                  <History className="w-4 h-4 text-emerald-brand" />
                  <span>سجل المحادثات</span>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="p-1 rounded-lg text-muted-light hover:text-charcoal-light hover:bg-black/5 dark:hover:bg-white/5"
                  title="إغلاق السجل"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  handleReset();
                  setHistoryOpen(false);
                }}
                className="w-full py-2 px-3 rounded-2xl bg-emerald-brand/10 hover:bg-emerald-brand/15 text-emerald-brand dark:text-emerald-brand-dark font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-brand/20"
              >
                <Plus className="w-4 h-4" />
                <span>محادثة جديدة</span>
              </button>

              <div className="overflow-y-auto max-h-[60vh] space-y-1.5 pe-1">
                {savedConversations.length === 0 ? (
                  <p className="text-center py-8 text-xs text-muted-light dark:text-muted-dark">
                    لا توجد محادثات سابقة حتى الآن.
                  </p>
                ) : (
                  savedConversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversation(c)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                        c.id === currentConvId
                          ? 'bg-emerald-brand text-white font-semibold'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 text-charcoal-light dark:text-charcoal-dark'
                      }`}
                    >
                      <div className="truncate flex-1 pe-2">
                        <p className="truncate">{c.title}</p>
                        <span
                          className={`text-[10px] block mt-0.5 ${
                            c.id === currentConvId
                              ? 'text-white/80'
                              : 'text-muted-light dark:text-muted-dark'
                          }`}
                        >
                          {new Date(c.createdAt).toLocaleDateString('ar-SA', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(e, c.id)}
                        className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                          c.id === currentConvId
                            ? 'hover:bg-white/20 text-white'
                            : 'hover:bg-rose-500/10 text-muted-light hover:text-rose-500'
                        }`}
                        title="حذف المحادثة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="text-[10px] text-center text-muted-light dark:text-muted-dark pt-3 border-t border-subtle-light dark:border-subtle-dark">
              يتم حفظ المحادثات محلياً على جهازك
            </p>
          </div>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex items-center justify-between border-b border-subtle-light/60 dark:border-subtle-dark/60 pb-3 mb-3 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center shrink-0">
            <BrandLogoIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              الباحث الذكي في السنة
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* زر سجل المحادثات */}
          <button
            onClick={() => setHistoryOpen(true)}
            className="p-1.5 rounded-xl text-muted-light hover:text-charcoal-light hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative"
            title="سجل المحادثات السابقة"
          >
            <History className="w-4 h-4" />
            {savedConversations.length > 0 && (
              <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-emerald-brand" />
            )}
          </button>

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
        className={`flex-1 overflow-y-auto space-y-6 pe-1 w-full max-w-full ${
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

            <div className="max-w-md mx-auto px-3">
              <h4 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                أهلاً بك في الباحث الذكي
              </h4>
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
                    // رد المساعد المباشر والمنسق
                    <div className="flex items-start gap-3 w-full">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark shrink-0 flex items-center justify-center mt-1 p-1">
                        <BrandLogoIcon className="w-full h-full" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        <AssistantContent content={m.content} />

                        {/* شرائح المصادر الموثّقة الداخلية في المنصة */}
                        {m.sources && m.sources.length > 0 && (
                          <div className="pt-2 space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-brand dark:text-emerald-brand-dark block">
                              المصادر الموثّقة بالمنصة:
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

                        {/* شريط المصادر الخارجية المعتمدة المخصّصة */}
                        {m.externalSources && m.externalSources.length > 0 && (
                          <div className="pt-2.5 border-t border-subtle-light/40 dark:border-subtle-dark/40 space-y-1.5">
                            <span className="text-[11px] font-bold text-muted-light dark:text-muted-dark block">
                              ابحث وتوسّع في المصادر الموثّقة:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {m.externalSources.map((ext, idx) => (
                                <a
                                  key={idx}
                                  href={ext.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/50 text-[11px] text-slate-800 dark:text-slate-200 transition-colors shadow-2xs group"
                                >
                                  <span className="font-semibold group-hover:text-emerald-brand transition-colors">
                                    {ext.name}
                                  </span>
                                  <span className="text-[10px] text-muted-light dark:text-muted-dark">
                                    • {ext.badge}
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-muted-light group-hover:text-emerald-brand ms-0.5" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* شريط الأدوات الخفيف (زر نسخ) */}
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
                    جاري استرجاع النصوص وصياغة البيان الموثّق...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Composer (Input Form + Scope Pills + Mic) */}
      <div
        className={`mt-3 pt-3 border-t border-subtle-light/60 dark:border-subtle-dark/60 space-y-2.5 w-full ${
          isFullscreen ? 'max-w-3xl mx-auto' : ''
        }`}
      >
        {/* أزرار اختيار النطاق (Scope Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          <span className="text-[10px] font-bold text-muted-light dark:text-muted-dark shrink-0 me-1">
            نطاق البحث:
          </span>
          {SCOPE_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setSelectedMode(mode.id)}
              className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 font-sans ${
                selectedMode === mode.id
                  ? 'bg-emerald-brand text-white shadow-2xs font-semibold'
                  : 'bg-paper-light dark:bg-paper-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light border border-subtle-light dark:border-subtle-dark'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* حقل الإدخال الكبسولي */}
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
            placeholder={
              isListening
                ? 'جاري الاستماع لحديثك باللغة العربية...'
                : 'اسأل في الأحاديث، الأذكار، السيرة، أو صحة حديث...'
            }
            disabled={isLoading}
            className="flex-1 py-2 ps-3.5 pe-2 bg-transparent text-xs sm:text-sm md:text-base text-slate-900 dark:text-white placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-hidden font-sans resize-none max-h-36 leading-relaxed"
          />

          {/* زر الميكروفون الصوتي باللغة العربية */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-400'
                  : 'text-muted-light hover:text-charcoal-light hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={isListening ? 'إيقاف التسجيل الصوتي' : 'التحدث بالصوت (العربية)'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          )}

          {/* زر الإرسال */}
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
      </div>
    </div>
  );
}
