'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Sparkles, ShieldAlert, Search } from 'lucide-react';

const BOTTOM_ITEMS = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/hadiths', label: 'الأحاديث', icon: BookOpen },
  { href: '/adhkar', label: 'الأذكار', icon: Sparkles },
  { href: '/verify', label: 'تثبّت', icon: ShieldAlert },
  { href: '/search', label: 'البحث', icon: Search },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="شريط التنقل السفلي للهاتف"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-subtle-light dark:border-subtle-dark transition-colors px-2 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]"
    >
      <div className="grid grid-cols-5 gap-1 items-center justify-around max-w-lg mx-auto">
        {BOTTOM_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-brand dark:text-emerald-brand-dark font-semibold'
                  : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full bg-emerald-brand dark:bg-emerald-brand-dark" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
