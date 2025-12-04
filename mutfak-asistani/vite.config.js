import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', // Güncelleme gelince otomatik yenile
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mutfak Asistanı',
        short_name: 'Mutfak',
        description: 'Akıllı Kiler ve Yemek Tarifi Yönetimi',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Tarayıcı çubuğunu gizle (Tam ekran uygulama hissi)
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: './' // Netlify beyaz ekran sorunu için
})
```

### 3. ADIM: İkonları Hazırla (Çok Önemli!)

Uygulamanın telefonda ikonunun çıkması için `public` klasörüne 2 tane resim koyman lazım. Yoksa PWA çalışmaz.

1.  İnternetten veya yapay zekadan güzel bir **Mutfak/Şef logosu** bul.
2.  Bu logoyu şu isimlerle ve boyutlarla `public` klasörünün içine at:
    * **`pwa-192x192.png`** (Boyutu tam 192x192 piksel olmalı)
    * **`pwa-512x512.png`** (Boyutu tam 512x512 piksel olmalı)

*(Eğer resim ayarlamakla uğraşamam dersen, Google'dan "192x192 placeholder icon" diye aratıp geçici resimler koyabilirsin, ama gerçek bir uygulama hissi için kendi logonu koymanı öneririm.)*

### 4. ADIM: `index.html` Güncellemesi

Projenin ana dizinindeki `index.html` dosyasını aç ve `<head>` etiketinin içine şu satırları ekle (Meta etiketleri mobil uyum içindir):

```html
<head>
  <!-- Mevcut kodların altına bunları ekle -->
  <meta name="theme-color" content="#ffffff">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <link rel="apple-touch-icon" href="/pwa-192x192.png">
  <!-- ... -->
</head>