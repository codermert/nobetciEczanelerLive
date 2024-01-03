const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapePharmacies(url, cityName) {
  const headers = {
    'Host': 'www.eczaneler.gen.tr',
    'method': 'GET',
    'scheme': 'https',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'tr-TR,tr;q=0.9',
    'Cache-Control': 'max-age=0',
    'Cookie': '_gid=GA1.3.973818948.1704299672; _gat_gtag_UA_533858_20=1; _ga_RTECLYJVM5=GS1.1.1704299672.11.0.1704299672.0.0.0; _ga=GA1.1.48944175.1691683467',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Linux"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Referer: url,
  };

  try {
    const response = await axios.get(url, { headers });
    const html = response.data;
    const $ = cheerio.load(html);

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

      const individualPageResponse = await axios.get(individualPageUrl, { headers });
      const individualPageHtml = individualPageResponse.data;
      const $individualPage = cheerio.load(individualPageHtml);

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
