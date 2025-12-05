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

      <!-- ALT MENÜ (Sadece 2 Buton: Kiler ve Şef) -->
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

/* ÜST BİLGİ ÇUBUĞU */
.top-bar {
  display: flex;
  justify-content: space-between; /* Biri sağa biri sola */
  align-items: center;
  /* DÜZELTME: Kenar boşlukları azaltıldı */
  padding: 0 6px; 
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky; /* Senin sevdiğin yapı */
  top: 0;
  z-index: 50;
  height: 60px;
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
  /* Renk Dalgalanması */
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
  border: 1px solid #ffcdd2;
  color: #c62828;
  border-radius: 6px; /* Çıkış butonu daha köşeli kalsın karışmasın */
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

/* --- GLOBAL İÇERİK GENİŞLETME --- */
/* Kiler ve Tarif sayfalarının içindeki paddingleri ezerek ekranı tam kaplamasını sağla */
.header-content, 
.scrollable-list,
.view-container .scroll-content,
.view-container .fixed-header {
  padding-left: 6px !important;
  padding-right: 6px !important;
}
</style>