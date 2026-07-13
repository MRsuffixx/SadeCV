# Katkı Rehberi

SadeCV'ye katkı göndermeden önce bu rehberi, [davranış kurallarını](./CODE_OF_CONDUCT.md) ve [lisansı](./LICENSE) okuyun.

## Katkı yetkisi

Bu depo source-available olarak yayımlanır; açık kaynak değildir. Kaynak kodunu klonlamak, çalıştırmak veya değiştirmek için proje sahibinden önceden yazılı katkı izni alınması gerekir. Issue açmak için bu izin gerekmez.

Bir pull request göndermeniz, katkının SadeCV tarafından lisans koşullarında belirtilen şekilde kullanılmasına izin verdiğiniz anlamına gelir. Katkınız size ait olmalı veya onu sunma hakkına sahip olmalısınız.

## Issue açmadan önce

- Aynı konu için açık veya kapalı bir issue bulunmadığını kontrol edin.
- Güvenlik açıklarını herkese açık issue olarak bildirmeyin; [SECURITY.md](./SECURITY.md) sürecini kullanın.
- Hesap, ödeme veya kişisel veri içeren ayrıntıları issue'ya eklemeyin.
- Hata raporlarında yeniden üretme adımlarını ve ortam bilgilerini sağlayın.

## Yetkili geliştirme kurulumu

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
pnpm install
```

Ortam dosyasını oluşturun:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Yerel SQLite veritabanını hazırlayıp uygulamayı başlatın:

```bash
pnpm db:push
pnpm dev
```

## Dal ve commit düzeni

Kısa ve amacını anlatan dal adları kullanın:

- `feat/<konu>`
- `fix/<konu>`
- `docs/<konu>`
- `refactor/<konu>`
- `chore/<konu>`

Commit mesajlarında depodaki Conventional Commits düzenini izleyin:

```text
feat(resume): add a template option
fix(auth): reject banned sessions
chore(deps): update prisma
```

Her commit tek bir mantıksal değişiklik içermelidir. İlgisiz format veya refactor değişikliklerini aynı PR'a eklemeyin.

## Kod kuralları

- TypeScript strict kurallarını koruyun.
- Mevcut `~/*` path alias'ını ve yakın dosyalardaki import düzenini izleyin.
- İstemci bileşenlerini yalnızca tarayıcı API'si veya etkileşim gerektiğinde kullanın.
- API girdilerini Zod ile doğrulayın.
- Kullanıcıya ait kaynaklarda oturum, ban ve sahiplik kontrolünü sunucuda yapın.
- Yönetim işlemlerini `protectedAdminProcedure` ile koruyun ve uygun olduğunda audit log yazın.
- Gizli anahtarları, token'ları, parolaları veya kişisel verileri loglamayın.
- Ödeme ve webhook işlemlerinde imza doğrulaması, idempotency ve transaction sınırlarını koruyun.
- Prisma modeli değiştiğinde SQLite ve PostgreSQL şemalarını birlikte güncelleyin.
- Yeni environment değişkenlerini hem `src/env.js` hem `.env.example` içine ekleyin.
- Yeni bağımlılık eklemeden önce mevcut araçlarla çözülemeyeceğini doğrulayın.

## Doğrulama

PR göndermeden önce çalıştırın:

```bash
pnpm check
pnpm build
```

Projede henüz otomatik test komutu yoktur. Davranış değişikliklerinde PR açıklamasına uyguladığınız manuel doğrulama adımlarını yazın. Test altyapısı eklendiğinde yeni davranışlar uygun otomatik testlerle kapsanmalıdır.

## Pull request beklentileri

- Açıklayıcı bir başlık ve kısa değişiklik özeti kullanın.
- İlgili issue'yu bağlayın.
- Kullanıcıya görünen değişikliklerde ekran görüntüsü veya kayıt ekleyin.
- Veritabanı, environment, güvenlik, ödeme veya deployment etkisini açıkça belirtin.
- Geriye dönük uyumsuzluk ve migration adımlarını belgeleyin.
- Yalnızca amaçlanan dosyaları değiştirin.
- CI kontrollerinin tamamlanmasını bekleyin.

Bakımcı inceleme isteyebilir, değişiklik talep edebilir veya projenin yönüyle uyuşmayan katkıları reddedebilir.
