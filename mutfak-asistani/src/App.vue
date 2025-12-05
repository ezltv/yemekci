<template>
  <div class="mobile-container">

    <!-- 1. DURUM: GİRİŞ YAPILMAMIŞSA -->
    <div v-if="!session" class="login-wrapper">
      <LoginView />
    </div>

    <!-- 2. DURUM: GİRİŞ YAPILMIŞSA -->
    <div v-else class="app-layout">
      
      <!-- ÜST BAR (SABİT) -->
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
        <button @click="cikisYap" class="logout-btn">Çıkış Yap 🚪</button>
      </header>

      <!-- İÇERİK ALANI (ORTA KISIM) -->
      <main class="content-area">
        <Transition name="fade" mode="out-in">
          <KeepAlive>
            <component :is="activeComponent" />
          </KeepAlive>
        </Transition>
      </main>

      <!-- ALT MENÜ (SABİT) -->
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
  if (error) alert("Çıkış hatası: " + error.message)
}
</script>

<style>
/* SIFIRLAMA */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body, html {
  width: 100%;
  height: 100%;
  overflow: hidden; /* Sayfa kaymasını engelle */
  background: #f8f9fa;
  font-family: 'Segoe UI', sans-serif;
}

/* MOBİL KONTEYNER */
.mobile-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: white;
  overflow: hidden;
}

/* ÜST BAR (FIXED - ZIMBA GİBİ) */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  background: #fff;
  border-bottom: 1px solid #eee;
  z-index: 100; /* En üstte */
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

/* İÇERİK ALANI (ARADA KALAN BÖLÜM) */
.content-area {
  position: absolute;
  top: 60px;    /* Header yüksekliği kadar aşağıdan başla */
  bottom: 70px; /* Footer yüksekliği kadar yukarıda bitir */
  left: 0;
  right: 0;
  overflow: hidden; /* İçerik taşarsa scroll kendi içinde olsun */
  background: #f8f9fa;
  width: 100%;
}

/* ALT MENÜ (FIXED - ZIMBA GİBİ) */
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
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

/* BUTON STİLLERİ */
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

/* Sihirli Buton */
.magic-btn {
  border-radius: 20px;
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

.logout-btn {
  background: #fff0f0;
  color: #ef4444;
  border: 1px solid #fecaca;
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

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>