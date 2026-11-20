// TypeScript definitions for «الباحث في السنة»

export type FiqhRank = 'ركن' | 'واجب' | 'سنة مؤكدة' | 'مستحب' | 'مباح' | 'عادة جبلية';

export interface FootnoteItem {
  number: number;
  text: string;
}

export interface BookStats {
  doorsCount: number;
  chaptersCount: number;
  textualSectionsCount: number;
  totalSectionsCount: number;
  hadithsCount: number;
  versesCount: number;
  biographiesCount: number;
  sourcesCount: number;
  situationsCount: number;
}

export interface BookIntroduction {
  title: string;
  opening: string[];
  methodology: {
    title: string;
    points: string[];
  };
  divisions: {
    title: string;
    doors: string[];
  };
  conclusion: {
    title: string;
    text: string;
    authorSignature: string;
  };
  footnotes: FootnoteItem[];
}

export interface BookMeta {
  title: string;
  subtitle: string;
  author: string;
  version: string;
  stats: BookStats;
  introduction: BookIntroduction;
  encyclopediaConclusion: {
    title: string;
    paragraphs: string[];
  };
}

export type SectionType = 'foundational' | 'applied' | 'verification';

export interface FoundationalSubsection {
  title: string;
  paragraphs: string[];
}

export interface VerificationItem {
  text: string;
  ruling?: string;
  narrator?: string;
  footnoteNumber?: number;
}

export interface VerificationData {
  unauthenticTexts: VerificationItem[];
  authenticAlternatives: VerificationItem[];
}

export interface SectionBase {
  id: string; // e.g. "section-1"
  slug: string; // e.g. "mafhum-al-sunnah-al-nabawiyyah"
  sectionNumber: number; // 1..44
  orderInChapter: number; // 1..6
  title: string;
  doorId: string; // "door-1".."door-5"
  chapterId: string; // "chapter-1".."chapter-10"
  type: SectionType;
  fiqhRanks: FiqhRank[];
  situationTags: string[];
  referenceCode: string; // e.g. "الباب ١، الفصل ١، المبحث ١"
  footnotes: FootnoteItem[];
}

export interface FoundationalSection extends SectionBase {
  type: 'foundational';
  subsections: FoundationalSubsection[];
  practicalBenefit: string;
}

export interface AppliedSection extends SectionBase {
  type: 'applied';
  hadithText: string;
  hadithsList?: string[];
  scholarlySummary: string;
  benefits: string[];
  practicalApplication: string[];
}

export interface VerificationSection extends SectionBase {
  type: 'verification';
  hadithText: string; // "١. النصوص (تحذيرٌ وبديل)..."
  scholarlySummary: string;
  benefits: string[];
  practicalApplication: string[];
  verificationData: VerificationData;
}

export type Section = FoundationalSection | AppliedSection | VerificationSection;
export type SectionItem = Section;
export type DoorItem = Door;
export type ChapterItem = Chapter;

export interface Chapter {
  id: string; // "chapter-1".."chapter-11"
  slug: string;
  chapterNumber: number;
  doorId: string;
  title: string;
  introText: string[];
  introFootnotes?: FootnoteItem[];
  sections: Section[];
}

export interface Door {
  id: string; // "door-1".."door-5"
  slug: string;
  doorNumber: number;
  title: string;
  introText: string[];
  conclusionText?: string[];
  chapters: Chapter[];
}

export interface EncyclopediaData {
  doors: Door[];
}

// Appendices Types
export interface DailyScheduleItem {
  id: string;
  station: string;
  sunnah: string;
  ruling: string;
  reference: string;
  linkedSectionId: string;
  linkedSectionIds: string[];
}

export interface SeasonalScheduleItem {
  id: string;
  season: string;
  sunnah: string;
  ruling: string;
  reference: string;
  linkedSectionIds: string[];
}

export interface AdhkarItem {
  id: string;
  text: string;
  repeatCount: number;
  note?: string;
}

export interface AdhkarCard {
  id: string;
  title: string;
  items: AdhkarItem[];
}

export interface FiqhRankingItem {
  id: string;
  rank: FiqhRank;
  definition: string;
  examples: string;
  rulingAndEffect: string;
}

export interface AppendicesData {
  dailySchedule: DailyScheduleItem[];
  seasonalSchedule: SeasonalScheduleItem[];
  adhkarCards: AdhkarCard[];
  fiqhRankingsTable: FiqhRankingItem[];
}

// Indexes Types
export interface QuranVerseIndexItem {
  id: string;
  surah: string;
  verseNumber: string;
  verseText: string;
  reference: string;
  linkedSectionIds: string[];
}

export interface HadithIndexItem {
  id: string;
  hadithText: string;
  narrator: string;
  reference: string;
  linkedSectionIds: string[];
}

export interface BiographyItem {
  id: string;
  name: string;
  aliases: string[];
  bio: string;
}

export interface SourceCategory {
  id: string;
  category: string;
  items: string[];
}

export interface IndexesData {
  quranVerses: QuranVerseIndexItem[];
  hadithIndex: HadithIndexItem[];
  biographies: BiographyItem[];
  sources: SourceCategory[];
}

// Situations Dictionary Types
export interface SituationDictionaryItem {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  dialects?: {
    egyptian?: string[];
    gulf?: string[];
    levantine?: string[];
    maghrebi?: string[];
  };
  sectionIds: string[];
  description: string;
}

export interface SituationsDictionaryData {
  situations: SituationDictionaryItem[];
}

// Hisn al-Muslim Types
export interface HisnDhikr {
  id: number;
  text: string;
  count: number;
  reference?: string;
}

export interface HisnCategory {
  id: number;
  title: string;
  items: HisnDhikr[];
}

export interface HisnAlMuslimData {
  meta: {
    title: string;
    author: string;
    chaptersCount: number;
    totalDhikrsCount: number;
    source: string;
    importedAt: string;
  };
  categories: HisnCategory[];
}

// Dorar.net Fake Hadiths Types
export interface DorarFakeHadith {
  id: number;
  hadithText: string;
  ruling: string;
  explanation?: string;
  dorarUrl: string;
}

export interface FakeHadithsData {
  meta: {
    title: string;
    source: string;
    sourceUrl: string;
    extractedCount: number;
    extractedAt: string;
  };
  hadiths: DorarFakeHadith[];
}

// Nawawi 40 Types
export interface NawawiHadith {
  id: number;
  title: string;
  text: string;
  narrator?: string;
  source?: string;
}

export interface Nawawi40Data {
  meta: {
    title: string;
    author: string;
    description: string;
    hadithsCount: number;
    source: string;
    fetchedAt: string;
  };
  hadiths: NawawiHadith[];
}



