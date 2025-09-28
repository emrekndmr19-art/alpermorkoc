# Kolay Anlatımlı Backend ve Admin Panel Kılavuzu

Bu dosya bilgisayardan çok anlamayan biri için hazırlandı. Aşağıdaki adımları tek tek takip ederek mevcut HTML/CSS/JS tabanlı sitenizi Node.js + Express + MongoDB ile çalışan backend ve admin panel ile kullanabilirsiniz. Acele etmeyin, sırayla giderseniz sorun yaşamazsınız.

---

## 0. Paket içinden neler çıktı?

| Klasör/Dosya | Ne işe yarıyor? |
| --- | --- |
| `server.js` | Sunucuyu başlatan ana dosya. |
| `models/` | Veritabanı şablonları (kullanıcı, içerik, CV). |
| `middleware/auth.js` | Admin işlemlerini koruyan güvenlik katmanı. |
| `public/admin.html` | Admin panelinin HTML dosyası. |
| `public/admin.js` | Admin panelinin çalışan JavaScript kodu. |
| `uploads/` | Yüklediğiniz CV dosyalarının saklanacağı klasör. |
| `README.md` | Elinizde tuttuğunuz bu rehber. |

> **Not:** `index.html`, `services.html` gibi var olan tüm sayfalarınız aynı klasörde durmaya devam eder. Backend bunların üzerine eklenen ayrı bir katmandır.

---

## 1. Bilgisayarınızı hazırlayın

