import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Search,
  BookOpen,
  Sparkles,
  Compass,
  Scroll,
  CalendarCheck,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { HadithOfTheDay } from '@/components/HadithOfTheDay';

export const metadata: Metadata = {
  title: 'منصة السنة | الأحاديث المشروحة وحصن المسلم وتثبّت',
  description:
    'منصة السنة النبوية الشاملة: الأحاديث النبوية المشروحة من موسوعة HadeethEnc، حصن المسلم، قسم تثبّت للأحاديث المنتشرة التي لا تصح، الأربعون النووية، السيرة النبوية، ومتتبع سنن اليوم والليلة.',
};

const PILLARS = [
  {
    href: '/hadiths',
    title: 'الأحاديث المشروحة',
    subtitle: 'موسوعة الأحاديث النبوية (HadeethEnc)',
    badge: '٥٣٩ حديثاً • شروح وفوائد',
    icon: BookOpen,
    desc: 'متون الأحاديث النبوية الصحيحة والحسنة مشفوعة بالشرح الميسر والفوائد التربوية ومعاني الكلمات الغريبة والتخريج.',
    highlight: true,
  },
  {
    href: '/adhkar',
    title: 'حصن المسلم',
    subtitle: 'من أذكار الكتاب والسنة',
    badge: '١٣٣ باباً • عدّاد تسبيح',
    icon: Sparkles,
    desc: 'أوراد اليوم والليلة وأدعية الكرب والسفر والصلاة، مشكولة وموثقة مع عدّاد تسبيح تفاعلي وحفظ يومي.',
    highlight: false,
  },
  {
    href: '/verify',
    title: 'تثبّت',
    subtitle: 'صيانة الحديث والبدائل الصحيحة',
    badge: '١٥٠ حديثاً • تحقيق الدرر',
    icon: ShieldAlert,
    desc: 'بيان الأحاديث المنتشرة التي لا تصح والبدائل الصحيحة الثابتة عنها موثقة بالتحقيق العلمي من الدرر السنية.',
    highlight: false,
  },
  {
    href: '/daily-tracker',
    title: 'يومك وليلتك',
    subtitle: 'متتبع السنن اليومية',
    badge: '١٢ محطة • حفظ محلي',
    icon: CalendarCheck,
    desc: 'رافق هدي الحبيب ﷺ في كل ساعة: جدول تفاعلي يرصد إنجاز سننك اليومية من الاستيقاظ حتى النوم.',
    highlight: false,
  },
  {
    href: '/seerah',
    title: 'السيرة النبوية',
    subtitle: 'دراسة وعبرة واقتداء',
    badge: '٣٠ محطة • الرحيق المختوم',
    icon: Compass,
    desc: 'مسيرة الحبيب المصطفى ﷺ من المولد الشريف حتى الرفيق الأعلى: ٣٠ محطة متسلسلة مع الشواهد القرآنية والدروس التربوية.',
    highlight: false,
  },
  {
    href: '/nawawi40',
    title: 'الأربعون النووية',
    subtitle: 'كليات وقواعد الإسلام',
    badge: '٤٢ حديثاً • ميزة التسميع',
    icon: Scroll,
    desc: 'الأحاديث الجامعة التي عليها مدار الدين وقواعد الشريعة، مشكولة ومحققة مع ميزة التسميع الذاتي ورصد الحفظ.',
    highlight: false,
  },
];

