import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Heart, Sparkles, ShieldCheck, CalendarCheck, ExternalLink, ArrowLeft, Scroll, Compass } from 'lucide-react';

export const metadata: Metadata = {
  title: 'عن منصة السنة والمنهج العلمي | منصة السنة',
  description: 'التعريف بمنصة السنة النبوية ومصادرها العلمية المعتمدة: الأربعون النووية، حصن المسلم، السيرة النبوية، قسم تثبّت، ومتتبع سنن اليوم والليلة.',
};

export default function AboutPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12 text-start">
      {/* Header */}
      <header className="border-b border-subtle-light dark:border-subtle-dark pb-10 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-brand dark:text-emerald-brand-dark uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>التعريف والمنهجية العلمية</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold font-display text-slate-900 dark:text-white leading-tight">
          عن «منصة السنة»
        </h1>

        <p className="text-lg sm:text-xl text-muted-light dark:text-muted-dark leading-relaxed font-text max-w-3xl">
          المرجع الرقمي العصري لكلام سيد المرسلين ﷺ: الجمع بين أصول الحديث النبوي والآداب، والعمل اليومي، والتثبت العلمي.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark">
          <span className="px-3 py-1 rounded-lg bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium">
            منصة رقمية موثوقة • وقف لوجه الله تعالى
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-brand/10 text-emerald-brand dark:text-emerald-brand-dark font-semibold">
            تخريج مباشر وتثبت معتمد
          </span>
        </div>
      </header>

      {/* الرؤية والرسالة */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-emerald-brand" />
          <span>الرؤية والهدف</span>
        </h2>
        <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-4 text-sm text-charcoal-light dark:text-charcoal-dark leading-[2] font-text">
          <p>
            تأسست <strong>«منصة السنة»</strong> انطلاقاً من واجب خدمة حديث رسول الله صلى الله عليه وسلم وهديه الشريف، وتقريب علوم الحديث والآداب النبوية للمسلم المعاصر في قالب رقمي حديث وسهل التصفح على كافة الأجهزة الذكية.
          </p>
          <p>
            حرصنا في بناء المنصة على الجمع بين <strong>الأمانة العلمية الصارمة</strong> في نقل النصوص وضبطها بالشكل، وبين <strong>التطبيق العملي</strong> الذي يعين المسلم على عمارة يومه وليلته بهدي نبيه ﷺ في كل موقف ولحظة.
          </p>
        </div>
      </section>

      {/* الأركان والمصادر العلمية */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
          المصادر العلمية المعتمدة في المنصة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* السيرة النبوية */}
          <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
            <div className="flex items-center gap-2 text-emerald-brand dark:text-emerald-brand-dark font-bold text-sm">
              <Compass className="w-5 h-5" />
              <span>السيرة النبوية العطرة</span>
            </div>
            <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
              محطات حياة الحبيب المصطفى ﷺ من المولد الشريف والبعثة والهجرة إلى حجة الوداع والرفيق الأعلى، مقسمة زمنياً وموضوعياً مع استخلاص الدروس والعبر والأماكن والشخصيات.
            </p>
            <Link
              href="/seerah"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-brand hover:underline pt-2"
            >
              <span>تصفح السيرة النبوية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* حصن المسلم */}
          <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
            <div className="flex items-center gap-2 text-emerald-brand dark:text-emerald-brand-dark font-bold text-sm">
              <Sparkles className="w-5 h-5" />
              <span>كتاب «حصن المسلم»</span>
            </div>
            <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
              للشيخ د. سعيد بن علي بن وهف القحطاني رحمه الله. جامع أذكار الكتاب والسنة في ١٣٣ باباً من أوراد اليوم والليلة وأدعية الكرب والسفر، مزوداً بعدّاد تسبيح تفاعلي وحفظ يومي.
            </p>
            <Link
              href="/adhkar"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-brand hover:underline pt-2"
            >
              <span>فتح الأذكار بالعدّاد</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* قسم تثبت */}
          <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>قسم «تثبّت» والتحقيق الحديثي</span>
            </div>
            <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
              بيان الأحاديث المنتشرة التي لا تصح والبدائل الصحيحة الثابتة عنها، نقلاً موثقاً من الموسوعة الحديثية في مؤسسة «الدرر السنية» مع أدوات نسخ التنبيه للواتساب وبطاقات المشاركة.
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline pt-2"
            >
              <span>زيارة قسم تثبّت</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* متتبع سنن اليوم والليلة */}
          <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 font-bold text-sm">
              <CalendarCheck className="w-5 h-5" />
              <span>متتبع سنن اليوم والليلة</span>
            </div>
            <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
              ١٢ محطة مرتبة زمنياً من الاستيقاظ حتى النوم، مربوطة بأبواب «حصن المسلم» ومحرك البحث الموثق في السنة مع حفظ الإنجاز اليومي محلياً في متصفحك وبلا حاجة لأي حساب خارجي.
            </p>
            <Link
              href="/daily-tracker"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300 hover:underline pt-2"
            >
              <span>بدء التتبع اليومي</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* الأربعون النووية */}
          <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-3">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
              <Scroll className="w-5 h-5" />
              <span>كتاب «الأربعون النووية»</span>
            </div>
            <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
              للإمام النووي رحمه الله. اثنان وأربعون حديثاً كلياً جامعاً لقواعد الدين ومحاسن الشريعة، مزودة بنظام تسميع ذاتي ورصد إنجاز الحفظ في المتصفح.
            </p>
            <Link
              href="/nawawi40"
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline pt-2"
            >
              <span>فتح الأربعين النووية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* الروابط التوثيقية الخارجية */}
      <section className="p-6 sm:p-8 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-4">
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
          التوثيق والربط الخارجي المعتمد
        </h2>
        <ul className="space-y-3 text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark font-sans">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-brand shrink-0 mt-0.5" />
            <div>
              <strong>مؤسسة «الدرر السنية» (Dorar.net):</strong> جميع أحاديث المنصة مربوطة آلياً بخدمة التخريج والبحث بالكلمات في الموسوعة الحديثية للتحقق من أسانيدها وصحتها.
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-brand shrink-0 mt-0.5" />
            <div>
              <strong>القرآن الكريم (Quran.com):</strong> كل آية قرآنية بين قوسي ﴿...﴾ في الموقع مربوطة تلقائياً برقم سورتها وآيتها المباشرة لقراءة تفاسيرها وترجماتها.
            </div>
          </li>
        </ul>
      </section>
    </article>
  );
}
