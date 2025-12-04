<template>
  <div class="p-20">
    <h2>📦 Ev Envanteri & Stok Takibi</h2>

    <div class="ekleme-formu">
      <h3>➕ Yeni Ürün Girişi</h3>
      
      <div class="form-satir">
        <label>Ürün Adı:</label>
        <input 
          v-model="yeniMalzeme.ad" 
          list="malzeme-onerileri" 
          placeholder="Örn: Süt, Deterjan..." 
          type="text" 
          class="tam-genislik"
          @change="birimOtomatikSec" 
        >
        <datalist id="malzeme-onerileri">
          <option v-for="malzeme in malzemeKutuphanesi" :key="malzeme.id" :value="malzeme.ad">
            {{ malzeme.kategori }}
          </option>
        </datalist>
      </div>

      <div class="form-satir">
        <label>Nereye Koyacaksın?</label>
        <select v-model="yeniMalzeme.konum" class="tam-genislik">
          <option v-for="yer in depoYerleri" :key="yer" :value="yer">{{ yer }}</option>
        </select>
      </div>

      <div class="hesap-kutusu">
        <div class="girdi-grup">
          <label>Paket</label>
          <input v-model="yeniMalzeme.paketSayisi" type="number" placeholder="1">
        </div>
        <div class="carpim-isareti">✖</div>
        <div class="girdi-grup">
          <label>Miktar</label>
          <input v-model="yeniMalzeme.paketAgirligi" type="number" placeholder="1">
        </div>
        <div class="girdi-grup">
          <label>Birim</label>
          <select v-model="yeniMalzeme.birim">
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

      <div class="form-satir">
        <label>Son Kullanma Tarihi (SKT):</label>
        <input v-model="yeniMalzeme.skt" type="date" class="tam-genislik tarih-input">
      </div>

      <p class="ozet-bilgi">
        Toplam Stok: <b>{{ toplamStokHesapla }} {{ yeniMalzeme.birim }}</b>
        <br>
        <small>Konum: {{ yeniMalzeme.konum }}</small>
      </p>

      <div class="form-satir">
        <div class="resim-bulucu">
          <input v-model="yeniMalzeme.resim" placeholder="Resim URL..." type="text" class="link-input">
          <button @click="googleResimAra(yeniMalzeme.ad)" class="google-btn">🔍 Bul</button>
        </div>
      </div>

      <button @click="malzemeEkle" class="ekle-btn">✅ Depoya Kaydet</button>
    </div>

    <hr>

    <h3>Evdeki Envanter</h3>

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

    <input v-model="listeArama" placeholder="Listede ara..." class="liste-arama-input">

    <div class="list">
      <div 
        v-for="item in siraliVeFiltreliListe" 
        :key="item.id" 
        class="item-card"
        :class="{ 'kritik-stok': stokAzMi(item), 'skt-gecti': sktGectiMi(item.son_kullanma_tarihi) }"
      >
        <img 
          :src="item.resim_url || 'https://placehold.co/100x100?text=Urun'" 
          @error="$event.target.src='https://placehold.co/100x100?text=Resim+Yok'"
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
              <b v-if="stokAzMi(item)" class="uyari-yazisi">⚠️ AZ KALDI!</b>
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
          <button @click="stoktanDus" class="onay-btn">✅ Stoktan Düş</button>
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

// SABİT DEPO YERLERİ
const depoYerleri = [
  "Buzdolabı", "Kiler", "Balkondolap", "Ezeldolap", 
  "Yatakdolap", "Banyo", "Ivırzıvır"
]

const yeniMalzeme = ref({ 
  ad: '', paketSayisi: 1, paketAgirligi: 1, birim: 'adet', skt: '', resim: '', konum: 'Kiler'
})

const toplamStokHesapla = computed(() => {
  return yeniMalzeme.value.paketSayisi * yeniMalzeme.value.paketAgirligi
})

// --- KRİTİK ALGORİTMA: SIRALAMA VE FİLTRELEME ---
const siraliVeFiltreliListe = computed(() => {
  let liste = kiler.value

  // 1. Arama Filtresi
  if (listeArama.value) {
    liste = liste.filter(i => i.malzeme_adi.toLowerCase().includes(listeArama.value.toLowerCase()))
  }

  // 2. Konum Filtresi
  if (seciliKonumFiltresi.value !== 'Hepsi') {
    liste = liste.filter(i => i.depo_yer === seciliKonumFiltresi.value)
  }

  // 3. Sıralama (Kritik Stok en üste > SKT Geçenler > Diğerleri)
  return liste.sort((a, b) => {
    const aKritik = stokAzMi(a)
    const bKritik = stokAzMi(b)
    
    // Biri kritik diğeri değilse, kritik olan üste
    if (aKritik && !bKritik) return -1
    if (!aKritik && bKritik) return 1

    // İkisi de aynı durumdaysa SKT'ye bak
    if (a.son_kullanma_tarihi && b.son_kullanma_tarihi) {
      return new Date(a.son_kullanma_tarihi) - new Date(b.son_kullanma_tarihi)
    }
    return 0
  })
})

