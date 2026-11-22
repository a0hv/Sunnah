import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  ShieldCheck,
  Search,
  Sparkles,
  Scroll,
  Heart,
  Compass,
  AlertCircle,
  Mail,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'عن الموقع | الباحث في السنة',
  description:
    'التعريف بموقع الباحث في السنة: محرك بحث في القرآن الكريم والحديث النبوي والسيرة والأذكار، يعتمد على المصادر المعتمدة دون توليد نصوص.',
};

const SOURCES = [
  {
    title: 'المصحف الشريف',
    desc: 'النص الكامل للقرآن الكريم (6,236 آية)، مع ربط مباشر بكل آية وسورة على موقع Quran.com لمطالعة التفسير والقراءات.',
    author: 'مجمع الملك فهد لطباعة المصحف الشريف',
    icon: BookOpen,
    link: 'https://quran.com',
    isExternal: true,
  },
  {
    title: 'الأربعون النووية',
    desc: 'اثنان وأربعون حديثًا نبويًا جامعًا لقواعد الدين، مع خاصية التسميع الذاتي للمساعدة في الحفظ والمراجعة.',
    author: 'الإمام يحيى بن شرف النووي رحمه الله',
    icon: Scroll,
    link: '/nawawi40',
    isExternal: false,
  },
  {
    title: 'حصن المسلم',
    desc: 'أذكار اليوم والليلة وأدعية الكتاب والسنة في 133 بابًا، مع عدّاد تسبيح لحفظ الأوراد اليومية.',
    author: 'الشيخ د. سعيد بن علي بن وهف القحطاني رحمه الله',
    icon: Heart,
    link: '/adhkar',
    isExternal: false,
  },
  {
    title: 'السيرة النبوية',
    desc: 'محطات مسيرة النبي ﷺ في 30 محطة مرتبة زمنيًا من المولد الشريف حتى الوفاة.',
    author: 'مستندة إلى «الرحيق المختوم» للشيخ صفي الرحمن المباركفوري رحمه الله',
    icon: Compass,
    link: '/seerah',
    isExternal: false,
  },
  {
    title: 'تنبيهات الأحاديث التي لا تصح',
    desc: 'فحص فوري للأحاديث المشتهرة التي لا تصح، مع بيان حكم العلماء والبدائل الصحيحة الثابتة.',
    author: 'مستندة إلى قسم الأحاديث المنتشرة بمؤسسة «الدرر السنية»',
    icon: ShieldCheck,
    link: 'https://dorar.net/fake-hadith',
    isExternal: true,
  },
];

