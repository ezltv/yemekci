<template>
  <div class="mobile-container">

    <!-- 1. DURUM: GİRİŞ YAPILMAMIŞSA -->
    <div v-if="!session" class="login-wrapper">
      <LoginView />
    </div>

    <!-- 2. DURUM: GİRİŞ YAPILMIŞSA -->
    <div v-else class="app-layout">
      
      <!-- ÜST BAR: Sol: Liste, Sağ: Çıkış -->
      <header class="top-bar">
        <!-- SOL: Liste Butonu -->
        <button 
          @click="currentView = 'alisveris'" 
          class="header-btn magic-btn"
          :class="{ active: currentView === 'alisveris' }"
        >
          📝 Alışveriş Listesi
        </button>

        <!-- SAĞ: Çıkış Butonu -->
        <button @click="cikisYap" class="header-btn logout-btn">
          Çıkış Yap 🚪
        </button>
      </header>

      <!-- İÇERİK ALANI -->
      <div class="content-area">
        <Transition name="fade" mode="out-in">
          <KeepAlive>
            <component :is="activeComponent" />
          </KeepAlive>
        </Transition>
      </div>

      <!-- ALT MENÜ (Sadece 2 Buton) -->
      <nav class="bottom-nav">
        <button 
          @click="currentView = 'kiler'" 
          class="nav-item" 
          :class="{ active: currentView === 'kiler' }"
        >
          <span class="icon">📦</span>
          <span class="label">Kilerim</span>
        </button>

        <div class="divider"></div>

        <button 
          @click="currentView = 'tarifler'" 
          class="nav-item" 
          :class="{ active: currentView === 'tarifler' }"
        >
          <span class="icon">👨‍🍳</span>
          <span class="label">Şefin Menüsü</span>
        </button>
      </nav>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from './supabase'
import KilerView from './components/KilerView.vue'
import TariflerView from './components/TariflerView.vue'
import AlisverisView from './components/AlisverisView.vue'
import LoginView from './components/LoginView.vue'

const currentView = ref('kiler')
const session = ref(null)

const activeComponent = computed(() => {
  if (currentView.value === 'kiler') return KilerView
  if (currentView.value === 'tarifler') return TariflerView
  if (currentView.value === 'alisveris') return AlisverisView
  return KilerView
})

// --- BİLDİRİM SİSTEMİ (NATIVE WEB NOTIFICATION) ---
// OneSignal olmadan, tarayıcının kendi özelliğiyle çalışır.
const checkExpirationAndNotify = async () => {
  // Tarayıcı desteği yoksa çık
  if (!("Notification" in window)) return;

  // İzin yoksa iste
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  // İzin verilmediyse zorlama
  if (Notification.permission !== "granted") return;

  // Günde 1 kez kontrol etme mantığı
  const lastCheckDate = localStorage.getItem('last_skt_notify_date');
  const todayStr = new Date().toDateString();

  // Eğer bugün zaten bildirim attıysak tekrar rahatsız etme
  if (lastCheckDate === todayStr) return; 

  // Veritabanından SKT'leri çek
  const { data: urunler } = await supabase
    .from('kiler')
    .select('malzeme_adi, son_kullanma_tarihi');

  if (!urunler) return;

  let kritikUrunSayisi = 0;

  urunler.forEach(item => {
    if (!item.son_kullanma_tarihi) return;
    
    const skt = new Date(item.son_kullanma_tarihi);
    const bugun = new Date();
    // Farkı gün cinsinden hesapla (milisaniye -> gün)
    const fark = Math.ceil((skt - bugun) / (1000 * 60 * 60 * 24));

    // 3 gün ve daha az kalanlar (veya tarihi geçmiş olanlar)
    if (fark <= 3) {
      kritikUrunSayisi++;
    }
  });

  // Eğer kritik ürün varsa BİLDİRİM GÖNDER
  if (kritikUrunSayisi > 0) {
    try {
      // Tarayıcı/Telefon bildirimi oluştur
      new Notification("⚠️ Mutfak Asistanı Uyarısı", {
        body: `Dikkat! ${kritikUrunSayisi} ürünün tarihi geçmek üzere veya geçti. Hemen kontrol et! 🧐`,
        icon: '/pwa-192x192.png', // Uygulama ikonu
        vibrate: [200, 100, 200] // Titreşim (Android için)
      });
      
      // Bugün bildirim gönderildiğini kaydet
      localStorage.setItem('last_skt_notify_date', todayStr);
    } catch (e) {
      console.error("Bildirim gönderilemedi:", e);
    }
  }
}

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
    // Oturum açılınca bildirimleri kontrol et
    if (data.session) checkExpirationAndNotify();
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
    // Giriş yapıldığında da kontrol et
    if (_session) checkExpirationAndNotify();
  })
})

const cikisYap = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) alert("Çıkış hatası: " + error.message)
}
</script>

<style>
/* EVRENSEL SIFIRLAMA (Kaymaları Önler) */
* {
  box-sizing: border-box; 
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body { 
  font-family: 'Segoe UI', sans-serif; 
  background: #f8f9fa; 
  overflow: hidden; /* Sayfa kaymasını engelle */
  width: 100%;
  height: 100%;
}

/* MOBİL KONTEYNER */
.mobile-container { 
  position: absolute; 
  top: 0; left: 0; right: 0; bottom: 0;
  background: white; 
  overflow: hidden;
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* ÜST BAR (SABİT) */
.top-bar {
  flex-shrink: 0;
  height: 54px;
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0 15px; 
  background: #fff; 
  border-bottom: 1px solid #eee; 
  z-index: 50;
  width: 100%;
}

/* HEADER BUTONLARI */
.header-btn {
  border: none; 
  border-radius: 8px; 
  padding: 0 12px; 
  font-size: 12px; 
  font-weight: 700; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  gap: 5px;
  height: 36px;
  transition: transform 0.1s;
}
.header-btn:active { transform: scale(0.95); }

/* Renkli Liste Butonu */
.magic-btn {
  color: white;
  background: linear-gradient(270deg, #f59e0b, #ec4899, #8b5cf6, #f59e0b);
  background-size: 300% 300%;
  animation: colorWave 4s ease infinite;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

@keyframes colorWave {
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
}

.logout-btn { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }

/* İÇERİK ALANI */
.content-area {
  flex: 1; 
  position: relative;
  overflow: hidden; 
  background: #f8f9fa;
  width: 100%;
}

/* ALT MENÜ TASARIMI */
.bottom-nav {
  flex-shrink: 0;
  height: 70px; 
  background: white; 
  display: flex; 
  justify-content: space-around; 
  align-items: center; 
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05); 
  border-top: 1px solid #eee; 
  z-index: 1000; 
  padding-bottom: env(safe-area-inset-bottom);
  position: relative; 
  width: 100%;
}

.nav-item { 
  flex: 1; 
  border: none; 
  background: none; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  gap: 4px; 
  cursor: pointer; 
  color: #999; 
  transition: all 0.3s ease; 
}

.nav-item .icon { font-size: 24px; filter: grayscale(100%); transition: 0.3s; }
.nav-item .label { font-size: 11px; font-weight: 600; }

.nav-item.active { color: #000; }
.nav-item.active .icon { filter: grayscale(0%); transform: scale(1.1); }

.divider { width: 1px; height: 30px; background: #eee; }

/* GEÇİŞ ANİMASYONU */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>