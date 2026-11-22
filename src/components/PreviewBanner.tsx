'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function PreviewBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem('preview_banner_dismissed') === 'true';
      if (isDismissed) {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('preview_banner_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <aside
      role="region"
      aria-label="تنويه نسخة المعاينة"
      className="w-full bg-[#121B28]/[0.04] dark:bg-[#D4A359]/10 border-b border-subtle-light/70 dark:border-subtle-dark/70 transition-colors"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark font-sans">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#9E6B2B] dark:bg-[#D4A359] shrink-0"
            aria-hidden="true"
          />
          <p className="truncate sm:whitespace-normal leading-normal">
            <strong className="font-semibold text-charcoal-light dark:text-charcoal-dark">
              نسخة معاينة قيد التطوير
            </strong>{' '}
            <span className="text-muted-light dark:text-muted-dark font-normal">
              — يعمل البحث حاليًا بالمكتبة المحلية الموثّقة، ويجري استكمال الإطلاق الكامل فور تفعيل الربط الرسمي مع{' '}
              <strong className="font-semibold text-charcoal-light dark:text-charcoal-dark">مؤسسة الدرر السنية</strong>.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-md text-muted-light hover:text-charcoal-light dark:text-muted-dark dark:hover:text-charcoal-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          title="إغلاق التنويه"
          aria-label="إغلاق التنويه"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
