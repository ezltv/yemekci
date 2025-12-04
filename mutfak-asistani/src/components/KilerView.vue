<template>
  <div class="p-20">
    <h2 class="page-title">📦 Ev Envanteri & Stok</h2>

    <!-- YENİ MALZEME EKLEME FORMU -->
    <div class="ekleme-formu">
      <h3 class="section-title">➕ Yeni Ürün Girişi</h3>
      
      <!-- 1. ÜRÜN ADI -->
      <div class="form-satir">
        <label>Ürün Adı</label>
        <input 
          v-model="yeniMalzeme.ad" 
          list="malzeme-onerileri" 
          placeholder="Örn: Süt, Deterjan..." 
          type="text" 
          class="modern-input"
          @change="birimOtomatikSec" 
        >
        <datalist id="malzeme-onerileri">
          <option v-for="malzeme in malzemeKutuphanesi" :key="malzeme.id" :value="malzeme.ad">
            {{ malzeme.kategori }}
          </option>
        </datalist>
      </div>

      <!-- 2. KONUM SEÇİMİ (Detaylı Liste) -->
      <div class="form-satir">
        <label>Konum</label>
        <select v-model="yeniMalzeme.konum" class="modern-input">
          <option v-for="yer in depoYerleri" :key="yer" :value="yer">{{ yer }}</option>
        </select>
      </div>

      <!-- 3. MİKTAR HESAPLAMA -->
      <div class="hesap-kutusu">
        <div class="girdi-grup">
          <label>Paket</label>
          <input v-model="yeniMalzeme.paketSayisi" type="number" placeholder="1" class="modern-input center-text">
        </div>
        <div class="carpim-isareti">✖</div>
        <div class="girdi-grup">
          <label>Miktar</label>
          <input v-model="yeniMalzeme.paketAgirligi" type="number" placeholder="1" class="modern-input center-text">
        </div>
        <div class="girdi-grup">
          <label>Birim</label>
          <select v-model="yeniMalzeme.birim" class="modern-input">
            <option value="adet">Adet</option>
            <option value="rulo">Rulo</option>
            <option value="paket">Paket</option>
            <option value="gr">Gram</option>
            <option value="kg">KG</option>
            <option value="litre">Litre</option>
            <option value="ml">Mililitre</option>
          </select>
        </div>
      </div>

      <!-- 4. SKT VE RESİM -->
      <div class="form-satir">
        <label>Son Kullanma Tarihi</label>
        <input v-model="yeniMalzeme.skt" type="date" class="modern-input">
      </div>

      <p class="ozet-bilgi">
        Toplam Stok: <b>{{ toplamStokHesapla }} {{ yeniMalzeme.birim }}</b>
        <br>
        <small>Konum: {{ yeniMalzeme.konum }}</small>
      </p>

      <!-- RESİM BULUCU -->
      <div class="form-satir">
        <div class="resim-bulucu">
          <input v-model="yeniMalzeme.resim" placeholder="Resim URL..." type="text" class="modern-input link-input">
          <button @click="aiResimUret" class="ai-btn" :disabled="aiLoading">
            {{ aiLoading ? 'Çiziliyor...' : '🎨 AI Resim' }}
          </button>
        </div>
      </div>

      <button @click="malzemeEkle" class="ekle-btn">✅ Kaydet</button>
    </div>

    <hr class="divider">

    <!-- LİSTELEME VE FİLTRELEME -->
    <h3 class="section-title">Envanter Listesi</h3>

    <!-- KONUM FİLTRESİ -->
    <div class="konum-filtresi">
      <button 
        :class="{ active: seciliKonumFiltresi === 'Hepsi' }" 
        @click="seciliKonumFiltresi = 'Hepsi'"
      >Tümü</button>
      
      <button 
        v-for="yer in depoYerleri" 
        :key="yer"
        :class="{ active: seciliKonumFiltresi === yer }"
        @click="seciliKonumFiltresi = yer"
      >
        {{ yer }}
      </button>
    </div>

    <input v-model="listeArama" placeholder="🔍 Listede ara..." class="liste-arama-input">

    <div class="list">
      <div 
        v-for="item in siraliVeFiltreliListe" 
        :key="item.id" 
        class="item-card"
        :class="{ 'kritik-stok': stokAzMi(item), 'skt-gecti': sktGectiMi(item.son_kullanma_tarihi) }"
      >
        <img 
          :src="item.resim_url || 'https://placehold.co/300x300?text=Urun'" 
          @error="$event.target.src='https://placehold.co/300x300?text=Resim+Yok'"
          class="thumb"
        >
        
        <div class="info">
          <div class="baslik-satir">
            <h3>{{ item.malzeme_adi.toUpperCase() }}</h3>
            <span class="konum-badge">{{ item.depo_yer || 'Belirsiz' }}</span>
          </div>
          
          <div class="detaylar">
            <span class="stok-badge">
              {{ item.miktar }} {{ item.birim }}
              <b v-if="stokAzMi(item)" class="uyari-yazisi">⚠️ AZ KALDI</b>
            </span>
            
            <span v-if="item.son_kullanma_tarihi" class="skt-badge" :class="sktGectiMi(item.son_kullanma_tarihi) ? 'tehlike' : 'guvenli'">
              SKT: {{ formatTarih(item.son_kullanma_tarihi) }}
            </span>
          </div>

          <div class="aksiyon-butonlari">
            <button @click="stokDuzenleModalAc(item)" class="kullan-btn">🔻 Kullan</button>
            <button @click="malzemeSil(item.id)" class="sil-btn">Sil</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="secilenUrun" class="modal-overlay" @click.self="modalKapat">
      <div class="modal-content">
        <h3>🔻 Stok Tüketimi</h3>
        <p><b>{{ secilenUrun.malzeme_adi.toUpperCase() }}</b> kullanılıyor.</p>
        <div class="modal-input-area">
          <label>Ne kadar kullandın?</label>
          <div class="input-group">
            <input type="number" v-model="dusulecekMiktar" class="buyuk-input" placeholder="0">
            <span>{{ secilenUrun.birim }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="modalKapat" class="iptal-btn">İptal</button>
          <button @click="stoktanDus" class="onay-btn">✅ Düş</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'

const kiler = ref([])
const malzemeKutuphanesi = ref([])
const listeArama = ref("")
const secilenUrun = ref(null)
const dusulecekMiktar = ref(1)
const seciliKonumFiltresi = ref("Hepsi")
const aiLoading = ref(false)

// --- GÜNCELLENMİŞ DEPO YERLERİ ---
const depoYerleri = [
  "Buzdolabı", 
  "Buzdolabı Üst Raf",
  "Buzdolabı Ara Raf",
  "Buzdolabı Alt Raf",
  "Buzdolabı Üst Göz",
  "Buzdolabı Kapak",
  "Kiler", 
  "Balkondolap", 
  "Ezeldolap", 
  "Yatakdolap", 
  "Banyo", 
  "Ivırzıvır"
]

const yeniMalzeme = ref({ 
  ad: '', paketSayisi: 1, paketAgirligi: 1, birim: 'adet', skt: '', resim: '', konum: 'Kiler'
})

const toplamStokHesapla = computed(() => {
  return yeniMalzeme.value.paketSayisi * yeniMalzeme.value.paketAgirligi
})

// --- AKILLI FİLTRELEME ALGORİTMASI ---
const siraliVeFiltreliListe = computed(() => {
  let liste = kiler.value

  if (listeArama.value) {
    liste = liste.filter(i => i.malzeme_adi.toLowerCase().includes(listeArama.value.toLowerCase()))
  }

  if (seciliKonumFiltresi.value !== 'Hepsi') {
    if (seciliKonumFiltresi.value === 'Buzdolabı') {
      liste = liste.filter(i => i.depo_yer && i.depo_yer.includes('Buzdolabı'))
    } else {
      liste = liste.filter(i => i.depo_yer === seciliKonumFiltresi.value)
    }
  }

  return liste.sort((a, b) => {
    const aKritik = stokAzMi(a)
    const bKritik = stokAzMi(b)
    
    if (aKritik && !bKritik) return -1
    if (!aKritik && bKritik) return 1

    if (a.son_kullanma_tarihi && b.son_kullanma_tarihi) {
      return new Date(a.son_kullanma_tarihi) - new Date(b.son_kullanma_tarihi)
    }
    return 0
  })
})

function stokAzMi(item) {
  const miktar = parseFloat(item.miktar)
  const birim = item.birim.toLowerCase()

  if (['adet', 'paket', 'rulo', 'kavanoz', 'şişe'].includes(birim)) {
    return miktar <= 3
  }
  if (['gr', 'ml'].includes(birim)) {
    return miktar <= 500
  }
  if (['kg', 'litre'].includes(birim)) {
    return miktar <= 0.5
  }
  return false
}

async function getKiler() {
  const { data } = await supabase.from('kiler').select('*')
  if (data) kiler.value = data
}

async function getMalzemeKutuphanesi() {
  const { data } = await supabase.from('malzeme_kutuphanesi').select('*').order('ad', { ascending: true })
  if (data) malzemeKutuphanesi.value = data
}

function birimOtomatikSec() {
  const secilen = malzemeKutuphanesi.value.find(m => m.ad === yeniMalzeme.value.ad)
  if (secilen && secilen.varsayilan_birim) {
    yeniMalzeme.value.birim = secilen.varsayilan_birim
  }
}

async function malzemeEkle() {
  if (!yeniMalzeme.value.ad) return alert("İsim yazmalısın!")
  const { error } = await supabase.from('kiler').insert({
    malzeme_adi: yeniMalzeme.value.ad.toLowerCase(),
    miktar: toplamStokHesapla.value, 
    birim: yeniMalzeme.value.birim,
    son_kullanma_tarihi: yeniMalzeme.value.skt || null,
    resim_url: yeniMalzeme.value.resim || 'https://placehold.co/300x300?text=' + yeniMalzeme.value.ad,
    depo_yer: yeniMalzeme.value.konum
  })
  if (!error) {
    alert("Stok Eklendi!")
    const eskiKonum = yeniMalzeme.value.konum
    yeniMalzeme.value = { ad: '', paketSayisi: 1, paketAgirligi: 1, birim: 'adet', skt: '', resim: '', konum: eskiKonum }
    getKiler()
  } else { alert("Hata: " + error.message) }
}

async function malzemeSil(id) {
  if(!confirm("Silmek istiyor musun?")) return;
  await supabase.from('kiler').delete().eq('id', id)
  getKiler()
}

function stokDuzenleModalAc(item) { secilenUrun.value = item; dusulecekMiktar.value = 1 }
function modalKapat() { secilenUrun.value = null }

async function stoktanDus() {
  if (!secilenUrun.value) return
  if (dusulecekMiktar.value <= 0) return alert("Geçerli miktar gir.")
  const yeniStok = Math.max(0, secilenUrun.value.miktar - dusulecekMiktar.value)
  const { error } = await supabase.from('kiler').update({ miktar: yeniStok }).eq('id', secilenUrun.value.id)
  if (!error) { modalKapat(); getKiler() } else { alert("Hata oluştu.") }
}

function aiResimUret() {
  if(!yeniMalzeme.value.ad) return alert("Önce ürün adını yazmalısın!");
  aiLoading.value = true
  const trToEn = {
    'domates': 'tomato', 'biber': 'pepper', 'patlıcan': 'eggplant', 'soğan': 'onion', 'sarımsak': 'garlic',
    'patates': 'potato', 'havuç': 'carrot', 'kabak': 'zucchini', 'ıspanak': 'spinach', 'limon': 'lemon',
    'elma': 'apple', 'muz': 'banana', 'çilek': 'strawberry', 'portakal': 'orange', 'karpuz': 'watermelon',
    'pirinç': 'rice', 'mercimek': 'lentil', 'nohut': 'chickpea', 'fasulye': 'bean', 'makarna': 'pasta',
    'süt': 'milk', 'yumurta': 'egg', 'peynir': 'cheese', 'yoğurt': 'yogurt', 'tereyağı': 'butter',
    'ekmek': 'bread', 'un': 'flour', 'şeker': 'sugar', 'tuz': 'salt', 'yağ': 'oil', 'salça': 'tomato paste',
    'zeytin': 'olive', 'bal': 'honey', 'reçel': 'jam', 'çay': 'tea', 'kahve': 'coffee', 'su': 'water',
    'deterjan': 'detergent', 'sabun': 'soap', 'şampuan': 'shampoo', 'peçete': 'napkin',
    'tuvalet kağıdı': 'toilet paper', 'kağıt havlu': 'paper towel', 'çamaşır suyu': 'bleach',
    'diş macunu': 'toothpaste', 'diş fırçası': 'toothbrush'
  }
  const arananKelime = yeniMalzeme.value.ad.toLowerCase().trim()
  const ingilizceIsim = trToEn[arananKelime] || arananKelime
  const prompt = `${ingilizceIsim} product photography, sharp focus, highly detailed, realistic white background, studio lighting, 8k`
  const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=300&height=300&nologo=true`
  yeniMalzeme.value.resim = aiUrl
  setTimeout(() => { aiLoading.value = false }, 1000)
}

function formatTarih(tarihStr) { if(!tarihStr) return ''; return new Date(tarihStr).toLocaleDateString('tr-TR') }
function sktGectiMi(tarihStr) { const bugun = new Date(); bugun.setHours(0,0,0,0); const skt = new Date(tarihStr); return skt < bugun }

onMounted(() => { getKiler(); getMalzemeKutuphanesi() })
</script>

<style scoped>
.p-20 { padding: 20px; padding-bottom: 80px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

.page-title { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 20px; letter-spacing: -0.5px; }
.section-title { font-size: 18px; font-weight: 700; color: #333; margin: 15px 0; }

.ekleme-formu { background: #f9fafb; padding: 20px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #edf2f7; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }

.form-satir { margin-bottom: 12px; }
.form-satir label { display: block; font-weight: 600; margin-bottom: 6px; color: #4a5568; font-size: 13px; }

/* Modern Inputlar */
.modern-input { 
  width: 100%; 
  padding: 12px 16px; 
  border: 1px solid #e2e8f0; 
  border-radius: 12px; 
  background: white;
  font-size: 15px;
  box-sizing: border-box;
  transition: all 0.2s;
  color: #2d3748;
}
.modern-input:focus { border-color: #000; outline: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.05); }
.center-text { text-align: center; font-weight: bold; }

.hesap-kutusu { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 12px; background: white; padding: 12px; border-radius: 12px; border: 1px solid #edf2f7; }
.girdi-grup { flex: 1; display: flex; flex-direction: column; }
.girdi-grup label { font-size: 11px; margin-bottom: 4px; font-weight: 700; text-align: center; color: #718096;}
.carpim-isareti { font-size: 16px; color: #cbd5e0; padding-bottom: 12px; }

.ozet-bilgi { background: #ebf8ff; color: #2b6cb0; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #bee3f8; margin-bottom: 15px; font-size: 14px;}

.resim-bulucu { display: flex; gap: 8px; }
.link-input { flex: 1; }
.ai-btn { 
  background: #6f42c1; 
  color: white; 
  border: none; 
  border-radius: 10px; 
  padding: 0 16px; 
  cursor: pointer; 
  font-weight: 600; 
  font-size: 13px;
  box-shadow: 0 2px 4px rgba(111, 66, 193, 0.2);
  transition: transform 0.1s;
}
.ai-btn:active { transform: scale(0.96); }

.ekle-btn { 
  width: 100%; 
  background: #1a202c; 
  color: white; 
  padding: 14px; 
  font-weight: 700; 
  cursor: pointer; 
  border: none; 
  border-radius: 12px; 
  font-size: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: background 0.2s;
}
.ekle-btn:active { background: #000; transform: scale(0.98); }

.divider { border: 0; border-top: 1px solid #edf2f7; margin: 30px 0; }

.liste-arama-input { 
  width: 100%; 
  padding: 12px 16px; 
  border: 1px solid #e2e8f0; 
  border-radius: 12px; 
  margin-bottom: 20px; 
  box-sizing: border-box; 
  font-size: 15px;
  background-color: #f7fafc;
}

/* KONUM FİLTRESİ */
.konum-filtresi { display: flex; overflow-x: auto; gap: 8px; margin-bottom: 20px; padding-bottom: 8px; scrollbar-width: none; }
.konum-filtresi::-webkit-scrollbar { display: none; }
.konum-filtresi button { 
  padding: 8px 16px; 
  border: 1px solid #e2e8f0; 
  border-radius: 20px; 
  background: white; 
  white-space: nowrap; 
  font-size: 13px; 
  cursor: pointer; 
  color: #4a5568; 
  font-weight: 500;
  transition: all 0.2s;
}
.konum-filtresi button.active { background: #1a202c; color: white; border-color: #1a202c; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* LİSTE KARTLARI */
.item-card { 
  display: flex; 
  align-items: flex-start; 
  border: 1px solid #f0f0f0; /* Soft border */
  margin-bottom: 16px; 
  padding: 16px; 
  border-radius: 16px; 
  background: white; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.03); /* Modern soft shadow */
  transition: transform 0.1s;
}
.thumb { 
  width: 90px; /* BÜYÜTÜLDÜ */
  height: 90px; /* BÜYÜTÜLDÜ */
  border-radius: 12px; 
  margin-right: 16px; 
  object-fit: cover; 
  border: 1px solid #edf2f7;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.info { flex: 1; min-width: 0; }
.baslik-satir { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.info h3 { margin: 0; font-size: 17px; color: #1a202c; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%;}
.konum-badge { font-size: 10px; background: #edf2f7; padding: 3px 8px; border-radius: 6px; color: #4a5568; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;}

.detaylar { margin-bottom: 12px; }
.stok-badge { font-weight: 700; font-size: 15px; color: #2d3748; display: block; margin-bottom: 4px; }
.uyari-yazisi { color: #e53e3e; font-weight: 800; font-size: 11px; margin-left: 6px; background: #fff5f5; padding: 2px 6px; border-radius: 4px;}

.skt-badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; display: inline-block; width: fit-content; font-weight: 600; }
.skt-badge.guvenli { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
.skt-badge.tehlike { background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; }

/* MODERN AKSİYON BUTONLARI */
.aksiyon-butonlari { display: flex; gap: 8px; margin-top: auto; }
.kullan-btn, .sil-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s;
}

.kullan-btn {
  background: #edf2f7;
  color: #2d3748;
}
.sil-btn {
  background: #fff5f5;
  color: #e53e3e;
  max-width: 60px;
}
.kullan-btn:active, .sil-btn:active { transform: scale(0.95); }

/* KRİTİK STOK STİLİ */
.item-card.kritik-stok { border: 1px solid #fc8181; background: #fffafa; }
.item-card.skt-gecti { opacity: 0.7; filter: grayscale(50%); }

/* MODAL */
.modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: white; padding: 24px; border-radius: 20px; width: 85%; max-width: 320px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
.modal-input-area { margin: 20px 0; }
.input-group { display: flex; align-items: center; justify-content: center; gap: 10px; }
.buyuk-input { width: 80px; padding: 12px; font-size: 24px; text-align: center; border: 2px solid #edf2f7; border-radius: 12px; font-weight: bold; color: #2d3748;}
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.iptal-btn { flex: 1; background: #edf2f7; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; color: #4a5568; }
.onay-btn { flex: 1; background: #1a202c; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; }

@keyframes blink { 50% { opacity: 0.5; } }
</style>