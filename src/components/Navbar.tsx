'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/nawawi40', label: 'الأربعون النووية' },
  { href: '/adhkar', label: 'حصن المسلم' },
  { href: '/daily-tracker', label: 'يومك وليلتك' },
  { href: '/verify', label: 'تثبّت' },
  { href: '/seerah', label: 'السيرة النبوية' },
  { href: '/search', label: 'البحث' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-paper-light/90 dark:bg-paper-dark/90 border-b border-subtle-light dark:border-subtle-dark transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <BrandLogo size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5" aria-label="شريط التنقل الرئيسي">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 text-emerald-brand dark:text-emerald-brand-dark font-semibold'
                    : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (Search, Theme Toggle, Mobile Menu Trigger) */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="البحث السريع في المنصة"
            className="p-2 rounded-xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark text-muted-light dark:text-muted-dark hover:text-emerald-brand dark:hover:text-emerald-brand-dark hover:border-emerald-brand/40 dark:hover:border-emerald-brand-dark/40 transition-colors shadow-2xs"
          >
            <Search className="w-5 h-5" />
          </Link>

          <ThemeToggle />

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="القائمة الجانبية"
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-subtle-light dark:border-subtle-dark bg-paper-light dark:bg-paper-dark px-4 py-4 space-y-1.5 shadow-lg animate-in slide-in-from-top-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 text-emerald-brand dark:text-emerald-brand-dark font-semibold'
                    : 'text-muted-light dark:text-muted-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
