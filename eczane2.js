const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cloudscraper = require('cloudscraper');

async function scrapePharmacies(url, cityName) {
  const options = {
    uri: url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    cloudflareTimeout: 1000,
    cloudflareMaxTimeout: 2000,
    followAllRedirects: true,
    jar: true // enable cookies
  };

  try {
    const response = await cloudscraper(options);
    const $ = cheerio.load(response);

    const eczaneVerileri = [];

    const pharmacyRows = $('#nav-bugun .table tbody tr');

    for (let index = 0; index < pharmacyRows.length; index++) {
      const element = pharmacyRows[index];

      const eczane = {
        isim: $(element).find('.isim').text(),
        adres: $(element).find('.col-lg-6').contents().first().text().trim(),
        telefon: $(element).find('.col-lg-3.py-lg-2').text().trim(),
      };

      const pharmacyUrl = $(element).find('.col-lg-3 a').attr('href');
      const individualPageUrl = `https://www.eczaneler.gen.tr${pharmacyUrl}`;

      // Rastgele bekleme süresi
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));

      const individualPageResponse = await cloudscraper({ ...options, uri: individualPageUrl });
      const $individualPage = cheerio.load(individualPageResponse);

      const googleMapsUrl = $individualPage('a[href^="https://www.google.com/maps?"]').attr('href');

      eczane.googleMapsUrl = googleMapsUrl;
      eczaneVerileri.push(eczane);

      if (index === pharmacyRows.length - 1) {
        const jsonData = JSON.stringify(eczaneVerileri, null, 2);
        fs.writeFileSync(`${cityName}_eczane_data.json`, jsonData);
        console.log(`Veriler başarıyla JSON dosyasına kaydedildi for ${cityName}.`);
      }
    }
  } catch (error) {
    console.error(`Hata oluştu for ${cityName}:`, error);
  }
}

const diyarbakirUrl = 'https://www.eczaneler.gen.tr/nobetci-diyarbakir';
const bursaUrl = 'https://www.eczaneler.gen.tr/nobetci-bursa';

scrapePharmacies(diyarbakirUrl, 'Diyarbakir');
scrapePharmacies(bursaUrl, 'Bursa');
