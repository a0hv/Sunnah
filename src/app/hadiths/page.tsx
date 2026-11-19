import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { HadithsClient } from '@/components/HadithsClient';

export const metadata: Metadata = {
  title: 'الأحاديث النبوية المشروحة — موسوعة الأحاديث النبوية | منصة السنة',
  description:
    'أكثر من ٥٠٠ حديث نبوي شريف صحيح وحسن مع الشرح المبسط والفوائد التربوية ومعاني الكلمات والتخريج في الدرر السنية من موسوعة HadeethEnc.',
};

export default function HadithsPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-muted-light dark:text-muted-dark">
            جاري تحميل الأحاديث النبوية المشروحة...
          </div>
        }
      >
        <HadithsClient />
      </Suspense>
    </div>
  );
}
