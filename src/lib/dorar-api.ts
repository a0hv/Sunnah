/**
 * src/lib/dorar-api.ts
 * وحدة التكامل الآمن مع الموسوعة الحديثية في «الدرر السنية» (Dorar.net).
 *
 * جاهزة للعمل فور إدخال DORAR_API_KEY الرسمي بعد الحصول على الموافقة.
 * في غياب المفتاح، توفر روابط البحث المباشرة بالكلمات في الموسوعة الحديثية.
 */

export interface DorarHadithItem {
  hadith: string;
  rawi: string;
  muhaddith: string;
  book: string;
  numberOrPage: string;
  grade: string;
  explanationUrl?: string;
}

/**
 * استخراج أبرز 3 إلى 4 كلمات مميزة من متن الحديث نفسه لبناء رابط بحث دقيق في الموسوعة الحديثية
 */
export function extractDistinctiveHadithKeywords(text: string, fallbackQuery: string): string {
  const norm = (text || '')
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[«»"”'’[\](){}<>؛،.؟!/\\–—\n\r]/g, ' ')
    .replace(/[\s\u200c\u200d]+/g, ' ')
    .trim();

  const stopWords = new Set([
    'هل', 'ما', 'من', 'في', 'على', 'الي', 'الى', 'إلى', 'عن', 'ان', 'أن', 'إن',
    'هو', 'هي', 'هم', 'هن', 'ماذا', 'كيف', 'متى', 'أين', 'اين', 'كم', 'لماذا', 'أي', 'اي',
    'ثم', 'أو', 'او', 'لو', 'ولو', 'مع', 'عند', 'بعد', 'قبل', 'كل', 'ذلك', 'هذا', 'هذه', 'تلك', 'يا',
    'قال', 'يقول', 'قالوا', 'قالت', 'كان', 'كانت', 'بن', 'ابن', 'ابي', 'أبي', 'ابو', 'أبو',
    'رضي', 'عنه', 'عنها', 'عنهما', 'عنهم', 'الله', 'صلى', 'صلي', 'عليه', 'وسلم', 'النبي', 'نبي', 'رسول', 'الرسول',
    'اللهم', 'رب', 'ربنا', 'حدثنا', 'اخبرنا'
  ]);

  const words = norm.split(' ').filter((w) => w.length >= 3 && !stopWords.has(w));
  if (words.length >= 3) {
    return words.slice(0, 4).join(' ');
  }

  const fallbackNorm = (fallbackQuery || '')
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[«»"”'’[\](){}<>؛،.؟!/\\–—\n\r]/g, ' ')
    .replace(/[\s\u200c\u200d]+/g, ' ')
    .trim();

  const fallbackWords = fallbackNorm.split(' ').filter((w) => w.length >= 3 && !stopWords.has(w));
  return fallbackWords.slice(0, 4).join(' ') || fallbackQuery;
}

export function getDorarSearchUrl(query: string, matchedText?: string): string {
  const searchTerm = matchedText
    ? extractDistinctiveHadithKeywords(matchedText, query)
    : query;
  const clean = (searchTerm || '').replace(/[«»"”'’[\](){}<>؛،.؟!/\\–—\n\r]/g, ' ').trim();
  return `https://dorar.net/hadith/search?q=${encodeURIComponent(clean)}&st=w`;
}

/**
 * البحث المباشر في API الدرر السنية الرسمي.
 * سيعمل تلقائياً عند تفعيل DORAR_API_KEY في متغيرات البيئة.
 */
export async function queryDorarApi(query: string): Promise<DorarHadithItem[] | null> {
  const apiKey = process.env.DORAR_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    // لم يتم تفعيل مفتاح الدرر السنية بعد
    return null;
  }

  try {
    const endpoint = `https://api.dorar.net/hadith/search?q=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ManassatAlSunnah/1.0',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn('Dorar API responded with status:', res.status);
      return null;
    }

    const data = await res.json();
    if (Array.isArray(data?.results)) {
      return data.results.map((r: any) => ({
        hadith: r.hadith || '',
        rawi: r.rawi || '',
        muhaddith: r.muhaddith || '',
        book: r.book || '',
        numberOrPage: r.numberOrPage || '',
        grade: r.grade || '',
        explanationUrl: r.explanationUrl,
      }));
    }

    return null;
  } catch (err) {
    console.error('Failed to query Dorar API:', err);
    return null;
  }
}
