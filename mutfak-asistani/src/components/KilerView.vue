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
            <input v-model="yeniMalzeme.paketSayisi" type="number" class="qty-input white-bg" placeholder="1">
            <span class="x-sign">✖</span>
            <input v-model="yeniMalzeme.paketAgirligi" type="number" class="qty-input white-bg" placeholder="1">
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
            <option value="rulo">Rulo</option>
            <option value="şişe">Şişe</option>
          </select>
          
          <input v-model="yeniMalzeme.skt" type="date" class="sub-input date-input">
          
          <button @click="malzemeEkle" class="add-btn">
            Ekle ({{ toplamStokHesapla }})
          </button>
        </div>

        <!-- FİLTRE (DROPDOWN) -->
        <div class="filter-row">
          <label class="filter-label">🔍 Filtrele:</label>
          <select v-model="seciliKonumFiltresi" class="filter-select">
            <option value="Hepsi">🏠 Tümü</option>
            <option value="Tüm Buzdolabı">❄️ Tüm Buzdolabı (Genel)</option>
            <option disabled>──────────</option>
            <option v-for="yer in depoYerleri" :key="yer" :value="yer">{{ yer }}</option>
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
          :class="{ 
            'kritik-yanip-son': stokAzMi(item), 
            'bayat': sktGectiMi(item.son_kullanma_tarihi) 
          }"
        >
          <!-- ÜST KISIM: Bilgiler (Solda) ve Resim (Sağda) -->
          <div class="card-top">
            <!-- SOL: Bilgiler -->
            <div class="info-col">
              <div class="p-name">{{ item.malzeme_adi }}</div>
              <div class="p-loc">{{ item.depo_yer }}</div>
              <div class="p-qty" :class="{'text-danger': stokAzMi(item)}">
                {{ item.miktar }} {{ item.birim }}
                <span v-if="stokAzMi(item)" class="alert-text">⚠️ AZ KALDI</span>
              </div>
              <!-- SKT TARİHİ -->
              <div class="p-skt" v-if="item.son_kullanma_tarihi">
                 📅 SKT: {{ formatTarih(item.son_kullanma_tarihi) }}
              </div>
            </div>

            <!-- SAĞ: Büyük Resim -->
            <div class="img-box">
              <img 
                :src="item.resim_url || 'https://placehold.co/100x100?text=📦'" 
                @error="$event.target.src='https://placehold.co/100x100?text=📦'"
                class="product-img"
              />
              <span v-if="sktGectiMi(item.son_kullanma_tarihi)" class="expire-badge">SKT!</span>
            </div>
          </div>

          <!-- ALT KISIM: Butonlar -->
          <div class="card-actions">
            <button @click="openConsumeModal(item)" class="use-btn">
              <span class="red-arrow">🔻</span> Kullan
            </button>
            <button @click="malzemeSil(item.id)" class="action-btn del-btn">Sil 🗑️</button>
          </div>
        </div>
      </div>
      
      <div class="bottom-spacer"></div>
    </div>

    <!-- 3. TÜKETİM PENCERESİ (MODAL) -->
    <div v-if="isConsumeModalOpen" class="modal-overlay" @click.self="isConsumeModalOpen = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Ne kadar kullandın?</h3>
          <button @click="isConsumeModalOpen = false" class="close-modal">✕</button>
        </div>
        
        <div class="modal-body">
          <p class="modal-item-name">{{ selectedItemToConsume?.malzeme_adi }}</p>
          <div class="modal-input-group">
            <input 
              type="number" 
              v-model="consumeAmount" 
              class="modal-input white-bg" 
              placeholder="0" 
              ref="consumeInput"
              @keyup.enter="confirmConsume"
            >
            <span class="modal-unit">{{ selectedItemToConsume?.birim }}</span>
          </div>
          <p class="modal-hint">Mevcut Stok: {{ selectedItemToConsume?.miktar }}</p>
        </div>

        <div class="modal-footer">
          <button @click="isConsumeModalOpen = false" class="modal-btn cancel">İptal</button>
          <button @click="confirmConsume" class="modal-btn confirm">Stoktan Düş</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { supabase } from '../supabase' 

