/**
 * src/lib/rag.ts
 * نظام الاسترجاع الدلالي المعزز (RAG) المحصور بالبيانات الموثّقة لمنصة السنة.
 *
 * القواعد الصارمة:
 * 1. لا يُعتمد إلا على المصادر الموثّقة المعتمدة في مجلد src/data/
 * 2. التحقق الاستباقي من قسم «تثبّت» لكشف أي أحاديث مكذوبة أو لا تصح.
 * 3. تزويد نموذج الذكاء الاصطناعي بسياق منضبط يمنعه من اختلاق أي نصوص أو فتاوى.
 */

import nawawiDataRaw from '@/data/nawawi40.json';
import hisnDataRaw from '@/data/hisn-al-muslim.json';
import seerahDataRaw from '@/data/seerah.json';
import fakeDataRaw from '@/data/fake-hadiths.json';
import dailyDataRaw from '@/data/daily-sunnah.json';
import { getDorarSearchUrl } from './dorar-api';

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[«»"”'’[\](){}<>؛،.؟!/\\–—\n\r]/g, ' ')
    .replace(/[\s\u200c\u200d]+/g, ' ')
    .trim()
    .toLowerCase();
}

export interface RagSource {
  title: string;
  category: string;
  source: string;
  url: string;
  type: 'nawawi' | 'hisn' | 'seerah' | 'fake-hadith' | 'daily-tracker';
}

export interface RagRetrievalResult {
  hasVerifiedContext: boolean;
  contextText: string;
  sources: RagSource[];
  isFakeWarning: boolean;
  dorarSearchUrl: string;
}

