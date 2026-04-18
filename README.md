# KidZania | National Store 🛒
Digital Transformation & Inventory Management System

Bu proje, staj yaptığım KidZania İstanbul bünyesindeki National Store'un operasyonel verimliliğini artırmak amacıyla geliştirilmiş, SQL Server ➔ Python ➔ Firestore ➔ Next.js akışına sahip uçtan uca bir dijitalleşme çözümüdür. Modern bir monorepo mimarisi üzerine inşa edilmiş olup, stok takibi ve QR kod entegrasyonu sunar.

## 🌟 Öne Çıkan Özellikler
⚡ Real-time Sync: Yerel SQL Server verilerinin Python aracılığıyla bulut veritabanına (Firestore) otomatik senkronizasyonu.

📱 QR Etiket Sistemi: Her ürün için 3x3 cm boyutunda, mobil öncelikli detay sayfalarına yönlendiren dinamik QR kod üretimi.

🛡️ Senior Architecture: Nest.js (Backend) ve Next.js (Frontend) ile tip güvenliği (TypeScript) ve DTO tabanlı veri doğrulama.

🎨 Modern UI: Marka kimliğine uygun #AB0033 ve #F18B22 renk paletiyle minimalist tasarım.

## 🛠️ Teknoloji 
Katman	Teknolojiler
Frontend	Next.js 14+, React, Tailwind CSS, Lucide Icons, Axios
Backend	Nest.js, TypeScript, Firebase Admin SDK, class-validator
Veritabanı	Google Firestore, Microsoft SQL Server (Tiger)
Pipeline	Python, Pandas, pyodbc

## 📈 Veri Akış Mimarisi (Data Pipeline)
Projenin en kritik özelliği, fiziksel mağaza verilerini buluta taşıyan akıllı boru hattıdır:

Extract: Python scripti yerel ağdaki SQL Server'a bağlanır.

Transform: Ham SQL verileri Pandas ile işlenir, temizlenir ve JSON formatına (DTO yapısına uygun) getirilir.

Load: Veriler Firestore üzerine "Upsert" (varsa güncelle, yoksa ekle) mantığıyla yüklenir.

Visualize: Next.js uygulaması, güncel veriyi anlık olarak müşterilere ve adminlere sunar.

## 🚀 Kurulum Rehberi
1. Firebase Yapılandırması

Firestore: Test modunda bir veritabanı başlatın.

Admin SDK: Project Settings > Service Accounts üzerinden özel anahtar (JSON) oluşturun ve backend klasörüne ekleyin.

Client SDK: Web app oluşturup konfigürasyon bilgilerini frontend .env dosyasına kaydedin.

2. Ortam Değişkenleri (.env)

Hem backend/ hem de frontend/ dizinlerinde .env.example dosyalarını .env olarak kopyalayın ve gerekli FIREBASE_* ve NEXT_PUBLIC_FIREBASE_* alanlarını doldurun.

3. Uygulamayı Başlatma

Backend

Bash
cd backend
npm install
npm run start:dev  # http://localhost:3001
Frontend

Bash
cd frontend
npm install
npm run dev        # http://localhost:3000

## 📋 Geliştirme Notları (Senior Pratikleri)
DTO Tabanlı Güvenlik: Tüm API girişleri class-validator ile kontrol edilir. Veri katmanı ile sunum katmanı birbirinden izoledir.

Modüler Yapı: Her özellik Nest.js modülleri altında (src/resource/) kendi controller, service ve dto dosyalarıyla yaşar.

Global Exception Handling: Hata yönetimi merkezi bir filtreden geçer, kullanıcıya asla "stack trace" sızdırılmaz.

## 🏷️ QR Etiket Standartları
Mağaza içi kullanım için tasarlanan etiketler şu standartlara sahiptir:

Boyut: 3x3 cm

Format: Yüksek çözünürlüklü SVG QR Kod.

URL Yapısı: https://domain.app/product/[barkod]
