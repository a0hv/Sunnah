'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Scroll, BookOpen, Compass, CalendarCheck } from 'lucide-react';

const BOTTOM_ITEMS = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/nawawi40', label: 'الأربعون', icon: Scroll },
  { href: '/adhkar', label: 'حصن المسلم', icon: BookOpen },
  { href: '/seerah', label: 'السيرة', icon: Compass },
  { href: '/daily-tracker', label: 'يومك وليلتك', icon: CalendarCheck },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="شريط التنقل السفلي للهاتف"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-paper-light/95 dark:bg-paper-dark/95 backdrop-blur-md border-t border-subtle-light/60 dark:border-subtle-dark/60 transition-colors px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)]"
    >
      <div className="grid grid-cols-5 gap-1 items-center justify-around max-w-lg mx-auto">
        {BOTTOM_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-200 ${
                isActive
                  ? 'text-emerald-brand dark:text-emerald-brand-dark font-semibold'
                  : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <Icon className="w-5 h-5" strokeWidth={1.6} />
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-brand dark:bg-emerald-brand-dark mt-0.5" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
