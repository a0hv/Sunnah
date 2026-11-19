import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SearchClient } from '@/components/SearchClient';

export const metadata: Metadata = {
  title: 'البحث الفوري وقاموس المواقف | منصة السنة',
  description:
    'محرك بحث فوري ذكي ودقيق داخل رياض الصالحين للإمام النووي، وحصن المسلم، وأحاديث تثبّت المنتشرة التي لا تصح، وقاموس المواقف الحياتية اليومية.',
};

export default function SearchPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Search Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-semibold text-emerald-brand dark:text-emerald-brand-dark uppercase tracking-wider block">
          منصة السنة • محرك البحث الموثق وقاموس المواقف
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-sans text-slate-900 dark:text-white">
          البحث في السنة النبوية
        </h1>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          ابحث بكلماتك اليومية (بالفصحى أو العامية) أو بطرف الحديث في «رياض الصالحين» و«حصن المسلم» و«تثبّت».
        </p>
      </div>

      {/* Client Search Wrapped in Suspense */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-muted-light dark:text-muted-dark">
            جاري تهيئة محرك البحث الفوري...
          </div>
        }
      >
        <SearchClient />
      </Suspense>
    </div>
  );
}
