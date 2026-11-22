'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Compass,
  BookOpen,
  Scroll,
  Scale,
  Search,
} from 'lucide-react';
import type { SmartCategory, SmartQueryData } from '@/app/api/smart-query/route';

interface SmartQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SmartQueryData | null;
  isLoading: boolean;
  rawQuery: string;
}

const CATEGORIES: { id: SmartCategory; label: string; icon: React.ElementType }[] = [
  { id: 'fatwa', label: 'فتوى وفقه', icon: Scale },
  { id: 'hadith', label: 'حديث نبوي', icon: Scroll },
  { id: 'seerah', label: 'السيرة النبوية', icon: Compass },
  { id: 'quran', label: 'القرآن والتفسير', icon: BookOpen },
  { id: 'adhkar', label: 'أذكار وأدعية', icon: Sparkles },
];

export function SmartQueryModal({
  isOpen,
  onClose,
  data,
  isLoading,
  rawQuery,
}: SmartQueryModalProps) {
  const [activeCategory, setActiveCategory] = useState<SmartCategory>('hadith');
  const [keywords, setKeywords] = useState('');
  const [copiedKeywords, setCopiedKeywords] = useState(false);
  const [copiedHadeethEnc, setCopiedHadeethEnc] = useState(false);
  const [cache, setCache] = useState<Record<string, SmartQueryData>>({});
  const [effectiveData, setEffectiveData] = useState<SmartQueryData | null>(data);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  // تحديث البيانات عند فتح النافذة أو وصول نتيجة الاستدعاء الأولي
  useEffect(() => {
    if (data) {
      const trimmedQuery = rawQuery.trim();
      const key = `${trimmedQuery}:${data.category}`;
      setCache((prev) => ({ ...prev, [key]: data }));
      setEffectiveData(data);
      setActiveCategory(data.category);
      setKeywords(data.smartKeywords || trimmedQuery);
    } else if (isLoading) {
      setEffectiveData(null);
      setKeywords('');
    } else if (rawQuery) {
      setKeywords(rawQuery);
    }
  }, [data, isLoading, rawQuery]);

  // إغلاق النافذة بزر Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // تبديل التصنيف مع فحص الكاش الفوري (0ms) أو الاستدعاء الذكي لتوليد كلمات التصنيف
  const handleCategorySelect = async (catId: SmartCategory) => {
    if (catId === activeCategory && effectiveData && !isCategoryLoading) return;
    setActiveCategory(catId);

    const trimmedQuery = rawQuery.trim();
    const key = `${trimmedQuery}:${catId}`;
    const cached = cache[key];

    if (cached) {
      // استرجاع فوري من الكاش بـ 0 مللي ثانية
      setEffectiveData(cached);
      setKeywords(cached.smartKeywords);
      return;
    }

    // غير موجود بالكاش: استدعاء التوليد الذكي المخصص لهذا التصنيف
    setIsCategoryLoading(true);
    try {
      const res = await fetch('/api/smart-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery, forcedCategory: catId }),
      });
      if (res.ok) {
        const json: SmartQueryData = await res.json();
        setCache((prev) => ({ ...prev, [key]: json }));
        setEffectiveData(json);
        setKeywords(json.smartKeywords);
      } else {
        const fallback: SmartQueryData = {
          category: catId,
          categoryLabel: CATEGORIES.find((c) => c.id === catId)?.label || '',
          smartKeywords: trimmedQuery,
          hadithKeywords: trimmedQuery,
          suggestedKeywords: [],
          poweredBy: 'local',
        };
        setCache((prev) => ({ ...prev, [key]: fallback }));
        setEffectiveData(fallback);
        setKeywords(fallback.smartKeywords);
      }
    } catch {
      const fallback: SmartQueryData = {
        category: catId,
        categoryLabel: CATEGORIES.find((c) => c.id === catId)?.label || '',
        smartKeywords: trimmedQuery,
        hadithKeywords: trimmedQuery,
        suggestedKeywords: [],
        poweredBy: 'local',
      };
      setCache((prev) => ({ ...prev, [key]: fallback }));
      setEffectiveData(fallback);
      setKeywords(fallback.smartKeywords);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentCategoryObj =
    CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[1];
  const CategoryIcon = currentCategoryObj.icon;

  const handleCopyKeywords = () => {
    if (!keywords) return;
    navigator.clipboard.writeText(keywords);
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 2000);
  };

  const handleHadeethEncSearch = () => {
    if (!keywords) return;
    navigator.clipboard.writeText(keywords);
    setCopiedHadeethEnc(true);
    setTimeout(() => setCopiedHadeethEnc(false), 2500);
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent('site:hadeethenc.com/ar ' + keywords)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const encodedKeywords = encodeURIComponent(keywords || rawQuery);
  const encodedHadith = encodeURIComponent(
    effectiveData?.hadithKeywords || keywords || rawQuery
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-query-modal-title"
      className="fixed inset-0 z-50 bg-[#121B28]/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="border-b border-subtle-light dark:border-subtle-dark px-5 sm:px-6 py-4 flex items-center justify-between gap-3 bg-paper-light/50 dark:bg-paper-dark/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 text-[#9E6B2B] dark:text-[#D4A359] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h2
                id="smart-query-modal-title"
                className="font-display font-bold text-base sm:text-lg text-charcoal-light dark:text-charcoal-dark truncate"
              >
                التوجيه الذكي للبحث
              </h2>
              <p className="text-[11px] text-muted-light dark:text-muted-dark truncate">
                اختر المصدر المناسب لسؤالك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-light hover:text-charcoal-light dark:text-muted-dark dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            title="إغلاق النافذة (Esc)"
            aria-label="إغلاق النافذة"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* حالة التحميل الأولي */}
          {isLoading && !data && (
            <div className="p-6 text-center space-y-2">
              <div className="inline-block w-6 h-6 border-2 border-[#9E6B2B] dark:border-[#D4A359] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-light dark:text-muted-dark">
                جاري تجهيز كلمات البحث...
              </p>
            </div>
          )}

          {/* شارة التصنيف + الكلمات المفتاحية */}
          <div className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/70 dark:border-subtle-dark/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-light dark:text-muted-dark">
                التصنيف المقترح:
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#9E6B2B]/10 text-[#9E6B2B] dark:bg-[#D4A359]/15 dark:text-[#D4A359] border border-[#9E6B2B]/20 dark:border-[#D4A359]/30">
                  <CategoryIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span>{currentCategoryObj.label}</span>
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="smart-keywords-input"
                className="text-[11px] font-medium text-muted-light dark:text-muted-dark block"
              >
                كلمات البحث المقترحة:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="smart-keywords-input"
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder={
                    isCategoryLoading
                      ? 'جاري تحديث كلمات البحث لهذا التصنيف...'
                      : isLoading
                      ? 'جاري تجهيز كلمات البحث...'
                      : 'كلمات البحث...'
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark font-sans focus:outline-hidden focus:border-[#9E6B2B] dark:focus:border-[#D4A359] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleCopyKeywords}
                  className="px-3 py-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 text-xs font-medium text-charcoal-light dark:text-charcoal-dark transition-colors shrink-0 inline-flex items-center gap-1.5"
                  title="نسخ كلمات البحث"
                >
                  {copiedKeywords ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">
                        تم النسخ
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-muted-light dark:text-muted-dark" />
                      <span className="hidden sm:inline">نسخ</span>
                    </>
                  )}
                </button>
              </div>

              {/* مؤشر التحميل */}
              {(isLoading || isCategoryLoading) && (
                <div className="flex items-center gap-2 pt-1 text-xs text-[#9E6B2B] dark:text-[#D4A359]">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>
                    {isCategoryLoading
                      ? `جاري تحديث كلمات البحث لتصنيف (${currentCategoryObj.label})...`
                      : 'جاري تجهيز كلمات البحث...'}
                  </span>
                </div>
              )}

              {/* شرائح الكلمات المقترحة البديلة */}
              {effectiveData?.suggestedKeywords && effectiveData.suggestedKeywords.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-light dark:text-muted-dark block">
                    اقتراحات بحث بديلة:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {effectiveData.suggestedKeywords.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setKeywords(suggestion)}
                        className={`px-2.5 py-1 rounded-xl text-xs transition-all ${
                          keywords === suggestion
                            ? 'bg-[#121B28] text-[#F7F4EE] dark:bg-[#D4A359] dark:text-[#0F141B] font-bold shadow-2xs'
                            : 'bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 text-charcoal-light dark:text-charcoal-dark font-medium'
                        }`}
                        title="اختيار هذا الاقتراح للبحث"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* بطاقات المصادر المتخصصة للتصنيف النشط */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-charcoal-light dark:text-charcoal-dark block">
              المصادر المتخصصة المناسبة لمسألتك:
            </span>

            {/* تصنيف الفتوى والفقه */}
            {activeCategory === 'fatwa' && (
              <div className="space-y-2.5">
                <a
                  href={`https://islamqa.info/ar/search?q=${encodedKeywords}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        الإسلام سؤال وجواب
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        فتاوى مؤصلة
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      فتاوى واستشارات فقهية شرعية مؤصلة بالأدلة بإشراف الشيخ محمد صالح المنجد.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </a>

                <a
                  href={`https://binbaz.org.sa/search?q=${encodedKeywords}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        موقع الشيخ عبد العزيز بن باز
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        أئمة العصر
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      فتاوى ومسائل فقهية محققة ومسجلة صوتياً لسماحة الإمام ابن باز رحمه الله.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </a>
              </div>
            )}

            {/* تصنيف الحديث النبوي */}
            {activeCategory === 'hadith' && (
              <div className="space-y-2.5">
                <a
                  href={`https://dorar.net/hadith/search?q=${encodedHadith}&st=w`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        الموسوعة الحديثية (الدرر السنية)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        تخريج دقيق
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      البحث في متون وأسانيد السنة النبوية مع بيان حكم كبار المحدثين وصحة الروايات.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </a>

                <div className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark">
                          موسوعة الأحاديث النبوية (HadeethEnc)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                          شروح ميسرة
                        </span>
                      </div>
                      <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                        أحاديث نبوية مختارة ومصححة مع شرح معاني الألفاظ الغريبة والفوائد المستنبطة.
                      </p>
                    </div>
                    <a
                      href="https://hadeethenc.com/ar/hybrid-search"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl text-muted-light hover:text-[#9E6B2B] dark:hover:text-[#D4A359] transition-colors shrink-0"
                      title="فتح موقع HadeethEnc"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="pt-2 border-t border-subtle-light/60 dark:border-subtle-dark/60 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleHadeethEncSearch}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 text-xs font-semibold text-[#9E6B2B] dark:text-[#D4A359] transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>
                        {copiedHadeethEnc
                          ? 'تم نسخ الكلمات وفتح البحث المباشر...'
                          : 'فتح البحث المباشر في HadeethEnc'}
                      </span>
                    </button>
                    <span className="text-[10px] text-muted-light dark:text-muted-dark">
                      ينسخ الكلمات تلقائياً لتسهيل البحث
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* تصنيف السيرة النبوية */}
            {activeCategory === 'seerah' && (
              <div className="space-y-2.5">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:dorar.net/history ' + keywords)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        الموسوعة التاريخية (الدرر السنية)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        توثيق تاريخي
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      توثيق أحداث السيرة النبوية والمغازي وأيام الإسلام الموثقة بأسانيد الرواة.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </a>

                <Link
                  href="/seerah"
                  onClick={onClose}
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        قسم السيرة في «الباحث في السنة»
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        تصفح محلي
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      ٣٠ محطة تاريخية متسلسلة من كتاب الرحيق المختوم مع العبر التربوية ومتتبع القراءة.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </Link>
              </div>
            )}

            {/* تصنيف القرآن والتفسير */}
            {activeCategory === 'quran' && (
              <div className="space-y-2.5">
                <a
                  href={`https://quran.com/ar/search?q=${encodedKeywords}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        القرآن الكريم (Quran.com)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        نص وتلاوة
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      تصفح الآيات مع التفاسير المعتمدة (ابن كثير، الطبري، السعدي) والترجمات المتعددة.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:tafsir.app ' + keywords)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        الباحث القرآني (تطبيق تفسير)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        تفاسير السلف
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      موسوعة جامعة تجمع كتب التفسير وعلوم القرآن وغريب الألفاظ لأئمة أهل السنة.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </a>
              </div>
            )}

            {/* تصنيف الأذكار والأدعية */}
            {activeCategory === 'adhkar' && (
              <div className="space-y-2.5">
                <Link
                  href="/adhkar"
                  onClick={onClose}
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        حصن المسلم (محلياً في المنصة)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        أذكار موثقة
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      ١٣٣ باباً وأكثر من ٣٠٠ ذكر نبوي موثّق مع أعداد التكرار وفضل كل ذكر ومناسبته.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </Link>

                <a
                  href={`https://dorar.net/hadith/search?q=${encodedHadith}&st=w`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 transition-colors group flex items-start justify-between gap-3 block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors">
                        تخريج ألفاظ الذكر (الدرر السنية)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#9E6B2B]/10 text-[#9E6B2B] dark:text-[#D4A359] text-[10px] font-semibold">
                        صحة اللفظ
                      </span>
                    </div>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                      التحقق من صحة وثبوت صياغة الذكر أو الدعاء المأثور عن النبي صلى الله عليه وسلم.
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] shrink-0 mt-0.5" />
                </a>
              </div>
            )}
          </div>

          {/* شريط تبديل التصنيف يدوياً مع التوليد الذكي الفوري */}
          <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 space-y-2">
            <span className="text-[11px] font-semibold text-muted-light dark:text-muted-dark block">
              أو اختر تصنيفًا آخر لتحديث الاقتراحات والمصادر:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    disabled={isCategoryLoading}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer disabled:opacity-60 ${
                      isSelected
                        ? 'bg-[#121B28] dark:bg-[#D4A359] text-[#F7F4EE] dark:text-[#0F141B] font-bold shadow-xs'
                        : 'bg-paper-light dark:bg-paper-dark border border-subtle-light/80 dark:border-subtle-dark/80 text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:border-[#9E6B2B]/40 dark:hover:border-[#D4A359]/40'
                    }`}
                  >
                    <Icon className="w-3 h-3" strokeWidth={1.8} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
