import React from 'react';
import type { Metadata } from 'next';
import { VerifyClient } from '@/components/VerifyClient';

export const metadata: Metadata = {
  title: 'تثبّت | أحاديث منتشرة لا تصح وبديلها الصحيح وميزان الأحكام',
  description:
    'قسم التثبت والتحقيق الحديثي: مقارنة موثقة بين الأحاديث الضعيفة والموضوعة المنتشرة وبين البدائل النبوية الصحيحة، مع ميزان مراتب الأحكام الست.',
};

export default function VerifyPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
          منصة السنة • صيانة الحديث الشريف والتثبت العلمي
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-quran text-slate-900 dark:text-white">
          قسم «تثبّت»
        </h1>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed">
          صيانة السنة النبوية المطهرة: بيان الأحاديث المنتشرة التي لا تصح، وتقديم البدائل الصحيحة الثابتة عنها، مع ضبط مراتب الأحكام الستة.
        </p>
      </div>

      <VerifyClient />
    </div>
  );
}
