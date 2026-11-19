/**
 * src/types/seerah.ts
 * TypeScript interfaces for the Prophetic Biography (السيرة النبوية)
 * Based on «الرحيق المختوم» by Sheikh Safiur Rahman al-Mubarakpuri.
 */

export type SeerahCategory = 'مرحلة' | 'غزوة' | 'حدث مفصلي' | 'معاهدة وبيعة';

export interface SeerahMilestone {
  id: string;
  order: number;          // 1 إلى 30
  eraId: number;          // 1 إلى 6
  eraTitle: string;
  title: string;          // عنوان المحطة
  hijriDate: string;      // مثل: "١٧ رمضان ٢ هـ" أو "عام الفيل"
  gregorianYear: string;  // مثل: "٦٢٤ م"
  location: string;       // مثل: "بدر" / "مكة المكرمة" / "غار حراء"
  category: SeerahCategory;
  summary: string;        // ملخص مركز في سطرين
  details: string[];      // تفاصيل الحدث في فقرات/نقاط محرّرة بوضوح
  lessons: string[];      // ٣ إلى ٤ دروس تربوية وعملية مستفادة
  keyFigures: string[];   // أبرز الصحابة والشخصيات في الحدث
  quranVerse?: string;    // آية قرآنية مرتبطة بالحدث محصورة بـ ﴿...﴾ مع [السورة: الآية]
}

export interface SeerahEra {
  id: number;
  title: string;
  period: string;
  milestonesCount: number;
  description: string;
}

export interface SeerahData {
  meta: {
    title: string;
    source: string;
    author: string;
    description: string;
    erasCount: number;
    milestonesCount: number;
  };
  eras: SeerahEra[];
  milestones: SeerahMilestone[];
}
