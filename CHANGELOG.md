# Değişiklik Günlüğü

Bu projedeki önemli değişiklikler bu dosyada belgelenir. Biçim [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) yaklaşımını, sürümler ise [Semantic Versioning](https://semver.org/spec/v2.0.0.html) ilkelerini izler.

## [Unreleased]

### Added

- Kaynak kodu, mimari, kurulum, entegrasyonlar ve operasyonlar için kapsamlı proje belgeleri.
- Source-available lisans, katkı, güvenlik, destek ve davranış politikaları.
- GitHub issue/PR şablonları, CODEOWNERS, Dependabot ve CI iş akışı.

## [0.1.0] - 2026-07-13

### Added

- Next.js 15, React 19, TypeScript, Tailwind CSS ve tRPC tabanlı ilk uygulama.
- Auth.js ile credentials ve isteğe bağlı Google OAuth girişi.
- Cloudflare Turnstile, hız sınırlama, ban ve rol kontrolleri.
- Sürüm 3 CV içerik şeması, kapsamlı editör ve canlı önizleme.
- ATS, teknik, editorial, kurumsal, yaratıcı ve akademik CV şablonları.
- Sunucu taraflı React PDF üretimi.
- Ücretsiz aylık CV kotası ve Premium yetkilendirme sistemi.
- Stripe ve iyzico abonelik/bağış akışları.
- İmzalı ve idempotent ödeme webhook işleme.
- UploadThing ile profil ve CV varlığı yükleme.
- Kullanıcı, CV, finans ve özellik bayrağı yönetim paneli.
- Admin audit log, ödeme olayı ve birleşik transaction modelleri.
- SQLite ve PostgreSQL için paralel Prisma şemaları.
- Open Graph görseli, metadata ve global güvenlik başlıkları.

### Changed

- Dashboard ve yönetim navigasyonu responsive olacak şekilde geliştirildi.
- Prisma şemaları ve import düzeni hizalandı.
- UploadThing CSP ve yetkilendirme hata davranışları güçlendirildi.

### Fixed

- Yönetim router'ındaki TypeScript sorunları düzeltildi.
- Auth JWT tipleri ve UploadThing auth hataları sadeleştirildi.
- Ödeme transaction takibi ve checkout arayüzü iyileştirildi.

[Unreleased]: https://github.com/MRsuffixx/SadeCV/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/MRsuffixx/SadeCV/releases/tag/v0.1.0
