import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Scroll,
  BookOpen,
  Compass,
  CalendarCheck,
  ArrowLeft,
} from 'lucide-react';
import { HadithOfTheDay } from '@/components/HadithOfTheDay';
import { SunnahAssistant } from '@/components/SunnahAssistant';

export const metadata: Metadata = {
  title: 'الباحث في السنة | المرجع الشامل للسنة النبوية',
  description:
    'الباحث في السنة — المرجع الرقمي الموثق لهدي وكلام سيد المرسلين ﷺ: الأحاديث الصحيحة وشروحها، السيرة النبوية، حصن المسلم، الأربعون النووية، ومتتبع سنن اليوم والليلة.',
};

const LIBRARY_SECTIONS = [
  {
    href: '/nawawi40',
    title: 'الأربعون النووية',
    desc: 'الأحاديث الجامعة لقواعد الدين وأصول الشريعة مع ميزة التسميع الذاتي.',
    count: '٤٢ حديثًا',
    icon: Scroll,
  },
  {
    href: '/adhkar',
    title: 'حصن المسلم',
    desc: 'أوراد اليوم والليلة وأدعية الكرب والسفر والصلاة مع عدّاد تسبيح تفاعلي.',
    count: '١٣٣ بابًا',
    icon: BookOpen,
  },
  {
    href: '/seerah',
    title: 'السيرة النبوية',
    desc: 'مسيرة الحبيب المصطفى ﷺ من المولد حتى الرفيق الأعلى في ٣٠ محطة متسلسلة.',
    count: '٣٠ محطة',
    icon: Compass,
  },
  {
    href: '/daily-tracker',
    title: 'يومك وليلتك',
    desc: 'جدول تفاعلي يرصد سننك العملية من الاستيقاظ حتى النوم مع حفظ محلي.',
    count: '١٢ محطة',
    icon: CalendarCheck,
  },
];

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-16 py-10 md:py-14 text-start">
      {/* 1. الهيرو + الباحث الذكي (محور الصفحة الرئيسي) */}
      <section className="text-center space-y-6 sm:space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            الباحث في السنة
          </h1>
          <p className="text-sm sm:text-base text-muted-light dark:text-muted-dark max-w-xl mx-auto leading-relaxed font-text">
            المرجع الرقمي الموثق لهدي النبي ﷺ وأحاديثه الصحيحة وأذكار اليوم والليلة والسيرة العطرة.
          </p>
        </div>

        {/* واجهة المساعد الذكي التحريرية */}
        <SunnahAssistant />
      </section>

      {/* 2. شبكة الأقسام المتماثلة 2×2 */}
      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-subtle-light/60 dark:border-subtle-dark/60 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
            أقسام المكتبة
          </h2>
          <span className="text-xs text-muted-light dark:text-muted-dark">
            أربعة مراجع شرعية موثقة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LIBRARY_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.href}
                href={sec.href}
                className="group p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light/70 dark:border-subtle-dark/70 hover:border-emerald-brand/50 dark:hover:border-emerald-brand-dark/50 transition-colors duration-200 flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center">
                      <Icon className="w-5 h-5" strokeWidth={1.6} />
                    </div>
                    <span className="text-xs text-muted-light dark:text-muted-dark font-sans">
                      {sec.count}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-brand dark:group-hover:text-emerald-brand-dark transition-colors duration-200">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed font-text mt-1">
                      {sec.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-subtle-light/50 dark:border-subtle-dark/50 flex items-center justify-between text-xs font-medium text-emerald-brand dark:text-emerald-brand-dark">
                  <span>تصفح القسم</span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" strokeWidth={1.6} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. بطاقة حديث اليوم */}
      <section className="space-y-5">
        <div className="border-b border-subtle-light/60 dark:border-subtle-dark/60 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
            حديث اليوم
          </h2>
        </div>

        <HadithOfTheDay />
      </section>
    </div>
  );
}
