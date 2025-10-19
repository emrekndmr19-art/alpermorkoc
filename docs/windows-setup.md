# Windows Kurulum Adımları

Bu proje klasörünü Windows'ta çalıştırmak için aşağıdaki adımları izleyin. Önce klasörün bilgisayarınızda nerede olduğunu doğrulayın:

1. **Dosya Gezgini'ni açın** ve projeyi nereye indirdiğinizi bulun. Klasöre sağ tıklayıp "Yolu kopyala" seçeneğini kullanabilir veya üst adres çubuğundan tam yolu kopyalayabilirsiniz. Örnek yollar:
   * `C:\Users\<kullanici>\Documents\GitHub\alpermorkoc`
   * `C:\Users\<kullanici>\OneDrive\Documents\GitHub\alpermorkoc` (OneDrive klasörü kullanıyorsanız)

2. **PowerShell veya Komut İstemi'ni açın.**

3. **Proje klasörüne gidin.** Kopyaladığınız yolu tırnak içine alarak `cd` (veya PowerShell'de `Set-Location`) komutu ile girin.
   ```powershell
   cd "C:\Users\<kullanici>\OneDrive\Documents\GitHub\alpermorkoc"
   ```
   Yolun doğru olup olmadığından emin değilseniz aynı dizinde `dir` yazarak klasör listesini kontrol edin. Klasör adlarında boşluk varsa tırnak işareti (`"`) kullanmayı unutmayın; aksi halde "path does not exist" hatası alırsınız.

4. **Projeyi ilk kez açıyorsanız** ZIP arşivini çıkarttığınızdan veya `git clone` ile indirdiğinizden emin olun. PowerShell aynı klasördeyken `dir` komutunda `package.json`, `server.js`, `public` gibi dosyaları görmelisiniz.

5. **Node.js ve npm yüklü değilse** [nodejs.org](https://nodejs.org/) sitesinden LTS sürümünü indirip kurun. Kurulumdan sonra terminali kapatıp yeniden açın.

6. **Bağımlılıkları yükleyin.**
   ```bash
   npm install
   ```

7. **`.env` dosyasını oluşturun veya güncelleyin.** Aşağıdaki örnekteki gibi değerler girin:
   ```
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/alpermorkoc
   JWT_SECRET=buraya_uzun_ve_guclu_bir_anahtar_yazin
   ADMIN_USERNAME=panelkullanici
   ADMIN_PASSWORD=GGucluSifre123!
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   ```
   `MONGO_URI` değerini kendi MongoDB bağlantınıza göre güncelleyebilirsiniz. Dosyayı proje köküne kaydedin.

8. **MongoDB'yi çalıştırın.** Yerel kurulumda `mongod` servisini başlatın veya Atlas bağlantınızın erişilebilir olduğundan emin olun.

9. **Sunucuyu başlatın.**
   ```bash
   npm start
   ```
   Komut satırında bağlantı ve port bilgilerini gösteren loglar görünecektir.

10. **Admin paneline girin.** Tarayıcıda `http://localhost:3000/admin-panel` adresine gidin.
    * Tarayıcı önce kullanıcı adı ve şifre isteyen küçük pencere açar (Basic Auth). `.env` dosyasındaki bilgileri girin.
    * Sayfa açıldıktan sonra ekrandaki giriş formuna yine aynı bilgileri girin. Bu işlemden sonra içerik ve CV yönetim seçenekleri aktifleşir.

11. **Panelde içerik ve CV yönetimi yapın.**
    * "Yeni İçerik Ekle" bölümünden metin ekleyin, düzenleyin veya silin.
    * "CV Yönetimi" alanından PDF yükleyin, indirin veya silin.

12. **İşiniz bitince çıkış yapın.** Paneldeki "Çıkış Yap" düğmesi token'ı siler ve yeniden giriş ekranına döndürür.

> Not: Üretim ortamında `JWT_SECRET`, `ADMIN_USERNAME` ve `ADMIN_PASSWORD` değerlerini daha güçlü ve benzersiz kombinasyonlarla değiştirin. MongoDB veritabanını ve `uploads/` klasörünü düzenli olarak yedeklemeyi unutmayın.
