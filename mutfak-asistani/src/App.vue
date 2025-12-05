<template>
  <div class="mobile-container">

    <!-- 1. DURUM: GİRİŞ YAPILMAMIŞSA -->
    <div v-if="!session" class="login-wrapper">
      <LoginView />
    </div>

    <!-- 2. DURUM: GİRİŞ YAPILMIŞSA -->
    <div v-else class="app-layout">
      
      <!-- SABİT ÜST BAR -->
      <header class="top-bar">
        <span class="user-info">👤 {{ session.user.email?.split('@')[0] }}</span>
        <button @click="cikisYap" class="logout-btn">Çıkış</button>
      </header>

      <!-- İÇERİK ALANI -->
      <main class="content-area">
        <Transition name="fade" mode="out-in">
          <KeepAlive>
            <!-- Dinamik Component Seçimi -->
            <component :is="currentComponent" />
          </KeepAlive>
        </Transition>
      </main>

      <!-- SABİT ALT MENÜ -->
      <nav class="bottom-nav">
        <button 
          @click="currentView = 'kiler'" 
          class="nav-item" 
          :class="{ active: currentView === 'kiler' }"
        >
          <span class="icon">📦</span>
          <span class="label">Kiler</span>
        </button>
        
        <div class="divider"></div>

        <!-- YENİ: ALIŞVERİŞ LİSTESİ BUTONU -->
        <button 
          @click="currentView = 'alisveris'" 
          class="nav-item" 
          :class="{ active: currentView === 'alisveris' }"
        >
          <span class="icon">📝</span>
          <span class="label">Liste</span>
        </button>

        <div class="divider"></div>

        <button 
          @click="currentView = 'tarifler'" 
          class="nav-item" 
          :class="{ active: currentView === 'tarifler' }"
        >
          <span class="icon">👨‍🍳</span>
          <span class="label">Şef</span>
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
import AlisverisView from './components/AlisverisView.vue' // YENİ
import LoginView from './components/LoginView.vue'

const currentView = ref('kiler')
const session = ref(null)

// View'a göre component seçimi
const currentComponent = computed(() => {
  if (currentView.value === 'kiler') return KilerView
  if (currentView.value === 'tarifler') return TariflerView
  if (currentView.value === 'alisveris') return AlisverisView // YENİ
  return KilerView
})

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => session.value = data.session)
  supabase.auth.onAuthStateChange((_, _session) => session.value = _session)
})

const cikisYap = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) alert(error.message)
}
</script>

<style>
/* GENEL RESET */
body { 
  margin: 0; padding: 0; 
  background: #fff; 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden; 
}

/* ANA DÜZEN */
.mobile-container {
  height: 100vh; width: 100vw; overflow: hidden;
}

.app-layout {
  display: flex; flex-direction: column; height: 100%;
}

/* ÜST BAR */
.top-bar {
  flex-shrink: 0; height: 50px;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 15px; background: white; border-bottom: 1px solid #f0f0f0; z-index: 20;
}
.user-info { font-weight: 700; font-size: 13px; color: #333; }
.logout-btn { background: #fee2e2; color: #ef4444; border:none; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;}

/* İÇERİK ALANI */
.content-area {
  flex: 1; position: relative; overflow: hidden; background: #f8f9fa;
}

/* ALT MENÜ */
.bottom-nav {
  flex-shrink: 0; height: 70px; padding-bottom: env(safe-area-inset-bottom);
  background: white; border-top: 1px solid #eee;
  display: flex; justify-content: space-around; align-items: center; z-index: 20;
}

.nav-item { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 2px; color: #aaa; cursor: pointer; flex: 1; }
.nav-item.active { color: #000; }
.nav-item .icon { font-size: 22px; filter: grayscale(1); transition: transform 0.2s; }
.nav-item.active .icon { filter: grayscale(0); transform: scale(1.2); }
.nav-item .label { font-size: 10px; font-weight: 700; }

.divider { width: 1px; height: 24px; background: #eee; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>