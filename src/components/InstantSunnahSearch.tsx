'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Mic,
  MicOff,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Scroll,
  Sparkles,
  Compass,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import {
  executeInstantSearch,
  SearchResults,
  QuranVerseMatch,
  FakeHadithMatch,
  DhikrMatch,
  NawawiMatch,
  SeerahMatch,
} from '@/lib/instant-search';
import { HighlightArabicText } from '@/lib/arabic-search';
import { HadithText } from './HadithText';

type FilterTab = 'all' | 'quran' | 'adhkar' | 'nawawi' | 'seerah' | 'fake';

const QUICK_SUGGESTIONS = [
  'سورة الكوثر',
  'آية الكرسي',
  'دعاء لبس ثوب جديد',
  'غزوة بدر',
  'اطلبوا العلم ولو بالصين',
];

export function InstantSunnahSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [, startTransition] = useTransition();

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // فحص دعم التعرف الصوتي في المتصفح
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
          const text = event.results?.[0]?.[0]?.transcript || '';
          if (text) {
            setQuery(text);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
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

  // تأخير إجرائي (Debounce 150ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // تنفيذ البحث الفوري المحلي
  useEffect(() => {
    startTransition(() => {
      if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
        setResults(null);
      } else {
        const res = executeInstantSearch(debouncedQuery);
        setResults(res);
      }
    });
  }, [debouncedQuery]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setResults(null);
    inputRef.current?.focus();
  };

  const hasResults = results && results.totalCount > 0;
  const isSearching = query.trim().length >= 2;

  // إحصائيات التبويبات
  const tabCounts = {
    all: results ? results.totalCount : 0,
    quran: results ? results.quran.length : 0,
    adhkar: results ? results.adhkar.length : 0,
    nawawi: results ? results.nawawi.length : 0,
    seerah: results ? results.seerah.length : 0,
    fake: results ? results.fakeHadiths.length : 0,
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 text-start">
      {/* 1. حقل الإدخال الكبسولي الفوري */}
      <div className="relative">
        <div className="relative flex items-center rounded-full bg-paper-light dark:bg-paper-dark border border-subtle-light/90 dark:border-subtle-dark/90 focus-within:border-[#9E6B2B] dark:focus-within:border-[#D4A359] focus-within:ring-1 focus-within:ring-[#9E6B2B]/20 dark:focus-within:ring-[#D4A359]/20 transition-all p-1.5 sm:p-2 shadow-xs">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-muted-light dark:text-muted-dark shrink-0 ms-1">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#9E6B2B] dark:text-[#D4A359]" strokeWidth={1.8} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isListening
                ? 'جاري الاستماع لصوتك باللغة العربية...'
                : 'ابحث فوريًا: سورة، آية، حديث، ذكر، أو حدث في السيرة...'
            }
            className="flex-1 py-2 ps-2 pe-3 bg-transparent text-sm sm:text-base text-charcoal-light dark:text-charcoal-dark placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-hidden font-sans"
          />

          {/* زر المسح عند وجود نص */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-full text-muted-light hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors me-1"
              title="مسح البحث"
            >
              <X className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}

          {/* زر الميكروفون الصوتي باللغة العربية */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all me-0.5 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                  : 'text-muted-light hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={isListening ? 'إيقاف التسجيل' : 'البحث بالصوت (العربية)'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.8} />
              ) : (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.8} />
              )}
            </button>
          )}
        </div>

        {/* اقتراحات البحث السريعة (تظهر فقط عندما تكون الخانة فارغة) */}
        {!query.trim() && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3">
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="px-3 py-1 rounded-full bg-surface-light dark:bg-surface-dark border border-subtle-light/70 dark:border-subtle-dark/70 hover:border-[#9E6B2B]/40 dark:hover:border-[#D4A359]/40 text-xs text-muted-light hover:text-charcoal-light dark:text-muted-dark dark:hover:text-charcoal-dark transition-colors font-sans"
              >
                «{suggestion}»
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. تبويبات التصفية (تظهر أثناء وجود نص بحث) */}
      {isSearching && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-subtle-light/60 dark:border-subtle-dark/60">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#121B28] dark:bg-[#D4A359] text-[#F7F4EE] dark:text-[#0F141B] font-semibold'
                : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
            }`}
          >
            الكل ({tabCounts.all})
          </button>

          {tabCounts.quran > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('quran')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                activeTab === 'quran'
                  ? 'bg-[#121B28] dark:bg-[#D4A359] text-[#F7F4EE] dark:text-[#0F141B] font-semibold'
                  : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
              }`}
            >
              القرآن ({tabCounts.quran})
            </button>
          )}

          {tabCounts.fake > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('fake')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                activeTab === 'fake'
                  ? 'bg-rose-700 text-white font-semibold'
                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
              }`}
            >
              فحص حديث ({tabCounts.fake})
            </button>
          )}

          {tabCounts.adhkar > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('adhkar')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                activeTab === 'adhkar'
                  ? 'bg-[#121B28] dark:bg-[#D4A359] text-[#F7F4EE] dark:text-[#0F141B] font-semibold'
                  : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
              }`}
            >
              الأذكار ({tabCounts.adhkar})
            </button>
          )}

          {tabCounts.nawawi > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('nawawi')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                activeTab === 'nawawi'
                  ? 'bg-[#121B28] dark:bg-[#D4A359] text-[#F7F4EE] dark:text-[#0F141B] font-semibold'
                  : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
              }`}
            >
              الأربعون النووية ({tabCounts.nawawi})
            </button>
          )}

          {tabCounts.seerah > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('seerah')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                activeTab === 'seerah'
                  ? 'bg-[#121B28] dark:bg-[#D4A359] text-[#F7F4EE] dark:text-[#0F141B] font-semibold'
                  : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
              }`}
            >
              السيرة ({tabCounts.seerah})
            </button>
          )}
        </div>
      )}

      {/* 3. قائمة نتائج البحث الفورية */}
      {isSearching && (
        <div className="space-y-4">
          {!hasResults ? (
            <div className="p-8 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light/70 dark:border-subtle-dark/70 text-center space-y-2">
              <p className="text-sm font-semibold text-charcoal-light dark:text-charcoal-dark">
                لم نجد نصًا مباشرًا يطابق «{query}» في قواعد البيانات الخمس المحلية.
              </p>
              <p className="text-xs text-muted-light dark:text-muted-dark">
                يمكنك التوسع في البحث عبر مصادر التحقيق المعتمدة أدناه.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* أ. بطاقة التحذير العلمي من الأحاديث التي لا تصح (تتصدر دائماً عند التطابق) */}
              {(activeTab === 'all' || activeTab === 'fake') &&
                results.fakeHadiths.map((fake) => (
                  <div
                    key={`fake-${fake.id}`}
                    className="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/30 dark:border-rose-500/40 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-rose-500/20 pb-2.5">
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm font-display">
                        <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                        <span>تنبيه علمي في صيانة الحديث • الدرر السنية</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300">
                        <HighlightArabicText text={fake.ruling} query={debouncedQuery} />
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-text text-charcoal-light dark:text-charcoal-dark leading-relaxed font-semibold">
                      <HighlightArabicText text={fake.hadithText} query={debouncedQuery} />
                    </p>

                    {fake.explanation && (
                      <p className="text-xs text-muted-light dark:text-muted-dark font-text leading-relaxed">
                        <HighlightArabicText text={fake.explanation} query={debouncedQuery} />
                      </p>
                    )}

                    <div className="pt-2 border-t border-rose-500/15 flex items-center justify-between text-xs">
                      <a
                        href={fake.dorarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400 hover:underline font-medium"
                      >
                        <span>التحقق في الموسوعة الحديثية (الدرر السنية)</span>
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.6} />
                      </a>
                    </div>
                  </div>
                ))}

              {/* ب. نتائج القرآن الكريم */}
              {(activeTab === 'all' || activeTab === 'quran') &&
                results.quran.map((item, idx) => (
                  <div
                    key={`quran-${item.surahNumber}-${item.ayahNumber}-${idx}`}
                    className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light/70 dark:border-subtle-dark/70 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-subtle-light/50 dark:border-subtle-dark/50 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#9E6B2B] dark:text-[#D4A359]" strokeWidth={1.8} />
                        <span className="font-bold text-[#9E6B2B] dark:text-[#D4A359] font-display">
                          سورة {item.surahName} • آية {item.ayahNumber}
                        </span>
                        {item.isFamous && (
                          <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                            {item.isFamous}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `q-${item.surahNumber}-${item.ayahNumber}`,
                              `﴿${item.text}﴾ [سورة ${item.surahName}: ${item.ayahNumber}]`
                            )
                          }
                          className="p-1 rounded-md text-muted-light hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          title="نسخ الآية"
                        >
                          {copiedId === `q-${item.surahNumber}-${item.ayahNumber}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="font-quran text-lg sm:text-xl text-charcoal-light dark:text-charcoal-dark leading-loose font-medium">
                      ﴿ <HighlightArabicText text={item.text} query={debouncedQuery} /> ﴾
                    </p>

                    <div className="pt-1 flex items-center justify-end text-xs">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#9E6B2B] dark:text-[#D4A359] hover:underline font-medium"
                      >
                        <span>تفسير الآية وترجمتها (Quran.com)</span>
                        <ExternalLink className="w-3 h-3" strokeWidth={1.6} />
                      </a>
                    </div>
                  </div>
                ))}

              {/* ج. نتائج حصن المسلم */}
              {(activeTab === 'all' || activeTab === 'adhkar') &&
                results.adhkar.map((item, idx) => (
                  <div
                    key={`adhkar-${item.categoryId}-${item.dhikrId}-${idx}`}
                    className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light/70 dark:border-subtle-dark/70 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-subtle-light/50 dark:border-subtle-dark/50 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#9E6B2B] dark:text-[#D4A359]" strokeWidth={1.8} />
                        <span className="font-bold text-charcoal-light dark:text-charcoal-dark font-display">
                          <HighlightArabicText text={item.categoryTitle} query={debouncedQuery} />
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-light dark:text-muted-dark">
                          التكرار: {item.count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`adhkar-${item.categoryId}-${item.dhikrId}`, item.text)}
                          className="p-1 rounded-md text-muted-light hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          title="نسخ الذكر"
                        >
                          {copiedId === `adhkar-${item.categoryId}-${item.dhikrId}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <p className="font-hadith text-base sm:text-lg text-charcoal-light dark:text-charcoal-dark leading-loose">
                      <HighlightArabicText text={item.text} query={debouncedQuery} />
                    </p>

                    <div className="pt-2 border-t border-subtle-light/50 dark:border-subtle-dark/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-light dark:text-muted-dark">
                      <span className="text-[11px]">{item.reference}</span>
                      <Link
                        href={item.url}
                        className="inline-flex items-center gap-1 text-[#9E6B2B] dark:text-[#D4A359] hover:underline font-medium"
                      >
                        <span>فتح الباب في حصن المسلم</span>
                        <ArrowLeft className="w-3 h-3" strokeWidth={1.6} />
                      </Link>
                    </div>
                  </div>
                ))}

              {/* د. نتائج الأربعين النووية */}
              {(activeTab === 'all' || activeTab === 'nawawi') &&
                results.nawawi.map((item) => (
                  <div
                    key={`nawawi-${item.id}`}
                    className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light/70 dark:border-subtle-dark/70 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-subtle-light/50 dark:border-subtle-dark/50 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Scroll className="w-3.5 h-3.5 text-[#9E6B2B] dark:text-[#D4A359]" strokeWidth={1.8} />
                        <span className="font-bold text-charcoal-light dark:text-charcoal-dark font-display">
                          الأربعون النووية • الحديث {item.id}: <HighlightArabicText text={item.title} query={debouncedQuery} />
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(`nawawi-${item.id}`, item.text)}
                        className="p-1 rounded-md text-muted-light hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title="نسخ الحديث"
                      >
                        {copiedId === `nawawi-${item.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="py-1">
                      <HadithText text={item.text} highlightQuery={debouncedQuery} className="text-base sm:text-lg leading-loose" />
                    </div>

                    <div className="pt-2 border-t border-subtle-light/50 dark:border-subtle-dark/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-light dark:text-muted-dark">
                      <div className="flex items-center gap-2">
                        <span>الراوي: {item.narrator}</span>
                        <span>• {item.source}</span>
                      </div>
                      <Link
                        href={item.url}
                        className="inline-flex items-center gap-1 text-[#9E6B2B] dark:text-[#D4A359] hover:underline font-medium"
                      >
                        <span>تصفح وشرح الحديث</span>
                        <ArrowLeft className="w-3 h-3" strokeWidth={1.6} />
                      </Link>
                    </div>
                  </div>
                ))}

              {/* هـ. نتائج السيرة النبوية */}
              {(activeTab === 'all' || activeTab === 'seerah') &&
                results.seerah.map((item) => (
                  <div
                    key={`seerah-${item.id}`}
                    className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light/70 dark:border-subtle-dark/70 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-subtle-light/50 dark:border-subtle-dark/50 pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Compass className="w-3.5 h-3.5 text-[#9E6B2B] dark:text-[#D4A359]" strokeWidth={1.8} />
                        <span className="font-bold text-charcoal-light dark:text-charcoal-dark font-display">
                          <HighlightArabicText text={item.title} query={debouncedQuery} />
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-light dark:text-muted-dark font-sans">
                        {item.hijriDate}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-text text-charcoal-light dark:text-charcoal-dark leading-relaxed">
                      <HighlightArabicText text={item.summary} query={debouncedQuery} />
                    </p>

                    <div className="pt-2 border-t border-subtle-light/50 dark:border-subtle-dark/50 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-light dark:text-muted-dark">
                        {item.eraTitle} • {item.location}
                      </span>
                      <Link
                        href={item.url}
                        className="inline-flex items-center gap-1 text-[#9E6B2B] dark:text-[#D4A359] hover:underline font-medium"
                      >
                        <span>قراءة المحطة في السيرة</span>
                        <ArrowLeft className="w-3 h-3" strokeWidth={1.6} />
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 4. شريط التوسع في المصادر الأربعة المعتمدة (يظهر عند وجود نص بحث) */}
          <div className="pt-4 border-t border-subtle-light/60 dark:border-subtle-dark/60 space-y-2">
            <span className="text-xs font-bold text-muted-light dark:text-muted-dark block">
              التوسع في المصادر العلمية الموثّقة:
            </span>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://dorar.net/hadith/search?q=${encodeURIComponent(query)}&st=w`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 text-xs text-charcoal-light dark:text-charcoal-dark transition-colors group"
              >
                <span className="font-semibold group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                  الدرر السنية
                </span>
                <span className="text-[10px] text-muted-light dark:text-muted-dark">• الموسوعة الحديثية</span>
                <ExternalLink className="w-3 h-3 text-muted-light ms-0.5" strokeWidth={1.6} />
              </a>

              <a
                href={`https://islamqa.info/ar/search?q=${encodeURIComponent(query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 text-xs text-charcoal-light dark:text-charcoal-dark transition-colors group"
              >
                <span className="font-semibold group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                  الإسلام سؤال وجواب
                </span>
                <span className="text-[10px] text-muted-light dark:text-muted-dark">• فتاوى وتأصيل</span>
                <ExternalLink className="w-3 h-3 text-muted-light ms-0.5" strokeWidth={1.6} />
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent('site:islamweb.net/ar ' + query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 text-xs text-charcoal-light dark:text-charcoal-dark transition-colors group"
              >
                <span className="font-semibold group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                  إسلام ويب
                </span>
                <span className="text-[10px] text-muted-light dark:text-muted-dark">• استشارات وأحكام</span>
                <ExternalLink className="w-3 h-3 text-muted-light ms-0.5" strokeWidth={1.6} />
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent('site:hadeethenc.com/ar ' + query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 text-xs text-charcoal-light dark:text-charcoal-dark transition-colors group"
              >
                <span className="font-semibold group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                  موسوعة الحديث
                </span>
                <span className="text-[10px] text-muted-light dark:text-muted-dark">• HadeethEnc</span>
                <ExternalLink className="w-3 h-3 text-muted-light ms-0.5" strokeWidth={1.6} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
