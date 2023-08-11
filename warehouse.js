const fs = require('fs'); // Dosyaya verileri yazdır

const axios = require('axios');
const cheerio = require('cheerio');
const cloudinary = require('cloudinary').v2;

const url = 'https://www.eczaneler.gen.tr/nobetci-bursa';


cloudinary.config({
    cloud_name: 'dziokg1mk',
    api_key: '879144885361551',
    api_secret: 'Lj_xBm7XR5FN6f-0tzlQaWNDuUg'
  });
  
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

    // Dosyaya verileri yazdır
    fs.writeFileSync('eczane_data.json', jsonData);

    // Cloudinary API ile veri yükle
    cloudinary.uploader.upload('eczane_data.json', {
      resource_type: 'raw',
      public_id: 'eczane_data'
    }, (error, result) => {
      if (error) {
        console.error('Cloudinary Upload Error:', error);
      } else {
        //console.log('Cloudinary Upload Result:', result);
        // Yüklenen JSON dosyasının URL'sini al
        const jsonUrl = result.secure_url;
        console.log('JSON URL:', jsonUrl);
      }
    });
  })
  .catch(error => {
    console.error('Hata oluştu:', error);
  });
