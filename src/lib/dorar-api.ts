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

export function getDorarSearchUrl(query: string): string {
  const clean = (query || '').replace(/[«»"”'’[\](){}<>؛،.؟!/\\–—\n\r]/g, ' ').trim();
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
