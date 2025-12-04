<template>
  <div class="kiler-container">
    
    <!-- 1. SABİT ÜST KISIM (EKLEME FORMU) -->
    <div class="sticky-header">
      <div class="header-content">
        <h3 class="mini-title">Hızlı Ürün Ekle</h3>
        
        <!-- İsim ve AI Butonu Satırı -->
        <div class="form-row">
          <div class="input-with-btn">
            <input 
              v-model="yeniMalzeme.ad" 
              placeholder="Ürün adı (Örn: Süt)" 
              class="main-input"
              @keyup.enter="malzemeEkle"
            />
            <button @click="aiResimUret" class="ai-btn" :disabled="aiLoading" title="AI Resim Üret">
              {{ aiLoading ? '⏳' : '🎨' }}
            </button>
          </div>
        </div>

        <!-- Konum ve Miktar Satırı -->
        <div class="form-row">
          <select v-model="yeniMalzeme.konum" class="sub-input location-select">
            <option v-for="yer in depoYerleri" :key="yer" :value="yer">{{ yer }}</option>
          </select>
          
          <!-- Hesaplamalı Miktar (Paket x Ağırlık) -->
          <div class="calc-group">
            <input v-model="yeniMalzeme.paketSayisi" type="number" class="qty-input" placeholder="1">
            <span class="x-sign">✖</span>
            <input v-model="yeniMalzeme.paketAgirligi" type="number" class="qty-input" placeholder="1">
          </div>
        </div>

        <!-- Birim, SKT ve Ekle Butonu Satırı -->
        <div class="form-row">
          <select v-model="yeniMalzeme.birim" class="sub-input unit-select">
            <option value="adet">Adet</option>
            <option value="kg">Kg</option>
            <option value="gr">Gr</option>
            <option value="litre">Lt</option>
            <option value="paket">Paket</option>
            <option value="kavanoz">Kavanoz</option>
          </select>
          
          <input v-model="yeniMalzeme.skt" type="date" class="sub-input date-input">
          
          <button @click="malzemeEkle" class="add-btn">
            Ekle ({{ toplamStokHesapla }})
          </button>
        </div>

        <!-- YENİ: AÇILIR MENÜ FİLTRE (Sağa sola kaymayı engeller) -->
        <div class="filter-row">
          <label class="filter-label">🔍 Konum Filtresi:</label>
          <select v-model="seciliKonumFiltresi" class="filter-select">
            <option value="Hepsi">🏠 Tümü</option>
            <option v-for="yer in filtreSecenekleri" :key="yer" :value="yer">{{ yer }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 2. KAYDIRILABİLİR LİSTE ALANI -->
    <div class="scrollable-list">
      <div v-if="loading" class="loading-state">Yükleniyor...</div>
      
      <div v-else-if="siraliVeFiltreliListe.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Bu rafta ürün yok.</p>
      </div>

      <div v-else class="product-grid">
        <div 
          v-for="item in siraliVeFiltreliListe" 
          :key="item.id" 
          class="product-card"
          :class="{ 'kritik': stokAzMi(item), 'bayat': sktGectiMi(item.son_kullanma_tarihi) }"
        >
          <!-- Sol: Resim ve Bilgi -->
          <div class="card-left">
            <div class="img-box">
              <img 
                :src="item.resim_url || 'https://placehold.co/100x100?text=📦'" 
                @error="$event.target.src='https://placehold.co/100x100?text=📦'"
                class="product-img"
              />
              <span v-if="sktGectiMi(item.son_kullanma_tarihi)" class="expire-badge">SKT!</span>
            </div>
            <div class="info-col">
              <div class="p-name">{{ item.malzeme_adi }}</div>
              <div class="p-loc">{{ item.depo_yer }}</div>
              <div class="p-qty" :class="{'low-stock': stokAzMi(item)}">
                {{ item.miktar }} {{ item.birim }}
                <span v-if="stokAzMi(item)" class="alert-icon">⚠️</span>
              </div>
            </div>
          </div>

          <!-- Sağ: Aksiyon Butonları -->
          <div class="card-actions">
            <!-- YENİ: EKSİLTME BUTONU -->
            <button @click="stokEksilt(item)" class="action-btn decrease-btn">➖</button>
            <button @click="malzemeSil(item.id)" class="action-btn del-btn">🗑️</button>
          </div>
        </div>
      </div>
      
      <!-- Listenin en altı rahat görünsün diye boşluk -->
      <div class="bottom-spacer"></div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase' 

// --- STATE ---
const kiler = ref([])
const loading = ref(true)
const aiLoading = ref(false)
const seciliKonumFiltresi = ref("Hepsi")

const depoYerleri = [
  "Buzdolabı Üst Raf", "Buzdolabı Ara Raf", "Buzdolabı Alt Raf", 
  "Buzdolabı Kapak", "Buzdolabı Sebzelik",
  "Kiler", "Balkondolap", "Ezeldolap", "Yatakdolap", "Banyo", "Ivırzıvır"
]

const filtreSecenekleri = [
  "Buzdolabı", "Kiler", "Balkondolap", "Ezeldolap", "Yatakdolap", "Banyo", "Ivırzıvır"
]

const yeniMalzeme = ref({ 
  ad: '', 
  konum: 'Kiler', 
  paketSayisi: 1, 
  paketAgirligi: 1, 
  birim: 'adet', 
  skt: '', 
  resim: '' 
})

// --- COMPUTED ---
const toplamStokHesapla = computed(() => {
  return yeniMalzeme.value.paketSayisi * yeniMalzeme.value.paketAgirligi
})

const siraliVeFiltreliListe = computed(() => {
  let liste = kiler.value

  if (seciliKonumFiltresi.value !== 'Hepsi') {
    if (seciliKonumFiltresi.value === 'Buzdolabı') {
      liste = liste.filter(i => i.depo_yer && i.depo_yer.includes('Buzdolabı'))
    } else {
      liste = liste.filter(i => i.depo_yer === seciliKonumFiltresi.value)
    }
  }

  // Sıralama
  return liste.sort((a, b) => {
    const aKritik = stokAzMi(a)
    const bKritik = stokAzMi(b)
    if (aKritik && !bKritik) return -1
    if (!aKritik && bKritik) return 1
    return 0
  })
})

// --- FONKSİYONLAR ---
async function getKiler() {
  loading.value = true
  const { data, error } = await supabase.from('kiler').select('*').order('created_at', { ascending: false })
  if (data) kiler.value = data
  loading.value = false
}

// AI Resim Üretme
async function aiResimUret() {
  if(!yeniMalzeme.value.ad) { alert("Önce ürün adını yazmalısın!"); return; }
  aiLoading.value = true
  
  const arananKelime = yeniMalzeme.value.ad.toLowerCase().trim()
  const trToEn = { 'domates': 'tomato', 'biber': 'pepper', 'süt': 'milk', 'yumurta': 'egg', 'deterjan': 'detergent', 'salça': 'tomato paste', 'pirinç': 'rice', 'mercimek': 'lentils', 'makarna': 'pasta', 'ekmek': 'bread', 'yoğurt': 'yogurt', 'peynir': 'cheese', 'yağ': 'oil' } 
  const ingilizceIsim = trToEn[arananKelime] || arananKelime
  
  const prompt = `${ingilizceIsim} product photography, sharp focus, highly detailed, realistic white background, studio lighting, 8k`
  const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=300&height=300&nologo=true`
  
  await new Promise(r => setTimeout(r, 800))
  yeniMalzeme.value.resim = aiUrl
  aiLoading.value = false
}

async function malzemeEkle() {
  if (!yeniMalzeme.value.ad) return alert("İsim yazmalısın!")
  
  if (!yeniMalzeme.value.resim) {
    await aiResimUret()
  }

  const { error } = await supabase.from('kiler').insert({
    malzeme_adi: yeniMalzeme.value.ad,
    miktar: toplamStokHesapla.value, 
    birim: yeniMalzeme.value.birim,
    son_kullanma_tarihi: yeniMalzeme.value.skt || null,
    resim_url: yeniMalzeme.value.resim,
    depo_yer: yeniMalzeme.value.konum
  })
  
  if (!error) {
    const eskiKonum = yeniMalzeme.value.konum
    yeniMalzeme.value = { ad: '', paketSayisi: 1, paketAgirligi: 1, birim: 'adet', skt: '', resim: '', konum: eskiKonum }
    getKiler()
  } else { 
    alert("Hata: " + error.message) 
  }
}

// YENİ: STOK EKSİLTME (1 Azaltma)
async function stokEksilt(item) {
  if (item.miktar <= 0) return;
  const yeniMiktar = Math.max(0, item.miktar - 1);
  
  // Eğer 0'a düşerse silme sorusu
  if (yeniMiktar === 0) {
    if (confirm(`${item.malzeme_adi} bitti. Listeden silinsin mi?`)) {
      malzemeSil(item.id);
    } else {
      // Silme iptal edilirse 0 olarak güncelle
      await stokGuncelle(item.id, 0);
      item.miktar = 0;
    }
    return;
  }

  // Anlık arayüz güncellemesi (Hızlı hissettirmek için)
  item.miktar = yeniMiktar;
  
  // Veritabanı güncellemesi
  await stokGuncelle(item.id, yeniMiktar);
}

async function stokGuncelle(id, miktar) {
  const { error } = await supabase.from('kiler').update({ miktar: miktar }).eq('id', id)
  if(error) console.error("Stok güncelleme hatası", error)
}

async function malzemeSil(id) {
  if(!confirm("Bu ürünü tamamen silmek istiyor musun?")) return;
  await supabase.from('kiler').delete().eq('id', id)
  kiler.value = kiler.value.filter(i => i.id !== id)
}

// Yardımcı Kontroller
function stokAzMi(item) {
  const miktar = parseFloat(item.miktar)
  const birim = item.birim ? item.birim.toLowerCase() : ''
  if (['adet', 'paket', 'rulo', 'kavanoz', 'şişe'].includes(birim)) return miktar <= 3
  if (['gr', 'ml'].includes(birim)) return miktar <= 500
  if (['kg', 'litre', 'lt'].includes(birim)) return miktar <= 0.5
  return false
}

function sktGectiMi(tarihStr) { 
  if(!tarihStr) return false
  const bugun = new Date(); 
  bugun.setHours(0,0,0,0); 
  const skt = new Date(tarihStr); 
  return skt < bugun 
}

onMounted(() => {
  getKiler()
})
</script>

<style scoped>
/* ANA YAPI - TAM EKRAN VE TAŞMA ENGELLEME */
.kiler-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #f8f9fa;
  position: relative;
  overflow: hidden; /* Dışa taşmaları engelle */
}

/* 1. STICKY HEADER (SABİT ÜST) */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
  border-bottom: 1px solid #eee;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  flex-shrink: 0;
  width: 100%;
}

.header-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-title { margin: 0; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }

/* FORM ELEMANLARI */
.form-row { display: flex; gap: 6px; width: 100%; }

.input-with-btn { display: flex; flex: 1; gap: 5px; }
.main-input { flex: 1; padding: 10px; background: #f3f4f6; border: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
.ai-btn { width: 40px; background: #8b5cf6; color: white; border: none; border-radius: 10px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

.sub-input { padding: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #374151; }
.location-select { flex: 2; }
.unit-select { flex: 1.5; }
.date-input { flex: 1.5; font-size: 11px; }

.calc-group { flex: 1.5; display: flex; align-items: center; gap: 2px; }
.qty-input { width: 100%; text-align: center; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; font-weight: bold; }
.x-sign { color: #9ca3af; font-size: 12px; font-weight: bold; }

.add-btn { flex: 1; background: #111827; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; }

/* YENİ FİLTRE SATIRI (SELECT) */
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 8px;
}
.filter-label { font-size: 12px; font-weight: 600; color: #666; }
.filter-select {
  flex: 1;
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

/* 2. SCROLLABLE LIST (KAYAN LİSTE) */
.scrollable-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* Yana taşmayı kesin engelle */
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.product-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-card {
  background: white;
  padding: 10px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #f3f4f6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transition: transform 0.1s;
}
.product-card.kritik { border: 1px solid #fed7aa; background: #fff7ed; }
.product-card.bayat { opacity: 0.6; filter: grayscale(0.8); }

.card-left { display: flex; gap: 10px; align-items: center; min-width: 0; flex: 1; }
.img-box { position: relative; width: 50px; height: 50px; border-radius: 10px; overflow: hidden; background: #f3f4f6; flex-shrink: 0; }
.product-img { width: 100%; height: 100%; object-fit: cover; }
.expire-badge { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(220,38,38,0.9); color: white; font-size: 8px; text-align: center; font-weight: bold; padding: 1px; }

.info-col { display: flex; flex-direction: column; min-width: 0; }
.p-name { font-weight: 700; font-size: 14px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-loc { font-size: 10px; color: #6b7280; font-weight: 500; margin-bottom: 2px; }
.p-qty { font-size: 12px; font-weight: 700; color: #374151; display: flex; align-items: center; gap: 4px; }
.p-qty.low-stock { color: #ea580c; }

/* AKSİYON BUTONLARI (SAĞ TARAFTAKİLER) */
.card-actions { display: flex; gap: 6px; align-items: center; }
.action-btn { 
  width: 32px; 
  height: 32px; 
  border-radius: 8px; 
  border: none; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 14px; 
  cursor: pointer; 
  flex-shrink: 0; 
}
.decrease-btn { background: #eff6ff; color: #2563eb; font-weight: bold; }
.del-btn { background: #fee2e2; color: #ef4444; }

.empty-state, .loading-state { text-align: center; margin-top: 50px; color: #9ca3af; }
.empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.5; filter: grayscale(1); }

.bottom-spacer { height: 20px; }
</style>