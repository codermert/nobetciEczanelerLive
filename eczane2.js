const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const HttpsProxyAgent = require('https-proxy-agent');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapePharmacies(url, cityName) {
  try {
    const proxy = 'http://your-proxy-here'; // Bir proxy sunucusu belirtin
    const agent = new HttpsProxyAgent(proxy);

    await delay(Math.random() * 5000 + 2000); // 2-7 saniye arası rastgele bekleme

    const response = await fetch(url, {
      agent,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const eczaneVerileri = [];

    const pharmacyRows = $('#nav-bugun .table tbody tr');

    for (let index = 0; index < pharmacyRows.length; index++) {
      await delay(Math.random() * 3000 + 1000); // 1-4 saniye arası rastgele bekleme

      const element = pharmacyRows[index];

      const eczane = {
        isim: $(element).find('.isim').text().trim(),
        adres: $(element).find('.col-lg-6').contents().first().text().trim(),
        telefon: $(element).find('.col-lg-3.py-lg-2').text().trim(),
      };

      const pharmacyUrl = $(element).find('.col-lg-3 a').attr('href');
      const individualPageUrl = `https://www.eczaneler.gen.tr${pharmacyUrl}`;

      const individualPageResponse = await fetch(individualPageUrl, {
        agent,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'max-age=0',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': url,
        },
      });

      if (individualPageResponse.ok) {
        const individualPageHtml = await individualPageResponse.text();
        const $individualPage = cheerio.load(individualPageHtml);

        const googleMapsUrl = $individualPage('a[href^="https://www.google.com/maps?"]').attr('href');
        eczane.googleMapsUrl = googleMapsUrl;
      }

      eczaneVerileri.push(eczane);
    }

    const jsonData = JSON.stringify(eczaneVerileri, null, 2);
    fs.writeFileSync(`${cityName}_eczane_data.json`, jsonData);
    console.log(`Veriler başarıyla JSON dosyasına kaydedildi for ${cityName}.`);

  } catch (error) {
    console.error(`Hata oluştu for ${cityName}:`, error);
  }
}

const diyarbakirUrl = 'https://www.eczaneler.gen.tr/nobetci-diyarbakir';
const bursaUrl = 'https://www.eczaneler.gen.tr/nobetci-bursa';

(async () => {
  await scrapePharmacies(diyarbakirUrl, 'Diyarbakir');
  await scrapePharmacies(bursaUrl, 'Bursa');
})();
