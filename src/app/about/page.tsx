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
  title: 'عن الباحث في السنة | المنهج العلمي وآلية العمل',
  description:
    'التعريف بمشروع «الباحث في السنة» ومنهجه العلمي الموثق: صفر توليد نصوص بالذكاء الاصطناعي، بحث فوري في المصحف والسنة والأذكار، والمصادر العلمية المعتمدة.',
};

const SOURCES = [
  {
    title: 'المصحف الشريف (مصحف المدينة النبوية)',
    desc: 'الفهرس الكامل لكتاب الله (6,236 آية) بالرسم العثماني المضبوط، مع الربط المباشر بكل آية وسورة على موقع Quran.com لمطالعة التفسير والقراءات.',
    author: 'مجمع الملك فهد لطباعة المصحف الشريف',
    icon: BookOpen,
    link: 'https://quran.com',
    isExternal: true,
  },
  {
    title: 'متن «الأربعون النووية»',
    desc: 'اثنان وأربعون حديثًا نبويًا جامعًا لقواعد الدين ومقاصد الشريعة، مجهزة بنظام التسميع الذاتي للمتون ومتابعة الحفظ.',
    author: 'الإمام يحيى بن شرف النووي (ت ٦٧٦ هـ)',
    icon: Scroll,
    link: '/nawawi40',
    isExternal: false,
  },
  {
    title: 'كتاب «حصن المسلم»',
    desc: 'أذكار وأدعية الكتاب والسنة المطهرة في ١٣٣ بابًا و٣٠٢ ذكر، مع عدّاد تسبيح تفاعلي وحفظ يومي للأوراد.',
    author: 'الشيخ د. سعيد بن علي بن وهف القحطاني رحمه الله',
    icon: Heart,
    link: '/adhkar',
    isExternal: false,
  },
  {
    title: 'السيرة النبوية الشريفة',
    desc: 'مسيرة النبي المصطفى ﷺ في ٣٠ محطة تاريخية متسلسلة عبر ٦ حقب كبرى من المولد الشريف حتى الرفيق الأعلى.',
    author: 'مستندة إلى «الرحيق المختوم» للشيخ صفي الرحمن المباركفوري رحمه الله',
    icon: Compass,
    link: '/seerah',
    isExternal: false,
  },
  {
    title: 'التثبّت من الأحاديث التي لا تصح',
    desc: 'فحص استباقي لحظي للتنبيه من الأحاديث الباطلة والموضوعة والضعيفة المنتشرة، مع بيان حكم أهل العلم والبدائل الصحيحة الثابتة.',
    author: 'مستندة إلى قسم الأحاديث المنتشرة بمؤسسة «الدرر السنية»',
    icon: ShieldCheck,
    link: 'https://dorar.net/fake-hadith',
    isExternal: true,
  },
];

