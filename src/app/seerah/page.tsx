import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SeerahClient } from '@/components/SeerahClient';

export const metadata: Metadata = {
  title: 'السيرة النبوية العطرة — ثلاثون محطة من الرحيق المختوم | منصة السنة',
  description:
    'المحطات الكبرى في السيرة النبوية العطرة مستندة إلى كتاب «الرحيق المختوم» للمباركفوري، ٣٠ محطة متسلسلة عبر ٦ مراحل كبرى مع الشواهد القرآنية والدروس التربوية ومتتبع القراءة.',
};

export default function SeerahPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-muted-light dark:text-muted-dark">
            جاري تحميل محطات السيرة النبوية العطرة...
          </div>
        }
      >
        <SeerahClient />
      </Suspense>
    </div>
  );
}
