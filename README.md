# KidZania | National Store

## Proje Tanımı
Modern web uygulamaları geliştirmek için hazırlanmış, üretime hazır (production-ready) bir monorepo başlangıç şablonudur. Proje, ölçeklenebilir ve güvenli bir altyapı sunmayı hedefler.

Kullanılan Temel Teknolojiler:
- **Backend:** Nest.js, TypeScript, Firebase Admin SDK (Firestore), `class-validator` (DTO tabanlı güvenlik).
- **Frontend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, Axios, Firebase Client SDK.

Bu proje bileşenleri, en yaygın "Senior" geliştirme pratikleri gözetilerek mimarilendirilmiş, yetkilendirme (Authentication) içermeden doğrudan veri katmanına (Firestore) odaklanan hızlı bir başlangıç noktası sunmaktadır.

---

## Firebase Kurulum Rehberi

Projenin tam kapasiteyle çalışabilmesi için bir Firebase projesi ile entegre edilmesi gerekmektedir. Aşağıdaki adımları sırasıyla izleyin:

### 1. Firebase Projesi Oluşturma
- [Firebase Console](https://console.firebase.google.com/)'a gidin.
- **"Add project"** (Proje ekle) butonuna tıklayın ve yönergeleri izleyerek yeni bir proje oluşturun.

### 2. Firestore Veritabanını Başlatma
- Firebase Console sol menüsünden **Build > Firestore Database** sekmesine tıklayın.
- **"Create database"** butonuna basın.
- Geliştirme aşaması için **"Start in test mode"** (Test modunda başlat) seçeneğini seçebilirsiniz. (Production'a çıkarken güvenlik kurallarınızı güncellemeyi unutmayın).
- Size uygun konumu (Region) seçip kurulumu tamamlayın.

### 3. Backend İçin Service Account (Admin SDK) Ayarları
- Firebase Console'da sağ üstteki dişli çark simgesine (Project settings) tıklayıp **"Project settings"** seçeneğine gidin.
- **"Service accounts"** sekmesine geçin.
- **"Generate new private key"** butonuna basarak JSON dosyasını bilgisayarınıza indirin.
- İndirdiğiniz JSON dosyasını açın. Ana dizindeki veya `backend/` dizinindeki `.env` dosyanıza şu iki bilgiyi ekleyin:
  - `client_email` değerini `FIREBASE_CLIENT_EMAIL` alanına yapıştırın.
  - `private_key` değerini `FIREBASE_PRIVATE_KEY` alanına yapıştırın. (NOT: Tırnak işaretlerine ve `\n` karakterlerinin korunmasına dikkat edin).
  - Proje ID'sini `FIREBASE_PROJECT_ID` alanına girin.

### 4. Frontend İçin Firebase Client Ayarları
- Tekrar **Project settings > General** sekmesine gidin.
- Sayfanın altındaki "Your apps" bölümünden yeni bir **Web app** (`</>`) ekleyin.
- Uygulama adını girin ve kaydedin.
- Size verilen `firebaseConfig` objesindeki değerleri ana dizindeki veya `frontend/` dizinindeki `.env` dosyanızda yer alan `NEXT_PUBLIC_FIREBASE_*` değişkenlerine eşleyin.

---

## Kurulum (Installation)

Projeyi bilgisayarınıza klonladıktan sonra şu adımları izleyerek çalıştırabilirsiniz:

### Ortam Değişkenleri (Environment Variables)
Hem kök dizindeki hem de backend/frontend dizinlerindeki `.env.example` dosyalarını `.env` adıyla kopyalayın ve içeriklerini yukarıdaki yönergelere göre doldurun.

### Backend'i Başlatma
```bash
cd backend
npm install
npm run start:dev
```
Backend API varsayılan olarak `http://localhost:3001` adresinde çalışacaktır.

### Frontend'i Başlatma
```bash
cd frontend
npm install
npm run dev
```
Frontend uygulaması varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

---

## Geliştirme Notları (Senior Pratikleri)

Bu yapı ölçeklenebilir projeler için şu prensiplere dayanır:

### Klasör Yapısı
- **Monorepo Yaklaşımı:** Backend ve Frontend kodları ayrılmış ancak aynı repoda tutulmuştur. Bu, uçtan uca tip güvenliği (end-to-end type safety) sağlamak için ileride paylaşımlı paketler (shared packages) eklemeyi kolaylaştırır.
- **Modülerlik (Nest.js):** Her feature (özellik) kendi klasöründe (module, controller, service, dto, interface) yaşar. Örneğin `src/resource/` klasörünü inceleyerek yeni modülleri nasıl ekleyeceğinizi görebilirsiniz.
- **App Router (Next.js):** Routing işlemleri `src/app/` altında yapılırken, tekrar kullanılabilir bileşenler, servisler ve yardımcı araçlar için `src/components`, `src/services`, `src/lib` gibi ayrı klasörler kullanılır.

### Yeni Bir Modül Eklerken
1. **Güvenlik (Validation):** Controller seviyesinde gelen tüm verileri bağlamak için mutlaka `class-validator` ile doğrulanmış DTO'lar (Data Transfer Objects) kullanın. (Global Validation Pipe projede aktif edilmiştir).
2. **Hata Yönetimi (Error Handling):** İstisnai durumlarda yığın izini (stack trace) sızdırmamak adına kurulan Global Exception Filter kullanımdadır. Controller veya Service katmanında manuel try-catch blokları kullanmak yerine Nest.js `HttpException` sınıflarını (örn. `NotFoundException`) fırlatın.
3. **Bağımlılık Enjeksiyonu (DI):** Firebase işlemleri veya diğer iş mantıkları her zaman Services sınıflarına delegasyon yapılarak kullanılmalı, doğrudan Controller içine mantık yazılmamalıdır.

---

## İsim Değiştirme (Renaming the Project)

Eğer bu şablonu alıp projenizin adını "web.skeleton" yerine yeni bir isim yapmak istiyorsanız:

1. Ana dizindeki klasör adını (root folder) değiştirin.
2. `backend/package.json` dosyasındaki `"name"` değerini güncelleyin (`"yeni-proje-backend"` gibi).
3. `backend/nest-cli.json` (varsa projeler bloğu altındaki isimler) ve diğer log/konfigürasyon dosyalarındaki "web.skeleton" ibarelerini bulun.
4. `frontend/package.json` dosyasındaki `"name"` değerini güncelleyin (`"yeni-proje-frontend"` gibi).
5. `frontend/src/app/layout.tsx` dosyasındaki `title` ve `description` metadata yapılarını uygulamanıza uygun şekilde güncelleyin.
6. `frontend/src/app/page.tsx` içerisindeki hoşgeldin yazılarını (Header vs.) kendi markanıza göre değiştirin.
7. Tüm IDE pencerelerini yeniden başlatın ve `npm install` adımlarını tekrarlayarak paket kilit dosyalarındaki isimlerin düzelmesini sağlayın.
