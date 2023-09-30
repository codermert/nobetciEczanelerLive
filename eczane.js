const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://www.eczaneler.gen.tr/nobetci-diyarbakir';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
  Referer: url,
};

axios
  .get(url, { headers })
  .then(async (response) => {
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
        fs.writeFileSync('eczane_data.json', jsonData);
        console.log('Veriler başarıyla JSON dosyasına kaydedildi.');
      }
    }
  })
  .catch((error) => {
    console.error('Hata oluştu:', error);
  });