const PROMINENT_HADITH_CATEGORIES = [
  {
    id: '266',
    title: 'فقه الأخلاق والسلوك',
    hadithsCount: 55,
    topics: 'الصدق، الحياء، الصبر، الإحسان، كظم الغيظ، والتواضع',
  },
  {
    id: '267',
    title: 'الآداب الشرعية',
    hadithsCount: 65,
    topics: 'آداب الطعام والشراب، الاستئذان، السلام، وعيادة المريض',
  },
  {
    id: '121',
    title: 'فقه العبادات',
    hadithsCount: 75,
    topics: 'الطهارة والوضوء، الصلاة، الجنائز، الزكاة، الصيام، والحج',
  },
  {
    id: '124',
    title: 'فقه الأسرة والمجتمع',
    hadithsCount: 45,
    topics: 'حقوق الزوجين، تربية الأولاد، بر الوالدين، وصلة الأرحام',
  },
  {
    id: '265',
    title: 'الفضائل ومحاسن الأعمال',
    hadithsCount: 55,
    topics: 'فضائل الأعمال الصالحة، الذكر والدعاء، ومحبة الله ورسوله',
  },
  {
    id: '122',
    title: 'فقه المعاملات المالية',
    hadithsCount: 40,
    topics: 'الأمانة في البيع والشراء، تحريم الربا والغش، وسداد الديون',
  },
];

const SEARCH_SUGGESTIONS = [
  { label: 'إنما الأعمال بالنيات', q: 'النيات' },
  { label: 'الصبر واليقين', q: 'الصبر' },
  { label: 'حسن الخلق', q: 'الخلق' },
  { label: 'أذكار الصباح والمساء', q: 'الصباح' },
  { label: 'دعاء السفر', q: 'السفر' },
  { label: 'التوبة والاستغفار', q: 'التوبة' },
];

