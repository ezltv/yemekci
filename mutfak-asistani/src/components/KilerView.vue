<template>
  <div class="kiler-layout">
    
    <!-- 1. SABİT BÖLÜM: Form ve Filtreler -->
    <div class="fixed-section">
      <!-- Hızlı Ekleme Alanı -->
      <div class="quick-add-box">
        <h3 class="section-title">Hızlı Ekle</h3>
        <div class="input-row">
          <input 
            v-model="yeniUrun.ad" 
            placeholder="Ürün adı (örn: Süt)" 
            class="main-input"
            @keyup.enter="urunEkle"
          />
          <button @click="urunEkle" class="add-btn">
            <span v-if="loading">⏳</span>
            <span v-else>+</span>
          </button>
        </div>
        
        <!-- Detaylar (Toggle ile açılabilir veya hep açık olabilir, basit tuttum) -->
        <div class="details-row">
          <select v-model="yeniUrun.konum" class="sub-input">
            <option v-for="yer in depoYerleri" :key="yer" :value="yer">{{ yer }}</option>
          </select>
          <div class="qty-group">
            <input v-model="yeniUrun.miktar" type="number" class="qty-input" placeholder="1">
            <select v-model="yeniUrun.birim" class="unit-input">
              <option value="adet">Adet</option>
              <option value="kg">Kg</option>
              <option value="gr">Gr</option>
              <option value="lt">Lt</option>
              <option value="paket">Paket</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Kategori Filtreleri (Yatay Kaydırma) -->
      <div class="filters-scroll">
        <button 
          v-for="filtre in filtreSecenekleri" 
          :key="filtre"
          @click="aktifFiltre = filtre"
          class="filter-chip"
          :class="{ active: aktifFiltre === filtre }"
        >
          {{ filtre }}
        </button>
      </div>
    </div>

    <!-- 2. KAYAN BÖLÜM: Ürün Listesi -->
    <div class="scroll-section">
      <div v-if="filtrelenmisListe.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>Bu rafta ürün yok.</p>
      </div>

      <div 
        v-else
        v-for="urun in filtrelenmisListe" 
        :key="urun.id" 
        class="product-card"
      >
        <div class="card-left">
          <div class="product-icon">{{ getEmoji(urun.malzeme_adi) }}</div>
          <div class="product-info">
            <div class="product-name">{{ urun.malzeme_adi }}</div>
            <div class="product-meta">
              <span class="location-tag">{{ urun.depo_yer }}</span>
            </div>
          </div>
        </div>
        
        <div class="card-right">
          <div class="qty-badge">
            {{ urun.miktar }} {{ urun.birim }}
          </div>
          <button @click="urunSil(urun.id)" class="delete-btn">🗑️</button>
        </div>
      </div>
      
      <!-- Listenin altı navigasyon altında kalmasın diye boşluk -->
      <div class="spacer"></div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'

// Veriler
const kilerListesi = ref([])
const loading = ref(false)
const aktifFiltre = ref('Hepsi')

const depoYerleri = ["Buzdolabı", "Kiler", "Balkon", "Banyo", "Diğer"]
const filtreSecenekleri = ["Hepsi", "Buzdolabı", "Kiler", "Balkon", "Diğer"]

const yeniUrun = ref({
  ad: '',
  konum: 'Buzdolabı',
  miktar: 1,
  birim: 'adet'
})

// Fonksiyonlar
const getEmoji = (ad) => {
  if(!ad) return '📦';
  ad = ad.toLowerCase();
  if(ad.includes('süt')) return '🥛';
  if(ad.includes('yumurta')) return '🥚';
  if(ad.includes('ekmek')) return '🍞';
  if(ad.includes('domates')) return '🍅';
  if(ad.includes('peynir')) return '🧀';
  return '📦';
}

const listeyiGetir = async () => {
  const { data, error } = await supabase.from('kiler').select('*').order('created_at', { ascending: false })
  if(data) kilerListesi.value = data
}

