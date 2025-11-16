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

> **Not:** `index.html`, `projeler.html` gibi var olan tüm sayfalarınız aynı klasörde durmaya devam eder. Backend bunların üzerine eklenen ayrı bir katmandır.

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

## 4. Admin paneline giriş (müşteriniz için)

Siteniz ve admin paneliniz hâlihazırda `https://alpimimarlik.com` alan adında yayın yapıyor. Yönetim alanına erişmek için aşağıdaki adımları müşterinize aynen iletebilirsiniz.

1. Tarayıcı adres çubuğuna şu adresi yazın:
   ```
https://alpimimarlik.com/admin-panel
```
2. İlk olarak küçük bir açılır pencere sizden kullanıcı adı ve şifre ister. Bu ekran sunucuyu koruyan ekstra güvenlik katmanıdır. Size ilettiğim "Yönetici Girişi" kullanıcı adı ve şifresini buraya girip "Oturum Aç" deyin.
3. Bu adımın ardından admin paneli yüklenir ve ekranda tekrar bir giriş formu görürsünüz. Aynı kullanıcı adı ve şifreyi (veya tarafınıza özel olarak belirlenen bilgileri) form alanlarına yazıp "Giriş yap" düğmesine tıklayın.
4. Panelin üst kısmında adınızı selamlayan bir mesaj, alt kısmında da içerik ve CV yönetimi gibi bölümler görünür. Sayfanın sağ üstündeki "Çıkış" bağlantısı ile güvenle oturumu kapatabilirsiniz.
5. Güvenliğiniz için panel, giriş yaptıktan yaklaşık 2 saat sonra oturumu otomatik kapatır. Yeniden çalışmaya devam etmek için adım 1'den itibaren aynı işlemleri tekrarlamanız yeterlidir.

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

## 7. Site metinlerini ve menüyü güncelleme

Sitede gördüğünüz tüm başlıklar, açıklamalar, buton yazıları ve menü bağlantıları admin panelindeki "Site Metinleri ve Menü" bölümünden yönetilir. Kod yazmanıza gerek yoktur; liste her metni "Menü • Portfolyo bağlantısı" gibi anlaşılır şekilde adlandırır.

1. Bölümü açınca üstteki form, altta ise mevcut metinlerin listesi yer alır. Düzenlemek istediğiniz satıra tıkladığınızda form alanları otomatik dolar.
2. "Dil" açılır menüsünden Türkçe veya İngilizce seçin. Her dil kendi çevirisini saklar.
3. "Metin / Değer" kutusuna görmek istediğiniz yeni cümleyi, buton yazısını veya bağlantıyı yazın. Kaydettiğinizde değişiklik siteye anında yansır.
4. Listede olmayan özel bir alanı güncellemeniz istenirse size verilen teknik adı bu kutuya yazabilirsiniz. Emin değilseniz destek ekibine sorun.
5. "Metni Kaydet" butonuna bastıktan sonra değişiklik listede görünür. "Sil" düğmesiyle gereksiz metinleri kaldırabilirsiniz; bu durumda site varsayılan çeviriye döner.

Paneldeki form aynı zamanda teknik anahtarları doğrudan düzenlemenize izin verir. Nokta ile ayrılmış yollar (`index.hero.title`, `common.nav.projects` gibi) üzerinden yeni alanlar oluşturabilir veya mevcut değerleri güncelleyebilirsiniz. Menü bağlantıları `common.nav.*`, hero başlıkları `*.hero.*` altında tutulur; yeni sayfalar veya CTA'lar için aynı isimlendirme kuralını kullanabilirsiniz.

> **İpucu:** Bir metnin teknik adı listede küçük gri yazıyla görünür. Destek gerektiğinde bu adı paylaşmanız yeterlidir; günlük kullanımda açıklayıcı başlıklar üzerinden ilerleyebilirsiniz.

## 8. Sitenizi müşterinin alan adına (domain) bağlama

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

### Üretim ortamı için `.env` dosyası

- Depoda yer alan `.env.production.example` dosyası, canlı ortamda ihtiyaç duyacağınız tüm değişkenlerin örnek değerlerini içerir.
- Sunucuda aşağıdaki komutla dosyayı kopyalayıp gerçek değerlerle doldurun:
  ```bash
  cp .env.production.example .env
  nano .env
  ```
- `ADMIN_API_BASE_URL` değerini backend'in dışarıdan erişilen adresi ile eşleştirin (ör. `https://api.sirketiniz.com/api`).
- `PUBLIC_CONTENT_API_BASE_URL` alanı, ziyaretçilerin gördüğü Projeler ve Portfolyo akışlarının `/api/content` isteklerini hangi domain'e göndereceğini belirler. Frontend'i farklı bir sunucuda barındırıyorsanız tam URL yazın (ör. `https://api.sirketiniz.com/api`).
- `CORS_ALLOWED_ORIGINS` alanına yalnızca frontend'in yayınlandığı alan adlarını yazın. GitHub Pages kullanıyorsanız sayfanın tam URL'sini ekleyin (örn. `https://kullanici.github.io`).

### Admin panelinin API adresini güncelleme

