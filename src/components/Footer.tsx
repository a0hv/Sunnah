import React from 'react';
import Link from 'next/link';
import { BookOpen, Compass, Sparkles, Scroll, Search, CalendarCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark transition-colors py-12 px-4 sm:px-6 lg:px-8 text-start">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Purpose */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 border border-emerald-brand/20 dark:border-emerald-brand-dark/30 flex items-center justify-center text-emerald-brand dark:text-emerald-brand-dark">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-charcoal-light dark:text-charcoal-dark font-quran">
                منصة السنة
              </h3>
            </div>
            <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed max-w-md">
              منصة رقمية حديثة تجمع أصول الحديث النبوي الشريف والآداب والأذكار اليومية؛ تضم الأحاديث المشروحة، حصن المسلم، السيرة النبوية، الأربعون النووية، قسم تثبّت، ومتتبع سنن يومك وليلتك بتصميم تفاعلي وبحث فوري.
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
                  href="/hadiths"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  الأحاديث النبوية المشروحة (HadeethEnc)
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

          {/* Column 3: Search & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light dark:text-charcoal-dark">
              الأدوات والخدمات
            </h4>
            <ul className="space-y-2 text-xs text-muted-light dark:text-muted-dark">
              <li>
                <Link
                  href="/verify"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  قسم تثبّت (أحاديث منتشرة لا تصح)
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  محرك البحث الفوري
                </Link>
              </li>
              <li>
                <Link
                  href="/hadiths"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  المفضلة والأحاديث المحفوظة
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
                >
                  عن المنصة والمراجع العلمية
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-subtle-light dark:border-subtle-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-light dark:text-muted-dark">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} • منصة السنة
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              الرئيسية
            </Link>
            <span>•</span>
            <Link
              href="/hadiths"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              الأحاديث المشروحة
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
              href="/verify"
              className="hover:text-emerald-brand dark:hover:text-emerald-brand-dark transition-colors"
            >
              تثبّت
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
