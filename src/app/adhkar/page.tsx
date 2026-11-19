import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdhkarClient } from '@/components/AdhkarClient';

export const metadata: Metadata = {
  title: 'الأذكار بالعدّاد الإلكتروني | منصة السنة',
  description:
    'أذكار نبوية مشكولة ومخرجة مرتبة في ١٣٣ باباً من كتاب حصن المسلم، مزودة بعدّاد تسبيح تفاعلي وحفظ يومي وبطاقات مشاركة رقمية.',
};

export default function AdhkarPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-semibold text-emerald-brand dark:text-emerald-brand-dark uppercase tracking-wider block">
          منصة السنة • حصن المسلم والأوراد النبوية
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-sans text-slate-900 dark:text-white">
          الأذكار
        </h1>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          أذكار نبوية جامعة مشكولة وموثّقة بأسانيدها وتخريجها، مرتبة في ١٣٣ باباً مع عدّاد تسبيح تفاعلي وحفظ يومي ومولد بطاقات مشاركة.
        </p>
      </div>

      <Suspense fallback={<div className="p-12 text-center text-muted-light">جاري تحميل الأذكار...</div>}>
        <AdhkarClient />
      </Suspense>
    </div>
  );
}
