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
          class="header-btn list-btn"
          :class="{ active: currentView === 'alisveris' }"
        >
          📝 Liste
        </button>

        <!-- SAĞ: Çıkış Butonu -->
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
/* EVRENSEL SIFIRLAMA (Sorunu çözen kısım) */
* {
  box-sizing: border-box; /* Padding ekleyince genişlik artmasın */
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
  position: absolute; /* Kesin konumlandırma */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white; 
  overflow: hidden;
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* ÜST BAR */
.top-bar {
  flex-shrink: 0;
  height: 54px;
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0 15px; /* İç boşluk */
  background: #fff; 
  border-bottom: 1px solid #eee; 
  z-index: 50;
  
  /* Sağa sola taşmayı engellemek için */
  width: 100%;
}

/* HEADER BUTONLARI */
.header-btn {
  border: none; 
  border-radius: 8px; 
  padding: 0 12px; /* Sadece yanlardan boşluk */
  font-size: 12px; 
  font-weight: 700; 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  gap: 5px;
  height: 36px; /* Buton yüksekliği sabit */
  transition: transform 0.1s;
}
.header-btn:active { transform: scale(0.95); }

.list-btn { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
.list-btn.active { background: #fbbf24; color: #78350f; border-color: #f59e0b; }

.logout-btn { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }

/* İÇERİK ALANI */
.content-area {
  flex: 1; /* Kalan boşluğu doldur */
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
  
  /* Güvenli Alan ve Konumlandırma */
  padding-bottom: env(safe-area-inset-bottom);
  position: relative; /* Fixed yerine relative çünkü flex yapıda en altta */
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