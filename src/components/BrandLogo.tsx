import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  href?: string;
}

export function BrandLogoIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Rounded inky navy container */}
      <rect width="64" height="64" rx="14" fill="#121B28" />

      {/* Copper focal diamond above the arch apex */}
      <polygon points="32,7.5 35.8,11.3 32,15.1 28.2,11.3" fill="#D4A359" />

      {/* Pointed Islamic Mihrab Arch (Unified Solid Ring) in Ivory */}
      <path
        fill="#F7F4EE"
        fillRule="evenodd"
        d="M 32,16.5
           C 27.2,19.2 22,24.8 17.5,30.5
           L 17.5,39
           L 32,44.5
           L 46.5,39
           L 46.5,30.5
           C 42,24.8 36.8,19.2 32,16.5 Z
           M 32,21.5
           C 35.5,23.8 39.5,27.8 42,31.5
           L 42,36.5
           L 32,40.5
           L 22,36.5
           L 22,31.5
           C 24.5,27.8 28.5,23.8 32,21.5 Z"
      />

      {/* Open Book Base in Ivory */}
      <path
        fill="#F7F4EE"
        d="M 32,48
           C 24,44 16,43 9,43.5
           L 12,48
           C 18.5,45.5 25.5,47.5 32,55.5
           C 38.5,47.5 45.5,45.5 52,48
           L 55,43.5
           C 48,43 40,44 32,48 Z"
      />
    </svg>
  );
}

export function BrandLogo({
  size = 'md',
  showSubtitle = true,
  className = '',
  href = '/',
}: BrandLogoProps) {
  const iconSizeClass =
    size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9 sm:w-10 sm:h-10';
  const titleClass =
    size === 'sm'
      ? 'text-sm font-bold font-display text-slate-900 dark:text-white tracking-tight'
      : size === 'lg'
      ? 'text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight'
      : 'text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white tracking-tight';

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${iconSizeClass} rounded-2xl shadow-xs overflow-hidden shrink-0`}>
        <BrandLogoIcon className="w-full h-full" />
      </div>
      <div className="flex flex-col text-start">
        <span className={titleClass}>الباحث في السنة</span>
        {showSubtitle && (
          <span className="text-[10px] text-muted-light dark:text-muted-dark font-sans -mt-0.5 hidden sm:inline-block">
            المرجع الشامل للسنة النبوية
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center text-charcoal-light dark:text-charcoal-dark hover:opacity-90 transition-opacity group"
      >
        {content}
      </Link>
    );
  }

  return content;
}
