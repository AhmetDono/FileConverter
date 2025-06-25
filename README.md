# PDF Converter API

**Multi-language README:** [English](#english) | [Türkçe](#türkçe)

---

## English

### Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Project Structure](#project-structure)
- [Workflow](#workflow)
- [Supported File Formats](#supported-file-formats)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Security](#security)
- [Performance](#performance)

### Overview

A Node.js-based REST API application that provides file conversion, PDF merging, and splitting services.

### Features

- **File Conversion**: Convert DOCX, TXT, JPG, JPEG, PNG files to PDF format
- **PDF Merging**: Merge multiple PDF files into a single document
- **PDF Splitting**: Split PDF files according to specified page ranges
- **Real-time Status Tracking**: Process status tracking with Server-Sent Events (SSE)
- **Asynchronous Processing**: Queue-based process management with RabbitMQ
- **User Management**: JWT-based authentication system
- **File Download**: Single file or batch download as ZIP archive

### Technologies Used

#### Backend Framework
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Mongoose**: MongoDB object modeling

#### Database
- **MongoDB**: NoSQL database

#### File Processing
- **Multer**: Middleware for multipart form data (file upload)
- **PDFKit**: PDF creation and editing
- **pdf-lib**: PDF manipulation and merging
- **docx-pdf**: Convert DOCX files to PDF
- **Archiver**: ZIP archive creation

#### Message Queue
- **RabbitMQ**: Asynchronous message queue system
- **amqplib**: RabbitMQ client library

#### Security & Authentication
- **bcrypt**: Password hashing
- **jsonwebtoken (JWT)**: Token-based authentication
- **dotenv**: Environment variables management

#### Utility Libraries
- **uuid**: Generate unique file names
- **path**: File path manipulation
- **fs**: File system operations

### System Requirements

- Node.js (v14 or higher)
- MongoDB (v4.0 or higher)
- RabbitMQ Server
- NPM or Yarn

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd pdf-converter-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Create .env file
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=mongodb://localhost:27017/your_db_name
PORT=4000
```

4. **Install and start RabbitMQ service:**
```bash
# RabbitMQ with Docker
1. Install RabbitMQ on Docker:
docker pull rabbitmq:3-management

2. Run RabbitMQ Container:
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

5. **Start API and Client:**
```bash
cd api
npm start
and
cd client
npm start
```

6. **Start worker processes:**
```bash
# Terminal 1: Convert Worker
node workers/convertWorker.js

# Terminal 2: Merge Worker  
node workers/mergeWorker.js

# Terminal 3: Split Worker
node workers/splitWorker.js
```

### API Endpoints

#### User Operations
```
POST   /api/users/register     - User registration
POST   /api/users/login        - User login
GET    /api/users/:id          - Get user information
PUT    /api/users/:id          - Update user
DELETE /api/users/:id          - Delete user
GET    /api/users/getall       - List all users
```

#### File Operations
```
POST   /api/jobs/convert       - File conversion
POST   /api/jobs/merge         - PDF merging
POST   /api/jobs/split         - PDF splitting
GET    /api/jobs/stream/:id    - Process status tracking (SSE)
GET    /api/jobs/download/:jobId               - Download all files
GET    /api/jobs/download/:jobId/:fileIndex   - Download specific file
```

### Usage Examples

#### File Conversion
```bash
curl -X POST http://localhost:3000/api/jobs/convert \
  -F "files=@document.docx" \
  -F "userId=user_id_here"
```

#### PDF Merging
```bash
curl -X POST http://localhost:3000/api/jobs/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -F "userId=user_id_here"
```

#### PDF Splitting
```bash
curl -X POST http://localhost:3000/api/jobs/split \
  -F "files=@document.pdf" \
  -F "userId=user_id_here" \
  -F "splitStart=1" \
  -F "splitEnd=5"
```

### Project Structure

```
├── models/
│   ├── User.js          # User schema
│   └── Job.js           # Job schema
├── controllers/
│   ├── userController.js    # User operations
│   └── jobController.js     # File operations
├── middlewares/
│   └── Multer.js        # File upload middleware
├── routes/
│   ├── userRoutes.js    # User routes
│   └── jobRoutes.js     # Job routes
├── workers/
│   ├── convertWorker.js # Conversion worker
│   ├── mergeWorker.js   # Merge worker
│   └── splitWorker.js   # Split worker
├── uploads/             # File storage
└── RabbitMQ.js         # Message queue configuration
```

### Workflow

1. **File Upload**: User uploads files
2. **Job Creation**: A new job record is created in the database
3. **Queue Submission**: Job is sent to the appropriate RabbitMQ queue
4. **Worker Processing**: Relevant worker picks up and processes the job
5. **Status Update**: Job status is updated in the database
6. **File Download**: User downloads processed files

### Supported File Formats

#### Input Formats
- **For Conversion**: DOCX, TXT, JPG, JPEG, PNG
- **For Merging**: PDF
- **For Splitting**: PDF

#### Output Format
- **PDF**: All operations produce results in PDF format

### Configuration

#### File Size Limits
- Maximum file size: 50MB
- Maximum number of files: 10 files

#### RabbitMQ Queues
- `pdf_convert_queue`: Conversion operations
- `pdf_merge_queue`: Merge operations  
- `pdf_split_queue`: Split operations

### Error Handling

The system includes comprehensive error handling:
- File upload errors
- Conversion errors
- Database connection errors
- RabbitMQ connection errors
- File system errors

### Security

- JWT token-based authentication
- Password hashing with bcrypt
- File size and type validation
- User-based file isolation

### Performance

- High performance with asynchronous processing
- Worker-based load distribution
- File cleanup mechanism
- Memory efficient streaming

---

## Türkçe

### İçindekiler
- [Genel Bakış](#genel-bakış)
- [Özellikler](#özellikler)
- [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
- [Sistem Gereksinimleri](#sistem-gereksinimleri)
- [Kurulum](#kurulum)
- [API Endpoints](#api-endpoints-tr)
- [Kullanım Örnekleri](#kullanım-örnekleri)
- [Proje Yapısı](#proje-yapısı)
- [İş Akışı](#iş-akışı)
- [Desteklenen Dosya Formatları](#desteklenen-dosya-formatları)
- [Konfigürasyon](#konfigürasyon)
- [Hata Yönetimi](#hata-yönetimi)
- [Güvenlik](#güvenlik)
- [Performans](#performans)

### Genel Bakış

Dönüştürme, pdf birleştirme ve bölme hizmeti sunan Node.js tabanlı REST API uygulaması.

### Özellikler

- **Dosya Dönüştürme**: DOCX, TXT, JPG, JPEG, PNG dosyalarını PDF formatına dönüştürme
- **PDF Birleştirme**: Birden fazla PDF dosyasını tek bir dosya halinde birleştirme
- **PDF Bölme**: PDF dosyalarını belirtilen sayfa aralığına göre bölme
- **Gerçek Zamanlı Durum Takibi**: Server-Sent Events (SSE) ile işlem durumu takibi
- **Asenkron İşleme**: RabbitMQ ile kuyruk tabanlı işlem yönetimi
- **Kullanıcı Yönetimi**: JWT tabanlı kimlik doğrulama sistemi
- **Dosya İndirme**: Tek dosya veya ZIP arşivi olarak toplu indirme

### Kullanılan Teknolojiler

#### Backend Framework
- **Node.js**: JavaScript runtime ortamı
- **Express.js**: Web application framework
- **Mongoose**: MongoDB object modeling

#### Veritabanı
- **MongoDB**: NoSQL veritabanı

#### Dosya İşleme
- **Multer**: Multipart form data (dosya upload) için middleware
- **PDFKit**: PDF oluşturma ve düzenleme
- **pdf-lib**: PDF manipülasyonu ve birleştirme
- **docx-pdf**: DOCX dosyalarını PDF'e dönüştürme
- **Archiver**: ZIP arşivi oluşturma

#### Message Queue
- **RabbitMQ**: Asenkron mesaj kuyruğu sistemi
- **amqplib**: RabbitMQ client library

#### Güvenlik & Kimlik Doğrulama
- **bcrypt**: Şifre hash'leme
- **jsonwebtoken (JWT)**: Token tabanlı kimlik doğrulama
- **dotenv**: Environment variables yönetimi

#### Utility Libraries
- **uuid**: Benzersiz dosya adları oluşturma
- **path**: Dosya yolu manipülasyonu
- **fs**: Dosya sistemi işlemleri

### Sistem Gereksinimleri

- Node.js (v14 veya üzeri)
- MongoDB (v4.0 veya üzeri)
- RabbitMQ Server
- NPM veya Yarn

### Kurulum

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

4. **RabbitMQ servisini kur ve başlat:**
```bash
# RabbitMQ
1. Docker'a RabbitMQ kurma:
docker pull rabbitmq:3-management

2. RabbitMQ Container'ını Çalıştırma:
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

5. **Api ve Client'ı başlatın:**
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

### API Endpoints {#api-endpoints-tr}

#### Kullanıcı İşlemleri
```
POST   /api/users/register     - Kullanıcı kaydı
POST   /api/users/login        - Kullanıcı girişi
GET    /api/users/:id          - Kullanıcı bilgileri
PUT    /api/users/:id          - Kullanıcı güncelleme
DELETE /api/users/:id          - Kullanıcı silme
GET    /api/users/getall       - Tüm kullanıcıları listeleme
```

#### Dosya İşlemleri
```
POST   /api/jobs/convert       - Dosya dönüştürme
POST   /api/jobs/merge         - PDF birleştirme
POST   /api/jobs/split         - PDF bölme
GET    /api/jobs/stream/:id    - İşlem durumu takibi (SSE)
GET    /api/jobs/download/:jobId               - Tüm dosyaları indir
GET    /api/jobs/download/:jobId/:fileIndex   - Belirli dosyayı indir
```

### Kullanım Örnekleri

#### Dosya Dönüştürme
```bash
curl -X POST http://localhost:3000/api/jobs/convert \
  -F "files=@document.docx" \
  -F "userId=user_id_here"
```

#### PDF Birleştirme
```bash
curl -X POST http://localhost:3000/api/jobs/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -F "userId=user_id_here"
```

#### PDF Bölme
```bash
curl -X POST http://localhost:3000/api/jobs/split \
  -F "files=@document.pdf" \
  -F "userId=user_id_here" \
  -F "splitStart=1" \
  -F "splitEnd=5"
```

### Proje Yapısı

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

### İş Akışı

1. **Dosya Upload**: Kullanıcı dosyaları yükler
2. **Job Oluşturma**: Veritabanında yeni bir iş kaydı oluşturulur
3. **Queue'ya Gönderme**: İş, uygun RabbitMQ kuyruğuna gönderilir
4. **Worker İşleme**: İlgili worker işi alır ve işler
5. **Durum Güncelleme**: İş durumu veritabanında güncellenir
6. **Dosya İndirme**: Kullanıcı işlenmiş dosyaları indirir

### Desteklenen Dosya Formatları

#### Giriş Formatları
- **Dönüştürme için**: DOCX, TXT, JPG, JPEG, PNG
- **Birleştirme için**: PDF
- **Bölme için**: PDF

#### Çıkış Formatı
- **PDF**: Tüm işlemler PDF formatında sonuç üretir

### Konfigürasyon

#### Dosya Boyutu Limitleri
- Maksimum dosya boyutu: 50MB
- Maksimum dosya sayısı: 10 adet

#### RabbitMQ Kuyrukları
- `pdf_convert_queue`: Dönüştürme işlemleri
- `pdf_merge_queue`: Birleştirme işlemleri  
- `pdf_split_queue`: Bölme işlemleri

### Hata Yönetimi

Sistem kapsamlı hata yönetimi içerir:
- Dosya upload hataları
- Dönüştürme hataları
- Veritabanı bağlantı hataları
- RabbitMQ bağlantı hataları
- Dosya sistemi hataları

### Güvenlik

- JWT token tabanlı kimlik doğrulama
- Bcrypt ile şifre hash'leme
- Dosya boyutu ve türü validasyonu
- Kullanıcı bazlı dosya izolasyonu

### Performans

- Asenkron işleme ile yüksek performans
- Worker tabanlı yük dağılımı
- Dosya cleanup mekanizması
- Memory efficient streaming
