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
        <!-- SOL: Alışveriş Listesi Butonu -->
        <button 
          @click="currentView = 'alisveris'" 
          class="header-btn list-btn"
          :class="{ active: currentView === 'alisveris' }"
        >
          📝 Liste
        </button>

        <!-- SAĞ: Çıkış Butonu (Yeri Sabit) -->
        <button @click="cikisYap" class="header-btn logout-btn">
          Çıkış 🚪
        </button>
      </header>

      <!-- İÇERİK ALANI -->
      <main class="content-area">
        <Transition name="fade" mode="out-in">
          <KeepAlive>
            <component :is="activeComponent" />
          </KeepAlive>
        </Transition>
      </main>

      <!-- ALT MENÜ (Sadece 2 Buton: Kiler ve Şef - Ferah Düzen) -->
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
/* GENEL AYARLAR */
body { 
  font-family: 'Segoe UI', sans-serif; 
  background: #f8f9fa; margin: 0; padding: 0; color: #222; 
  -webkit-tap-highlight-color: transparent; overflow: hidden; 
}

/* MOBİL KONTEYNER */
.mobile-container { 
  width: 100vw; height: 100vh; background: white; 
  position: relative; overflow: hidden;
}

.app-layout { display: flex; flex-direction: column; height: 100%; width: 100%; }

/* ÜST BAR DÜZENİ (ZIMBA GİBİ SABİT) */
.top-bar {
  flex-shrink: 0; height: 60px; 
  display: flex; justify-content: space-between; /* Biri en sola, biri en sağa */
  align-items: center; 
  padding: 0 15px; background: white; border-bottom: 1px solid #f0f0f0; 
  z-index: 50; box-sizing: border-box;
}

/* HEADER BUTONLARI */
.header-btn {
  border: none; border-radius: 8px; padding: 8px 12px; 
  font-size: 13px; font-weight: 600; cursor: pointer; 
  display: flex; align-items: center; gap: 6px; transition: transform 0.1s;
  height: 36px; /* Yükseklik sabitlendi, kaymayı önler */
}
.header-btn:active { transform: scale(0.95); }

.list-btn { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
.list-btn.active { background: #fcd34d; color: #78350f; border-color: #f59e0b; }

.logout-btn { background: #fee2e2; color: #ef4444; }

/* İÇERİK ALANI */
.content-area {
  flex: 1; position: relative; overflow: hidden; background: #f8f9fa;
}

/* ALT MENÜ */
.bottom-nav {
  flex-shrink: 0; height: 70px; 
  background: white; display: flex; justify-content: space-around; 
  align-items: center; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); 
  border-top: 1px solid #eee; z-index: 1000; 
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item { 
  flex: 1; border: none; background: none; 
  display: flex; flex-direction: column; align-items: center; 
  justify-content: center; gap: 4px; cursor: pointer; color: #999; 
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