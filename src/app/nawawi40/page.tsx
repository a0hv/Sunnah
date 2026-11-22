import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Scroll } from 'lucide-react';
import { NawawiClient } from '@/components/NawawiClient';

export const metadata: Metadata = {
  title: 'الأربعون النووية للإمام النووي كاملاً مع التسميع | الباحث في السنة',
  description:
    'اثنان وأربعون حديثاً نبوياً جامعاً للإمام النووي رحمه الله، مشكولة ومحققة مع خاصية حفظ الأحاديث والتسميع الذاتي، وبطاقات المشاركة، والتخريج في الدرر السنية.',
};

export default function Nawawi40Page() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-brand/10 dark:bg-emerald-brand-dark/15 text-emerald-brand dark:text-emerald-brand-dark border border-emerald-brand/20 dark:border-emerald-brand-dark/30 shadow-2xs">
          <Scroll className="w-3.5 h-3.5" />
          <span>كليات الدين وقواعد الشريعة الإسلامية</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-charcoal-light dark:text-charcoal-dark">
          الأربعون النووية
        </h1>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          للإمام أبي زكريا يحيى بن شرف النووي رحمه الله (ت ٦٧٦ هـ). الأحاديث الكلية الجامعة التي عليها مدار الإسلام، مع ميزة التسميع والحفظ والتخريج المباشر.
        </p>
      </div>

      {/* Interactive Client Component */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-muted-light">
            جاري تحميل الأربعين النووية...
          </div>
        }
      >
        <NawawiClient />
      </Suspense>
    </div>
  );
}
