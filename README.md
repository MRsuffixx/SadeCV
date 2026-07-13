# SadeCV

![SadeCV — Your story, clearly told](./public/og.png)

SadeCV, profesyonel özgeçmişleri oluşturmak, düzenlemek ve PDF olarak dışa aktarmak için geliştirilmiş sade bir SaaS uygulamasıdır. Proje; CV editörü, canlı önizleme, plan ve kota yönetimi, Stripe/iyzico ödemeleri, dosya yükleme, yönetim paneli ve güvenlik kontrollerini tek bir Next.js uygulamasında bir araya getirir.

> **Lisans:** Bu depo açık kaynak değildir. Kaynak kodu inceleme ve öğrenme amacıyla görüntülenebilir; ticari kullanım, yeniden dağıtım, herkese açık dağıtım ve SadeCV'nin kopyası niteliğinde bir hizmet oluşturmak yasaktır. Ayrıntılar için [LICENSE](./LICENSE) dosyasını okuyun.

## İçindekiler

- [Öne çıkan özellikler](#öne-çıkan-özellikler)
- [Teknoloji yığını](#teknoloji-yığını)
- [Mimari](#mimari)
- [Proje yapısı](#proje-yapısı)
- [Rotalar](#rotalar)
- [Başlangıç](#başlangıç)
- [Ortam değişkenleri](#ortam-değişkenleri)
- [Veritabanı](#veritabanı)
- [Kimlik doğrulama ve yetkilendirme](#kimlik-doğrulama-ve-yetkilendirme)
- [CV modeli ve şablonlar](#cv-modeli-ve-şablonlar)
- [Ödeme entegrasyonları](#ödeme-entegrasyonları)
- [Dosya yükleme](#dosya-yükleme)
- [Yönetim paneli](#yönetim-paneli)
- [Komutlar](#komutlar)
- [Kalite ve test durumu](#kalite-ve-test-durumu)
- [Dağıtım](#dağıtım)
- [Güvenlik](#güvenlik)
- [Bilinen sınırlamalar](#bilinen-sınırlamalar)
- [Katkı ve destek](#katkı-ve-destek)

## Öne çıkan özellikler

### CV oluşturma

- Kişisel bilgiler, profesyonel özet, iş deneyimi, eğitim, beceriler, diller, sertifikalar, projeler, ödüller, gönüllülük, yayınlar, referanslar, hobiler ve özel bölümler.
- Zod ile doğrulanan, sürümlenmiş CV içerik modeli (`schemaVersion: 3`; veritabanında `contentSchemaVersion`).
- Eski içerik biçimlerini güncel şemaya dönüştüren geriye dönük uyumluluk katmanı.
- Zustand tabanlı editör durumu ve eş zamanlı canlı HTML önizlemesi.
- Renk paleti, yazı tipi eşleşmesi, yoğunluk, ikon ve profil fotoğrafı seçenekleri.
- Node.js üzerinde `@react-pdf/renderer` ile güvenli, sunucu taraflı PDF üretimi.
- CV oluşturma, çoğaltma, güncelleme ve silme işlemleri.

### Şablon sistemi

| Şablon      | Kategori | Plan     | Kullanım amacı                         |
| ----------- | -------- | -------- | -------------------------------------- |
| Atlas ATS   | ATS      | Ücretsiz | ATS portalları ve yoğun başvurular     |
| Mono ATS    | ATS      | Ücretsiz | Mühendislik ve teknik roller           |
| Editorial   | Akademik | Ücretsiz | Araştırma, yazarlık ve kültür alanları |
| Boardroom   | Kurumsal | Premium  | Üst düzey yönetim rolleri              |
| Studio Grid | Yaratıcı | Premium  | Tasarım, ürün ve yaratıcı teknoloji    |
| Scholarly   | Akademik | Premium  | Akademi, araştırma ve fon başvuruları  |

### Hesap ve plan yönetimi

- E-posta/parola ve isteğe bağlı Google OAuth ile giriş.
- Cloudflare Turnstile doğrulaması ve giriş/kayıt hız sınırlaması.
- Ücretsiz hesaplar için UTC takvim ayı başına bir CV oluşturma hakkı.
- Premium erişim, abonelik durumu ve bitiş tarihine göre yetkilendirme.
- Stripe ve iyzico üzerinden Premium abonelik.
- Stripe ve iyzico üzerinden tek seferlik destek ödemesi.

### Yönetim ve operasyon

- Kullanıcı, CV, abonelik, bağış ve ödeme hareketi görünümü.
- Rol değiştirme, kullanıcı engelleme, Premium erişim verme/geri alma ve kota sıfırlama.
- Yönetici işlemleri için denetim kaydı.
- Bakım modu, PDF üretimi ve yeni kayıtlar için veritabanı destekli özellik bayrakları.
- Stripe ve iyzico webhook olaylarında imza doğrulaması ve idempotent işleme.
- İsteğe bağlı Valkey/Redis tabanlı dağıtık hız sınırlama.

## Teknoloji yığını

| Katman           | Teknoloji                                     |
| ---------------- | --------------------------------------------- |
| Uygulama çatısı  | Next.js 15, App Router, React 19              |
| Dil              | TypeScript 5.8, strict mode                   |
| UI               | Tailwind CSS 4, Lucide React                  |
| İstemci durumu   | Zustand, TanStack Query                       |
| API              | tRPC 11, SuperJSON, Zod                       |
| Kimlik doğrulama | Auth.js/NextAuth v5, Prisma Adapter, bcryptjs |
| Veritabanı       | Prisma 6, SQLite veya PostgreSQL              |
| PDF              | `@react-pdf/renderer`                         |
| Ödeme            | Stripe, iyzico                                |
| Dosya depolama   | UploadThing v7                                |
| Bot koruması     | Cloudflare Turnstile                          |
| Hız sınırlama    | Valkey/Redis; yoksa süreç içi bellek          |
| Kod kalitesi     | ESLint 9, typescript-eslint, Prettier         |
| Paket yöneticisi | pnpm 11.9.0                                   |

## Mimari

SadeCV tek bir Next.js uygulaması olarak istemci arayüzünü, React Server Components sayfalarını, API rotalarını ve sunucu servislerini birlikte barındırır.

```mermaid
flowchart LR
    B[Tarayıcı] --> RSC[Next.js App Router]
    B --> TRPC[/api/trpc]
    B --> PDF[/api/resumes/:id/pdf]
    B --> UP[/api/uploadthing]

    RSC --> AUTH[Auth.js]
    RSC --> CALLER[tRPC server caller]
    TRPC --> ROUTERS[tRPC router'ları]
    PDF --> PDFR[React PDF renderer]
    CALLER --> ROUTERS
    ROUTERS --> DB[(Prisma)]
    AUTH --> DB
    PDF --> DB
    UP --> UT[UploadThing]
    ROUTERS --> STRIPE[Stripe]
    ROUTERS --> IYZICO[iyzico]
    WH[/api/webhooks/checkout] --> STRIPE
    WH --> IYZICO
    WH --> DB
    ROUTERS --> RL[Valkey / bellek rate limit]
```

### İstek akışı

1. React Server Components, oturum ve ilk veriyi sunucuda alır.
2. İstemci bileşenleri tRPC HTTP batch stream bağlantısı üzerinden mutation/query çalıştırır.
3. `publicProcedure`, `protectedProcedure` ve `protectedAdminProcedure` farklı yetki seviyeleri uygular.
4. Prisma, seçilen sağlayıcıya göre SQLite veya PostgreSQL ile konuşur.
5. Ödeme dönüşleri ve webhook'lar imza/idempotency kontrollerinden sonra transaction içinde işlenir.
6. PDF rotası oturum, kaynak sahipliği, özellik bayrağı, hız sınırı ve Premium şablon erişimini tekrar doğrular.

## Proje yapısı

```text
.
├── .github/
│   ├── ISSUE_TEMPLATE/       # Hata ve özellik talebi formları
│   ├── workflows/            # GitHub Actions kalite kontrolü
│   ├── CODEOWNERS
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── prisma/
│   ├── schema.prisma         # SQLite şeması
│   └── schema.postgresql.prisma
├── public/                   # Favicon ve Open Graph görseli
├── scripts/
│   ├── generate-prisma.mjs   # Sağlayıcıya göre Prisma Client üretimi
│   └── grant-admin.mjs       # Kullanıcıya ADMIN rolü verme
├── src/
│   ├── app/                  # Sayfalar, layout'lar ve API rotaları
│   ├── lib/                  # CV veri modeli ve doğrulama
│   ├── server/
│   │   ├── api/routers/      # tRPC router'ları
│   │   ├── auth/             # Auth.js yapılandırması
│   │   ├── billing/          # Plan ve kota kuralları
│   │   ├── payments/         # Stripe/iyzico ve senkronizasyon
│   │   ├── security/         # Turnstile ve rate limit
│   │   ├── system/           # Özellik bayrakları
│   │   ├── db.ts             # Prisma bağlantısı
│   │   └── uploadthing.ts    # Dosya yükleme router'ı
│   ├── styles/               # Tailwind giriş noktası ve tema token'ları
│   ├── templates/
│   │   ├── dom/              # Canlı önizleme renderer'ları
│   │   └── pdf/              # PDF renderer'ları
│   ├── trpc/                 # React ve RSC tRPC istemcileri
│   ├── types/                # Harici paket tipleri
│   ├── utils/                # İstemci yardımcıları
│   ├── env.js                # Ortam değişkeni şeması
│   └── middleware.ts         # Auth, admin ve bakım kontrolleri
├── .env.example
├── next.config.js
├── package.json
└── pnpm-workspace.yaml
```

TypeScript path alias'ı `~/*`, `./src/*` dizinine karşılık gelir.

## Rotalar

### Kullanıcı arayüzü

| Rota                       | Erişim                         | Amaç                         |
| -------------------------- | ------------------------------ | ---------------------------- |
| `/`                        | Herkese açık                   | Ürün tanıtım sayfası         |
| `/auth/login`              | Herkese açık                   | Giriş                        |
| `/auth/register`           | Herkese açık, bayrak kontrollü | Hesap oluşturma              |
| `/auth/profile`            | Oturum gerekli                 | Profil özeti                 |
| `/auth/profile/edit`       | Oturum gerekli                 | Profil ve parola ayarları    |
| `/dash`                    | Oturum gerekli                 | CV listesi ve kota bilgisi   |
| `/dash/resumes/[resumeId]` | Oturum ve sahiplik gerekli     | CV editörü ve önizleme       |
| `/pricing`                 | Herkese açık                   | Planlar ve abonelik başlatma |
| `/pricing/success`         | Herkese açık                   | Abonelik ödeme sonucu        |
| `/support`                 | Herkese açık                   | Tek seferlik destek ödemesi  |
| `/support/success`         | Herkese açık                   | Destek ödeme sonucu          |
| `/maintenance`             | Herkese açık                   | Bakım ekranı                 |
| `/admin`                   | ADMIN                          | Platform özeti               |
| `/admin/users`             | ADMIN                          | Kullanıcı yönetimi           |
| `/admin/users/[userId]`    | ADMIN                          | Kullanıcı ayrıntısı          |
| `/admin/resumes`           | ADMIN                          | CV moderasyonu               |
| `/admin/finance`           | ADMIN                          | Finans ve webhook görünümü   |
| `/admin/settings`          | ADMIN                          | Özellik bayrakları           |

### API

| Rota                            | Metot    | Amaç                           |
| ------------------------------- | -------- | ------------------------------ |
| `/api/auth/[...nextauth]`       | GET/POST | Auth.js handler'ı              |
| `/api/trpc/[trpc]`              | GET/POST | tRPC fetch adapter             |
| `/api/resumes/[resumeId]/pdf`   | POST     | Sahiplik kontrollü PDF üretimi |
| `/api/uploadthing`              | GET/POST | UploadThing handler'ı          |
| `/api/webhooks/checkout`        | POST     | Stripe ve iyzico webhook'ları  |
| `/api/payments/iyzico/callback` | POST     | iyzico hosted checkout dönüşü  |

## Başlangıç

Aşağıdaki adımlar yalnızca lisans sahibi tarafından yazılı geliştirme veya katkı izni verilmiş kişiler içindir. Depoyu herkese açık olarak görüntüleyebilmek, kodu klonlama ya da çalıştırma hakkı vermez.

### Gereksinimler

- Node.js `24.15.0` (`.node-version` ile sabitlenir)
- pnpm `11.9.0` (`package.json#packageManager` ile sabitlenir)
- Yerel geliştirme için SQLite veya erişilebilir bir PostgreSQL veritabanı
- İsteğe bağlı entegrasyonlar için ilgili sağlayıcı hesapları

### 1. Depoyu alın

```bash
git clone https://github.com/MRsuffixx/SadeCV.git
cd SadeCV
```

### 2. pnpm'i etkinleştirin

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
```

### 3. Ortam dosyasını oluşturun

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Yerel SQLite kurulumu için örnek dosyadaki şu değerler yeterlidir:

```dotenv
DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./db.sqlite"
APP_DOMAIN="http://localhost:3000"
```

Prisma göreli SQLite yolunu şema dosyasının bulunduğu dizine göre çözer; bu ayarla veritabanı `prisma/db.sqlite` olarak oluşur.

### 4. Bağımlılıkları kurun

```bash
pnpm install
```

`postinstall`, `DATABASE_PROVIDER` değerini okuyup uygun Prisma Client'ı `generated/prisma` altında üretir.

### 5. Veritabanını hazırlayın

SQLite:

```bash
pnpm db:push
```

PostgreSQL:

```bash
pnpm db:push:postgres
```

### 6. Geliştirme sunucusunu başlatın

```bash
pnpm dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır.

## Ortam değişkenleri

Ortam şeması `src/env.js`, güvenli örnek değerler `.env.example` içinde tutulur. Boş dizeler `undefined` kabul edilir. Gerçek `.env` dosyasını veya gizli anahtarları commit etmeyin.

| Değişken                             | Zorunluluk                       | Açıklama                                                                                                            |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                        | Production'da zorunlu            | Auth.js token imzalama anahtarı                                                                                     |
| `AUTH_GOOGLE_ID`                     | İsteğe bağlı                     | Google OAuth istemci kimliği                                                                                        |
| `AUTH_GOOGLE_SECRET`                 | İsteğe bağlı                     | Google OAuth istemci sırrı                                                                                          |
| `TURNSTILE_SECRET_KEY`               | Production için gerekli          | Turnstile sunucu doğrulaması                                                                                        |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`     | Production için gerekli          | Tarayıcıdaki Turnstile widget anahtarı                                                                              |
| `DATABASE_URL`                       | Zorunlu                          | Prisma bağlantı adresi                                                                                              |
| `DATABASE_PROVIDER`                  | İsteğe bağlı                     | `sqlite` veya `postgresql`; varsayılan `sqlite`                                                                     |
| `VALKEY_URL`                         | İsteğe bağlı                     | Dağıtık hız sınırlama için Valkey/Redis URL'si                                                                      |
| `APP_DOMAIN`                         | İsteğe bağlı                     | Uygulamanın mutlak public origin'i; varsayılan `http://localhost:3000`                                              |
| `APP_PORT`                           | İsteğe bağlı                     | Env şemasındaki port değeri; varsayılan `3000`. Mevcut başlangıç scriptleri bunu Next.js'e doğrudan aktarmamaktadır |
| `UPLOADTHING_TOKEN`                  | İsteğe bağlı                     | UploadThing v7 token paketi                                                                                         |
| `STRIPE_SECRET_KEY`                  | Stripe için gerekli              | Stripe gizli API anahtarı (`sk_…`)                                                                                  |
| `STRIPE_WEBHOOK_SECRET`              | Stripe webhook için gerekli      | Webhook imza sırrı (`whsec_…`)                                                                                      |
| `STRIPE_PREMIUM_PRICE_ID`            | Stripe aboneliği için gerekli    | Premium fiyat kimliği (`price_…`)                                                                                   |
| `IYZICO_API_KEY`                     | iyzico için gerekli              | iyzico API anahtarı                                                                                                 |
| `IYZICO_SECRET_KEY`                  | iyzico için gerekli              | iyzico gizli anahtarı                                                                                               |
| `IYZICO_MERCHANT_ID`                 | iyzico webhook için gerekli      | Üye işyeri kimliği                                                                                                  |
| `IYZICO_BASE_URL`                    | iyzico için gerekli              | Sandbox veya production API kökü                                                                                    |
| `IYZICO_PREMIUM_PLAN_REFERENCE_CODE` | iyzico aboneliği için gerekli    | Premium plan referansı                                                                                              |
| `NODE_ENV`                           | Çalışma zamanı tarafından atanır | `development`, `test` veya `production`                                                                             |
| `SKIP_ENV_VALIDATION`                | Yalnızca build aracı             | Ayarlandığında env doğrulamasını atlar; production runtime'da kullanılmamalıdır                                     |

### Entegrasyonların devre dışı kalma davranışı

- Google anahtarlarından biri eksikse Google sağlayıcısı yüklenmez.
- UploadThing token'ı yoksa yükleme endpoint'i kullanılabilirlik hatası döndürür.
- Stripe/iyzico ayarları eksikse ilgili ödeme sağlayıcısı checkout için sunulmaz.
- `VALKEY_URL` yoksa rate limit süreç içi belleğe düşer; çoklu instance production dağıtımında bu yeterli değildir.

## Veritabanı

İki eşdeğer Prisma şeması bulunur:

- `prisma/schema.prisma`: SQLite
- `prisma/schema.postgresql.prisma`: PostgreSQL

`scripts/generate-prisma.mjs`, `DATABASE_PROVIDER` değerine göre doğru şemayı seçer. Desteklenmeyen bir değer build'i durdurur.

### Ana veri modelleri

| Model                 | Sorumluluk                                    |
| --------------------- | --------------------------------------------- |
| `User`                | Hesap, rol, plan, ban ve sağlayıcı kimlikleri |
| `Account` / `Session` | Auth.js hesap bağlantıları ve oturum modeli   |
| `Resume`              | Güncel CV içeriği, tema, şablon ve görünürlük |
| `ResumeVersion`       | CV snapshot'ları için ayrılmış model          |
| `UsageGrant`          | Aylık ücretsiz CV oluşturma kotası            |
| `Subscription`        | Sağlayıcı bağımsız Premium abonelik durumu    |
| `Donation`            | Tek seferlik destek ödemeleri                 |
| `PaymentEvent`        | Webhook idempotency ve işleme sonucu          |
| `PaymentTransaction`  | Birleşik finans hareketi kaydı                |
| `FeatureFlag`         | Operasyonel özellik bayrakları                |
| `AdminAuditLog`       | Yönetici işlemlerinin denetim izi             |

### Veritabanı komutları

| Komut                       | Açıklama                                         |
| --------------------------- | ------------------------------------------------ |
| `pnpm db:generate:client`   | Seçili sağlayıcı için Prisma Client üretir       |
| `pnpm db:generate`          | SQLite şemasıyla `prisma migrate dev` çalıştırır |
| `pnpm db:generate:postgres` | PostgreSQL şeması için Prisma Client üretir      |
| `pnpm db:push`              | SQLite şemasını veritabanına iter                |
| `pnpm db:push:postgres`     | PostgreSQL şemasını veritabanına iter            |
| `pnpm db:migrate`           | SQLite migration'larını deploy eder              |
| `pnpm db:migrate:postgres`  | PostgreSQL migration'larını deploy eder          |
| `pnpm db:studio`            | Prisma Studio'yu açar                            |

Şema değişikliklerinde SQLite ve PostgreSQL dosyalarını birlikte güncel tutun. Production migration dosyaları sürüm kontrolüne alınmalıdır.

## Kimlik doğrulama ve yetkilendirme

- Auth.js v5, Prisma Adapter ve JWT oturum stratejisi kullanılır.
- Credentials girişinde e-posta normalize edilir, parola bcrypt ile karşılaştırılır, Turnstile ve rate limit uygulanır.
- Google sağlayıcısı yalnızca iki OAuth değişkeni de bulunduğunda etkinleşir.
- Oturum nesnesi `id`, `tier`, `role` ve `banned` alanlarıyla genişletilir.
- Korumalı tRPC prosedürleri kullanıcı kaydını ve ban durumunu yeniden doğrular.
- Yönetim rotaları hem middleware hem sunucu prosedürleriyle `ADMIN` rolünü zorunlu tutar.
- Kullanıcı yalnızca kendisine ait CV ve dosya kaynaklarına erişebilir.

## CV modeli ve şablonlar

`src/lib/resume-model.ts`, CV içeriğinin tek doğruluk kaynağıdır. Taslak içerik ile yayına/PDF'e hazır içerik için farklı doğrulama seviyeleri bulunur.

Temel kurallar:

- İçerik nesnesi strict Zod şemasıdır.
- JSON içerik boyutu en fazla 500 KB olabilir.
- Tekrarlanabilir bölümlerde kimlikler bölüm içinde benzersiz olmalıdır.
- Tarih aralıkları ve zorunlu kişisel alanlar hazır içerik doğrulamasında kontrol edilir.
- Eski temel CV biçimleri şema sürümü 3'e dönüştürülebilir.
- DOM ve PDF çıktıları aynı şablon registry'sini ve sunum modelini kullanır.

## Ödeme entegrasyonları

### Stripe

Stripe; Premium abonelik ve tek seferlik bağış için Checkout Session oluşturur. Webhook adresi:

```text
POST /api/webhooks/checkout
```

İşlenen başlıca olaylar:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Webhook yapılandırmasında production `APP_DOMAIN` değerinizi temel alın ve `STRIPE_WEBHOOK_SECRET` değerini sağlayıcı panelinden alın.

### iyzico

iyzico; abonelik için hosted subscription checkout, destek ödemesi için hosted checkout formu kullanır. Callback adresi uygulama tarafından şu rota üzerinde oluşturulur:

```text
POST /api/payments/iyzico/callback
```

Webhook'lar Stripe ile ortak endpoint'e gelir ve `x-iyz-signature-v3` imzasıyla doğrulanır. iyzico tek seferlik ödemeleri TRY kullanır; checkout için kart sahibi kimlik, telefon ve adres alanları gerekir.

### Tutarlılık

- Webhook kimlikleri `PaymentEvent` üzerinde benzersiz tutulur.
- Tekrarlanan olaylar güvenli biçimde yutulur.
- Abonelik ve ödeme hareketleri Prisma transaction'ları içinde senkronize edilir.
- Kullanıcının FREE/PREMIUM planı aktif aboneliklerden yeniden hesaplanır.

## Dosya yükleme

UploadThing iki dosya rotası sunar:

| Rota           | Sınır                          | Davranış                                           |
| -------------- | ------------------------------ | -------------------------------------------------- |
| `profileImage` | 1 görsel, en fazla 4 MB        | Tamamlandığında `User.image` güncellenir           |
| `resumeAsset`  | 1 görsel 8 MB veya 1 PDF 16 MB | CV sahipliği doğrulanır ve dosya URL'si döndürülür |

Token olarak eski `sk_live_…` biçimi değil, UploadThing v7 token paketi kullanılmalıdır. Veritabanında dosyanın kendisi değil, dönen URL saklanır.

## Yönetim paneli

İlk yöneticiyi oluşturmak için önce normal bir kullanıcı kaydı açın, ardından:

```bash
pnpm admin:grant -- user@example.com
```

Komut kullanıcının var olmasını bekler, rolünü `ADMIN` yapar ve varsa ban bilgisini temizler.

Yönetim paneli şu operasyonları destekler:

- Platform metriklerini görüntüleme
- Kullanıcı arama ve sayfalama
- Rol, ban, not, Premium ve kota yönetimi
- CV moderasyonu ve doğrulamalı silme
- Abonelik, bağış, işlem ve webhook kaydı görüntüleme
- `MAINTENANCE_MODE`, `PDF_GENERATION` ve `REGISTRATION` bayraklarını değiştirme

Son yönetici hesabını düşürmeye veya silmeye karşı sunucu taraflı koruma bulunur.

## Komutlar

| Komut                         | Açıklama                                               |
| ----------------------------- | ------------------------------------------------------ |
| `pnpm dev`                    | Turbopack ile geliştirme sunucusu                      |
| `pnpm build`                  | Prisma Client üretir ve production build alır          |
| `pnpm start`                  | Production Next.js sunucusunu başlatır                 |
| `pnpm preview`                | Build alıp production sunucusunu başlatır              |
| `pnpm lint`                   | ESLint çalıştırır                                      |
| `pnpm lint:fix`               | Düzeltilebilir lint sorunlarını düzeltir               |
| `pnpm typecheck`              | TypeScript'i çıktı üretmeden denetler                  |
| `pnpm check`                  | ESLint ve TypeScript kontrollerini birlikte çalıştırır |
| `pnpm format:check`           | Prettier uyumluluğunu kontrol eder                     |
| `pnpm format:write`           | Desteklenen kaynak dosyalarını biçimlendirir           |
| `pnpm admin:grant -- <email>` | Var olan kullanıcıya yönetici rolü verir               |

## Kalite ve test durumu

CI şu kontrolleri çalıştırır:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

TypeScript'te `strict`, `noUncheckedIndexedAccess` ve typed ESLint kuralları etkindir.

> Projede henüz otomatik birim, entegrasyon veya uçtan uca test altyapısı bulunmamaktadır. Bu nedenle `pnpm test` komutu yoktur; mevcut CI kalite kapısı lint, typecheck ve production build kontrollerinden oluşur.

## Dağıtım

Depo belirli bir hosting sağlayıcısına bağlanmamıştır. Node.js çalıştırabilen ve kalıcı PostgreSQL erişimi sunan bir ortam kullanılmalıdır.

### Production kontrol listesi

1. `APP_DOMAIN` değerini HTTPS public origin olarak ayarlayın.
2. Güçlü bir `AUTH_SECRET` üretin.
3. `DATABASE_PROVIDER=postgresql` ve production `DATABASE_URL` kullanın.
4. Turnstile anahtarlarını yapılandırın.
5. Çoklu instance için `VALKEY_URL` tanımlayın.
6. Kullanılacak ödeme sağlayıcılarının anahtarlarını ve webhook adreslerini tanımlayın.
7. Dosya yükleme gerekiyorsa `UPLOADTHING_TOKEN` ekleyin.
8. Veritabanı migration stratejisini ve yedeklemeyi doğrulayın.
9. Kalite kontrollerini ve build'i çalıştırın.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm start
```

`SKIP_ENV_VALIDATION` yalnızca build-time secret'ların bulunmadığı kontrollü imaj derlemelerinde kullanılmalıdır. Runtime ortamında eksik yapılandırmayı gizlemek için kullanmayın.

## Güvenlik

Projede uygulanan başlıca kontroller:

- Parolalarda bcrypt ve 12 tur salt
- Cloudflare Turnstile bot koruması
- Kimlik/IP tabanlı hız sınırlama
- Ban ve rol durumunun sunucuda yeniden doğrulanması
- CV ve yükleme kaynaklarında sahiplik kontrolü
- Stripe ve iyzico webhook imza doğrulaması
- Webhook idempotency kaydı
- Admin denetim günlüğü
- Origin kontrolü ve özel/no-store PDF yanıtları
- Content Security Policy, HSTS, `nosniff`, frame engelleme ve kısıtlı Permissions Policy
- Zod ile env, form, API ve CV içerik doğrulaması

Güvenlik açığı bulursanız herkese açık issue açmayın. [SECURITY.md](./SECURITY.md) içindeki özel bildirim sürecini kullanın.

## Bilinen sınırlamalar

- Kullanıcı modelinde `locale` alanı bulunsa da arayüz ve route tabanlı i18n henüz uygulanmamıştır; mevcut UI İngilizcedir.
- Otomatik test paketi henüz yoktur.
- `ResumeVersion` modeli hazırdır ancak sürüm geçmişi arayüzü ve snapshot akışı henüz bağlı değildir.
- `isPublic` alanı ve paylaşılabilirlik seçeneği vardır; herkese açık CV görüntüleme rotası henüz bulunmamaktadır.
- Transactional e-posta sağlayıcısı entegre değildir.
- Deployment manifesti bulunmadığından Vercel, container veya başka bir hedef için platform ayarları ayrıca yapılmalıdır.

## Katkı ve destek

- Katkı süreci: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Davranış kuralları: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Güvenlik politikası: [SECURITY.md](./SECURITY.md)
- Destek kanalları: [SUPPORT.md](./SUPPORT.md)
- Değişiklik geçmişi: [CHANGELOG.md](./CHANGELOG.md)

Katkıda bulunmadan önce source-available lisansın yerel çalıştırma ve katkı istisnalarını okuyun. Bir katkı göndermek, projeyi bağımsız olarak dağıtma veya ticari kullanma hakkı vermez.
