<template>
  <div class="mobile-container">

    <!-- 1. DURUM: GİRİŞ YAPILMAMIŞSA -->
    <div v-if="!session" class="login-wrapper">
      <LoginView />
    </div>

    <!-- 2. DURUM: GİRİŞ YAPILMIŞSA -->
    <div v-else class="app-layout">
      
      <!-- ÜST BAR -->
      <header class="top-bar">
        <!-- SOL: Liste Butonu (Yeni) -->
        <button 
          @click="currentView = 'alisveris'" 
          class="header-btn list-btn"
          :class="{ active: currentView === 'alisveris' }"
        >
          📝 Liste
        </button>

        <!-- SAĞ: Çıkış Butonu (Sabit) -->
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

        <!-- Tek Ayırıcı Çizgi -->
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

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
  })
})

const cikisYap = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) alert("Çıkış yapılırken hata oldu: " + error.message)
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
  overflow: hidden; /* Dış kaydırmayı engelle */
}

/* MOBİL KONTEYNER */
.mobile-container { 
  max-width: 100%; 
  min-height: 100vh; 
  background: white; 
  position: relative;
  overflow: hidden;
}

/* APP DÜZENİ */
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Ekran boyuna sabitle */
  width: 100vw;
}

/* ÜST BİLGİ ÇUBUĞU - ZIMBA GİBİ SABİT */
.top-bar {
  flex-shrink: 0; /* Asla büzüşme */
  height: 54px;   /* Sabit yükseklik */
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0 15px; 
  background: #fff; 
  border-bottom: 1px solid #eee; 
  z-index: 50;
  box-sizing: border-box;
}

/* HEADER BUTONLARI */
.header-btn {
  border: none; 
  border-radius: 8px; 
  padding: 6px 12px; 
  font-size: 12px; 
  font-weight: 700; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  gap: 5px;
  height: 32px; /* Buton yüksekliğini sabitledim, headerı şişirmez */
  transition: transform 0.1s;
}
.header-btn:active { transform: scale(0.95); }

.list-btn { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
.list-btn.active { background: #fbbf24; color: #78350f; border-color: #f59e0b; }

.logout-btn { background: #fff0f0; border: 1px solid #ffcdd2; color: #c62828; }

/* İÇERİK ALANI */
.content-area {
  flex: 1; /* Kalan boşluğu doldur */
  position: relative;
  overflow: hidden; 
  background: #f8f9fa;
}

/* ALT MENÜ TASARIMI */
.bottom-nav {
  flex-shrink: 0; /* Asla büzüşme */
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

/* Aktif Sekme */
.nav-item.active { color: #000; }
.nav-item.active .icon { filter: grayscale(0%); transform: scale(1.2); }

.divider { width: 1px; height: 30px; background: #eee; }

/* GEÇİŞ ANİMASYONU */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>