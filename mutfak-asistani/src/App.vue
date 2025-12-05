<template>
  <div class="mobile-container">

    <!-- 1. DURUM: GİRİŞ YAPILMAMIŞSA (Login Ekranı) -->
    <div v-if="!session" class="login-wrapper">
      <LoginView />
    </div>

    <!-- 2. DURUM: GİRİŞ YAPILMIŞSA (Ana Uygulama) -->
    <div v-else class="app-wrapper">
      
      <!-- Üst Bilgi Çubuğu -->
      <header class="top-bar">
        <span class="user-info">👤 {{ session.user.email }}</span>
        <button @click="cikisYap" class="logout-btn">Çıkış Yap 🚪</button>
      </header>

      <!-- İçerik Alanı (Dinamik) -->
      <div class="content-area">
        <Transition name="fade" mode="out-in">
          <KeepAlive>
             <component :is="activeComponent" />
          </KeepAlive>
        </Transition>
      </div>

      <!-- Alt Menü (3 Butonlu) -->
      <nav class="bottom-nav">
        <!-- 1. KİLER -->
        <button 
          @click="currentView = 'kiler'" 
          class="nav-item" 
          :class="{ active: currentView === 'kiler' }"
        >
          <span class="icon">📦</span>
          <span class="label">Kiler</span>
        </button>

        <div class="divider"></div>

        <!-- 2. LİSTE (YENİ) -->
        <button 
          @click="currentView = 'alisveris'" 
          class="nav-item" 
          :class="{ active: currentView === 'alisveris' }"
        >
          <span class="icon">📝</span>
          <span class="label">Liste</span>
        </button>

        <div class="divider"></div>

        <!-- 3. ŞEF -->
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
import AlisverisView from './components/AlisverisView.vue' // Yeni dosya
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
  overflow: hidden; /* Kendi içinde scroll olan bileşenler için */
}

/* MOBİL KONTEYNER */
.mobile-container { 
  width: 100vw; 
  height: 100vh; 
  background: white; 
  position: relative;
  overflow: hidden;
}

/* APP DÜZENİ (Flex Column ile tam ekran) */
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* ÜST BİLGİ ÇUBUĞU */
.top-bar {
  flex-shrink: 0; /* Asla küçülmesin */
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 10px 15px; 
  background: #fff; 
  border-bottom: 1px solid #eee; 
  z-index: 50;
  height: 50px; /* Sabit yükseklik */
  box-sizing: border-box;
}
.user-info { font-size: 12px; color: #555; font-weight: bold; }
.logout-btn { 
  background: #fff0f0; border: 1px solid #ffcdd2; color: #c62828; 
  padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; 
}

/* İÇERİK ALANI */
.content-area {
  flex: 1; /* Kalan tüm alanı kapla */
  position: relative;
  overflow: hidden; /* İçerik taşarsa gizle (scroll içerideki bileşende) */
  background: #f8f9fa;
}

/* ALT MENÜ TASARIMI */
.bottom-nav {
  flex-shrink: 0; /* Asla küçülmesin */
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
  gap: 2px; 
  cursor: pointer; 
  color: #999; 
  transition: all 0.3s ease; 
}

/* İkon ve Yazı Boyutları (3 tane sığsın diye optimize edildi) */
.nav-item .icon { font-size: 22px; filter: grayscale(100%); transition: 0.3s; }
.nav-item .label { font-size: 10px; font-weight: 600; }

/* Aktif Sekme */
.nav-item.active { color: #000; }
.nav-item.active .icon { filter: grayscale(0%); transform: scale(1.1); }

.divider { width: 1px; height: 24px; background: #eee; }

/* GEÇİŞ ANİMASYONU */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>