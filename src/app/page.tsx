import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
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
import { SunnahAssistant } from '@/components/SunnahAssistant';

export const metadata: Metadata = {
  title: 'الباحث في السنة | المرجع الشامل للسنة النبوية',
  description:
    'الباحث في السنة — المرجع الرقمي العصري الشامل لهدي وكلام سيد المرسلين ﷺ: الأحاديث الصحيحة وشروحها، العقيدة النبوية، السيرة ومواقف النبي ﷺ، حصن المسلم، الأربعون النووية، وقسم تثبّت.',
};

const PILLARS = [
  {
    href: '/nawawi40',
    title: 'الأربعون النووية',
    subtitle: 'كليات وقواعد الإسلام',
    badge: '٤٢ حديثاً • ميزة التسميع',
    icon: Scroll,
    desc: 'الأحاديث الجامعة التي عليها مدار الدين وقواعد الشريعة، مشكولة ومحققة مع ميزة التسميع الذاتي ورصد الحفظ.',
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
];

export default function HomePage() {
  return (
    <div className="space-y-12 sm:space-y-16 md:space-y-24 py-6 sm:py-8 md:py-14 text-start overflow-x-hidden w-full max-w-full">
      {/* 1. Hero Section & AI Assistant */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 text-emerald-brand dark:text-emerald-brand-dark border border-emerald-brand/20 dark:border-emerald-brand-dark/30 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-brand dark:bg-emerald-brand-dark animate-pulse" />
            <span>الباحث في السنة النبوية الشامل • الأحاديث والعقيدة والسيرة والآداب</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-display text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-snug">
            الباحث في السنة
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-light dark:text-muted-dark max-w-2xl mx-auto leading-relaxed font-text">
            المرجع الرقمي العصري الشامل لهدي وكلام سيد المرسلين ﷺ: الأحاديث الصحيحة وشروحها، العقيدة النبوية، السيرة ومواقف النبي ﷺ، كتاب «حصن المسلم» بالعدّاد التفاعلي، «الأربعون النووية» بنظام التسميع، صيانة الحديث عبر قسم تثبّت، ومتتبع سنن اليوم والليلة.
          </p>
        </div>

        {/* 1.1 واجهة المساعد الشخصي الذكي (RAG موثّق) */}
        <SunnahAssistant />
      </section>

      {/* 2. الأركان الأربعة للباحث في السنة */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-subtle-light dark:border-subtle-dark pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-brand dark:text-emerald-brand-dark uppercase tracking-wider block">
              أقسام المنصة الأساسية
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
              أركان الباحث في السنة
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark">
            محتوى محرّر ومشكول وموثق يجمع بين التأصيل النبوي والتطبيق المعاصر
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Link
                key={pillar.title}
                href={pillar.href}
                className={`group p-5 sm:p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
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
                    <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-emerald-brand dark:group-hover:text-emerald-brand-dark transition-colors">
                      {pillar.title}
                    </h3>
                    <span className="text-xs text-muted-light dark:text-muted-dark font-sans block">
                      {pillar.subtitle}
                    </span>
                  </div>

                  <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed font-text">
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

      {/* 3. بطاقة حديث اليوم من الأربعين النووية */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-gold-accent dark:text-gold-accent-dark uppercase tracking-wider block">
            وردك اليومي من هدي النبوة
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">
            حديث اليوم من الأربعين النووية
          </h2>
        </div>

        <HadithOfTheDay />
      </section>

      {/* 4. متتبع سنن اليوم والليلة Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 md:p-10 rounded-3xl bg-linear-to-r from-emerald-brand/10 via-surface-light to-gold-accent/10 dark:from-emerald-brand-dark/20 dark:via-surface-dark dark:to-gold-accent-dark/15 border border-emerald-brand/20 dark:border-emerald-brand-dark/30 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 w-full">
          <div className="space-y-2 text-center md:text-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-brand text-white shadow-2xs">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>أداة تفاعلية يومية</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-white">
              متتبع سنن اليوم والليلة
            </h2>
            <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark max-w-xl leading-relaxed">
              رافق هدي الحبيب ﷺ في كل ساعة من يومك: ١٢ محطة يومية من الاستيقاظ وحتى النوم، مع رصد إنجازك اليومي وحفظه محليًا في متصفحك.
            </p>
          </div>

          <Link
            href="/daily-tracker"
            className="w-full sm:w-auto shrink-0 px-6 py-3.5 rounded-2xl bg-emerald-brand text-white font-bold text-sm shadow-md hover:bg-emerald-brand/90 transition-all flex items-center justify-center gap-2 group"
          >
            <span>بدء تتبع سنن اليوم</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
