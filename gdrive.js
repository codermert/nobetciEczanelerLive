const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.eczaneler.gen.tr/nobetci-bursa';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
  'Referer': url
};

axios.get(url, { headers })
  .then(response => {
    const html = response.data;
    const $ = cheerio.load(html);

    const eczaneVerileri = [];

    $('#nav-bugun .table tbody tr').each((index, element) => {
      const eczane = {
        isim: $(element).find('.isim').text(),
        adres: $(element).find('.col-lg-6').contents().first().text().trim(),
        telefon: $(element).find('.col-lg-3.py-lg-2').text().trim()
      };
      eczaneVerileri.push(eczane);
    });

    const jsonData = JSON.stringify(eczaneVerileri);

    fs.writeFileSync('eczane_data.json', jsonData); // Veriyi JSON dosyasına kaydet

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxE7MCIqQsTW9FOV9H8v1kTfO5Z5iEKb_OhbHtiRXysM_AKCwTNXrN-06jI_SA4jRD7/exec';

    axios.post(scriptUrl, null, {
      params: {
        jsonData: jsonData
      }
    })
    .then(response => {
      console.log('JSON verisi Google Drive\'da güncellendi:', response.data);
    })
    .catch(error => {
      console.error('Hata oluştu:', error);
    });
  })
  .catch(error => {
    console.error('Hata oluştu:', error);
  });
