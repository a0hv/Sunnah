'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/nawawi40', label: 'الأربعون النووية' },
  { href: '/adhkar', label: 'حصن المسلم' },
  { href: '/seerah', label: 'السيرة النبوية' },
  { href: '/daily-tracker', label: 'يومك وليلتك' },
  { href: '/about', label: 'عن الموقع' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-paper-light/90 dark:bg-paper-dark/90 border-b border-subtle-light/60 dark:border-subtle-dark/60 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* البداية: الشعار */}
        <div className="flex items-center shrink-0">
          <BrandLogo size="md" href="/" />
        </div>

        {/* الوسط: الروابط الخمسة بخط أنيق ومسافات متساوية */}
        <nav
          className="hidden md:flex items-center gap-1 lg:gap-2"
          aria-label="شريط التنقل الرئيسي"
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 text-xs lg:text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-emerald-brand dark:text-emerald-brand-dark font-semibold after:absolute after:bottom-[-20px] after:inset-x-2 after:h-0.5 after:bg-emerald-brand dark:after:bg-emerald-brand-dark after:rounded-full'
                    : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* النهاية: زر تبديل المظهر وقائمة الجوال */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle className="rounded-full" />

          {/* زر قائمة الجوال */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="القائمة الجانبية"
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-full border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark transition-colors duration-200"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.6} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.6} />
            )}
          </button>
        </div>
      </div>

      {/* قائمة الجوال المنسدلة */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-subtle-light/70 dark:border-subtle-dark/70 bg-paper-light/98 dark:bg-paper-dark/98 backdrop-blur-md px-4 py-3 space-y-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 text-[#9E6B2B] dark:text-[#D4A359] font-bold'
                    : 'text-charcoal-light dark:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9E6B2B] dark:bg-[#D4A359]" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
