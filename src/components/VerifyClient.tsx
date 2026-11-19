'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  BookOpen,
  Scale,
  Sparkles,
  Info,
  Layers,
  FileCheck2,
  ExternalLink,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import fakeHadithsDataRaw from '@/data/fake-hadiths.json';
import { FiqhBadge } from './FiqhBadge';
import { ShareCardModal, type ShareCardData } from './ShareCardModal';
import { normalizeArabic } from '@/lib/arabic-search';
import { getDorarHadithUrl } from '@/lib/external-refs';
import type {
  FiqhRankingItem,
  FiqhRank,
  FakeHadithsData,
  DorarFakeHadith,
} from '@/types/book';

interface ComparativePair {
  id: string;
  unauthentic: {
    title: string;
    text: string;
    degree: string;
    footnote: string;
  };
  authentic: {
    title: string;
    text: string;
    narratorAndSource: string;
    footnote: string;
  };
}

const COMPARATIVE_PAIRS: ComparativePair[] = [
  {
    id: 'pair-1',
    unauthentic: {
      title: 'حديث صلاة ست ركعات بعد المغرب لتعدل ١٢ سنة',
      text: '«من صلى بعد المغرب ست ركعاتٍ لم يتكلم فيما بينهن بسوءٍ عُدلن له بعبادة اثنتي عشرة سنة»',
      degree: 'ضعيفٌ جدًا لا يصح',
      footnote: 'أخرجه الترمذي وضعّفه هو والألباني جدًا.',
    },
    authentic: {
      title: 'البديل الصحيح: السنن الرواتب الثابتة اليومية (١٢ ركعة)',
      text: '«من صلى في يومٍ وليلةٍ ثنتي عشرة ركعة، بُني له بيتٌ في الجنة: أربعًا قبل الظهر، وركعتين بعدها، وركعتين بعد المغرب، وركعتين بعد العشاء، وركعتين قبل صلاة الغداة»',
      narratorAndSource: 'عن أم حبيبة رضي الله عنها — رواه مسلم والترمذي',
      footnote: 'أخرجه مسلم في صحيحه، كتاب صلاة المسافرين.',
    },
  },
  {
    id: 'pair-2',
    unauthentic: {
      title: 'حديث قراءة سورة الواقعة كل ليلة لمنع الفقر',
      text: '«من قرأ سورة الواقعة في كل ليلةٍ لم تصبه فاقةٌ أبدًا»',
      degree: 'ضعيف الإسناد لا يثبت',
      footnote: 'أخرجه البيهقي في شعب الإيمان، وضعّفه أحمد وأبو حاتم والدارقطني والألباني.',
    },
    authentic: {
      title: 'البديل الصحيح: آية الكرسي دبر كل صلاة مكتوبة وأذكار الرزق',
      text: '«من قرأ آية الكرسي دبر كل صلاةٍ مكتوبةٍ لم يمنعه من دخول الجنة إلا أن يموت»',
      narratorAndSource: 'عن أبي أمامة الباهلي رضي الله عنه — رواه النسائي وصححه الألباني',
      footnote: 'أخرجه النسائي في السنن الكبرى، وصححه ابن حبان والألباني.',
    },
  },
  {
    id: 'pair-3',
    unauthentic: {
      title: 'صلوات وهيئات مخترعة ليلة الجمعة',
      text: 'ما يُروى في صلاةٍ مخصوصةٍ ليلة الجمعة بعدد ركعات وهيئات مخصوصة ترتّب أجورًا خيالية',
      degree: 'موضوعٌ مكذوبٌ لا أصل له',
      footnote: 'نص الحفاظ والمحققون كابن القيم وابن حجر على بطلانها ووضعها.',
    },
    authentic: {
      title: 'البديل الصحيح: التحذير من الكذب + سنن الجمعة المشروعة',
      text: '«من كذب عليّ متعمدًا فليتبوأ مقعده من النار»',
      narratorAndSource: 'عن أبي هريرة رضي الله عنه — رواه البخاري ومسلم',
      footnote: 'أخرجه البخاري ومسلم، مع مشروعية قراءة سورة الكهف والتبكير والغسل والصلاة على النبي ﷺ.',
    },
  },
  {
    id: 'pair-4',
    unauthentic: {
      title: 'زيادات دعاء الأذان غير الثابتة في ختامه',
      text: 'زيادة «إنك لا تخلف الميعاد» في آخر دعاء الوسيلة، وزيادة «والدرجة العالية الرفيعة»',
      degree: 'زيادات شاذة ولا أصل لها',
      footnote: 'الأصل الصحيح في صحيح البخاري بدونها؛ وزيادة الميعاد شاذة ضعّفها الألباني والمحققون.',
    },
    authentic: {
      title: 'البديل الصحيح: دعاء الوسيلة الصحيح المحكم + التسبيح',
      text: '«اللهم رب هذه الدعوة التامة، والصلاة القائمة، آتِ محمدًا الوسيلة والفضيلة، وابعثه مقامًا محمودًا الذي وعدته»',
      narratorAndSource: 'عن جابر بن عبد الله رضي الله عنهما — رواه البخاري',
      footnote: 'أخرجه البخاري في صحيحه، كتاب الأذان.',
    },
  },
];

