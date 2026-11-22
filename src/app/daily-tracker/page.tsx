import React from 'react';
import type { Metadata } from 'next';
import { DailyTrackerClient } from '@/components/DailyTrackerClient';

export const metadata: Metadata = {
  title: 'متتبع سنن اليوم والليلة | الباحث في السنة',
  description:
    'متتبع يومي تفاعلي لسنن النبي ﷺ وآدابه في ١٢ محطة حياتية من الاستيقاظ حتى المنام، مربوط بأبواب حصن المسلم والبحث الموثق في السنة مع رصد الإنجاز وحفظ محلي.',
};

export default function DailyTrackerPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-semibold text-emerald-brand dark:text-emerald-brand-dark uppercase tracking-wider block">
          الباحث في السنة • التطبيق العملي لهدي النبوة
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-charcoal-light dark:text-charcoal-dark">
          متتبع سنن اليوم والليلة
        </h1>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          جدول تطبيقي محرّر يعينك على إحياء هدي النبي ﷺ خطوة بخطوة في تفاصيل يومك، من لحظة استيقاظك إلى حين نومك.
        </p>
      </div>

      <DailyTrackerClient />
    </div>
  );
}
