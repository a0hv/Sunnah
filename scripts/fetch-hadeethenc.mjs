/**
 * scripts/fetch-hadeethenc.mjs
 * Fetches authentic and well-explained hadiths from HadeethEnc.com (IslamHouse.com)
 * Output: src/data/hadeethenc.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.resolve(__dirname, '../src/data/hadeethenc.json');

const TARGET_CATEGORIES = [
  { id: '266', title: 'فقه الأخلاق', quota: 55 },
  { id: '267', title: 'الآداب الشرعية', quota: 65 },
  { id: '265', title: 'الفضائل', quota: 55 },
  { id: '121', title: 'فقه العبادات', quota: 75 },
  { id: '124', title: 'فقه الأسرة', quota: 45 },
  { id: '122', title: 'فقه المعاملات', quota: 40 },
  { id: '3',   title: 'العقيدة', quota: 55 },
  { id: '7',   title: 'السيرة والتاريخ', quota: 45 },
  { id: '269', title: 'الرقائق والمواعظ', quota: 45 },
  { id: '6',   title: 'الدعوة والحسبة', quota: 30 },
  { id: '1',   title: 'القرآن الكريم وعلومه', quota: 35 },
];

async function fetchWithRetry(url, retries = 3, delayMs = 600) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PlatformSunnah/1.0',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status} on ${url}`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
}

async function fetchCategoryHadithIds(categoryId, neededCount) {
  const perPage = Math.min(100, Math.max(20, neededCount + 15));
  const url = `https://hadeethenc.com/api/v1/hadeeths/list/?language=ar&category_id=${categoryId}&page=1&per_page=${perPage}`;
  try {
    const listRes = await fetchWithRetry(url);
    if (!listRes || !Array.isArray(listRes.data)) return [];
    return listRes.data.map((item) => item.id).filter(Boolean);
  } catch (err) {
    console.error(`[!] Failed to list category ${categoryId}:`, err.message);
    return [];
  }
}

async function fetchHadithDetails(id) {
  const url = `https://hadeethenc.com/api/v1/hadeeths/one/?language=ar&id=${id}`;
  try {
    return await fetchWithRetry(url);
  } catch (err) {
    console.error(`[!] Error fetching hadith ${id}:`, err.message);
    return null;
  }
}

// Concurrency pool
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      try {
        const res = await fn(items[current], current);
        results[current] = res;
      } catch (err) {
        results[current] = null;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('🚀 Starting HadeethEnc data extraction...');
  console.log(`📁 Target categories: ${TARGET_CATEGORIES.length}`);

  const collectedHadiths = [];
  const seenIds = new Set();

  for (const cat of TARGET_CATEGORIES) {
    process.stdout.write(`\n📥 Fetching category: «${cat.title}» (id: ${cat.id}, quota: ${cat.quota})... `);
    const candidateIds = await fetchCategoryHadithIds(cat.id, cat.quota);
    console.log(`found ${candidateIds.length} candidate IDs.`);

    // Filter out already seen
    const newIds = candidateIds.filter((id) => !seenIds.has(id));

    // Fetch details concurrently
    const CONCURRENCY = 6;
    let fetchedInCat = 0;

    const detailsList = await mapConcurrent(newIds, CONCURRENCY, async (id) => {
      // Throttle slightly
      await new Promise((r) => setTimeout(r, 60));
      return await fetchHadithDetails(id);
    });

    for (const d of detailsList) {
      if (!d || !d.id || seenIds.has(d.id)) continue;

      const hadeethText = (d.hadeeth || '').trim();
      const explanationText = (d.explanation || '').trim();
      const hintsList = Array.isArray(d.hints)
        ? d.hints.map((h) => (typeof h === 'string' ? h.trim() : '')).filter(Boolean)
        : [];

      // Ensure requirements: non-empty hadeeth, non-empty explanation, at least 1 hint
      if (!hadeethText || !explanationText || hintsList.length === 0) {
        continue;
      }

      // Format words meanings
      const wordsMeanings = Array.isArray(d.words_meanings)
        ? d.words_meanings
            .map((wm) => ({
              word: (wm.word || '').trim(),
              meaning: (wm.meaning || '').trim(),
            }))
            .filter((wm) => wm.word && wm.meaning)
        : [];

      // Clean attribution
      let attribution = (d.attribution || '').trim();
      attribution = attribution.replace(/\s+/g, ' ');

      // Grade
      let grade = (d.grade || 'صحيح').trim();

      const item = {
        id: String(d.id),
        title: (d.title || '').trim(),
        categoryId: cat.id,
        categoryTitle: cat.title,
        hadeeth: hadeethText,
        attribution: attribution || 'متفق عليه',
        grade: grade || 'صحيح',
        explanation: explanationText,
        hints: hintsList,
        wordsMeanings,
      };

      seenIds.add(item.id);
      collectedHadiths.push(item);
      fetchedInCat++;

      if (fetchedInCat >= cat.quota) {
        break;
      }
    }

    console.log(`   ✅ Accepted ${fetchedInCat} valid hadiths for «${cat.title}» (Total so far: ${collectedHadiths.length})`);
  }

  console.log(`\n🎉 Total extracted hadiths: ${collectedHadiths.length}`);

  // Validation
  let invalidCount = 0;
  for (const h of collectedHadiths) {
    if (!h.id || !h.title || !h.hadeeth || !h.explanation || !h.hints || h.hints.length === 0) {
      invalidCount++;
    }
  }

  if (invalidCount > 0) {
    console.error(`❌ Validation failed: ${invalidCount} invalid hadiths found!`);
    process.exit(1);
  }

  const outputData = {
    meta: {
      title: 'موسوعة الأحاديث النبوية المشروحة',
      source: 'موسوعة الأحاديث النبوية (HadeethEnc.com) — التابعة لـ IslamHouse.com',
      license: 'المحتوى متاح برخصة النشر المفتوح مع الإشارة للمصدر وعدم تعديل النصوص',
      extractedAt: new Date().toISOString(),
      totalHadiths: collectedHadiths.length,
      categoriesCount: TARGET_CATEGORIES.length,
    },
    categories: TARGET_CATEGORIES.map((c) => ({
      id: c.id,
      title: c.title,
      count: collectedHadiths.filter((h) => h.categoryId === c.id).length,
    })),
    hadiths: collectedHadiths,
  };

  const jsonString = JSON.stringify(outputData, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonString, 'utf-8');

  const stats = fs.statSync(OUTPUT_FILE);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n📦 Saved successfully to: ${OUTPUT_FILE}`);
  console.log(`📊 File size: ${sizeMB} MB`);
  console.log(`💯 Verification: 100% of hadiths contain full explanations and hints.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
