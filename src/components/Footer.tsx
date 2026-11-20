import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Scroll, Search, CalendarCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  return (
    <footer className="w-full border-t border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark transition-colors py-12 px-4 sm:px-6 lg:px-8 text-start">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <BrandLogo size="md" showSubtitle={false} />
            <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed max-w-md">
              مرجع رقمي شامل يجمع بين الأحاديث الصحيحة وشروحها، العقيدة النبوية، السيرة ومواقف النبي ﷺ، أذكار حصن المسلم، وقسم تثبّت لصيانة الحديث النبوي الشريف بتصميم تفاعلي وبحث فوري.
            </p>
            <p className="text-xs text-muted-light dark:text-muted-dark pt-1">
              خدمة لكتاب الله وسنة نبيه ﷺ • وقف رقمي لجميع المسلمين
            </p>
          </div>

          {/* Column 2: Main Sections */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light dark:text-charcoal-dark">
              أقسام المنصة
            </h4>
            <ul className="space-y-2 text-xs text-muted-light dark:text-muted-dark">
              <li>
                <Link
                  href="/nawawi40"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  كتاب «الأربعون النووية»
                </Link>
              </li>
              <li>
                <Link
                  href="/adhkar"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  أذكار حصن المسلم بالعدّاد
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
                  href="/seerah"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  السيرة النبوية العطرة
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Services & About */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light dark:text-charcoal-dark">
              الأدوات والخدمات
            </h4>
            <ul className="space-y-2 text-xs text-muted-light dark:text-muted-dark">
              <li>
                <Link
                  href="/nawawi40"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  الأربعون النووية ونظام التسميع
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
              <li>
                <Link
                  href="/seerah"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  السيرة النبوية (الرحيق المختوم)
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  عن الباحث في السنة والمنهج العلمي
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-subtle-light dark:border-subtle-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-light dark:text-muted-dark">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} • الباحث في السنة
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              الباحث الذكي
            </Link>
            <span>•</span>
            <Link
              href="/adhkar"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              حصن المسلم
            </Link>
            <span>•</span>
            <Link
              href="/seerah"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              السيرة النبوية
            </Link>
            <span>•</span>
            <Link
              href="/nawawi40"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              الأربعون النووية
            </Link>
            <span>•</span>
            <Link
              href="/daily-tracker"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              يومك وليلتك
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
