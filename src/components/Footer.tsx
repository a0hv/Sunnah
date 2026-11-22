import React from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  return (
    <footer className="w-full border-t border-subtle-light/60 dark:border-subtle-dark/60 bg-paper-light dark:bg-paper-dark transition-colors py-12 px-4 sm:px-6 text-start">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* العمود 1: الشعار والتعريف */}
          <div className="space-y-3">
            <BrandLogo size="md" showSubtitle={false} href="/" />
            <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
              محرك بحث في القرآن الكريم والسنة النبوية والسيرة وأذكار حصن المسلم، بواجهة هادئة وسريعة.
            </p>
          </div>

          {/* العمود 2: أقسام المنصة */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light dark:text-charcoal-dark font-display">
              أقسام المنصة
            </h4>
            <ul className="space-y-2 text-xs text-muted-light dark:text-muted-dark font-text">
              <li>
                <Link
                  href="/"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  الرئيسية والباحث في السنة
                </Link>
              </li>
              <li>
                <Link
                  href="/nawawi40"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  الأربعون النووية
                </Link>
              </li>
              <li>
                <Link
                  href="/adhkar"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  حصن المسلم وعدّاد التسبيح
                </Link>
              </li>
              <li>
                <Link
                  href="/seerah"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  السيرة النبوية المطهرة
                </Link>
              </li>
              <li>
                <Link
                  href="/daily-tracker"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  متتبع سنن اليوم والليلة
                </Link>
              </li>
            </ul>
          </div>

          {/* العمود 3: الكتب والمصادر */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light dark:text-charcoal-dark font-display">
              الكتب والمصادر
            </h4>
            <ul className="space-y-2 text-xs text-muted-light dark:text-muted-dark font-text">
              <li>
                <span className="text-charcoal-light dark:text-charcoal-dark font-medium">مؤسسة الدرر السنية</span>
                <span className="block text-[11px] text-muted-light dark:text-muted-dark">الموسوعة الحديثية وقسم تثبّت</span>
              </li>
              <li>
                <span className="text-charcoal-light dark:text-charcoal-dark font-medium">حصن المسلم</span>
                <span className="block text-[11px] text-muted-light dark:text-muted-dark">د. سعيد بن علي بن وهف القحطاني</span>
              </li>
              <li>
                <span className="text-charcoal-light dark:text-charcoal-dark font-medium">الأربعون النووية</span>
                <span className="block text-[11px] text-muted-light dark:text-muted-dark">الإمام يحيى بن شرف النووي</span>
              </li>
              <li>
                <span className="text-charcoal-light dark:text-charcoal-dark font-medium">الرحيق المختوم</span>
                <span className="block text-[11px] text-muted-light dark:text-muted-dark">الشيخ صفي الرحمن المباركفوري</span>
              </li>
              <li className="pt-1">
                <Link
                  href="/about"
                  className="text-[#9E6B2B] dark:text-[#D4A359] hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>عن الموقع</span>
                  <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.6} />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* الشريط السفلي */}
        <div className="pt-6 border-t border-subtle-light/60 dark:border-subtle-dark/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-light dark:text-muted-dark font-sans text-center md:text-start">
          <p className="leading-relaxed">
            جميع الحقوق محفوظة © 2026 · الباحث في السنة — إعداد وتطوير{' '}
            <strong className="font-semibold text-charcoal-light dark:text-charcoal-dark">
              أحمد بن جابر القاضي
            </strong>
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs">
            <a
              href="mailto:ag.elkady1@gmail.com"
              className="inline-flex items-center gap-1.5 text-muted-light dark:text-muted-dark hover:text-[#9E6B2B] dark:hover:text-[#D4A359] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
              <span>للتواصل:</span>
              <span
                dir="ltr"
                className="font-mono text-[11px] underline decoration-[#9E6B2B]/40 dark:decoration-[#D4A359]/40 underline-offset-2"
              >
                ag.elkady1@gmail.com
              </span>
            </a>

            <span className="opacity-30 hidden sm:inline" aria-hidden="true">•</span>

            <Link
              href="/about"
              className="hover:text-[#9E6B2B] dark:hover:text-[#D4A359] transition-colors"
            >
              عن الموقع
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