// --- STATE ---
const kiler = ref([])
const loading = ref(true)
const aiLoading = ref(false)
const seciliKonumFiltresi = ref("Hepsi")

// Modal State
const isConsumeModalOpen = ref(false)
const selectedItemToConsume = ref(null)
const consumeAmount = ref('')
const consumeInput = ref(null)

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
  konum: 'Buzdolabı Üst Raf', 
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
    if (seciliKonumFiltresi.value === 'Tüm Buzdolabı') {
      liste = liste.filter(i => i.depo_yer && i.depo_yer.includes('Buzdolabı'))
    } else {
      liste = liste.filter(i => i.depo_yer === seciliKonumFiltresi.value)
    }
  }

  return liste.sort((a, b) => {
    const aExpired = sktGectiMi(a.son_kullanma_tarihi)
    const bExpired = sktGectiMi(b.son_kullanma_tarihi)
    if (aExpired && !bExpired) return -1
    if (!aExpired && bExpired) return 1

    const aLow = stokAzMi(a)
    const bLow = stokAzMi(b)
    if (aLow && !bLow) return -1
    if (!aLow && bLow) return 1

    if (a.son_kullanma_tarihi && b.son_kullanma_tarihi) {
      return new Date(a.son_kullanma_tarihi) - new Date(b.son_kullanma_tarihi)
    }
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

async function aiResimUret() {
  if(!yeniMalzeme.value.ad) { alert("Önce ürün adını yazmalısın!"); return; }
  aiLoading.value = true
  
  const arananKelime = yeniMalzeme.value.ad.toLowerCase().trim()
  const trToEn = { 
    'domates': 'tomato', 'biber': 'pepper', 'süt': 'milk', 'yumurta': 'egg', 
    'deterjan': 'detergent', 'salça': 'tomato paste', 'pirinç': 'rice', 
    'mercimek': 'lentil', 'makarna': 'pasta', 'ekmek': 'bread', 'yoğurt': 'yogurt', 
    'peynir': 'cheese', 'yağ': 'oil', 'tereyağı': 'butter', 'un': 'flour',
    'şeker': 'sugar', 'tuz': 'salt', 'kahve': 'coffee', 'çay': 'tea', 
    'patates': 'potato', 'soğan': 'onion', 'sarımsak': 'garlic', 'tavuk': 'chicken',
    'et': 'meat', 'kıyma': 'minced meat', 'sucuk': 'turkish sausage', 'salam': 'salami',
    'sosis': 'sausage', 'bal': 'honey', 'reçel': 'jam', 'zeytin': 'olive',
    'tuvalet kağıdı': 'toilet paper', 'kağıt havlu': 'paper towel', 'şampuan': 'shampoo',
    'sabun': 'soap', 'diş macunu': 'toothpaste'
  } 
  
  const ingilizceIsim = trToEn[arananKelime] || arananKelime
  const prompt = `${ingilizceIsim} product packaging, grocery item, isolated on white background, high quality, studio lighting, 4k`
  const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=300&height=300&nologo=true`
  
  await new Promise(r => setTimeout(r, 1000))
  yeniMalzeme.value.resim = aiUrl
  aiLoading.value = false
}

async function malzemeEkle() {
  if (!yeniMalzeme.value.ad) return alert("İsim yazmalısın!")
  if (!yeniMalzeme.value.resim) await aiResimUret()

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
  } else { alert("Hata: " + error.message) }
}

function openConsumeModal(item) {
  selectedItemToConsume.value = item
  consumeAmount.value = '' 
  isConsumeModalOpen.value = true
  nextTick(() => {
    if(consumeInput.value) consumeInput.value.focus()
  })
}

async function confirmConsume() {
  if (!selectedItemToConsume.value || !consumeAmount.value) return
  const miktar = parseFloat(consumeAmount.value)
  if (isNaN(miktar) || miktar <= 0) { alert("Geçerli bir miktar girin."); return; }

  const currentItem = selectedItemToConsume.value
  const yeniMiktar = Math.max(0, currentItem.miktar - miktar)

  if (yeniMiktar === 0) {
    if (confirm(`${currentItem.malzeme_adi} bitti. Listeden silinsin mi?`)) {
      malzemeSil(currentItem.id)
    } else {
      await stokGuncelle(currentItem.id, 0)
      updateLocalList(currentItem.id, 0)
    }
  } else {
    await stokGuncelle(currentItem.id, yeniMiktar)
    updateLocalList(currentItem.id, yeniMiktar)
  }
  isConsumeModalOpen.value = false
}

async function stokGuncelle(id, miktar) {
  const { error } = await supabase.from('kiler').update({ miktar: miktar }).eq('id', id)
  if(error) console.error("Stok güncelleme hatası", error)
}

function updateLocalList(id, miktar) {
  const idx = kiler.value.findIndex(k => k.id === id)
  if(idx !== -1) kiler.value[idx].miktar = miktar
}

async function malzemeSil(id) {
  if(!confirm("Bu ürünü tamamen silmek istiyor musun?")) return;
  await supabase.from('kiler').delete().eq('id', id)
  kiler.value = kiler.value.filter(i => i.id !== id)
}

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

// YENİ: Tarih formatlama fonksiyonu
function formatTarih(tarihStr) {
  if (!tarihStr) return ''
  const date = new Date(tarihStr)
  return date.toLocaleDateString('tr-TR')
}

onMounted(() => {
  getKiler()
})
</script>

<style scoped>
.kiler-container {
  display: flex; flex-direction: column; height: 100%; width: 100%;
  background: #f8f9fa; position: relative; overflow: hidden;
}

.sticky-header {
  position: sticky; top: 0; z-index: 20;
  background: #fff; border-bottom: 1px solid #eee;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03); flex-shrink: 0; width: 100%;
}

.header-content { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.mini-title { margin: 0; font-size: 13px; color: #888; text-transform: uppercase; font-weight: 700; }

.form-row { display: flex; gap: 6px; width: 100%; }
.input-with-btn { display: flex; flex: 1; gap: 5px; }
.main-input { 
  flex: 1; 
  padding: 10px; 
  background: #f3f4f6; 
  border: none; 
  border-radius: 10px; 
  font-weight: 600; 
  font-size: 15px; 
  color: #111827; 
}
.ai-btn { width: 40px; background: #8b5cf6; color: white; border: none; border-radius: 10px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

.sub-input { padding: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #374151; }
.location-select { flex: 2; }
.unit-select { flex: 1.5; }
.date-input { flex: 1.5; font-size: 11px; }

.calc-group { flex: 1.5; display: flex; align-items: center; gap: 2px; }
.qty-input { width: 100%; text-align: center; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; font-weight: bold; }
.white-bg { background-color: #ffffff; color: #111827; } 
.x-sign { color: #9ca3af; font-size: 12px; font-weight: bold; }

.add-btn { flex: 1; background: #111827; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; }

.filter-row { display: flex; align-items: center; gap: 8px; margin-top: 5px; background: #f3f4f6; padding: 8px; border-radius: 8px; }
.filter-label { font-size: 12px; font-weight: 600; color: #666; }
.filter-select { flex: 1; padding: 6px; border-radius: 6px; border: 1px solid #ddd; background: white; font-size: 13px; font-weight: 600; color: #333; }

.scrollable-list { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px; -webkit-overflow-scrolling: touch; }
.product-grid { display: flex; flex-direction: column; gap: 10px; }

.product-card {
  background: white; 
  padding: 12px; 
  border-radius: 16px;
  display: flex; 
  flex-direction: column; /* DİKEY YERLEŞİM */
  border: 1px solid #f3f4f6; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transition: transform 0.1s;
  gap: 10px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 15px;
}

@keyframes blink-red {
  0% { border-color: #fca5a5; background-color: #fff1f2; }
  50% { border-color: #ef4444; background-color: #ffe4e6; }
  100% { border-color: #fca5a5; background-color: #fff1f2; }
}

.product-card.kritik-yanip-son {
  animation: blink-red 2s infinite ease-in-out;
  border: 2px solid #ef4444;
}

.product-card.bayat { opacity: 0.6; filter: grayscale(0.8); border: 1px solid #999; }

.img-box { 
  position: relative; 
  width: 110px; /* GÖRSEL BÜYÜTÜLDÜ */
  height: 110px; 
  border-radius: 12px; 
  overflow: hidden; 
  background: #f3f4f6; 
  flex-shrink: 0; 
}
.product-img { width: 100%; height: 100%; object-fit: cover; }
.expire-badge { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(220,38,38,0.9); color: white; font-size: 8px; text-align: center; font-weight: bold; padding: 1px; }

.info-col { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 4px;
  align-items: flex-start; 
}
/* YAZILAR BÜYÜTÜLDÜ VE KALINLAŞTIRILDI */
.p-name { font-weight: 800; font-size: 18px; color: #111827; white-space: normal; line-height: 1.2; }
.p-loc { font-size: 13px; color: #4b5563; font-weight: 600; }
.p-qty { font-size: 15px; font-weight: 800; color: #374151; display: flex; align-items: center; gap: 4px; }
.text-danger { color: #dc2626; font-weight: 900; }
.alert-text { font-size: 11px; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: 700;}
.p-skt { font-size: 12px; color: #059669; font-weight: 700; margin-top: 2px; }

/* AKSİYON BUTONLARI (ALT KISIM) */
.card-actions { 
  display: flex; 
  gap: 10px; 
  align-items: center; 
  width: 100%; 
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}

.action-btn { 
  height: 40px; /* Butonlar biraz daha yüksek */
  border-radius: 8px; 
  border: none; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 15px; 
  cursor: pointer; 
  font-weight: 700;
}

.use-btn {
  flex: 2; /* Geniş alan */
  background: #f1f5f9; 
  color: #0f172a; 
  border: 1px solid #cbd5e1; 
  border-radius: 8px;
  height: 40px;
  font-size: 14px; 
  font-weight: 800; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  gap: 6px;
  cursor: pointer; 
  transition: all 0.2s;
}
.use-btn:active { transform: scale(0.95); background: #e2e8f0; }
.red-arrow { color: #ef4444; font-size: 14px; }

.del-btn { 
  flex: 1; /* Daha dar alan */
  background: #fee2e2; 
  color: #ef4444; 
}

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5); z-index: 100;
  display: flex; justify-content: center; align-items: center; backdrop-filter: blur(2px);
}
.modal-content {
  background: white; width: 85%; max-width: 320px;
  border-radius: 20px; padding: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  animation: popIn 0.2s ease-out;
}
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.modal-header h3 { margin: 0; font-size: 16px; color: #333; }
.close-modal { background: none; border: none; font-size: 20px; color: #999; cursor: pointer; }

.modal-body { text-align: center; margin-bottom: 20px; }
.modal-item-name { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 10px; }
.modal-input-group { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px; }
.modal-input { 
  width: 80px; 
  padding: 10px; 
  border: 2px solid #e5e7eb; 
  border-radius: 12px; 
  font-size: 20px; 
  font-weight: bold; 
  text-align: center; 
  outline: none;
  background-color: white; 
  color: #111827; 
}
.modal-input:focus { border-color: #2563eb; }
.modal-unit { font-size: 16px; color: #6b7280; font-weight: 600; }
.modal-hint { font-size: 12px; color: #9ca3af; margin: 0; }

.modal-footer { display: flex; gap: 10px; }
.modal-btn { flex: 1; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 14px; cursor: pointer; border: none; }
.modal-btn.cancel { background: #f3f4f6; color: #4b5563; }
.modal-btn.confirm { background: #2563eb; color: white; }

.empty-state, .loading-state { text-align: center; margin-top: 50px; color: #9ca3af; }
.empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.5; filter: grayscale(1); }
.bottom-spacer { height: 20px; }
</style>