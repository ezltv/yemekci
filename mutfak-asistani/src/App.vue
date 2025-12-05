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
        <!-- SOL GRUP -->
        <div class="left-group">
          <!-- Alışveriş Listesi -->
          <button 
            @click="currentView = 'alisveris'" 
            class="header-btn magic-btn"
            :class="{ active: currentView === 'alisveris' }"
          >
            📝 Liste
          </button>
          
          <!-- TEST BUTONU (BİLDİRİM İÇİN) -->
          <button @click="testBildirim" class="header-btn test-btn" title="Bildirim Testi">
            🔔
          </button>
        </div>

        <!-- SAĞ: Çıkış Butonu -->
        <button @click="cikisYap" class="header-btn logout-btn">
          Çıkış 🚪
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

// --- BİLDİRİM SİSTEMİ (GERÇEK KONTROL) ---
const checkExpirationAndNotify = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission !== "granted") return;

  const lastCheckDate = localStorage.getItem('last_skt_notify_date');
  const todayStr = new Date().toDateString();

  if (lastCheckDate === todayStr) return; 

  const { data: urunler } = await supabase
    .from('kiler')
    .select('malzeme_adi, son_kullanma_tarihi');

  if (!urunler) return;

  let kritikUrunSayisi = 0;
  urunler.forEach(item => {
    if (!item.son_kullanma_tarihi) return;
    const skt = new Date(item.son_kullanma_tarihi);
    const bugun = new Date();
    const fark = Math.ceil((skt - bugun) / (1000 * 60 * 60 * 24));
    if (fark <= 3) kritikUrunSayisi++;
  });

  if (kritikUrunSayisi > 0) {
    try {
      new Notification("⚠️ Mutfak Asistanı", {
        body: `Dikkat! ${kritikUrunSayisi} ürünün tarihi geçmek üzere.`,
        icon: '/pwa-192x192.png',
        vibrate: [200, 100, 200]
      });
      localStorage.setItem('last_skt_notify_date', todayStr);
    } catch (e) {
      console.error("Bildirim hatası:", e);
    }
  }
}

// --- TEST BUTONU FONKSİYONU ---
const testBildirim = async () => {
  if (!("Notification" in window)) {
    alert("Cihazın bu özelliği desteklemiyor.");
    return;
  }

  // İzin iste
  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission === "granted") {
    // Hemen bildirim gönder
    new Notification("🔔 Test Başarılı!", {
      body: "Bildirim sistemin harika çalışıyor şefim! 👨‍🍳",
      icon: '/pwa-192x192.png',
      vibrate: [200, 100, 200]
    });
  } else {
    alert("Bildirim izni reddedildi. Ayarlardan açmalısın.");
  }
}

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
    if (data.session) checkExpirationAndNotify();
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
    if (_session) checkExpirationAndNotify();
  })
})

const cikisYap = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) alert("Çıkış hatası: " + error.message)
}
</script>

<style>
/* GENEL AYARLAR */
body { 
  font-family: 'Segoe UI', sans-serif; 
  background: #f8f9fa; 
  margin: 0; 
  padding: 0; 
  color: #222; 
  -webkit-tap-highlight-color: transparent;
}

/* MOBİL KONTEYNER */
.mobile-container { 
  max-width: 100%; 
  min-height: 100vh; 
  background: white; 
  position: relative;
}

.app-wrapper {
  padding-bottom: 80px; 
}

/* ÜST BİLGİ ÇUBUĞU */
.top-bar {
  display: flex;
  justify-content: space-between; 
  align-items: center;
  padding: 10px 15px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky; 
  top: 0;
  z-index: 50;
  height: 60px;
}

.left-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* HEADER BUTONLARI */
.header-btn {
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  transition: transform 0.1s;
}
.header-btn:active { transform: scale(0.95); }

/* SİHİRLİ LİSTE BUTONU */
.magic-btn {
  color: white;
  background: linear-gradient(270deg, #f59e0b, #ec4899, #8b5cf6, #f59e0b);
  background-size: 300% 300%;
  animation: colorWave 4s ease infinite;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* TEST BUTONU STİLİ */
.test-btn {
  background: #f3f4f6;
  color: #4b5563;
  padding: 0;
  width: 36px; /* Kare buton */
  justify-content: center;
  border: 1px solid #e5e7eb;
}

@keyframes colorWave {
  0% { background-position: 0% 50% }
  50% { background-position: 100% 50% }
  100% { background-position: 0% 50% }
}

.logout-btn {
  background: #fff0f0;
  border: 1px solid #ffcdd2;
  color: #c62828;
  border-radius: 6px; 
}

/* ALT MENÜ TASARIMI */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  border-top: 1px solid #eee;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
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
.nav-item.active .icon { filter: grayscale(0%); transform: scale(1.2); }

.divider { width: 1px; height: 30px; background: #eee; }

/* GEÇİŞ ANİMASYONU */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>