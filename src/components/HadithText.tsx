'use client';

import React from 'react';
import { getQuranComUrl } from '@/lib/external-refs';
import { HighlightArabicText } from '@/lib/arabic-search';

interface HadithTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
  highlightQuery?: string;
}

interface Segment {
  type: 'narrator' | 'prophetic' | 'quran' | 'footnote';
  text: string;
}

/**
 * Normalizes unbalanced quotes (e.g. Nawawi #16 where an opening quote is omitted)
 */
function normalizeUnbalancedQuotes(raw: string): string {
  const doubleQuoteCount = (raw.match(/"/g) || []).length;
  if (doubleQuoteCount % 2 === 1) {
    const match = raw.match(/(قَالَ:\s*)([^"«»]+")/);
    if (match) {
      return raw.replace(match[0], match[1] + '"' + match[2]);
    }
  }
  return raw;
}

/**
 * Parses Hadith text into segments:
 * - Prophetic speech: inside «...», "...", “...”, or ((...))
 * - Quranic verses: ﴿...﴾ rendered in font-quran with Quran.com link
 * - Footnotes: [1] or [١]
 * - Narrator & context: the rest rendered in font-hadith with standard text color
 */
function parseHadith(rawText: string): Segment[] {
  if (!rawText) return [];

  const text = normalizeUnbalancedQuotes(rawText);

  // Match quotes: «...» or "..." or ((...)) or “...”
  const quoteRegex = /((?:«[^»]+»)|(?:"[^"]+")|(?:\(\([^)]+\)\))|(?:“[^”]+”))/g;
  const quoteParts = text.split(quoteRegex);

  const segments: Segment[] = [];

  for (const part of quoteParts) {
    if (!part) continue;

    const isQuote =
      (part.startsWith('«') && part.endsWith('»')) ||
      (part.startsWith('"') && part.endsWith('"') && part.length > 2) ||
      (part.startsWith('“') && part.endsWith('”')) ||
      (part.startsWith('((') && part.endsWith('))'));

    // Check for Quranic verses ﴿...﴾ and footnotes [١] inside each part
    const subRegex = /((?:﴿[^﴾]+﴾)|(?:\[[0-9١-٩]+\]))/g;
    const subParts = part.split(subRegex);

    for (const sub of subParts) {
      if (!sub) continue;

      if (sub.startsWith('﴿') && sub.endsWith('﴾')) {
        segments.push({ type: 'quran', text: sub });
      } else if (/^\[[0-9١-٩]+\]$/.test(sub)) {
        segments.push({ type: 'footnote', text: sub });
      } else if (isQuote) {
        segments.push({ type: 'prophetic', text: sub });
      } else {
        segments.push({ type: 'narrator', text: sub });
      }
    }
  }

  return segments;
}

export function HadithText({
  text,
  className = '',
  as: Component = 'p',
  highlightQuery = '',
}: HadithTextProps) {
  if (!text) return null;

  const segments = parseHadith(text);

  return (
    <Component
      className={`font-hadith leading-[2.85] text-justify select-text ${className}`}
    >
      {segments.map((seg, idx) => {
        if (seg.type === 'quran') {
          const quranUrl = getQuranComUrl(seg.text);
          return (
            <a
              key={idx}
              href={quranUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="اقرأ الآية وتفسيرها في Quran.com"
              className="font-quran font-bold text-[#9E6B2B] dark:text-[#D4A359] text-[1.12em] leading-[2.1] px-1 select-text hover:underline decoration-[#9E6B2B]/50 dark:decoration-[#D4A359]/50 underline-offset-4 transition-colors"
            >
              <HighlightArabicText text={seg.text} query={highlightQuery} />
            </a>
          );
        }

        if (seg.type === 'footnote') {
          return (
            <sup
              key={idx}
              className="font-sans text-[11px] font-semibold text-[#9E6B2B] dark:text-[#D4A359] bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 border border-[#9E6B2B]/20 dark:border-[#D4A359]/30 px-1 py-0.5 rounded mx-0.5 align-super cursor-default select-none"
            >
              {seg.text}
            </sup>
          );
        }

        if (seg.type === 'prophetic') {
          return (
            <span
              key={idx}
              className="text-[#8A5A1E] dark:text-[#DFB46B] font-bold transition-colors"
            >
              <HighlightArabicText text={seg.text} query={highlightQuery} />
            </span>
          );
        }

        // Narrator / Context (default color)
        return (
          <span
            key={idx}
            className="text-charcoal-light dark:text-charcoal-dark transition-colors"
          >
            <HighlightArabicText text={seg.text} query={highlightQuery} />
          </span>
        );
      })}
    </Component>
  );
}
