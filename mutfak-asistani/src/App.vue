<template>
  <div class="mobile-container">

    <!-- 1. DURUM: GİRİŞ YAPILMAMIŞSA (Login Ekranı) -->
    <div v-if="!session" class="login-wrapper">
      <LoginView />
    </div>

    <!-- 2. DURUM: GİRİŞ YAPILMIŞSA (Ana Uygulama) -->
    <div v-else class="app-wrapper">
      
      <!-- Üst Bilgi Çubuğu (Email ve Çıkış) -->
      <header class="top-bar">
        <span class="user-info">👤 {{ session.user.email }}</span>
        <button @click="cikisYap" class="logout-btn">Çıkış Yap 🚪</button>
      </header>

      <!-- İçerik Alanı -->
      <div class="content-area">
        <Transition name="fade" mode="out-in">
          <KilerView v-if="currentView === 'kiler'" />
          <TariflerView v-else-if="currentView === 'tarifler'" />
        </Transition>
      </div>

      <!-- Alt Menü -->
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
import { ref, onMounted } from 'vue'
import { supabase } from './supabase'
import KilerView from './components/KilerView.vue'
import TariflerView from './components/TariflerView.vue'
import LoginView from './components/LoginView.vue'

const currentView = ref('kiler')
const session = ref(null)

onMounted(() => {
  // 1. Sayfa ilk açıldığında oturum kontrolü
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  // 2. Oturum durumunu dinle (Giriş veya Çıkış anında tetiklenir)
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
}

/* MOBİL KONTEYNER */
.mobile-container { 
  max-width: 100%; 
  min-height: 100vh; 
  background: white; 
  position: relative;
}

/* GİRİŞ YAPILINCAKİ DÜZEN (Padding ekleyerek alt menüye yer açıyoruz) */
.app-wrapper {
  padding-bottom: 80px; 
}

/* ÜST BİLGİ ÇUBUĞU (YENİ) */
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
}
.user-info {
  font-size: 12px;
  color: #555;
  font-weight: bold;
}
.logout-btn {
  background: #fff0f0;
  border: 1px solid #ffcdd2;
  color: #c62828;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
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

/* Aktif Sekme */
.nav-item.active { color: #000; }
.nav-item.active .icon { filter: grayscale(0%); transform: scale(1.2); }

.divider { width: 1px; height: 30px; background: #eee; }

/* GEÇİŞ ANİMASYONU */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>