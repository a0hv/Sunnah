import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight, Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  subtitle: string;
  stageName: string;
  icon: LucideIcon;
  description: string;
  features?: string[];
}

export function ComingSoon({
  title,
  subtitle,
  stageName,
  icon: Icon,
  description,
  features = [],
}: ComingSoonProps) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16 text-center space-y-8">
      {/* Stage Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 text-emerald-brand dark:text-emerald-brand-dark border border-emerald-brand/20 dark:border-emerald-brand-dark/30">
        <Construction className="w-3.5 h-3.5" />
        <span>قيد التطوير في {stageName}</span>
      </div>

      {/* Main Title & Icon */}
      <div className="space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark flex items-center justify-center text-emerald-brand dark:text-emerald-brand-dark shadow-sm">
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-sans text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-base text-muted-light dark:text-muted-dark max-w-xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Description Card */}
      <div className="p-6 rounded-2xl border border-subtle-light dark:border-subtle-dark bg-surface-light dark:bg-surface-dark text-start max-w-2xl mx-auto space-y-4 shadow-sm">
        <p className="text-sm text-charcoal-light dark:text-charcoal-dark leading-relaxed">
          {description}
        </p>

        {features.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-subtle-light dark:border-subtle-dark">
            <h4 className="text-xs font-bold text-muted-light dark:text-muted-dark uppercase tracking-wider">
              ما سيقدمه هذا القسم:
            </h4>
            <ul className="space-y-1.5 text-xs text-charcoal-light dark:text-charcoal-dark">
              {features.map((feat, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-brand dark:bg-emerald-brand-dark" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-brand dark:bg-emerald-brand-dark text-white font-medium text-sm hover:opacity-95 transition-opacity shadow-sm"
        >
          <span>العودة إلى الصفحة الرئيسية</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>
    </main>
  );
}
