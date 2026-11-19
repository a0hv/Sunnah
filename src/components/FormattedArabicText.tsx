import React from 'react';
import { getQuranComUrl } from '@/lib/external-refs';

interface FormattedArabicTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
}

export function FormattedArabicText({
  text,
  className = '',
  as: Component = 'span',
}: FormattedArabicTextProps) {
  if (!text) return null;

  // Match Quranic verses ﴿...﴾ and Footnotes [١]
  const regex = /((?:﴿[^﴾]+﴾)|(?:\[[0-9١-٩]+\]))/g;
  const parts = text.split(regex);

  return (
    <Component className={`leading-relaxed text-charcoal-light dark:text-charcoal-dark ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('﴿') && part.endsWith('﴾')) {
          const quranUrl = getQuranComUrl(part);
          return (
            <a
              key={index}
              href={quranUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="اقرأ الآية وتفسيرها في Quran.com"
              className="font-quran font-bold text-gold-accent dark:text-amber-300 text-[1.15em] leading-[2.1] px-1 select-text hover:underline decoration-gold-accent/50 dark:decoration-amber-300/50 underline-offset-4 transition-colors"
            >
              {part}
            </a>
          );
        }

        if (/^\[[0-9١-٩]+\]$/.test(part)) {
          return (
            <sup
              key={index}
              className="font-sans text-[11px] font-semibold text-emerald-brand dark:text-emerald-brand-dark bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-1 py-0.5 rounded mx-0.5 align-super cursor-default select-none"
            >
              {part}
            </sup>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </Component>
  );
}