const FIQH_RANKINGS_DATA: FiqhRankingItem[] = [
  {
    id: 'rank-1',
    rank: 'ركن',
    definition: 'ما لا يقوم الشيء إلا به، وهو جزء من حقيقته وماهيته، ويبطل العمل بتركه عمداً أو سهواً.',
    rulingAndEffect: 'يبطل العمل بتركه مطلقاً، ولا يجبره سجود السهو، بل لا بد من الإتيان به.',
    examples: 'تكبيرة الإحرام، وقراءة الفاتحة، والركوع، والسجود في الصلاة.',
  },
  {
    id: 'rank-2',
    rank: 'واجب',
    definition: 'ما أمر به الشارع أمراً جازماً على وجه الحتم والإلزام، ويُثاب فاعله ويأثم تاركه عمداً.',
    rulingAndEffect: 'يأثم تاركه عمداً، وإن تركه سهواً في الصلاة جبر بسجود السهو.',
    examples: 'التكبيرات الانتقالية، وقول: «سبحان ربي العظيم» في الركوع، والتشهد الأول.',
  },
  {
    id: 'rank-3',
    rank: 'سنة مؤكدة',
    definition: 'ما واظب النبي ﷺ على فعله ولم يتركه إلا نادراً لبيان الجواز، ورغّب في ثوابه.',
    rulingAndEffect: 'يُثاب فاعلها ولا يأثم تاركها، ولكن يُلام على المداومة على تركها تفريطاً في الهدي.',
    examples: 'السنن الرواتب (١٢ ركعة)، وصلاة الوتر، وركعتا الفجر، والسواك.',
  },
  {
    id: 'rank-4',
    rank: 'مستحب',
    definition: 'ما رغّب فيه الشارع من غير إلزام ولا حتم، ويُطلق عليه أيضاً المندوب والفضيلة والنفل.',
    rulingAndEffect: 'يُثاب فاعله امتثالاً ولا يُعاقب تاركه ولا يُلام.',
    examples: 'صيام الاثنين والخميس، وركعتا الضحى، والتبكير إلى الجمعة، والدعاء بين الأذان والإقامة.',
  },
  {
    id: 'rank-5',
    rank: 'مباح',
    definition: 'ما خُيّر المكلف بين فعله وتركه من غير مدح ولا ذم لذاته.',
    rulingAndEffect: 'لا ثواب فيه ولا عقاب بذاته، ولكنه ينقلب بالنية الصالحة إلى قربة وطاعة.',
    examples: 'أنواع الأطعمة والمشاريب المباحة، واللباس المعتاد، والبيع والشراء.',
  },
  {
    id: 'rank-6',
    rank: 'عادة جبلية',
    definition: 'الأفعال الصادرة عن النبي ﷺ بمقتضى الطبيعة البشرية والإنسانية دون قصد التشريع.',
    rulingAndEffect: 'لا يترتب عليها حكم شرعي من وجوب أو ندب لذاتها، ومتابعته فيها محبة تُرجى بركتها.',
    examples: 'طريقته في المشي، وهيئة جلوسه، وألوان ثيابه المعتادة، ونوع طعامه المفضل كالدباء.',
  },
];

const fakeData = fakeHadithsDataRaw as unknown as FakeHadithsData;
const PAGE_SIZE = 20;

type VerifyTab = 'dorar-fake' | 'comparative' | 'rankings';

