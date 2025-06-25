# PDF Converter API

Dönüştürme, pdf birleştirme ve bölme hizmeti sunan Node.js tabanlı REST API uygulaması.

## 🚀 Özellikler

- **Dosya Dönüştürme**: DOCX, TXT, JPG, JPEG, PNG dosyalarını PDF formatına dönüştürme
- **PDF Birleştirme**: Birden fazla PDF dosyasını tek bir dosya halinde birleştirme
- **PDF Bölme**: PDF dosyalarını belirtilen sayfa aralığına göre bölme
- **Gerçek Zamanlı Durum Takibi**: Server-Sent Events (SSE) ile işlem durumu takibi
- **Asenkron İşleme**: RabbitMQ ile kuyruk tabanlı işlem yönetimi
- **Kullanıcı Yönetimi**: JWT tabanlı kimlik doğrulama sistemi
- **Dosya İndirme**: Tek dosya veya ZIP arşivi olarak toplu indirme

## 🛠️ Kullanılan Teknolojiler

### Backend Framework
- **Node.js**: JavaScript runtime ortamı
- **Express.js**: Web application framework
- **Mongoose**: MongoDB object modeling

### Veritabanı
- **MongoDB**: NoSQL veritabanı

### Dosya İşleme
- **Multer**: Multipart form data (dosya upload) için middleware
- **PDFKit**: PDF oluşturma ve düzenleme
- **pdf-lib**: PDF manipülasyonu ve birleştirme
- **docx-pdf**: DOCX dosyalarını PDF'e dönüştürme
- **Archiver**: ZIP arşivi oluşturma

### Message Queue
- **RabbitMQ**: Asenkron mesaj kuyruğu sistemi
- **amqplib**: RabbitMQ client library

### Güvenlik & Kimlik Doğrulama
- **bcrypt**: Şifre hash'leme
- **jsonwebtoken (JWT)**: Token tabanlı kimlik doğrulama
- **dotenv**: Environment variables yönetimi

### Utility Libraries
- **uuid**: Benzersiz dosya adları oluşturma
- **path**: Dosya yolu manipülasyonu
- **fs**: Dosya sistemi işlemleri

## 📋 Sistem Gereksinimleri

- Node.js (v14 veya üzeri)
- MongoDB (v4.0 veya üzeri)
- RabbitMQ Server
- NPM veya Yarn

## ⚙️ Kurulum

1. **Projeyi klonlayın:**
```bash
git clone <repository-url>
cd pdf-converter-api
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment variables ayarlayın:**
```bash
# .env dosyası oluşturun
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=mongodb://localhost:27017/your_db_name
PORT=4000
```

4. **-RabbitMQ servisını kur ve başlat **
```bash
# RabbitMQ
1. Docker'a RabbıtMQ kurma:
docker pull rabbitmq:3-management

2. RabbitMQ Container'ını Çalıştırma
bashdocker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

5. **Api ve Clienti başlatın:**
```bash
cd api
npm start
ve
cd client
npm start
```

6. **Worker süreçlerini başlatın:**
```bash
# Terminal 1: Convert Worker
node workers/convertWorker.js

# Terminal 2: Merge Worker  
node workers/mergeWorker.js

# Terminal 3: Split Worker
node workers/splitWorker.js
```

## 🔗 API Endpoints

### Kullanıcı İşlemleri
```
POST   /api/users/register     - Kullanıcı kaydı
POST   /api/users/login        - Kullanıcı girişi
GET    /api/users/:id          - Kullanıcı bilgileri
PUT    /api/users/:id          - Kullanıcı güncelleme
DELETE /api/users/:id          - Kullanıcı silme
GET    /api/users/getall       - Tüm kullanıcıları listeleme
```

### Dosya İşlemleri
```
POST   /api/jobs/convert       - Dosya dönüştürme
POST   /api/jobs/merge         - PDF birleştirme
POST   /api/jobs/split         - PDF bölme
GET    /api/jobs/stream/:id    - İşlem durumu takibi (SSE)
GET    /api/jobs/download/:jobId               - Tüm dosyaları indir
GET    /api/jobs/download/:jobId/:fileIndex   - Belirli dosyayı indir
```

## 📝 Kullanım Örnekleri

### Dosya Dönüştürme
```bash
curl -X POST http://localhost:3000/api/jobs/convert \
  -F "files=@document.docx" \
  -F "userId=user_id_here"
```

### PDF Birleştirme
```bash
curl -X POST http://localhost:3000/api/jobs/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -F "userId=user_id_here"
```

### PDF Bölme
```bash
curl -X POST http://localhost:3000/api/jobs/split \
  -F "files=@document.pdf" \
  -F "userId=user_id_here" \
  -F "splitStart=1" \
  -F "splitEnd=5"
```

## 🏗️ Proje Yapısı

```
├── models/
│   ├── User.js          # Kullanıcı şeması
│   └── Job.js           # İş şeması
├── controllers/
│   ├── userController.js    # Kullanıcı işlemleri
│   └── jobController.js     # Dosya işlemleri
├── middlewares/
│   └── Multer.js        # Dosya upload middleware
├── routes/
│   ├── userRoutes.js    # Kullanıcı rotaları
│   └── jobRoutes.js     # İş rotaları
├── workers/
│   ├── convertWorker.js # Dönüştürme işçisi
│   ├── mergeWorker.js   # Birleştirme işçisi
│   └── splitWorker.js   # Bölme işçisi
├── uploads/             # Dosya depolama
└── RabbitMQ.js         # Message queue konfigürasyonu
```

## 🔄 İş Akışı

1. **Dosya Upload**: Kullanıcı dosyaları yükler
2. **Job Oluşturma**: Veritabanında yeni bir iş kaydı oluşturulur
3. **Queue'ya Gönderme**: İş, uygun RabbitMQ kuyruğuna gönderilir
4. **Worker İşleme**: İlgili worker işi alır ve işler
5. **Durum Güncelleme**: İş durumu veritabanında güncellenir
6. **Dosya İndirme**: Kullanıcı işlenmiş dosyaları indirir

## 📊 Desteklenen Dosya Formatları

### Giriş Formatları
- **Dönüştürme için**: DOCX, TXT, JPG, JPEG, PNG
- **Birleştirme için**: PDF
- **Bölme için**: PDF

### Çıkış Formatı
- **PDF**: Tüm işlemler PDF formatında sonuç üretir

## 🔧 Konfigürasyon

### Dosya Boyutu Limitleri
- Maksimum dosya boyutu: 50MB
- Maksimum dosya sayısı: 10 adet

### RabbitMQ Kuyrukları
- `pdf_convert_queue`: Dönüştürme işlemleri
- `pdf_merge_queue`: Birleştirme işlemleri  
- `pdf_split_queue`: Bölme işlemleri

## 🚨 Hata Yönetimi

Sistem kapsamlı hata yönetimi içerir:
- Dosya upload hataları
- Dönüştürme hataları
- Veritabanı bağlantı hataları
- RabbitMQ bağlantı hataları
- Dosya sistemi hataları

## 🔒 Güvenlik

- JWT token tabanlı kimlik doğrulama
- Bcrypt ile şifre hash'leme
- Dosya boyutu ve türü validasyonu
- Kullanıcı bazlı dosya izolasyonu

## 📈 Performans

- Asenkron işleme ile yüksek performans
- Worker tabanlı yük dağılımı
- Dosya cleanup mekanizması
- Memory efficient streaming