export default function AboutPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 space-y-12 sm:space-y-16 text-start">
      {/* 1. رأس الصفحة والتعريف التأسيسي */}
      <header className="border-b border-subtle-light/80 dark:border-subtle-dark/80 pb-8 sm:pb-12 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#9E6B2B] dark:text-[#D4A359]">
          <BookOpen className="w-4 h-4" strokeWidth={1.6} />
          <span>التعريف والمنهجية العلمية</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold font-display text-charcoal-light dark:text-charcoal-dark leading-tight">
          عن «الباحث في السنة»
        </h1>

        <p className="text-base sm:text-lg text-muted-light dark:text-muted-dark leading-relaxed font-text max-w-3xl">
          مشروع عربي رقمي مستقل ومجاني ١٠٠٪، خالٍ تمامًا من الإعلانات أو الاشتراكات، يهدف لتقديم تجربة قراءة وبحث عصرية، سريعة، وموثّقة في السنة النبوية الشريفة والعلوم الشرعية.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs text-charcoal-light dark:text-charcoal-dark font-sans">
          <span className="px-3 py-1.5 rounded-full bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark font-medium">
            مشروع مستقل ومجاني بالكامل
          </span>
          <span className="px-3 py-1.5 rounded-full bg-[#9E6B2B]/10 text-[#9E6B2B] dark:bg-[#D4A359]/15 dark:text-[#D4A359] border border-[#9E6B2B]/20 dark:border-[#D4A359]/30 font-semibold">
            صفر توليد بالذكاء الاصطناعي للنصوص الشرعية
          </span>
        </div>
      </header>

      {/* 2. المنهج العلمي وآلية العمل (صفر تأليف أو هلوسة) */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-charcoal-light dark:text-charcoal-dark">
            المنهج العلمي وآلية العمل (صفر تأليف أو هلوسة)
          </h2>
          <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark">
            ركائز الأمانة العلمية الصارمة التي بُني عليها المحرك
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* ركيزة 1 */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 text-[#9E6B2B] dark:text-[#D4A359] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <h3 className="font-display font-bold text-base text-charcoal-light dark:text-charcoal-dark">
              حظر توليد النصوص الشرعية
            </h3>
            <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
              لا نستخدم الذكاء الاصطناعي في توليد أو تأليف أي آية، حديث، دعاء، أو فتوى إطلاقًا. جميع النصوص تُعرض حرفيًا ومشكولة من مصادرها الأصلية المعتمدة لحماية السنة من أي هلوسة رقمية.
            </p>
          </div>

          {/* ركيزة 2 */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 text-[#9E6B2B] dark:text-[#D4A359] flex items-center justify-center">
              <Search className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <h3 className="font-display font-bold text-base text-charcoal-light dark:text-charcoal-dark">
              البحث الفوري الموثّق
            </h3>
            <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
              محرك بحث لحظي عالي الدقة يبحث مباشرة في المصحف كاملاً (6,236 آية)، وحصن المسلم، والأربعين النووية، ومحطات السيرة، وقاعدة التنبيه للأحاديث المنتشرة التي لا تصح.
            </p>
          </div>

          {/* ركيزة 3 */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light/80 dark:border-subtle-dark/80 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9E6B2B]/10 dark:bg-[#D4A359]/15 text-[#9E6B2B] dark:text-[#D4A359] flex items-center justify-center">
              <Sparkles className="w-5 h-5" strokeWidth={1.6} />
            </div>
            <h3 className="font-display font-bold text-base text-charcoal-light dark:text-charcoal-dark">
              موجّه البحث الشرعي الذكي
            </h3>
            <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text">
              يقتصر دور الذكاء الاصطناعي فقط على فهم سؤال المستخدم واستخلاص أدق كلمات البحث الفصيحة لتوجيهه مباشرة إلى أوثق المصادر المتخصصة (الدرر السنية، HadeethEnc، الإسلام سؤال وجواب، ابن باز، Quran.com، والباحث القرآني).
            </p>
          </div>
        </div>
      </section>

      {/* 3. المصادر العلمية المعتمدة في المكتبة الحالية */}
      <section className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-charcoal-light dark:text-charcoal-dark">
            المصادر العلمية المعتمدة في المكتبة الحالية
          </h2>
          <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark">
            أمهات الكتب والموسوعات المحققة المعتمدة في قاعدة بيانات المنصة
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
                      <span>فتح في المنصة</span>
                      <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.6} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. حالة المنصة حاليًا (نسخة معاينة قيد التطوير) */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#9E6B2B]/[0.05] dark:bg-[#D4A359]/10 border border-[#9E6B2B]/20 dark:border-[#D4A359]/30 space-y-3 text-start">
        <div className="flex items-center gap-2 text-[#9E6B2B] dark:text-[#D4A359] font-bold text-sm sm:text-base">
          <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={1.8} />
          <span>حالة المنصة حاليًا: نسخة معاينة قيد التطوير</span>
        </div>
        <p className="text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark leading-relaxed font-text">
          يعمل البحث حاليًا بالمكتبة الرقمية المحلية الموثّقة، ويجري استكمال الإطلاق الكامل فور تفعيل الربط الرسمي عبر واجهة برمجة التطبيقات (API) مع <strong>مؤسسة الدرر السنية</strong>.
        </p>
        <p className="text-xs sm:text-sm text-muted-light dark:text-muted-dark leading-relaxed font-text pt-1 border-t border-[#9E6B2B]/15 dark:border-[#D4A359]/20">
          تنويه فقهي: «الباحث في السنة» منصة رقمية تقنية ناقلة للعلم الموثّق وميسّرة للوصول إليه، وليست جهة إفتاء شرعي؛ وتوجّه المستفتين دومًا إلى العلماء وهيئات الفتوى الرسمية المعتمدة.
        </p>
      </section>

      {/* 5. الإعداد والتواصل */}
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
