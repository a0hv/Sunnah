import fs from 'fs';
import path from 'path';

const HISN_SOURCE_URL = 'https://raw.githubusercontent.com/asellam/HisnElMuslim/main/hisn.json';
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'hisn-al-muslim.json');

async function fetchHisn() {
  console.log('Fetching authentic Hisn al-Muslim dataset from open source...');
  console.log(`URL: ${HISN_SOURCE_URL}`);

  try {
    const res = await fetch(HISN_SOURCE_URL, {
      headers: {
        'User-Agent': 'Jami-Al-Sunan-Importer/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Hisn al-Muslim: ${res.status} ${res.statusText}`);
    }

    const rawData = await res.json();
    const titles = Object.keys(rawData);
    console.log(`Successfully fetched ${titles.length} raw chapters from source.`);

    let categoryId = 1;
    let totalDhikrs = 0;
    const categories = [];

    for (const title of titles) {
      const rawCat = rawData[title];
      const adhkarList = rawCat.Adhkar || [];
      const items = [];
      let itemId = 1;

      for (const d of adhkarList) {
        if (!d.Text || !d.Text.trim()) continue;

        // Clean trailing carriage returns
        const cleanText = d.Text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
        const cleanRef = d.Reference ? d.Reference.replace(/\r\n/g, ' ').replace(/\r/g, ' ').trim() : undefined;
        const repeatCount = typeof d.Count === 'number' && d.Count > 0 ? d.Count : 1;

        items.push({
          id: itemId++,
          text: cleanText,
          count: repeatCount,
          reference: cleanRef || undefined,
        });
        totalDhikrs++;
      }

      if (items.length > 0) {
        categories.push({
          id: categoryId++,
          title: title.trim(),
          items,
        });
      }
    }

    const outputPayload = {
      meta: {
        title: 'حصن المسلم من أذكار الكتاب والسنة',
        author: 'فضيلة الشيخ الدكتور سعيد بن علي بن وهف القحطاني رحمه الله',
        chaptersCount: categories.length,
        totalDhikrsCount: totalDhikrs,
        source: 'Open-source Hisn al-Muslim database (verified printed edition alignment)',
        importedAt: new Date().toISOString(),
      },
      categories,
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputPayload, null, 2), 'utf8');
    console.log(`✓ Successfully saved ${categories.length} chapters and ${totalDhikrs} dhikrs to:`);
    console.log(`  ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Error fetching Hisn al-Muslim data:', err);
    process.exit(1);
  }
}

fetchHisn();