export function retrieveVerifiedContext(query: string): RagRetrievalResult {
  const normQuery = normalizeArabic(query);
  const dorarSearchUrl = getDorarSearchUrl(query);

  if (!normQuery || normQuery.length < 2) {
    return {
      hasVerifiedContext: false,
      contextText: '',
      sources: [],
      isFakeWarning: false,
      dorarSearchUrl,
    };
  }

  const queryTokens = normQuery.split(' ').filter((t) => t.length >= 2);
  const sources: RagSource[] = [];
  const contextParts: string[] = [];
  let isFakeWarning = false;

  // 1. فحص قسم «تثبّت» أولاً لكشف الأحاديث المكذوبة والضعيفة
  const fakeData = fakeDataRaw as any;
  const fakeList = Array.isArray(fakeData?.hadiths)
    ? fakeData.hadiths
    : Array.isArray(fakeData?.fakeHadiths)
    ? fakeData.fakeHadiths
    : [];

  for (const item of fakeList) {
      const normText = normalizeArabic(item.hadithText || '');
      const normExpl = normalizeArabic(item.explanation || '');

      const isMatch =
        normText.includes(normQuery) ||
        (queryTokens.length >= 2 && queryTokens.every((t) => normText.includes(t))) ||
        (queryTokens.length >= 2 && queryTokens.filter((t) => normText.includes(t)).length >= 2);

      if (isMatch) {
        isFakeWarning = true;
        contextParts.push(
          `[تنبيه علمي فوري من قسم تثبّت]\n` +
          `الحديث المذكور: «${item.hadithText}»\n` +
          `الحكم والدرجة: ${item.ruling}\n` +
          `البيان والتحقيق: ${item.explanation}\n` +
          `المصدر: الموسوعة الحديثية بمؤسسة «الدرر السنية»`
        );
        sources.push({
          title: `حديث لا يصح: «${item.hadithText.slice(0, 45)}...»`,
          category: 'قسم تثبّت — الدرر السنية',
          source: item.ruling,
          url: '/verify',
          type: 'fake-hadith',
        });
        break; // نكتفي بأبرز مطابقة
      }
    }

  // 2. البحث في الأربعين النووية (نصوص كاملة وأرقام)
  const nawawiData = nawawiDataRaw as any;
  if (Array.isArray(nawawiData?.hadiths)) {
    let nawawiMatches = 0;
    for (const item of nawawiData.hadiths) {
      const normTitle = normalizeArabic(item.title || '');
      const normText = normalizeArabic(item.text || '');
      const normNarrator = normalizeArabic(item.narrator || '');

      const isMatch =
        normTitle.includes(normQuery) ||
        normText.includes(normQuery) ||
        (queryTokens.length >= 2 && queryTokens.every((t) => normText.includes(t) || normTitle.includes(t)));

      if (isMatch && nawawiMatches < 3) {
        nawawiMatches++;
        contextParts.push(
          `[حديث نبوي شريف — الأربعون النووية]\n` +
          `الحديث رقم (${item.id}): ${item.title}\n` +
          `المتن: ${item.text}\n` +
          `الراوي: ${item.narrator || 'صحابي جليل'}\n` +
          `التخريج والمصدر: ${item.source || 'رواه البخاري ومسلم'}`
        );
        sources.push({
          title: `الحديث (${item.id}): ${item.title}`,
          category: 'الأربعون النووية',
          source: item.source || 'الإمام النووي',
          url: `/nawawi40#hadith-${item.id}`,
          type: 'nawawi',
        });
      }
    }
  }

  // 3. البحث في حصن المسلم (أذكار وأدعية موثقة)
  const hisnData = hisnDataRaw as any;
  if (Array.isArray(hisnData?.categories)) {
    let hisnMatches = 0;
    for (const cat of hisnData.categories) {
      const normCat = normalizeArabic(cat.title || '');
      const catItems = cat.items || cat.adhkar || [];

      for (const dhikr of catItems) {
        const normText = normalizeArabic(dhikr.text || '');
        const isMatch =
          normText.includes(normQuery) ||
          normCat.includes(normQuery) ||
          (queryTokens.length >= 2 && queryTokens.every((t) => normText.includes(t) || normCat.includes(t)));

        if (isMatch && hisnMatches < 3) {
          hisnMatches++;
          contextParts.push(
            `[ذكر مأثور — حصن المسلم]\n` +
            `الباب: ${cat.title}\n` +
            `الذكر: ${dhikr.text}\n` +
            `التخريج: ${dhikr.reference || 'صحيح الأذكار'}\n` +
            (dhikr.count > 1 ? `عدد التكرار: ${dhikr.count} مرات` : '')
          );
          sources.push({
            title: cat.title,
            category: 'حصن المسلم',
            source: dhikr.reference || 'الشيخ سعيد بن وهف القحطاني',
            url: `/adhkar?cat=${cat.id}`,
            type: 'hisn',
          });
          break;
        }
      }
      if (hisnMatches >= 3) break;
    }
  }

  // 4. البحث في السيرة النبوية (محطات ودروس الرحيق المختوم)
  const seerahData = seerahDataRaw as any;
  if (Array.isArray(seerahData?.stations)) {
    let seerahMatches = 0;
    for (const st of seerahData.stations) {
      const normTitle = normalizeArabic(st.title || '');
      const normSummary = normalizeArabic(st.summary || '');
      const normEra = normalizeArabic(st.eraTitle || '');

      const isMatch =
        normTitle.includes(normQuery) ||
        normSummary.includes(normQuery) ||
        (queryTokens.length >= 2 && queryTokens.every((t) => normSummary.includes(t) || normTitle.includes(t)));

      if (isMatch && seerahMatches < 2) {
        seerahMatches++;
        contextParts.push(
          `[موقف من السيرة النبوية — الرحيق المختوم]\n` +
          `المحطة: ${st.title} (${st.eraTitle})\n` +
          `التاريخ والمكان: ${st.hijriDate} — ${st.location}\n` +
          `الملخص: ${st.summary}\n` +
          `أبرز الدروس والعبر: ${(st.lessons || []).slice(0, 3).join(' • ')}`
        );
        sources.push({
          title: st.title,
          category: 'السيرة النبوية المطهرة',
          source: 'الرحيق المختوم',
          url: `/seerah#station-${st.id}`,
          type: 'seerah',
        });
      }
    }
  }

  // 5. البحث في متتبع سنن اليوم والليلة
  const dailyData = dailyDataRaw as any;
  if (Array.isArray(dailyData?.stations)) {
    for (const d of dailyData.stations) {
      const normTitle = normalizeArabic(d.title || '');
      const normDesc = normalizeArabic(d.description || '');

      if (normTitle.includes(normQuery) || normDesc.includes(normQuery)) {
        contextParts.push(
          `[سنة يومية عملية — متتبع سنن اليوم والليلة]\n` +
          `المحطة: ${d.title} (${d.timeOfDay})\n` +
          `الهدي النبوي: ${d.hadithQuote}\n` +
          `السنن التطبيقية: ${(d.sunnahActions || []).slice(0, 4).join(' • ')}`
        );
        sources.push({
          title: d.title,
          category: 'سنن اليوم والليلة',
          source: d.hadithQuote,
          url: '/daily-tracker',
          type: 'daily-tracker',
        });
        break;
      }
    }
  }

  const hasVerifiedContext = contextParts.length > 0;
  const contextText = contextParts.join('\n\n---\n\n');

  return {
    hasVerifiedContext,
    contextText,
    sources,
    isFakeWarning,
    dorarSearchUrl,
  };
}