- Admin paneli açılırken `/admin-panel/admin-config.js` dosyasını otomatik yükler ve `.env` içindeki `ADMIN_API_BASE_URL` değerini kullanır.
- Paneli Node.js sunucusundan servis etmeye devam ediyorsanız bu adres genellikle `/api` olarak kalabilir.
- Paneli GitHub Pages üzerinde tutmak istiyorsanız `ADMIN_API_BASE_URL` değerini backend'in tam alan adına ayarlayın, GitHub Pages deposunda da aynı içerikle bir `admin-config.js` dosyası barındırın ve sayfada kullanılan Basic Auth korumasını Nginx benzeri bir ters proxy üzerinden sağlamayı unutmayın.

### Portfolyo akışının API adresini güncelleme

- `portfolio.html` sayfası açılırken kök dizindeki `site-config.js` betiğini yükler ve `.env` içinde tanımladığınız `PUBLIC_CONTENT_API_BASE_URL` değerini okur.
- Frontend'i CDN, GitHub Pages veya farklı bir domainden dağıtıyorsanız `PUBLIC_CONTENT_API_BASE_URL` değerini backend'in tam URL'sine ayarlayın. Böylece `assets/js/portfolio.js` dosyası içerik listesini ve fotoğrafları doğru kaynaktan çeker.

### Mimarlık projeleri bloğu

- Admin panelinde oluşturduğunuz her içerik için "Proje Tipi" alanı bulunur. Bu değer (`workplace`, `residential`, `hospitality`, `concept`) kartların ana sayfa, Projeler ve Portfolyo sayfalarında hangi etiketle gösterileceğini belirler.
- `index.html` dosyasındaki `assets/js/projects-feed.js` betiği, aynı `site-config.js` çıktısını kullanarak `/api/content` uç noktasını çağırır ve ilgili dile göre filtrelenmiş en güncel üç projeyi gösterir.
- `projectType` alanı MongoDB tarafında tutulur; içeriği güncellerken değiştirebilir veya bırakırsanız varsayılan olarak "Ofis / Çalışma Alanı" etiketi kullanılır.

### CORS izinlerini doğrulama

- GitHub Pages ile backend arasında bağlantı kurarken tarayıcı konsolunda `CORS` hatası görürseniz backend'deki `CORS_ALLOWED_ORIGINS` ayarını güncelleyin.
- Birden fazla origin'i virgülle ayırabilirsiniz: `CORS_ALLOWED_ORIGINS=https://kullanici.github.io,https://admin.sirketiniz.com`.
- Değişiklikten sonra Node.js sürecini yeniden başlatın; `pm2 restart site-backend` veya uygulamayı nasıl çalıştırıyorsanız o komutu kullanın.

### Yayını canlıya alma adımları (özet)

1. Sunucuda proje klasörüne geçin ve bağımlılıkları kurun: `npm install`.
2. `.env` dosyanızın üretim değerleri ile dolu olduğundan emin olun.
3. Uygulamayı kalıcı olarak çalıştırmak için süreç yöneticisi kullanın:
   ```bash
   pm2 start server.js --name site-backend --env production
   ```
   veya basit testler için `npm start` komutu ile manuel başlatın.
4. Gerekirse `pm2 save` ve `pm2 startup` komutları ile sunucu yeniden başladığında uygulamanın otomatik açılmasını sağlayın.

---

## 9. Sık karşılaşılan sorunlar ve çözümleri

| Problem | Sebep | Çözüm |
| --- | --- | --- |
| `MongoDB bağlantı hatası` | MongoDB çalışmıyor | Windows'ta "Services" uygulamasından MongoDB'yi başlatın. Linux'ta `sudo systemctl start mongodb`. |
| `Sunucu portu kullanımda` | Aynı portu kullanan başka uygulama var | `.env` dosyasında `PORT` değerini 4000 gibi başka bir sayıya değiştirin. Nginx proxy ayarını da güncelleyin. |
| Admin paneli "Yetkisiz" uyarısı veriyor | JWT süresi doldu veya şifre yanlış | Panelde oturumu kapatıp tekrar giriş yapın. Şifreyi `.env` dosyasından kontrol edin. |
| Dosya yüklerken hata | PDF değil veya dosya çok büyük | Dosyanın `.pdf` olduğundan ve 10 MB'tan küçük olduğundan emin olun. |

---

## 10. Teknik ekler (meraklısına)

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
  - `GET /api/site-copy/:language` → Sitenin herkese açık metinlerini döner.
  - `GET /api/site-copy` → Admin panelinde tüm dilleri listeler (JWT gerektirir).
  - `PUT /api/site-copy/:language` → Belirli bir dildeki metin anahtarlarını günceller veya siler (JWT gerektirir).
- **Güvenlik:** Parolalar `bcrypt` ile şifrelenir, admin paneline erişim için ek olarak HTTP Basic Auth (ENV değişkenlerindeki `ADMIN_USERNAME` ve `ADMIN_PASSWORD`) zorunludur ve panel içindeki tüm işlemler `Authorization: Bearer <token>` başlığı ile doğrulanır.
- **CORS:** Varsayılan olarak `.env` dosyasındaki `CORS_ALLOWED_ORIGINS` ile sınırlandırılır; ihtiyaç halinde bu listeyi güncelleyebilirsiniz.

---

## 10. Yardım mı lazım?

Takıldığınız bir yer olursa adım numarasını not alın, tekrar baştan okuyun. Çok zorlanırsanız bilgisayardan anlayan bir arkadaşınıza bu README'yi gösterin; burada yazan bilgilerle sizi kolayca yönlendirebilir.

Başarılar! 👋
