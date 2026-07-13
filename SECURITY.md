# Güvenlik Politikası

## Desteklenen sürümler

SadeCV henüz kararlı bir public sürüm yayımlamamıştır. Güvenlik düzeltmeleri yalnızca `main` dalının güncel durumu için hazırlanır. Eski commit'ler, fork'lar ve yetkisiz dağıtımlar desteklenmez.

| Sürüm | Destek |
| --- | --- |
| `main` | Destekleniyor |
| Eski commit'ler ve yetkisiz kopyalar | Desteklenmiyor |

## Güvenlik açığı bildirme

Bir güvenlik açığını herkese açık issue, pull request, discussion veya sosyal medya gönderisiyle açıklamayın.

Raporu `hello@sadecv.com` adresine, konu satırında `[SECURITY]` ifadesiyle gönderin. Raporda mümkünse şunlar bulunmalıdır:

- Etkilenen bileşen ve rota
- Açığın türü ve olası etkisi
- Yeniden üretme adımları veya kontrollü proof of concept
- Gerekli kullanıcı rolü ve ön koşullar
- Etkilenen commit veya sürüm
- Önerilen düzeltme ya da azaltma yöntemi
- Size güvenli biçimde ulaşılabilecek iletişim bilgisi

Gerçek kullanıcı verisi, tam ödeme bilgisi, parola, API anahtarı, session token veya başka bir gizli bilgiyi rapora eklemeyin. Hassas bir örnek gerekliyse sentetik veri kullanın.

## Süreç

1. Raporun alındığı mümkün olan en kısa sürede teyit edilir.
2. Bakımcılar etkiyi ve yeniden üretilebilirliği değerlendirir.
3. Gerekirse ek bilgi güvenli kanaldan istenir.
4. Düzeltme hazırlanır ve uygun bir yayın planı belirlenir.
5. Açıklama zamanı ve atıf, raporlayan kişiyle koordine edilir.

Yanıt veya düzeltme süresi için garanti verilmez; kritik ve doğrulanabilir raporlara öncelik verilir.

## Kapsam

Aşağıdaki alanlar güvenlik kapsamındadır:

- Kimlik doğrulama, oturum ve rol kontrolleri
- Kullanıcı ban ve kaynak sahipliği kontrolleri
- CV ve kişisel veri erişimi
- Admin paneli ve audit log akışları
- Stripe/iyzico checkout, callback ve webhook doğrulaması
- UploadThing yükleme yetkilendirmesi
- PDF üretimi ve origin kontrolleri
- Rate limit ve özellik bayrağı atlatmaları
- Gizli anahtarların veya environment değerlerinin açığa çıkması
- Bağımlılık kaynaklı uygulanabilir güvenlik açıkları

Şunlar kapsam dışındadır:

- Otomatik araç çıktısı dışında doğrulanmamış iddialar
- Hizmet kesintisine yol açan yük veya DoS testleri
- Sosyal mühendislik, phishing ve fiziksel saldırılar
- Üçüncü taraf sağlayıcılardaki, SadeCV entegrasyonundan bağımsız açıklar
- Yetkisiz kopya veya dağıtımlar

Test sırasında veri gizliliğine uyun, başka kullanıcıların hesaplarına erişmeyin ve hizmetin kullanılabilirliğini etkilemeyin. Yazılı izin olmadan kaynak kodunu indirip çalıştırmak lisans kapsamında değildir.