const urunEkle = async () => {
  if(!yeniUrun.value.ad) return;
  loading.value = true;
  
  const { error } = await supabase.from('kiler').insert({
    malzeme_adi: yeniUrun.value.ad,
    depo_yer: yeniUrun.value.konum,
    miktar: yeniUrun.value.miktar,
    birim: yeniUrun.value.birim
  })
  
  if(!error) {
    yeniUrun.value.ad = '';
    yeniUrun.value.miktar = 1;
    listeyiGetir();
  }
  loading.value = false;
}

const urunSil = async (id) => {
  if(!confirm('Silinsin mi?')) return;
  await supabase.from('kiler').delete().eq('id', id)
  listeyiGetir();
}

const filtrelenmisListe = computed(() => {
  if(aktifFiltre.value === 'Hepsi') return kilerListesi.value;
  return kilerListesi.value.filter(u => u.depo_yer === aktifFiltre.value);
})

onMounted(() => {
  listeyiGetir()
})
</script>

<style scoped>
/* SAYFA YAPISI */
.kiler-layout {
  display: flex;
  flex-direction: column;
  height: 100%; /* Parent'ın (content-area) tamamını kapla */
  background: #f8f9fa;
  overflow: hidden; /* Dışarı taşmayı engelle */
}

/* 1. SABİT KISIM STİLLERİ */
.fixed-section {
  flex-shrink: 0; /* Asla küçülme */
  background: white;
  padding: 15px;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  z-index: 10;
}

.section-title { margin: 0 0 10px 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }

.input-row { display: flex; gap: 10px; margin-bottom: 10px; }
.main-input {
  flex: 1;
  padding: 12px;
  background: #f0f2f5;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
}
.add-btn {
  width: 50px;
  background: #222;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 24px;
  cursor: pointer;
}

.details-row { display: flex; gap: 8px; }
.sub-input, .qty-input, .unit-input {
  padding: 8px;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 13px;
  color: #555;
}
.sub-input { flex: 2; }
.qty-group { flex: 3; display: flex; gap: 5px; }
.qty-input { width: 50px; text-align: center; }
.unit-input { flex: 1; }

/* Filtreler */
.filters-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto; /* Yatay scroll SADECE burada */
  padding-bottom: 5px;
  margin-top: 10px;
  /* Scrollbar gizleme */
  -ms-overflow-style: none;  
  scrollbar-width: none;  
}
.filters-scroll::-webkit-scrollbar { display: none; }

.filter-chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid #eee;
  background: white;
  font-size: 13px;
  white-space: nowrap; /* Metin taşmasın */
  color: #666;
}
.filter-chip.active {
  background: #222;
  color: white;
  border-color: #222;
}

/* 2. KAYAN KISIM STİLLERİ */
.scroll-section {
  flex: 1; /* Kalan tüm alanı kapla */
  overflow-y: auto; /* Dikey scroll SADECE burada */
  overflow-x: hidden; /* Yatay scrollu engelle */
  padding: 15px;
  /* Mobile momentum scroll */
  -webkit-overflow-scrolling: touch;
}

.product-card {
  background: white;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.card-left { display: flex; gap: 12px; align-items: center; min-width: 0; }
.product-icon { font-size: 24px; background: #f8f9fa; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
.product-info { min-width: 0; }
.product-name { font-weight: 700; font-size: 15px; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.location-tag { font-size: 11px; background: #eef2ff; color: #4f46e5; padding: 2px 6px; border-radius: 4px; font-weight: 600; }

.card-right { display: flex; align-items: center; gap: 10px; }
.qty-badge { font-weight: 700; font-size: 14px; color: #444; }
.delete-btn { background: #fff5f5; color: #e00; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }

.empty-state { text-align: center; margin-top: 50px; color: #ccc; }
.empty-icon { font-size: 40px; display: block; margin-bottom: 10px; filter: grayscale(1); opacity: 0.5; }

.spacer { height: 20px; }
</style>