export function VerifyClient() {
  const [activeTab, setActiveTab] = useState<VerifyTab>('dorar-fake');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);

  const rankings: FiqhRankingItem[] = FIQH_RANKINGS_DATA;
  const fakeHadithsList: DorarFakeHadith[] = fakeData.hadiths || [];

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast((cur) => (cur === msg ? null : cur));
    }, 2500);
  };

  // Filter Dorar fake hadiths by search
  const filteredFakeHadiths = useMemo(() => {
    const q = normalizeArabic(searchQuery.trim());
    if (!q) return fakeHadithsList;

    return fakeHadithsList.filter((item) => {
      const textNorm = normalizeArabic(item.hadithText);
      const rulingNorm = normalizeArabic(item.ruling);
      return textNorm.includes(q) || rulingNorm.includes(q);
    });
  }, [fakeHadithsList, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredFakeHadiths.length / PAGE_SIZE) || 1;
  const displayedFakeHadiths = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFakeHadiths.slice(start, start + PAGE_SIZE);
  }, [filteredFakeHadiths, currentPage]);

  const handleCopyDorarItem = async (item: DorarFakeHadith) => {
    const formatted = `⚠️ تنبيه وتثبّت حديثي:
نص الحديث المنتشر:
«${item.hadithText}»

▪️ حكم الحديث: ${item.ruling}
📚 المصدر: موسوعة الأحاديث المنتشرة التي لا تصح — الدرر السنية
🔗 رابط التحقق المباشر: ${item.dorarUrl}`;

    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedId(item.id);
      showToast('تم نسخ التنبيه لصيغة الواتساب بنجاح');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('تعذر النسخ إلى الحافظة');
    }
  };

  const handleCopyPair = async (pair: ComparativePair) => {
    const formatted = `⚠️ تنبيه وتثبّت حديثي:
انتشر حديث: ${pair.unauthentic.text}
▪️ حكمه: ${pair.unauthentic.degree} (${pair.unauthentic.footnote})

✅ والبديل النبوي الصحيح الثابت عنه ﷺ:
${pair.authentic.text}
▪️ رواه: ${pair.authentic.narratorAndSource}

📚 المصدر: منصة السنة — قسم التثبت الحديثي`;

    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedId(pair.id);
      showToast('تم نسخ التنبيه والبديل الصحيح بنجاح للمشاركة');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('تعذر النسخ إلى الحافظة');
    }
  };

  const mapRankName = (raw: string): FiqhRank => {
    if (raw.includes('ركن')) return 'ركن';
    if (raw.includes('واجب')) return 'واجب';
    if (raw.includes('مؤكدة')) return 'سنة مؤكدة';
    if (raw.includes('مستحب')) return 'مستحب';
    if (raw.includes('مباح')) return 'مباح';
    return 'عادة جبلية';
  };

  return (
    <div className="space-y-10 text-start">
      {/* 1. Header & Source Attribution Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-amber-500/10 via-surface-light to-emerald-brand/10 dark:from-amber-500/15 dark:via-surface-dark dark:to-emerald-brand/15 border border-amber-500/30 dark:border-amber-500/40 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle-light/70 dark:border-subtle-dark/70 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>قاعدة الأمانة والتثبت في النقل عن رسول الله ﷺ</span>
          </div>

          <a
            href="https://dorar.net/fake-hadith"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-xs font-bold text-emerald-brand dark:text-emerald-brand-dark hover:border-emerald-brand/40 shadow-2xs transition-colors"
          >
            <span>المصدر: موسوعة الدرر السنية (dorar.net)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white">
          «كفى بالمرء كذبًا أن يحدّث بكل ما سمع»
        </h2>

        <p className="text-xs sm:text-sm text-charcoal-light dark:text-charcoal-dark leading-relaxed">
          إن من أعظم القربات الذبّ عن سنة المصطفى ﷺ وصيانتها مما لم يثبت عنه. يضم هذا القسم قائمة الأحاديث المكذوبة والضعيفة المتداولة بالتعاون مع جهود <strong>موقع الدرر السنية</strong>، إلى جانب نماذج المقارنة بالبدائل الصحيحة وميزان مراتب الأحكام الست.
        </p>
      </div>

      {/* 2. Mode Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark max-w-2xl mx-auto shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('dorar-fake')}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'dorar-fake'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>أحاديث لا تصح ({fakeHadithsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comparative')}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'comparative'
              ? 'bg-emerald-brand text-white shadow-xs'
              : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>مقارنة الشائع بالبديل ({COMPARATIVE_PAIRS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rankings')}
          className={`flex-1 min-w-[170px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'rankings'
              ? 'bg-emerald-brand text-white shadow-xs'
              : 'text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>مراتب الأحكام (٦)</span>
        </button>
      </div>

      {/* ================= TAB 1: DORAR FAKE HADITHS ================= */}
      {activeTab === 'dorar-fake' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Instant Search Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark shadow-xs space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-light dark:text-muted-dark">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="الصق أو اكتب نص الحديث المنتشر للتحقق من صحته فوراً..."
                className="w-full ps-10 pe-10 py-3 rounded-2xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-xs sm:text-sm placeholder:text-muted-light/60 dark:placeholder:text-muted-dark/60 focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all text-slate-900 dark:text-white font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-muted-light dark:text-muted-dark hover:text-charcoal-light dark:hover:text-charcoal-dark"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-light dark:text-muted-dark pt-1">
              <span>
                {filteredFakeHadiths.length} حديثاً مطابقاً من أصل {fakeHadithsList.length} حديثاً موثقاً
              </span>
              <a
                href="https://dorar.net/fake-hadith"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 dark:text-amber-300 hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>موسوعة الأحاديث المنتشرة بالدرر السنية</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Fallback if no local match */}
          {filteredFakeHadiths.length === 0 && searchQuery && (
            <div className="p-8 sm:p-10 text-center rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  لم نجد نص هذا الحديث ضمن القائمة المحلية المختارة
                </h3>
                <p className="text-xs text-muted-light dark:text-muted-dark max-w-md mx-auto">
                  يمكنك التحقق منه فوراً مباشرة في محرك البحث الشامل للموسوعة الحديثية بالدرر السنية:
                </p>
              </div>

              <a
                href={getDorarHadithUrl(searchQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs sm:text-sm hover:bg-amber-700 transition-colors shadow-xs"
              >
                <span>ابحث عن هذا الحديث مباشرة في الدرر السنية</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-4">
            {displayedFakeHadiths.map((item) => (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-rose-200 dark:border-rose-950/60 hover:border-rose-300 dark:hover:border-rose-900 shadow-2xs space-y-4 transition-all"
              >
                {/* Top Bar: Degree Badge & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle-light/70 dark:border-subtle-dark/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-400 font-sans font-bold text-xs flex items-center justify-center">
                      #{item.id}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      {item.ruling}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Share Card */}
                    <button
                      type="button"
                      onClick={() => {
                        setShareCardData({
                          category: 'تثبّت • أحاديث لا تصح',
                          sectionTitle: `حكم الحديث: ${item.ruling}`,
                          text: item.hadithText,
                          citation: 'موسوعة الأحاديث المنتشرة التي لا تصح — الدرر السنية',
                        });
                      }}
                      title="توليد بطاقة مشاركة تحذيرية"
                      className="p-1.5 rounded-lg border border-subtle-light dark:border-subtle-dark text-muted-light dark:text-muted-dark hover:text-gold-accent hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
                    </button>

                    {/* Copy Alert Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyDorarItem(item)}
                      title="نسخ صيغة التنبيه والتحذير لواتساب"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-subtle-light dark:border-subtle-dark text-xs font-medium text-charcoal-light dark:text-charcoal-dark hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ للواتساب</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Hadith Text */}
                <p className="font-hadith text-base sm:text-lg leading-[2.2] text-slate-900 dark:text-white text-justify">
                  {item.hadithText}
                </p>

                {/* Explanation if present */}
                {item.explanation && (
                  <div className="p-3 rounded-xl bg-paper-light dark:bg-paper-dark border border-subtle-light dark:border-subtle-dark text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                    <span className="font-bold text-amber-700 dark:text-amber-300 me-1">
                      البيان والبديل:
                    </span>
                    <span>{item.explanation}</span>
                  </div>
                )}

                {/* Footer Link to Dorar */}
                <div className="pt-2 border-t border-subtle-light/50 dark:border-subtle-dark/50 flex items-center justify-between text-xs">
                  <span className="text-muted-light dark:text-muted-dark">
                    المصدر: الدرر السنية
                  </span>
                  <a
                    href={item.dorarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-brand hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>التفاصيل في الدرر السنية</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                className="py-1.5 px-3 rounded-lg border border-subtle-light dark:border-subtle-dark font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <span className="font-mono text-muted-light dark:text-muted-dark">
                صفحة {currentPage} من {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                className="py-1.5 px-3 rounded-lg border border-subtle-light dark:border-subtle-dark font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>التالي</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: COMPARATIVE PAIRS ================= */}
      {activeTab === 'comparative' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-s-4 border-amber-500 ps-4 py-1 text-start">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wider block">
              المقارنة والبيان
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white">
              أحاديث مشتهرة لا تصح وبدائلها الصحيحة
            </h2>
          </div>

          <div className="space-y-6">
            {COMPARATIVE_PAIRS.map((pair, idx) => (
              <div
                key={pair.id}
                className="p-6 sm:p-7 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark space-y-6 shadow-xs"
              >
                {/* Header: Topic Title & WhatsApp Sharing Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle-light/70 dark:border-subtle-dark/70 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-sans font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-charcoal-light dark:text-charcoal-dark">
                      المسألة الحديثية: {pair.unauthentic.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShareCardData({
                          category: 'تثبّت حديثي • بديل صحيح',
                          sectionTitle: pair.authentic.title,
                          text: pair.authentic.text,
                          citation: `${pair.authentic.narratorAndSource} (بديلاً عن: ${pair.unauthentic.title})`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-subtle-light dark:border-subtle-dark text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="توليد بطاقة مشاركة للبديل الصحيح"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
                      <span className="hidden sm:inline">بطاقة مشاركة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyPair(pair)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-subtle-light dark:border-subtle-dark text-xs font-medium text-charcoal-light dark:text-charcoal-dark hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 transition-colors"
                      title="نسخ التنبيه والبديل الصحيح بصيغة مهذبة جاهزة للنشر في الواتساب"
                    >
                      {copiedId === pair.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">تم نسخ التنبيه</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ التنبيه مع البديل</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Two Column Layout on Desktop, Stacked on Mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-start">
                  {/* Right Column: Unauthentic Narration (Warning) */}
                  <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-900/60 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-rose-200/80 dark:border-rose-900/40 pb-2">
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>غير ثابت (تحذيرٌ وتنبيه)</span>
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-200/60 text-rose-900 dark:bg-rose-900/80 dark:text-rose-200">
                        {pair.unauthentic.degree}
                      </span>
                    </div>

                    <p className="font-hadith text-base sm:text-lg leading-[2.2] text-rose-950 dark:text-rose-100 text-justify">
                      {pair.unauthentic.text}
                    </p>

                    <div className="text-[11px] text-rose-800/80 dark:text-rose-300/80 pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                      <strong>البيان والتخريج:</strong> {pair.unauthentic.footnote}
                    </div>
                  </div>

                  {/* Left Column: Authentic Alternative (Success) */}
                  <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-800/80 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-emerald-200/80 dark:border-emerald-900/40 pb-2">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>البديل النبوي الصحيح</span>
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200">
                        صحيح ثابت ✓
                      </span>
                    </div>

                    <p className="font-hadith text-base sm:text-lg leading-[2.2] text-emerald-950 dark:text-emerald-100 text-justify">
                      {pair.authentic.text}
                    </p>

                    <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40 space-y-0.5">
                      <div>
                        <strong>التخريج:</strong> {pair.authentic.narratorAndSource}
                      </div>
                      <div className="text-muted-light dark:text-muted-dark">
                        {pair.authentic.footnote}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: FIQH RANKINGS ================= */}
      {activeTab === 'rankings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-s-4 border-emerald-brand ps-4 py-1 text-start">
            <span className="text-xs font-semibold text-emerald-brand dark:text-emerald-brand-dark uppercase tracking-wider block">
              الضبط الأصولي والفقهي
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 dark:text-white">
              ميزان مراتب الأحكام الفقهية الست
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rankings.map((item) => {
              const mappedRank = mapRankName(item.rank);

              return (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-subtle-light dark:border-subtle-dark flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FiqhBadge rank={mappedRank} />
                      <span className="font-mono text-xs text-muted-light dark:text-muted-dark">
                        مرتبة شرعية
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-light dark:text-muted-dark block">
                        التعريف الأصولي:
                      </span>
                      <p className="text-xs text-charcoal-light dark:text-charcoal-dark leading-relaxed font-sans">
                        {item.definition}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-xs font-bold text-emerald-brand dark:text-emerald-brand-dark block">
                        أمثلة تطبيقية من السنن:
                      </span>
                      <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
                        {item.examples}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-subtle-light/70 dark:border-subtle-dark/70 text-xs">
                    <span className="font-bold text-charcoal-light dark:text-charcoal-dark">
                      الأثر والحكم:{' '}
                    </span>
                    <span className="text-muted-light dark:text-muted-dark">
                      {item.rulingAndEffect}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 sm:bottom-10 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-light dark:bg-charcoal-dark text-white text-xs font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Share Card Modal */}
      <ShareCardModal
        isOpen={Boolean(shareCardData)}
        onClose={() => setShareCardData(null)}
        data={shareCardData}
      />
    </div>
  );
}
