import React from 'react';
import Link from 'next/link';
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
              محرك بحث نبوي فوري موثّق يعتمد على النصوص الأصلية المعتمدة، يجمع بين متون الأحاديث وشروحها، السيرة النبوية، أذكار حصن المسلم، ومتتبع السنن اليومية في واجهة تحريرية هادئة.
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

          {/* العمود 3: المصادر العلمية الموثقة */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light dark:text-charcoal-dark font-display">
              المصادر العلمية المعتمدة
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
                  className="text-emerald-brand dark:text-emerald-brand-dark hover:underline font-medium inline-block"
                >
                  عن المنصة والمنهج العلمي ←
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* الشريط السفلي */}
        <div className="pt-6 border-t border-subtle-light/60 dark:border-subtle-dark/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-light dark:text-muted-dark">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} • الباحث في السنة
          </div>
          <div className="flex items-center gap-3">
            <span>خدمة مجانية لوجه الله تعالى</span>
            <span className="opacity-40">•</span>
            <Link
              href="/about"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              عن المنصة
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