export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-24 py-8 md:py-14 text-start">
      {/* 1. Hero Section & Instant Search */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 text-emerald-brand dark:text-emerald-brand-dark border border-emerald-brand/20 dark:border-emerald-brand-dark/30 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-brand dark:bg-emerald-brand-dark animate-pulse" />
            <span>منصة السنة النبوية الشاملة • الحديث والأذكار والآداب</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold font-quran text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-snug">
            منصة السنة
          </h1>

          <p className="text-base sm:text-lg text-muted-light dark:text-muted-dark max-w-2xl mx-auto leading-relaxed font-sans">
            المرجع الرقمي العصري لكلام سيد المرسلين ﷺ: كتاب «رياض الصالحين» كاملاً، وكتاب «حصن المسلم» بالعدّاد التفاعلي، والسيرة النبوية، والأربعون النووية.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="max-w-2xl mx-auto space-y-3">
          <form
            action="/search"
            method="GET"
            className="relative flex items-center shadow-md rounded-2xl overflow-hidden bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark focus-within:ring-2 focus-within:ring-emerald-brand transition-all"
          >
            <div className="ps-4 text-muted-light dark:text-muted-dark pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              name="q"
              placeholder="ابحث في الأحاديث، الكتب، الأبواب، أو الأذكار..."
              className="w-full py-4 px-3.5 bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-hidden font-sans"
            />
            <div className="pe-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-brand text-white font-bold text-xs sm:text-sm hover:bg-emerald-brand/90 transition-colors shadow-xs"
              >
                بحث
              </button>
            </div>
          </form>

          {/* Quick Search Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs text-muted-light dark:text-muted-dark">
            <span className="text-[11px] font-semibold me-1">شائع في البحث:</span>
            {SEARCH_SUGGESTIONS.map((tag) => (
              <Link
                key={tag.label}
                href={`/search?q=${encodeURIComponent(tag.q)}`}
                className="px-2.5 py-1 rounded-lg bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/40 text-charcoal-light dark:text-charcoal-dark transition-colors"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. الأركان الأربعة لمنصة السنة */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-subtle-light dark:border-subtle-dark pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-brand dark:text-emerald-brand-dark uppercase tracking-wider block">
              أقسام المنصة الأساسية
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-quran text-slate-900 dark:text-white">
              أركان منصة السنة
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark">
            محتوى محرّر ومشكول وموثق يجمع بين التأصيل النبوي والتطبيق المعاصر
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Link
                key={pillar.title}
                href={pillar.href}
                className={`group p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                  pillar.highlight
                    ? 'bg-gradient-to-b from-surface-light to-emerald-brand/5 dark:from-surface-dark dark:to-emerald-brand-dark/10 border-emerald-brand/30 dark:border-emerald-brand-dark/40 hover:border-emerald-brand'
                    : 'bg-surface-light dark:bg-surface-dark border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark">
                      {pillar.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-quran font-bold text-xl text-slate-900 dark:text-white group-hover:text-emerald-brand dark:group-hover:text-emerald-brand-dark transition-colors">
                      {pillar.title}
                    </h3>
                    <span className="text-xs text-muted-light dark:text-muted-dark font-sans block">
                      {pillar.subtitle}
                    </span>
                  </div>

                  <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-subtle-light/70 dark:border-subtle-dark/70 flex items-center justify-between text-xs font-bold text-emerald-brand dark:text-emerald-brand-dark">
                  <span>تصفح القسم</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:translate-x-[-3px] transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. بطاقة حديث اليوم المشروح */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-gold-accent dark:text-gold-accent-dark uppercase tracking-wider block">
            وردك اليومي من هدي النبوة
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-quran text-slate-900 dark:text-white">
            حديث اليوم المشروح
          </h2>
        </div>

        <HadithOfTheDay />
      </section>

      {/* 4. استعراض سريع لأبرز كتب رياض الصالحين */}
      {/* 4. الأحاديث النبوية المشروحة Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-subtle-light dark:border-subtle-dark pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-brand dark:text-emerald-brand-dark uppercase tracking-wider block">
              موسوعة الأحاديث النبوية (HadeethEnc)
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-quran text-slate-900 dark:text-white">
              أبواب الأحاديث النبوية المشروحة
            </h2>
          </div>
          <Link
            href="/hadiths"
            className="text-xs sm:text-sm font-bold text-emerald-brand dark:text-emerald-brand-dark hover:underline inline-flex items-center gap-1"
          >
            <span>استعراض كافة الأحاديث (٥٣٩ حديثاً مشروحاً)</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROMINENT_HADITH_CATEGORIES.map((c, idx) => (
            <Link
              key={c.id}
              href="/hadiths"
              className="group p-5 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark hover:border-emerald-brand/50 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-emerald-brand/10 dark:bg-emerald-brand-dark/20 text-emerald-brand dark:text-emerald-brand-dark text-xs font-bold font-sans flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-muted-light dark:text-muted-dark font-sans">
                    {c.hadithsCount} حديثاً
                  </span>
                </div>
                <h3 className="font-quran font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-brand transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                  أبواب: {c.topics}
                </p>
              </div>

              <div className="pt-2 border-t border-subtle-light/60 dark:border-subtle-dark/60 flex items-center justify-between text-xs font-semibold text-emerald-brand">
                <span>تصفح أحاديث القسم بشروحها</span>
                <ChevronLeft className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. متتبع سنن اليوم والليلة Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-r from-emerald-brand/10 via-surface-light to-gold-accent/10 dark:from-emerald-brand-dark/20 dark:via-surface-dark dark:to-gold-accent-dark/15 border border-emerald-brand/20 dark:border-emerald-brand-dark/30 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-brand text-white shadow-2xs">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>أداة تفاعلية يومية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-quran text-slate-900 dark:text-white">
              متتبع سنن اليوم والليلة
            </h2>
            <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark max-w-xl leading-relaxed">
              رافق هدي الحبيب ﷺ في كل ساعة من يومك: ١٢ محطة يومية من الاستيقاظ وحتى النوم، مع رصد إنجازك اليومي وحفظه محليًا في متصفحك.
            </p>
          </div>

          <Link
            href="/daily-tracker"
            className="shrink-0 px-6 py-3.5 rounded-2xl bg-emerald-brand text-white font-bold text-sm shadow-md hover:bg-emerald-brand/90 transition-all flex items-center gap-2 group"
          >
            <span>بدء تتبع سنن اليوم</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