export default function AboutPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 space-y-12 sm:space-y-16 text-start">
      {/* 1. عن الموقع */}
      <header className="border-b border-subtle-light/80 dark:border-subtle-dark/80 pb-8 sm:pb-12 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#9E6B2B] dark:text-[#D4A359]">
          <BookOpen className="w-4 h-4" strokeWidth={1.6} />
          <span>عن الموقع</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold font-display text-charcoal-light dark:text-charcoal-dark leading-tight">
          الباحث في السنة
        </h1>

        <p className="text-base sm:text-lg text-muted-light dark:text-muted-dark leading-relaxed font-text max-w-3xl">
          مشروع عربي غير ربحي، يتيح البحث والقراءة في القرآن الكريم والحديث النبوي والسيرة النبوية والأذكار، بواجهة سريعة وبسيطة وخالية تمامًا من الإعلانات.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs text-charcoal-light dark:text-charcoal-dark font-sans">
          <span className="px-3 py-1.5 rounded-full bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium">
            مشروع مستقل ومجاني بالكامل
          </span>
          <span className="px-3 py-1.5 rounded-full bg-[#9E6B2B]/10 text-[#9E6B2B] dark:bg-[#D4A359]/15 dark:text-[#D4A359] border border-[#9E6B2B]/20 dark:border-[#D4A359]/30 font-semibold">
            نصوص أصلية دون توليد بالذكاء الاصطناعي
          </span>
        </div>
      </header>

      {/* 2. كيف يعمل البحث */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-charcoal-light dark:text-charcoal-dark">
            كيف يعمل البحث
          </h2>
          <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark">
            يعتمد الموقع على البحث المباشر في الكتب الأصلية مع توجيه ذكي للمصادر المتخصصة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* ركيزة 1 */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 text-[#9E6B2B] dark:text-[#D4A359] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <h3 className="font-display font-bold text-base text-charcoal-light dark:text-charcoal-dark">
              نصوص أصلية فقط
            </h3>
            <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
              تُعرض الآيات والأحاديث والأذكار كما وردت في كتبها المعتمدة، دون أي توليد أو تعديل على النصوص.
            </p>
          </div>

          {/* ركيزة 2 */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 text-[#9E6B2B] dark:text-[#D4A359] flex items-center justify-center">
              <Search className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <h3 className="font-display font-bold text-base text-charcoal-light dark:text-charcoal-dark">
              بحث محلي مباشر
            </h3>
            <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
              يبحث الموقع فورياً في القرآن الكريم كاملاً، وحصن المسلم، والأربعين النووية، ومحطات السيرة، وقائمة الأحاديث المنتشرة التي لا تصح.
            </p>
          </div>

          {/* ركيزة 3 */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 text-[#9E6B2B] dark:text-[#D4A359] flex items-center justify-center">
              <Sparkles className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <h3 className="font-display font-bold text-base text-charcoal-light dark:text-charcoal-dark">
              توجيه ذكي للبحث
            </h3>
            <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
              يقتصر دور الذكاء الاصطناعي على فهم مقصد سؤالك واستخراج أنسب كلمات للبحث في المصادر المتخصصة كالدرر السنية وموسوعات الحديث والفتاوى.
            </p>
          </div>
        </div>
      </section>

      {/* 3. الكتب والمصادر */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-charcoal-light dark:text-charcoal-dark">
            الكتب والمصادر
          </h2>
          <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark">
            المصادر المعتمدة في قاعدة بيانات الموقع
          </p>
        </div>

        <div className="divide-y divide-subtle-light/80 dark:divide-subtle-dark/80 border-y border-subtle-light/80 dark:border-subtle-dark/80">
          {SOURCES.map((source, idx) => {
            const Icon = source.icon;
            return (
              <div
                key={idx}
                className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 text-[#9E6B2B] dark:text-[#D4A359] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" strokeWidth={1.6} />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3 className="font-display font-bold text-base text-charcoal-light dark:text-charcoal-dark">
                      {source.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark font-text leading-relaxed">
                      {source.desc}
                    </p>
                    <span className="inline-block text-[11px] text-[#9E6B2B] dark:text-[#D4A359] font-medium font-sans">
                      المصدر: {source.author}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 sm:self-center ms-12 sm:ms-0">
                  {source.isExternal ? (
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-light dark:text-muted-dark hover:text-[#9E6B2B] dark:hover:text-[#D4A359] transition-colors"
                    >
                      <span>زيارة المصدر</span>
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.6} />
                    </a>
                  ) : (
                    <Link
                      href={source.link}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9E6B2B] dark:text-[#D4A359] hover:underline"
                    >
                      <span>فتح في الموقع</span>
                      <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.6} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. حالة الموقع */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#9E6B2B]/[0.05] dark:bg-[#D4A359]/10 border border-[#9E6B2B]/20 dark:border-[#D4A359]/30 space-y-3 text-start">
        <div className="flex items-center gap-2 text-[#9E6B2B] dark:text-[#D4A359] font-bold text-sm sm:text-base">
          <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={1.8} />
          <span>حالة الموقع: نسخة تجريبية قيد التطوير</span>
        </div>
        <p className="text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark leading-relaxed font-text">
          يعمل البحث حاليًا بالاعتماد على الكتب المحفوظة في الموقع، ونعمل على استكمال الربط المباشر مع موسوعة «الدرر السنية».
        </p>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text pt-1 border-t border-[#9E6B2B]/15 dark:border-[#D4A359]/20">
          تنويه: الموقع أداة للبحث في النصوص ونقلها، ولا يقدم فتاوى خاصة؛ ونحيل الأسئلة الفقهية دائمًا إلى مواقع الإفتاء المعتمدة.
        </p>
      </section>

      {/* 5. للتواصل */}
      <footer className="p-6 sm:p-8 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-base sm:text-lg text-charcoal-light dark:text-charcoal-dark">
            إعداد وتطوير
          </h3>
          <p className="text-sm text-muted-light dark:text-muted-dark font-text">
            أحمد بن جابر القاضي
          </p>
        </div>

        <a
          href="mailto:ag.elkady1@gmail.com"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark hover:border-[#9E6B2B]/50 dark:hover:border-[#D4A359]/50 text-xs sm:text-sm font-medium text-charcoal-light dark:text-charcoal-dark transition-colors self-start sm:self-auto"
        >
          <Mail className="w-4 h-4 text-[#9E6B2B] dark:text-[#D4A359]" strokeWidth={1.6} />
          <span className="font-sans font-medium text-muted-light dark:text-muted-dark">للتواصل:</span>
          <span dir="ltr" className="font-mono text-charcoal-light dark:text-charcoal-dark font-medium">
            ag.elkady1@gmail.com
          </span>
        </a>
      </footer>
    </article>
  );
}
