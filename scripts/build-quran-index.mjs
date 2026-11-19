/**
 * scripts/build-quran-index.mjs
 * Downloads and normalizes the full Quran text (6,236 verses)
 * into a lightweight JSON index (src/data/quran-index.json)
 * enabling instantaneous client-side direct linking to quran.com/ar/SURAH/AYAH.
 */
import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = path.resolve('src/data/quran-index.json');
const SOURCE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quransimple.json';

function normalizeArabicText(text) {
  return text
    .replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '') // Tashkeel, Tatweel, Quranic symbols
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\s\u200c\u200d]+/g, ' ')
    .trim();
}

async function main() {
  console.log('Fetching Quranic dataset from:', SOURCE_URL);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Quran data: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.quran || !Array.isArray(data.quran)) {
    throw new Error('Unexpected JSON format from Quran source.');
  }

  const index = data.quran.map((item) => ({
    c: item.chapter,
    v: item.verse,
    t: normalizeArabicText(item.text),
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index));
  const fileSizeKB = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(1);
  console.log(`Successfully built Quran index with ${index.length} verses.`);
  console.log(`Saved to: ${OUTPUT_PATH} (${fileSizeKB} KB)`);
}

main().catch((err) => {
  console.error('Build Quran Index failed:', err);
  process.exit(1);
});