// --- KRİTİK STOK KONTROLÜ ---
function stokAzMi(item) {
  const miktar = parseFloat(item.miktar)
  const birim = item.birim.toLowerCase()

  // Adet, Paket, Rulo için sınır: 3
  if (['adet', 'paket', 'rulo', 'kavanoz', 'şişe'].includes(birim)) {
    return miktar <= 3
  }
  // Gram, Mililitre için sınır: 500
  if (['gr', 'ml'].includes(birim)) {
    return miktar <= 500
  }
  // KG, Litre için sınır: 0.5
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
    resim_url: yeniMalzeme.value.resim || 'https://placehold.co/100x100?text=' + yeniMalzeme.value.ad,
    depo_yer: yeniMalzeme.value.konum // YENİ: Konumu kaydet
  })
  if (!error) {
    alert("Stok Eklendi!")
    // Formu sıfırla ama konumu koru (belki aynı yere ekler)
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

function googleResimAra(kelime) {
  if(!kelime) return alert("Önce ürün adını yazmalısın!");
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(kelime)}`;
  window.open(url, '_blank');
}

function formatTarih(tarihStr) { if(!tarihStr) return ''; return new Date(tarihStr).toLocaleDateString('tr-TR') }
function sktGectiMi(tarihStr) { const bugun = new Date(); bugun.setHours(0,0,0,0); const skt = new Date(tarihStr); return skt < bugun }

onMounted(() => { getKiler(); getMalzemeKutuphanesi() })
</script>

<style scoped>
.p-20 { padding: 20px; padding-bottom: 80px; }
.ekleme-formu { background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e9ecef; }
.form-satir { margin-bottom: 15px; }
.form-satir label { display: block; font-weight: bold; margin-bottom: 5px; color: #000; }
.tam-genislik { width: 100%; padding: 10px; border: 2px solid #000; border-radius: 8px; box-sizing: border-box; font-size: 16px; }
.tarih-input { font-family: inherit; font-size: 16px; }
.hesap-kutusu { display: flex; align-items: flex-end; gap: 10px; margin-bottom: 15px; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #ccc; }
.girdi-grup { flex: 1; display: flex; flex-direction: column; }
.girdi-grup label { font-size: 11px; margin-bottom: 3px; font-weight: bold; text-align: center; color: #000;}
.girdi-grup input, .girdi-grup select { padding: 8px; border: 2px solid #000; border-radius: 6px; width: 100%; box-sizing: border-box; text-align: center; font-weight: bold;}
.carpim-isareti { font-size: 18px; font-weight: bold; color: #000; padding-bottom: 8px; }
.ozet-bilgi { background: #e8f5e9; color: #000; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #c8e6c9; margin-bottom: 15px; font-weight: bold;}
.resim-bulucu { display: flex; gap: 5px; }
.link-input { flex: 1; padding: 10px; border: 2px solid #000; border-radius: 6px; box-sizing: border-box; }
.google-btn { background: #4285F4; color: white; border: none; border-radius: 6px; padding: 0 15px; cursor: pointer; font-weight: bold; }
.ekle-btn { width: 100%; background: #000; color: white; padding: 14px; font-weight: bold; cursor: pointer; border: none; border-radius: 8px; font-size: 16px;}
.liste-arama-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 15px; box-sizing: border-box; }

/* KONUM FİLTRESİ (TABLAR) */
.konum-filtresi { display: flex; overflow-x: auto; gap: 5px; margin-bottom: 15px; padding-bottom: 5px; scrollbar-width: none; }
.konum-filtresi::-webkit-scrollbar { display: none; }
.konum-filtresi button { padding: 8px 12px; border: 1px solid #ccc; border-radius: 20px; background: white; white-space: nowrap; font-size: 12px; cursor: pointer; color: #555; }
.konum-filtresi button.active { background: black; color: white; border-color: black; font-weight: bold; }

/* LİSTE KARTLARI */
.item-card { display: flex; align-items: flex-start; border: 2px solid #eee; margin-bottom: 12px; padding: 12px; border-radius: 10px; background: white; transition: 0.3s; }
.thumb { width: 60px; height: 60px; border-radius: 8px; margin-right: 15px; object-fit: cover; border: 1px solid #ddd; }
.info { flex: 1; }
.baslik-satir { display: flex; justify-content: space-between; align-items: flex-start; }
.info h3 { margin: 0 0 5px 0; font-size: 16px; color: #000; font-weight: 800;}
.konum-badge { font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 4px; color: #666; font-weight: bold; }

.stok-badge { font-weight: bold; font-size: 14px; color: #000; display: block; margin-bottom: 5px; }
.uyari-yazisi { color: red; font-weight: 900; animation: blink 1.5s infinite; margin-left: 5px; font-size: 12px;}

.skt-badge { font-size: 12px; padding: 4px 8px; border-radius: 4px; display: inline-block; width: fit-content; font-weight: bold; }
.skt-badge.guvenli { background: #e8f5e9; color: #1b5e20; border: 1px solid #c8e6c9; }
.skt-badge.tehlike { background: #ffebee; color: #b71c1c; border: 1px solid #ffcdd2; }

/* KRİTİK STOK STİLİ */
.item-card.kritik-stok { border: 2px solid #ef9a9a; background: #fff8f8; }
.item-card.skt-gecti { opacity: 0.7; border: 2px solid #ccc; background: #f0f0f0; }

.aksiyon-butonlari { display: flex; gap: 10px; margin-top: 10px; }
.kullan-btn { flex: 2; background: #e0e0e0; border: 1px solid #999; border-radius: 6px; padding: 8px; font-weight: bold; cursor: pointer; color: #333; }
.sil-btn { flex: 1; background: #ffebee; color: #c62828; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold; border: 1px solid #ef9a9a;}

/* MODAL */
.modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index: 1000; }
.modal-content { background: white; padding: 20px; border-radius: 15px; width: 85%; max-width: 350px; text-align: center; }
.modal-input-area { margin: 20px 0; }
.input-group { display: flex; align-items: center; justify-content: center; gap: 10px; }
.buyuk-input { width: 80px; padding: 10px; font-size: 20px; text-align: center; border: 2px solid #000; border-radius: 8px; font-weight: bold; }
.modal-actions { display: flex; gap: 10px; }
.iptal-btn { flex: 1; background: #f5f5f5; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }
.onay-btn { flex: 2; background: black; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }

@keyframes blink { 50% { opacity: 0.5; } }
</style>