1. **Node.js kurulu mu?**
   - [nodejs.org](https://nodejs.org/) adresine girin, "Recommended" (önerilen) yazan büyük yeşil butonu tıklayıp kurulumu tamamlayın. Kurulum sonunda bilgisayarı yeniden başlatmanız gerekebilir.
   - Kurulum sonrası "Komut İstemi" (Windows) veya "Terminal" (Mac) açıp şu komutu yazın:
     ```bash
     node -v
     ```
     Karşınıza `v18.XX` gibi bir şey geliyorsa Node hazır demektir.

2. **MongoDB gerekli.**
   - Bilgisayarınızda MongoDB yoksa [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) adresinden "Community Server" sürümünü indirin.
   - Kurulumda karşınıza çıkan ekranlarda "Complete" seçeneğini seçin ve servis olarak çalışmasına izin verin. Kurulum bitince MongoDB arka planda otomatik başlar.

3. **Proje dosyalarını bir klasöre çıkarın.**
   - ZIP aldıysanız istediğiniz bir klasöre (ör. `C:\\projem`) çıkarın.
   - Terminalde bu klasöre geçin:
     ```bash
     cd C:\\projem
     ```

4. **Gerekli paketleri yükleyin.**
   - Aynı terminalde şu komutu yazın:
     ```bash
     npm install
     ```
   - Birkaç dakika sürebilir. Komut bittikten sonra hata görmüyorsanız her şey yolunda demektir.

---

## 2. Ortam ayarlarını (şifreleri, portu) belirleyin

Backend'in hangi kapıyı (portu) kullanacağını, veritabanı adresini ve admin şifresini `.env` isimli küçük bir dosyada tutuyoruz.

1. Proje klasörünüzün içinde `.env` adında yeni bir dosya oluşturun. Windows'ta Not Defteri ile `dosyaadi.env` şeklinde kaydedebilirsiniz.
2. Aşağıdaki satırları dosyaya kopyalayın ve isterseniz değerleri değiştirin:
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/alpermorkoc
   JWT_SECRET=cok-gizli-bir-kelime
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```
3. "ADMIN" satırlarını müşteriniz için anlamlı bir kullanıcı adı ve şifre ile değiştirin. İlk kez sunucuyu çalıştırdığınızda bu bilgilerle admin hesabı otomatik oluşur.
4. Dosyayı kaydedin ve kapatın.

> **Önemli:** Şifreyi sonradan değiştirirseniz, MongoDB'deki kullanıcıyı da güncellemeniz gerekir. En kolayı eski kullanıcıyı silip sunucuyu yeniden başlatmak (sunucu yeni şifre ile kullanıcıyı tekrar oluşturur).

---

## 3. Sunucuyu başlatma adımları

1. Terminal hâlâ proje klasörünüzdeyken şu komutu yazın:
   ```bash
   npm start
   ```
2. Ekranda aşağıdakine benzer satırlar görünür:
   ```
MongoDB bağlantısı başarılı
Sunucu 3000 portunda çalışıyor
```
3. Bu yazıları görüyorsanız sunucu ayaktadır. Tarayıcınızda `http://localhost:3000` yazarak sitenizi açabilirsiniz.
4. Sunucuyu durdurmak isterseniz terminalde `Ctrl + C` tuşlarına basın.

> **Sık yapılan hata:** MongoDB servisi çalışmıyorsa `MongoDB bağlantı hatası` mesajı alırsınız. Windows'ta "Services" uygulamasından MongoDB'yi başlatın. Linux'ta `sudo systemctl start mongodb`.

---

## 4. Admin paneline giriş

1. Tarayıcıda şu adrese gidin:
   ```
http://localhost:3000/admin-panel
```
2. Karşınıza kullanıcı adı ve şifre isteyen bir ekran gelir. `.env` dosyasındaki değerleri girin.
3. Giriş başarılı olduğunda sayfanın üst kısmında "Hoş geldiniz" mesajı, alt kısımlarında ise içerik listeleri ve formlar görünür.
4. Panel arka planda bir güvenlik anahtarı (JWT) alır ve bunu tarayıcının hafızasında saklar. Bu anahtar 2 saat geçerlidir. Süre dolarsa panel sizi otomatik çıkışa gönderir, tekrar giriş yapmanız yeterlidir.

---

## 5. İçerikleri yönetme (haber, blog, duyuru vb.)

1. Admin panelindeki "İçerik Yönetimi" başlığını bulun.
2. **Yeni içerik eklemek** için:
   - Formdaki "Başlık" ve "Metin" alanlarını doldurun.
   - "Yeni İçerik Ekle" düğmesine basın.
   - Liste otomatik güncellenir ve yeni içerik en üstte görünür.
3. **Var olan içerikleri düzenlemek** için listedeki herhangi bir kaydın sağındaki "Düzenle" butonuna basın. Alanlar formda doldurulur, düzenlemelerinizi yapıp "Güncelle" düğmesine tıklayın.
4. **Silmek** isterseniz aynı satırdaki "Sil" butonuna basın. İşlem geri alınamaz, emin olun.
5. Tüm bu işlemler arka planda `/api/content` adresine güvenli istekler gönderir; siz ekstra bir şey yapmazsınız.

---

## 6. CV yükleme ve indirme

1. Panelde "CV Yönetimi" başlığını açın.
2. "Dosya Seç" butonuna tıklayın ve bilgisayarınızdan **PDF** uzantılı dosyayı seçin.
3. "CV Yükle" butonuna bastığınızda dosya sunucuya gönderilir, `uploads/` klasörüne kaydedilir ve veritabanına kaydı eklenir.
4. Alt kısımda "CV Listesi" tablosu görünür. Her satırda yüklediğiniz dosyalar listelenir.
5. "İndir" butonu dosyayı bilgisayarınıza indirir.
6. Bir CV’yi silmek isterseniz listedeki "Sil" butonunu kullanın; işlem tamamlandığında tablo otomatik yenilenir ve dosya `uploads/` klasöründen de kaldırılır.

---

## 7. Sitenizi müşterinin alan adına (domain) bağlama

1. **Bir sunucu kiralayın.** DigitalOcean, Hetzner, AWS Lightsail gibi sağlayıcılardan aylık birkaç dolara Linux sunucu alabilirsiniz. Windows seviyorsanız Windows sunucusu da olur, ancak talimatlar Linux içindir.
2. **Sunucuya Node.js ve MongoDB kurun.**
   - Ubuntu için hızlı kurulum:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs
     sudo apt-get install -y mongodb
     ```
   - MongoDB servisinin çalıştığından emin olun: `sudo systemctl status mongodb`
3. **Projeyi sunucuya aktarın.**
   - `scp` veya FTP ile tüm dosyaları sunucudaki bir klasöre yükleyin (ör. `/var/www/site`).
   - Sunucuda `npm install` ve `npm start` komutlarını aynı şekilde çalıştırın.
4. **Sunucunun sürekli açık kalması için süreç yöneticisi kullanın.**
   - Örnek: `npm install -g pm2`, sonra `pm2 start server.js --name site-backend`.
5. **Domain ayarları (DNS).**
   - Alan adınızı aldığınız firmaya girin, DNS bölümünde `A` kaydını sunucunuzun IP adresine yönlendirin.
   - Örnek: `@` kaydı → `203.0.113.10` (sizin IP'niz neyse).
6. **80/443 portlarını Node.js sunucunuza yönlendirin.**
   - Sunucuda Nginx kurup gelen istekleri Node uygulamasına iletin:
     ```bash
     sudo apt-get install -y nginx
     sudo nano /etc/nginx/sites-available/site.conf
     ```
   - Dosya içeriği:
     ```nginx
     server {
         listen 80;
         server_name alanadiniz.com www.alanadiniz.com;

        location / {
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /admin-panel {
            auth_basic "Admin Panel";
            auth_basic_user_file /etc/nginx/.htpasswd_admin_panel;
            proxy_pass http://127.0.0.1:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```
   - Kaydedin, sonra:
     ```bash
     sudo ln -s /etc/nginx/sites-available/site.conf /etc/nginx/sites-enabled/
     sudo nginx -t
     sudo systemctl reload nginx
     ```
7. `auth_basic_user_file` için kullanıcı/şifre üretmek üzere `sudo apt-get install -y apache2-utils` sonrası `sudo htpasswd -c /etc/nginx/.htpasswd_admin_panel admin` komutunu çalıştırın. Daha fazla kullanıcı eklemek isterseniz `-c` parametresini kaldırın.
8. Artık tarayıcıdan `https://alanadiniz.com/admin-panel` adresine gidince Nginx sizden önce temel kimlik doğrulaması isteyecek, ardından Node.js tarafındaki aynı korumalı panele ulaşacaksınız. HTTPS sertifikası için ücretsiz [Let’s Encrypt](https://letsencrypt.org/) kullanabilirsiniz (komut: `sudo certbot --nginx`).

---

## 8. Sık karşılaşılan sorunlar ve çözümleri

| Problem | Sebep | Çözüm |
| --- | --- | --- |
| `MongoDB bağlantı hatası` | MongoDB çalışmıyor | Windows'ta "Services" uygulamasından MongoDB'yi başlatın. Linux'ta `sudo systemctl start mongodb`. |
| `Sunucu portu kullanımda` | Aynı portu kullanan başka uygulama var | `.env` dosyasında `PORT` değerini 4000 gibi başka bir sayıya değiştirin. Nginx proxy ayarını da güncelleyin. |
| Admin paneli "Yetkisiz" uyarısı veriyor | JWT süresi doldu veya şifre yanlış | Panelde oturumu kapatıp tekrar giriş yapın. Şifreyi `.env` dosyasından kontrol edin. |
| Dosya yüklerken hata | PDF değil veya dosya çok büyük | Dosyanın `.pdf` olduğundan ve 10 MB'tan küçük olduğundan emin olun. |

---

## 9. Teknik ekler (meraklısına)

- **API uç noktaları:**
  - `POST /api/login` → JWT üretir.
  - `GET /api/content` → Herkese açık içerik listesi.
  - `POST /api/content` → JWT gerektirir, yeni içerik ekler.
  - `PUT /api/content/:id` → JWT gerektirir, içerik günceller.
  - `DELETE /api/content/:id` → JWT gerektirir, içerik siler.
  - `POST /api/upload-cv` → PDF yükler (JWT gerektirir).
  - `GET /api/cvs` → Tüm CV kayıtları (JWT gerektirir).
  - `GET /api/cv/download/:id` → CV indirme (JWT gerektirir).
  - `DELETE /api/cv/:id` → CV kaydını ve dosyasını siler (JWT gerektirir).
- **Güvenlik:** Parolalar `bcrypt` ile şifrelenir, admin paneline erişim için ek olarak HTTP Basic Auth (ENV değişkenlerindeki `ADMIN_USERNAME` ve `ADMIN_PASSWORD`) zorunludur ve panel içindeki tüm işlemler `Authorization: Bearer <token>` başlığı ile doğrulanır.
- **CORS:** Açık olduğu için isterseniz farklı bir domain üzerinden de API'ye erişebilirsiniz.

---

## 10. Yardım mı lazım?

Takıldığınız bir yer olursa adım numarasını not alın, tekrar baştan okuyun. Çok zorlanırsanız bilgisayardan anlayan bir arkadaşınıza bu README'yi gösterin; burada yazan bilgilerle sizi kolayca yönlendirebilir.

Başarılar! 👋
