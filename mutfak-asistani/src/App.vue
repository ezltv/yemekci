<template>
  <div class="mobile-container">
    
    <div class="content-area">
      <Transition name="fade" mode="out-in">
        <KilerView v-if="currentView === 'kiler'" />
        <TariflerView v-else-if="currentView === 'tarifler'" />
      </Transition>
    </div>

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
</template>

<script setup>
import { ref } from 'vue'
import KilerView from './components/KilerView.vue'
import TariflerView from './components/TariflerView.vue'

const currentView = ref('kiler')
</script>

<style>
/* GENEL AYARLAR */
body { 
  font-family: 'Segoe UI', sans-serif; 
  background: #f8f9fa; 
  margin: 0; 
  padding: 0;
  color: #222; 
  -webkit-tap-highlight-color: transparent; /* Mobilde tıklama efektini düzeltir */
}

/* MOBİL KONTEYNER */
.mobile-container { 
  max-width: 100%; 
  min-height: 100vh; 
  background: white; 
  padding-bottom: 80px; /* Alt menü yüksekliği kadar boşluk */
  position: relative;
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
  padding-bottom: env(safe-area-inset-bottom); /* iPhone çizgisi için */
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