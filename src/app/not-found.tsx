import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-emerald-brand/10 text-emerald-brand dark:text-emerald-brand-dark flex items-center justify-center font-bold text-2xl font-sans">
        ٤٠٤
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-quran text-slate-900 dark:text-white">
          الصفحة غير موجودة
        </h1>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark max-w-md leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها. يمكنك العودة للصفحة الرئيسية وتصفح «منصة السنة».
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-brand text-white font-bold text-xs sm:text-sm hover:bg-emerald-brand/90 transition-colors shadow-xs"
      >
        <Home className="w-4 h-4" />
        <span>العودة للرئيسية</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>
    </div>
  );
}
