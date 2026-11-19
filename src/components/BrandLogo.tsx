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
      {/* Rounded emerald container */}
      <rect width="64" height="64" rx="14" fill="#0F5C4A" />

      {/* Golden focal diamond above the arch apex */}
      <polygon points="32,7.5 35.8,11.3 32,15.1 28.2,11.3" fill="#D4A853" />

      {/* Pointed Islamic Arch / Mihrab */}
      <path
        d="M 32,17
           C 27.2,19.5 22.5,24.8 19.5,30.5
           L 19.5,38.5
           C 21.3,38 23.3,37.5 25,37.1
           L 25,31
           C 27,27 29.5,23.5 32,22
           C 34.5,23.5 37,27 39,31
           L 39,37.1
           C 40.7,37.5 42.7,38 44.5,38.5
           L 44.5,30.5
           C 41.5,24.8 36.8,19.5 32,17 Z"
        fill="#FAF8F4"
      />

      {/* Open Book Base */}
      <path
        d="M 32,41
           C 24,37.5 16,38 9,44
           L 12,48
           C 18.5,43.5 25.5,44.5 32,54
           C 38.5,44.5 45.5,43.5 52,48
           L 55,44
           C 48,38 40,37.5 32,41 Z"
        fill="#FAF8F4"
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
      <div className={`${iconSizeClass} rounded-2xl shadow-xs overflow-hidden shrink-0 group-hover:scale-105 transition-transform`}>
        <BrandLogoIcon className="w-full h-full" />
      </div>
      <div className="flex flex-col text-start">
        <span className={titleClass}>منصة السنة</span>
        {showSubtitle && (
          <span className="text-[10px] text-muted-light dark:text-muted-dark font-sans -mt-0.5 hidden sm:inline-block">
            الحديث النبوي والآداب
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
