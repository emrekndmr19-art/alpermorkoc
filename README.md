# Backend ve Admin Panel Kullanım Kılavuzu

Bu proje mevcut statik web sitesine Node.js, Express ve MongoDB tabanlı bir backend ile JWT korumalı bir admin panel ekler. Aşağıda backend'i kendi ortamınızda çalıştırmak, admin paneline giriş yapmak ve içerik/CV yönetimi yapmak için adımlar bulunmaktadır.

## 1. Gerekli bağımlılıkları yükleyin

1. [Node.js](https://nodejs.org/) (>= 18) ve npm kurulu olmalıdır.
2. Yerelinizde çalışan bir MongoDB sunucusu olması gerekir. Varsayılan olarak `mongodb://127.0.0.1:27017/alpermorkoc` adresi kullanılır.
3. Proje klasöründe aşağıdaki komutu çalıştırın:

```bash
npm install
```

## 2. Ortam değişkenlerini yapılandırın

İsteğe bağlı olarak `.env` dosyası oluşturup aşağıdaki değerleri özelleştirebilirsiniz. Dosya oluşturmazsanız dosyada belirtilen varsayılan değerler kullanılır.

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/alpermorkoc
JWT_SECRET=supersecretjwt
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

İlk çalıştırmada `ADMIN_USERNAME` ve `ADMIN_PASSWORD` bilgileriyle bir admin kullanıcısı otomatik olarak oluşturulur. Daha sonra bu değerleri değiştirirseniz veri tabanındaki kullanıcıyı manuel olarak güncellemeniz gerekir.

## 3. Sunucuyu başlatın

Gerekli servisler hazır olduğunda Express sunucusunu başlatmak için:

```bash
npm start
```

Komut başarılı olduğunda konsolda aşağıdaki mesajlar görünür:

- "MongoDB bağlantısı başarılı"
- "Sunucu 3000 portunda çalışıyor" (veya `.env` dosyasında belirlediğiniz port)

Sunucu, proje kök dizinini ve `public/` klasörünü statik olarak servis eder.

## 4. Admin paneline erişim

Tarayıcınızda aşağıdaki adresi açın:

```
http://localhost:3000/admin-panel
```

Karşınıza gelen giriş formuna admin kullanıcı adı ve parolasını girin. Giriş başarılı olduğunda JWT token `localStorage` içine kaydedilir ve içerik/CV yönetim bileşenleri görünür hale gelir.

## 5. API uç noktalarının kullanımı

### 5.1. Kimlik doğrulama

- `POST /api/login`
  - İstek gövdesi: `{ "username": "admin", "password": "admin123" }`
  - Yanıt: `{ "token": "<JWT>" }`
  - Admin paneli bu endpoint'i `fetch` ile çağırır ve token'ı saklar.

### 5.2. İçerik yönetimi (herkese açık listeleme, admin kontrollü CRUD)

- `GET /api/content`: İçerik listesini döndürür.
- `POST /api/content`: Başlık ve içerik alır, yeni içerik oluşturur. Header'da `Authorization: Bearer <JWT>` bulunmalıdır.
- `PUT /api/content/:id`: Mevcut içeriği günceller (JWT gerekli).
- `DELETE /api/content/:id`: İçeriği siler (JWT gerekli).

Admin panelindeki "İçerik Yönetimi" bölümü bu endpoint'leri kullanır.

### 5.3. CV yükleme ve indirme (yalnızca admin)

- `POST /api/upload-cv`: `multipart/form-data` formatında `cv` isimli alanla PDF yükler. Yüklenen dosya `uploads/` klasörüne kaydedilir ve veritabanına metadata eklenir.
- `GET /api/cvs`: Yüklenen tüm CV kayıtlarını listeler.
- `GET /api/cv/download/:id`: Belirli bir CV'yi indirir.

Admin panelinde "CV Yönetimi" başlığı altında yükleme formu ve liste bulunmaktadır. Liste üzerindeki "İndir" butonları ilgili `download` endpoint'ine yönlenir.

## 6. Statik site ile entegrasyon

Backend çalıştığında, halihazırda var olan statik HTML sayfalarınız (`index.html`, `services.html` vb.) aynı sunucu üzerinden servis edilir. Frontend tarafında içeriği dinamikleştirmek isterseniz `GET /api/content` ile dönen verileri ilgili sayfalarda kullanabilirsiniz.

## 7. Dosya yapısı özeti

- `server.js`: Express uygulaması ve tüm API route'ları.
- `models/`: Mongoose modelleri (`User`, `Content`, `CV`).
- `middleware/auth.js`: JWT doğrulama middleware'i.
- `public/admin.html` & `public/admin.js`: Admin panel arayüzü ve istemci tarafı işlevleri.
- `uploads/`: Yüklenen PDF dosyalarının tutulduğu klasör.

## 8. Faydalı ipuçları

- Admin paneline giriş yaptıktan sonra token 2 saat boyunca geçerlidir. Süre dolduğunda panel sizi otomatik olarak çıkışa yönlendirir.
- Varsayılan admin parolasını değiştirmek için yeni bir hash üretip veritabanındaki kaydı güncelleyin ya da `.env` ayarlarını güncelledikten sonra eski kullanıcıyı silip sunucuyu yeniden başlatın.
- Endpoint'leri test etmek için [Postman](https://www.postman.com/) veya [Insomnia](https://insomnia.rest/) gibi REST istemcilerini kullanabilirsiniz. Yetkili isteklerde `Authorization: Bearer <JWT>` header'ını eklemeyi unutmayın.

Bu adımları takip ederek backend'i çalıştırabilir, admin panelini kullanabilir ve MongoDB üzerinde içerik ile CV yönetimi yapabilirsiniz.
