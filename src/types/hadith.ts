/**
 * src/types/hadith.ts
 * TypeScript interfaces for the Explained Hadiths section (الأحاديث النبوية المشروحة)
 * Source: HadeethEnc.com (IslamHouse.com)
 */

export interface WordMeaning {
  word: string;
  meaning: string;
}

export interface ExplainedHadith {
  id: string;
  title: string;
  categoryId: string;
  categoryTitle: string;
  hadeeth: string;
  attribution: string;
  grade: string;
  explanation: string;
  hints: string[];
  wordsMeanings: WordMeaning[];
}

export interface HadeethCategory {
  id: string;
  title: string;
  count: number;
}

export interface HadeethEncData {
  meta: {
    title: string;
    source: string;
    license: string;
    extractedAt: string;
    totalHadiths: number;
    categoriesCount: number;
  };
  categories: HadeethCategory[];
  hadiths: ExplainedHadith[];
}
