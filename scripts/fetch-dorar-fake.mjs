/**
 * scripts/fetch-dorar-fake.mjs
 * Fetches "أحاديث منتشرة لا تصح" verbatim from dorar.net/fake-hadith archive snapshots
 * Extracts: id, hadithText, ruling, explanation, dorarUrl
 * Saves to: src/data/fake-hadiths.json
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUTPUT_PATH = path.resolve('src/data/fake-hadiths.json');
const MAX_PAGES = 10; // Fetch up to 10 pages (~150 hadiths) for speed and server respect

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchPageHtml(pageNum) {
  const url = `http://web.archive.org/web/20261108143131/https://dorar.net/fake-hadith?page=${pageNum}`;
  try {
    const cmd = `curl.exe -L -s -m 25 "${url}"`;
    const html = execSync(cmd, { maxBuffer: 15 * 1024 * 1024 }).toString('utf8');
    return html;
  } catch (err) {
    console.warn(`[Page ${pageNum}] Fetch warning:`, err.message);
    return null;
  }
}

function parseArticlesFromHtml(html) {
  const articles = [];
  const articleRegex = /<article class="border-bottom py-4">([\s\S]*?)<\/article>/g;
  let match;

  while ((match = articleRegex.exec(html)) !== null) {
    const block = match[1];

    // 1. Extract PK
    const pkMatch = block.match(/data-pk="(\d+)"/);
    const pk = pkMatch ? pkMatch[1] : null;

    // 2. Extract Degree (الحكم)
    const degreeMatch = block.match(/data-name="degree"[^>]*>([^<]+)<\/span>/);
    const ruling = degreeMatch ? degreeMatch[1].trim() : 'لا يصح';

    // 3. Extract Hadith Text from <h5>
    const h5Match = block.match(/<h5[^>]*>([\s\S]*?)<\/h5>/);
    let hadithText = '';
    if (h5Match) {
      hadithText = h5Match[1]
        .replace(/<[^>]+>/g, '') // remove HTML tags
        .replace(/^[\d٠-٩\s\-–]+/, '') // remove leading item numbers like "1 - "
        .replace(/^\(\(|\)\)$/g, '') // strip outer double parentheses if entire text is enclosed
        .trim();
    }

    // 4. Extract Explanation / Alternative (البيان أو البديل إن وجد)
    const altMatch = block.match(/href="[^"]*fake-hadith\/(\d+)\?alts=1"/);
    let explanation = '';
    const textInfoMatch = block.match(/<span class="text-secondary[^"]*">([\s\S]*?)<\/span>/);
    if (textInfoMatch) {
      explanation = textInfoMatch[1].replace(/<[^>]+>/g, '').trim();
    } else if (altMatch) {
      explanation = 'يوجد للحديث بديل صحيح مخرج في موسوعة الدرر السنية';
    }

    if (hadithText && pk) {
      articles.push({
        id: Number(pk),
        hadithText,
        ruling,
        explanation: explanation || undefined,
        dorarUrl: `https://dorar.net/fake-hadith/${pk}`,
      });
    }
  }

  return articles;
}

async function main() {
  console.log(`[1/3] Starting extraction of «أحاديث منتشرة لا تصح» from dorar.net...`);
  const allHadiths = [];
  const seenIds = new Set();

  for (let p = 1; p <= MAX_PAGES; p++) {
    process.stdout.write(`Fetching page ${p}/${MAX_PAGES}... `);
    const html = fetchPageHtml(p);

    if (!html || !html.includes('data-name="degree"')) {
      console.log(`[!] Page ${p} unavailable or empty. Stopping pagination.`);
      break;
    }

    const items = parseArticlesFromHtml(html);
    let addedCount = 0;

    for (const item of items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allHadiths.push(item);
        addedCount++;
      }
    }

    console.log(`✓ (${addedCount} hadiths found, total: ${allHadiths.length})`);
    await sleep(1000); // Polite pause between pages
  }

  console.log(`\n[2/3] Total authentic records extracted: ${allHadiths.length}`);

  const outputData = {
    meta: {
      title: 'أحاديث منتشرة لا تصح',
      source: 'موقع الدرر السنية — الموسوعة الحديثية (dorar.net/fake-hadith)',
      sourceUrl: 'https://dorar.net/fake-hadith',
      extractedCount: allHadiths.length,
      extractedAt: new Date().toISOString(),
    },
    hadiths: allHadiths,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`[3/3] Successfully written to: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error in fetch-dorar-fake:', err);
  process.exit(1);
});
