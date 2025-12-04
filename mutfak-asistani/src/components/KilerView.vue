<template>
  <div class="page-wrapper">
    
    <!-- 1. SABİT ÜST BÖLÜM (HEADER + FORM) -->
    <div class="fixed-header">
      <div class="header-top">
        <h2 class="page-title">📦 Kiler Stok</h2>
        <span class="total-count">{{ kiler.length }} Ürün</span>
      </div>

      <!-- EKLEME FORMU (Scroll edilebilir) -->
      <div class="ekleme-formu-scroll">
        <div class="ekleme-formu">
          <!-- Ürün Adı -->
          <div class="form-satir">
            <input 
              v-model="yeniMalzeme.ad" 
              list="malzeme-onerileri" 
              placeholder="Ürün Adı (Örn: Süt)" 
              type="text" 
              class="modern-input big-text"
              @change="birimOtomatikSec" 
            >
            <datalist id="malzeme-onerileri">
              <option v-for="malzeme in malzemeKutuphanesi" :key="malzeme.id" :value="malzeme.ad">
                {{ malzeme.kategori }}
              </option>
            </datalist>
          </div>

          <!-- Konum -->
          <div class="form-satir">
            <select v-model="yeniMalzeme.konum" class="modern-input big-text">
              <option disabled value="">Konum Seç</option>
              <option v-for="yer in depoYerleri" :key="yer" :value="yer">{{ yer }}</option>
            </select>
          </div>

          <!-- Miktar Alanları (Yan Yana) -->
          <div class="hesap-kutusu">
            <div class="girdi-grup">
              <input v-model="yeniMalzeme.paketSayisi" type="number" placeholder="1" class="modern-input center-text big-text">
              <label>Paket</label>
            </div>
            <div class="carpim-isareti">✖</div>
            <div class="girdi-grup">
              <input v-model="yeniMalzeme.paketAgirligi" type="number" placeholder="1" class="modern-input center-text big-text">
              <label>Miktar</label>
            </div>
            <div class="girdi-grup genis">
              <select v-model="yeniMalzeme.birim" class="modern-input big-text">
                <option value="adet">Adet</option>
                <option value="rulo">Rulo</option>
                <option value="paket">Paket</option>
                <option value="gr">Gr</option>
                <option value="kg">KG</option>
                <option value="litre">Lt</option>
                <option value="ml">Ml</option>
              </select>
            </div>
          </div>

          <!-- Alt Satır: SKT, AI ve Kaydet -->
          <div class="alt-kontrol-satiri">
            <div class="date-wrapper">
              <label>SKT:</label>
              <input v-model="yeniMalzeme.skt" type="date" class="modern-input date-input">
            </div>
            
            <button @click="aiResimUret" class="ai-btn" :disabled="aiLoading">
              {{ aiLoading ? '⏳' : '🎨 AI Resim' }}
            </button>
            
            <button @click="malzemeEkle" class="ekle-btn">KAYDET ✅</button>
          </div>
          
          <div class="preview-area" v-if="yeniMalzeme.ad">
             <span class="preview-text">Eklenecek: <b>{{ toplamStokHesapla }} {{ yeniMalzeme.birim }}</b></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. KAYDIRILABİLİR LİSTE BÖLÜMÜ -->
    <div class="scrollable-content">
      
      <!-- FİLTRELER (Sadeleştirilmiş Liste) -->
      <div class="konum-filtresi">
        <button :class="{ active: seciliKonumFiltresi === 'Hepsi' }" @click="seciliKonumFiltresi = 'Hepsi'">Tümü</button>
        <button v-for="yer in filtreSecenekleri" :key="yer" :class="{ active: seciliKonumFiltresi === yer }" @click="seciliKonumFiltresi = yer">{{ yer }}</button>
      </div>

      <input v-model="listeArama" placeholder="🔍 Envanterde ara..." class="liste-arama-input big-text">

      <!-- ÜRÜN LİSTESİ -->
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
              <span class="konum-badge">{{ item.depo_yer || '?' }}</span>
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
              <button @click="stokDuzenleModalAc(item)" class="kullan-btn">Kullan</button>
              <button @click="malzemeSil(item.id)" class="sil-btn">Sil</button>
            </div>
          </div>
        </div>
        
        <!-- Liste boşsa uyarı -->
        <div v-if="siraliVeFiltreliListe.length === 0" class="bos-liste">
          <p>Bu konumda ürün yok 🤷‍♂️</p>
        </div>
      </div>
      
      <div class="bottom-spacer"></div>
    </div>

    <!-- MODAL (STOK DÜŞME) -->
    <div v-if="secilenUrun" class="modal-overlay" @click.self="modalKapat">
      <div class="modal-content">
        <h3>🔻 Stok Tüketimi</h3>
        <p class="big-text"><b>{{ secilenUrun.malzeme_adi.toUpperCase() }}</b></p>
        <div class="modal-input-area">
          <label>Ne kadar kullandın?</label>
          <div class="input-group">
            <input type="number" v-model="dusulecekMiktar" class="buyuk-input" placeholder="0">
            <span class="big-text">{{ secilenUrun.birim }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="modalKapat" class="iptal-btn">İptal</button>
          <button @click="stoktanDus" class="onay-btn">Onayla ✅</button>
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

// --- DETAYLI DEPO YERLERİ (EKLEME FORMU İÇİN) ---
const depoYerleri = [
  "Buzdolabı Üst Raf", "Buzdolabı Ara Raf", "Buzdolabı Alt Raf", 
  "Buzdolabı Üst Göz", "Buzdolabı Kapak", "Buzdolabı Sebzelik",
  "Kiler", "Balkondolap", "Ezeldolap", "Yatakdolap", "Banyo", "Ivırzıvır"
]

// --- SADELEŞTİRİLMİŞ FİLTRELER (LİSTE İÇİN) ---
// PAYLAŞTIĞIN KODDA EKSİK OLAN KISIM BURASIYDI, EKLENDİ:
const filtreSecenekleri = [
  "Buzdolabı", "Kiler", "Balkondolap", "Ezeldolap", "Yatakdolap", "Banyo", "Ivırzıvır"
]

const yeniMalzeme = ref({ 
  ad: '', paketSayisi: 1, paketAgirligi: 1, birim: 'adet', skt: '', resim: '', konum: 'Kiler'
})

const toplamStokHesapla = computed(() => {
  return yeniMalzeme.value.paketSayisi * yeniMalzeme.value.paketAgirligi
})

// --- SIRALAMA VE FİLTRELEME MANTIĞI ---
const siraliVeFiltreliListe = computed(() => {
  let liste = kiler.value

  if (listeArama.value) {
    liste = liste.filter(i => i.malzeme_adi.toLowerCase().includes(listeArama.value.toLowerCase()))
  }

  if (seciliKonumFiltresi.value !== 'Hepsi') {
    // ÖZEL MANTIK: "Buzdolabı" seçilirse içinde "Buzdolabı" geçen HER YERİ getir.
    if (seciliKonumFiltresi.value === 'Buzdolabı') {
      liste = liste.filter(i => i.depo_yer && i.depo_yer.includes('Buzdolabı'))
    } else {
      liste = liste.filter(i => i.depo_yer === seciliKonumFiltresi.value)
    }
  }

  return liste.sort((a, b) => {
    const aKritik = stokAzMi(a)
    const bKritik = stokAzMi(b)
    // Kritikler en üste
    if (aKritik && !bKritik) return -1
    if (!aKritik && bKritik) return 1
    // Sonra SKT'ye göre (Yaklaşanlar üste)
    if (a.son_kullanma_tarihi && b.son_kullanma_tarihi) {
      return new Date(a.son_kullanma_tarihi) - new Date(b.son_kullanma_tarihi)
    }
    return 0
  })
})

function stokAzMi(item) {
  const miktar = parseFloat(item.miktar)
  const birim = item.birim.toLowerCase()
  if (['adet', 'paket', 'rulo', 'kavanoz', 'şişe'].includes(birim)) return miktar <= 3
  if (['gr', 'ml'].includes(birim)) return miktar <= 500
  if (['kg', 'litre', 'lt'].includes(birim)) return miktar <= 0.5
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
  
  // Resim yoksa otomatik AI çalıştır
  if (!yeniMalzeme.value.resim) {
    await aiResimUret(true) // true: sessiz mod (beklemeden kaydetmek için gerekirse)
  }

  const { error } = await supabase.from('kiler').insert({
    malzeme_adi: yeniMalzeme.value.ad.toLowerCase(),
    miktar: toplamStokHesapla.value, 
    birim: yeniMalzeme.value.birim,
    son_kullanma_tarihi: yeniMalzeme.value.skt || null,
    resim_url: yeniMalzeme.value.resim || 'https://placehold.co/300x300?text=' + yeniMalzeme.value.ad,
    depo_yer: yeniMalzeme.value.konum
  })
  
  if (!error) {
    alert("✅ Eklendi")
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

async function aiResimUret(sessiz = false) {
  if(!yeniMalzeme.value.ad) { if(!sessiz) alert("Önce ürün adını yazmalısın!"); return; }
  aiLoading.value = true
  const trToEn = { 'domates': 'tomato', 'biber': 'pepper', 'süt': 'milk', 'yumurta': 'egg', 'deterjan': 'detergent', 'salça': 'tomato paste' } 
  const arananKelime = yeniMalzeme.value.ad.toLowerCase().trim()
  const ingilizceIsim = trToEn[arananKelime] || arananKelime
  // Prompt: Yüksek kalite, stüdyo ışığı
  const prompt = `${ingilizceIsim} product photography, sharp focus, highly detailed, realistic white background, studio lighting, 8k`
  const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=300&height=300&nologo=true`
  yeniMalzeme.value.resim = aiUrl
  // Resim yüklenene kadar biraz bekle
  await new Promise(r => setTimeout(r, 800))
  aiLoading.value = false
}

function formatTarih(tarihStr) { if(!tarihStr) return ''; return new Date(tarihStr).toLocaleDateString('tr-TR') }
function sktGectiMi(tarihStr) { const bugun = new Date(); bugun.setHours(0,0,0,0); const skt = new Date(tarihStr); return skt < bugun }

onMounted(() => { getKiler(); getMalzemeKutuphanesi() })
</script>

<style scoped>
/* SAYFA YAPISI */
.page-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden; 
  background: #f8f9fa;
}

/* 1. SABİT ÜST BÖLÜM (HEADER) - MODERN VE SABİT */
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 48vh; /* Ekranın yaklaşık yarısı */
  background: #ffffff;
  z-index: 50; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  display: flex;
  flex-direction: column;
}

.header-top {
  padding: 15px 20px 5px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: #1a202c;
  letter-spacing: -0.5px;
}

.total-count {
  font-size: 12px;
  background: #edf2f7;
  padding: 4px 8px;
  border-radius: 12px;
  color: #4a5568;
  font-weight: 600;
}

/* FORM ALANI - Kendi içinde kayabilir */
.ekleme-formu-scroll {
  flex: 1;
  overflow-y: auto; /* Küçük ekranlarda form sığmazsa kaydır */
  padding: 10px 20px 20px 20px;
}

.ekleme-formu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-satir { margin-bottom: 5px; }

/* BÜYÜK YAZILAR (Inputlar) */
.big-text { font-size: 16px !important; padding: 12px !important; font-weight: 600; }

.modern-input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f7fafc;
  box-sizing: border-box;
  transition: all 0.2s;
  color: #2d3748;
}
.modern-input:focus { border-color: #2d3748; background: #fff; outline: none; }

.hesap-kutusu { display: flex; align-items: flex-end; gap: 5px; }
.girdi-grup { flex: 1; text-align: center; }
.girdi-grup label { font-size: 10px; font-weight: 700; color: #718096; display: block; margin-top: 2px;}
.genis { flex: 1.5; }
.carpim-isareti { font-size: 16px; padding-bottom: 22px; color: #cbd5e0; }

.alt-kontrol-satiri { display: flex; gap: 8px; margin-top: 5px; align-items: flex-end; }
.date-wrapper { flex: 2; }
.date-wrapper label { font-size: 10px; font-weight: 700; color: #718096; display: block; margin-bottom: 2px;}
.ai-btn { flex: 1; background: #6f42c1; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; height: 46px; font-size: 13px;}
.ekle-btn { flex: 2; background: #1a202c; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 16px; height: 46px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);}

.preview-area { display: flex; align-items: center; gap: 10px; background: #ebf8ff; padding: 8px; border-radius: 10px; margin-top: 5px; }
.preview-img { width: 30px; height: 30px; border-radius: 5px; object-fit: cover; }
.preview-text { font-size: 12px; color: #2b6cb0; }

/* 2. KAYDIRILABİLİR LİSTE BÖLÜMÜ */
.scrollable-content {
  margin-top: 48vh; /* Header yüksekliği kadar boşluk */
  height: calc(52vh - 80px); /* Kalan alan */
  overflow-y: auto; /* Sadece burası kayar */
  padding: 15px;
  padding-bottom: 100px;
  box-sizing: border-box;
}

/* FİLTRELER */
.konum-filtresi { display: flex; overflow-x: auto; gap: 8px; margin-bottom: 15px; padding-bottom: 5px; scrollbar-width: none; }
.konum-filtresi::-webkit-scrollbar { display: none; }
.konum-filtresi button { 
  padding: 8px 14px; 
  border: 1px solid #e2e8f0; 
  border-radius: 20px; 
  background: white; 
  white-space: nowrap; 
  font-size: 13px; 
  cursor: pointer; 
  color: #4a5568; 
  font-weight: 600;
}
.konum-filtresi button.active { background: #1a202c; color: white; border-color: #1a202c; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

.liste-arama-input { margin-bottom: 15px; border: 2px solid #e2e8f0; background: white; }

/* KARTLAR */
.item-card { 
  display: flex; align-items: center; 
  background: white; padding: 12px; margin-bottom: 12px; 
  border-radius: 16px; border: 1px solid #f0f0f0; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.02); 
  transition: transform 0.1s;
}
.thumb { 
  width: 90px; height: 90px; /* BÜYÜK RESİM */
  border-radius: 12px; margin-right: 15px; 
  object-fit: cover; border: 1px solid #edf2f7; 
  background-color: #f7fafc;
}
.info { flex: 1; min-width: 0; }
.baslik-satir { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.baslik-satir h3 { margin: 0; font-size: 17px; color: #1a202c; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%;}
.konum-badge { font-size: 10px; background: #edf2f7; padding: 3px 6px; border-radius: 6px; color: #4a5568; font-weight: 700; text-transform: uppercase; }

.stok-badge { font-size: 15px; font-weight: 700; display: block; margin: 4px 0; color: #2d3748; }
.uyari-yazisi { color: #e53e3e; font-size: 11px; background: #fff5f5; padding: 2px 5px; border-radius: 4px; margin-left: 5px; }

.skt-badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; display: inline-block; width: fit-content; font-weight: 600; margin-bottom: 8px;}
.skt-badge.guvenli { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
.skt-badge.tehlike { background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; }

.aksiyon-butonlari { display: flex; gap: 8px; }
.kullan-btn, .sil-btn { flex: 1; padding: 8px; font-size: 12px; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; transition: transform 0.1s;}
.kullan-btn { background: #edf2f7; color: #2d3748; }
.sil-btn { background: #fff5f5; color: #e53e3e; max-width: 60px; }
.kullan-btn:active, .sil-btn:active { transform: scale(0.95); }

/* KRİTİK STİL */
.item-card.kritik-stok { border: 1px solid #fc8181; background: #fffafa; }
.item-card.skt-gecti { opacity: 0.6; filter: grayscale(100%); }

.bos-liste { text-align: center; padding: 20px; color: #a0aec0; font-weight: 600; }
.bottom-spacer { height: 50px; }

/* MODAL */
.modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index: 2000; backdrop-filter: blur(3px); }
.modal-content { background: white; padding: 25px; border-radius: 20px; width: 85%; max-width: 320px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.buyuk-input { width: 100px; font-size: 30px; text-align: center; border: 2px solid #e2e8f0; border-radius: 12px; padding: 10px; font-weight: bold; color: #2d3748; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }
.iptal-btn, .onay-btn { flex: 1; padding: 12px; border-radius: 10px; font-weight: bold; border: none; cursor: pointer; font-size: 15px;}
.iptal-btn { background: #edf2f7; color: #4a5568; }
.onay-btn { background: #1a202c; color: white; }

@keyframes blink { 50% { opacity: 0.5; } }
</style>