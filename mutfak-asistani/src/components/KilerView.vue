<template>
  <div class="p-20">
    <h2>📦 Kiler ve Stok Yönetimi</h2>

    <div class="ekleme-formu">
      <h3>➕ Yeni Ürün Ekle</h3>
      
      <div class="form-satir">
        <label>Ürün Adı:</label>
        <input 
          v-model="yeniMalzeme.ad" 
          list="malzeme-onerileri" 
          placeholder="Örn: Tuvalet Kağıdı..." 
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
        Eklenecek Stok: <b>{{ toplamStokHesapla }} {{ yeniMalzeme.birim }}</b>
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
    
    <input v-model="listeArama" placeholder="Listede ara..." class="liste-arama-input">

    <div class="list">
      <div v-for="item in filtrelenmisListe" :key="item.id" class="item-card">
        <img 
          :src="item.resim_url || 'https://placehold.co/100x100?text=Urun'" 
          @error="$event.target.src='https://placehold.co/100x100?text=Resim+Yok'"
          class="thumb"
        >
        
        <div class="info">
          <h3>{{ item.malzeme_adi.toUpperCase() }}</h3>
          
          <div class="detaylar">
            <span class="stok-badge">{{ item.miktar }} {{ item.birim }}</span>
            
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
const secilenUrun = ref(null) // Modal için seçilen ürün
const dusulecekMiktar = ref(1) // Varsayılan düşülecek miktar

const yeniMalzeme = ref({ 
  ad: '', paketSayisi: 1, paketAgirligi: 1, birim: 'adet', skt: '', resim: '' 
})

const toplamStokHesapla = computed(() => {
  return yeniMalzeme.value.paketSayisi * yeniMalzeme.value.paketAgirligi
})

// Listede arama yapabilmek için computed
const filtrelenmisListe = computed(() => {
  if (!listeArama.value) return kiler.value
  return kiler.value.filter(i => i.malzeme_adi.toLowerCase().includes(listeArama.value.toLowerCase()))
})

async function getKiler() {
  const { data } = await supabase.from('kiler').select('*').order('son_kullanma_tarihi', { ascending: true })
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
    resim_url: yeniMalzeme.value.resim || 'https://placehold.co/100x100?text=' + yeniMalzeme.value.ad
  })
  if (!error) {
    alert("Stok Eklendi!")
    yeniMalzeme.value = { ad: '', paketSayisi: 1, paketAgirligi: 1, birim: 'adet', skt: '', resim: '' }
    getKiler()
  } else { alert("Hata: " + error.message) }
}

async function malzemeSil(id) {
  if(!confirm("Bu ürünü tamamen silmek istiyor musun?")) return;
  await supabase.from('kiler').delete().eq('id', id)
  getKiler()
}

// --- YENİ: STOK DÜŞME MANTIĞI ---
function stokDuzenleModalAc(item) {
  secilenUrun.value = item
  dusulecekMiktar.value = 1 // Varsayılan 1 olsun
}

function modalKapat() {
  secilenUrun.value = null
}

async function stoktanDus() {
  if (!secilenUrun.value) return
  if (dusulecekMiktar.value <= 0) return alert("Geçerli bir miktar girin.")

  const yeniStok = secilenUrun.value.miktar - dusulecekMiktar.value
  
  // Eğer stok sıfıra indiyse veya altına düştüyse 0 yapalım (Silmeyelim, 0 görünsün ki bittiği anlaşılsın)
  const guncelStok = yeniStok < 0 ? 0 : yeniStok

  const { error } = await supabase
    .from('kiler')
    .update({ miktar: guncelStok })
    .eq('id', secilenUrun.value.id)

  if (!error) {
    // alert("Stok güncellendi!") // Her seferinde uyarı vermesin, hızlı olsun
    modalKapat()
    getKiler()
  } else {
    alert("Hata oluştu.")
  }
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

.item-card { display: flex; align-items: flex-start; border: 2px solid #eee; margin-bottom: 12px; padding: 12px; border-radius: 10px; background: white; }
.thumb { width: 60px; height: 60px; border-radius: 8px; margin-right: 15px; object-fit: cover; border: 1px solid #ddd; }
.info { flex: 1; }
.info h3 { margin: 0 0 5px 0; font-size: 16px; color: #000; font-weight: 800;}
.stok-badge { font-weight: bold; font-size: 14px; color: #000; display: block; margin-bottom: 5px; }
.skt-badge { font-size: 12px; padding: 4px 8px; border-radius: 4px; display: inline-block; width: fit-content; font-weight: bold; }
.skt-badge.guvenli { background: #e8f5e9; color: #1b5e20; border: 1px solid #c8e6c9; }
.skt-badge.tehlike { background: #ffebee; color: #b71c1c; border: 1px solid #ffcdd2; }

/* Buton Grubu */
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
</style>