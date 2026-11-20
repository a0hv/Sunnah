import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { HadithOfTheDay } from '@/components/HadithOfTheDay';
import { SunnahAssistant } from '@/components/SunnahAssistant';

export const metadata: Metadata = {
  title: 'الباحث في السنة | المرجع الشامل للسنة النبوية',
  description:
    'الباحث في السنة — المرجع الرقمي الموثق لهدي وكلام سيد المرسلين ﷺ: الأحاديث الصحيحة وشروحها، السيرة النبوية، حصن المسلم، الأربعون النووية، ومتتبع سنن اليوم والليلة.',
};

const SECTIONS = [
  {
    num: '٠١',
    title: 'الأربعون النووية',
    desc: 'الأحاديث الجامعة لقواعد الدين وأصول الشريعة مع التسميع الذاتي.',
    count: '٤٢ حديثًا',
    href: '/nawawi40',
  },
  {
    num: '٠٢',
    title: 'حصن المسلم',
    desc: 'أوراد اليوم والليلة وأدعية الكرب والسفر والصلاة مع عدّاد التسبيح.',
    count: '١٣٣ بابًا',
    href: '/adhkar',
  },
  {
    num: '٠٣',
    title: 'السيرة النبوية',
    desc: 'مسيرة النبي المصطفى ﷺ من المولد حتى الرفيق الأعلى في محطات متسلسلة.',
    count: '٣٠ محطة',
    href: '/seerah',
  },
  {
    num: '٠٤',
    title: 'يومك وليلتك',
    desc: 'جدول تفاعلي يرصد سننك العملية من الاستيقاظ حتى النوم.',
    count: '١٢ محطة',
    href: '/daily-tracker',
  },
];

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-14 py-8 md:py-14 text-start">
      {/* 1. الباحث في السنة (المحور التحريري الرئيسي) */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-charcoal-light dark:text-charcoal-dark tracking-tight">
          الباحث في السنة
        </h1>

        {/* واجهة المساعد الذكي */}
        <SunnahAssistant />
      </section>

      {/* 2. فهرس المكتبة المرقّم */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-subtle-light/80 dark:border-subtle-dark/80">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-charcoal-light dark:text-charcoal-dark">
            فهرس المكتبة
          </h2>
          <span className="text-xs text-muted-light dark:text-muted-dark">
            أربعة مراجع موثّقة
          </span>
        </div>

        <div className="divide-y divide-subtle-light/80 dark:divide-subtle-dark/80 border-b border-subtle-light/80 dark:border-subtle-dark/80">
          {SECTIONS.map((sec) => (
            <Link
              key={sec.href}
              href={sec.href}
              className="group flex items-center justify-between py-4 sm:py-5 px-1.5 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015]"
            >
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <span className="font-display text-base sm:text-lg font-bold text-[#9E6B2B] dark:text-[#D4A359] tabular-nums select-none shrink-0 w-7 sm:w-8">
                  {sec.num}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base sm:text-lg text-charcoal-light dark:text-charcoal-dark group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] transition-colors truncate">
                    {sec.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark font-text mt-0.5 line-clamp-1">
                    {sec.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ms-4">
                <span className="text-xs text-muted-light dark:text-muted-dark font-sans hidden sm:inline">
                  {sec.count}
                </span>
                <ArrowLeft
                  className="w-4 h-4 text-muted-light group-hover:text-[#9E6B2B] dark:group-hover:text-[#D4A359] group-hover:-translate-x-1 transition-all"
                  strokeWidth={1.6}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. قراءة حديث اليوم */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-subtle-light/80 dark:border-subtle-dark/80">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-charcoal-light dark:text-charcoal-dark">
            حديث اليوم
          </h2>
        </div>

        <HadithOfTheDay />
      </section>
    </div>
  );
}
