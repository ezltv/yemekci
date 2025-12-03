<template>
  <div class="p-20">
    <h2>👨‍🍳 Akıllı Mutfak Şefi</h2>
    
    <div class="arama-container">
      <div class="input-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          v-model="aramaKelimesi" 
          placeholder="Yemek adı veya malzeme yaz... (Örn: Patates)" 
          type="text" 
          class="arama-input"
        >
        <button v-if="aramaKelimesi" @click="aramaKelimesi = ''" class="temizle-btn">✖</button>
      </div>

      <label class="switch-container" :class="{ 'aktif': sadeceYapilabilir }">
        <input type="checkbox" v-model="sadeceYapilabilir">
        <div class="switch-kutusu">
          <span class="switch-ikon">🥘</span>
          <span class="switch-text">Sadece Malzememin Yettiği</span>
        </div>
      </label>
    </div>

    <div class="kategori-satiri">
      <button 
        v-for="kat in kategoriler" 
        :key="kat"
        :class="{ active: seciliKategori === kat }"
        @click="kategoriSec(kat)"
      >
        {{ kat }}
      </button>
    </div>

    <hr>
    
    <div v-if="listeBosMu" class="bos-ekran">
      <div class="bos-ikon">👩‍🍳</div>
      <h3>Ne pişirmek istersin?</h3>
      <p>Yukarıya bir malzeme (örn: <b>Patates</b>) veya yemek adı yaz.</p>
      <p>Ya da <b>"Sadece Malzememin Yettiği"</b> butonuna basarak sihirli listeyi gör.</p>
    </div>

    <div v-else-if="filtrelenmisTarifler.length === 0" class="uyari">
      <p>😔 Aradığınız kriterlere uygun tarif bulunamadı.</p>
    </div>

    <div v-else class="liste-container">
      <p class="sonuc-sayisi">{{ filtrelenmisTarifler.length }} tarif bulundu</p>
      
      <div v-for="tarif in filtrelenmisTarifler" :key="tarif.id" class="tarif-card">
        <img 
          :src="tarif.resim_url || 'https://placehold.co/600x400?text=Yemek'" 
          @error="$event.target.src='https://placehold.co/600x400?text=Resim+Yok'"
          class="tarif-img"
          @click="modalAc(tarif)" 
        >
        
        <div class="content">
          <div class="baslik-satir">
            <h3>{{ tarif.baslik }}</h3>
            <span class="kategori-badge">{{ tarif.kategori }}</span>
          </div>
          
          <div class="malzeme-ozet">
            <span 
              v-for="m in tarif.malzemeler_detay" 
              :key="m.id" 
              :class="[
                stokKontrol(m.malzeme_adi, m.gerekli_miktar) ? 'var' : 'yok',
                aramaKelimesi && m.malzeme_adi.includes(aramaKelimesi.toLowerCase()) ? 'vurgulu' : ''
              ]"
            >
              {{ m.malzeme_adi }}
            </span>
          </div>

          <button 
            @click="modalAc(tarif)" 
            class="hazirla-btn"
            :class="pisirebilirMiyim(tarif) ? 'yesil' : 'turuncu'"
          >
            📖 Tarifi Oku & Pişir
          </button>
        </div>
      </div>
    </div>

    <div v-if="secilenTarif" class="modal-overlay" @click.self="modalKapat">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ secilenTarif.baslik }}</h3>
          <div>
            <button @click="duzenlemeModunuAc" class="edit-btn">✏️</button>
            <button @click="modalKapat" class="kapat-x">✖</button>
          </div>
        </div>

        <div class="tarif-metni-kutusu">
          <div v-if="!duzenlemeModu">
            <h4>📝 Hazırlanışı:</h4>
            <p>{{ secilenTarif.tarif_adimlari }}</p>
          </div>
          <div v-else class="editor-alani">
            <textarea v-model="secilenTarif.tarif_adimlari" rows="10"></textarea>
            <button @click="tarifiKaydet" class="kaydet-btn">💾 Kaydet</button>
          </div>
        </div>

        <hr class="modal-divider" v-if="!duzenlemeModu">

        <div v-if="!duzenlemeModu">
          <h4>🛒 Pişirme Onayı</h4>
          <div class="malzeme-listesi-scroll">
            <div v-for="(malzeme, index) in pisirmeListesi" :key="index" class="ayar-satir">
              <label :class="stokKontrol(malzeme.malzeme_adi, malzeme.dusulecek_miktar) ? '' : 'eksik-yazi'">
                {{ malzeme.malzeme_adi }}
              </label>
              <div class="input-group">
                <input type="number" v-model="malzeme.dusulecek_miktar" class="miktar-input">
                <span>{{ malzeme.birim }}</span>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="stoktanDusVeBitir" class="onay-btn">🔥 PİŞİRDİM (Stoktan Düş)</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'

const tarifler = ref([])
const kilerStoklari = ref({}) 
const secilenTarif = ref(null) 
const pisirmeListesi = ref([]) 
const aramaKelimesi = ref("") 
const seciliKategori = ref("Hepsi")
const sadeceYapilabilir = ref(false)
const duzenlemeModu = ref(false)

const kategoriler = [
  "Hepsi", "Çorba", "Ana Yemek", "Sebze", "Bakliyat",
  "Pilav", "Makarna", "Hamur İşi", "Kahvaltılık",
  "Tatlı", "Salata", "Aperatif", "İçecek", "Diyet", "Çocuk", "Sandviç"
]

// EKRAN BOŞ MU GÖZÜKSÜN?
const listeBosMu = computed(() => {
  // Eğer arama yoksa, kategori seçilmemişse VE "yapılabilir" kapalıysa -> BOŞ GÖSTER
  return !aramaKelimesi.value && !sadeceYapilabilir.value && seciliKategori.value === 'Hepsi'
})

const filtrelenmisTarifler = computed(() => {
  // Eğer boş moddaysak direkt boş dizi döndür (performans için)
  if (listeBosMu.value) return []

  let liste = tarifler.value

  // Kategori Filtresi
  if (seciliKategori.value !== "Hepsi") {
    liste = liste.filter(t => t.kategori.toLowerCase().includes(seciliKategori.value.toLowerCase()))
  }

  // Arama Filtresi (Hem Başlıkta Hem Malzemede Arar)
  if (aramaKelimesi.value) {
    const kucukHarf = aramaKelimesi.value.toLowerCase()
    liste = liste.filter(t => 
      t.baslik.toLowerCase().includes(kucukHarf) || 
      t.malzemeler_detay.some(m => m.malzeme_adi.toLowerCase().includes(kucukHarf))
    )
  }

  // Yapılabilirlik Filtresi
  if (sadeceYapilabilir.value) {
    liste = liste.filter(tarif => pisirebilirMiyim(tarif))
  }

  return liste
})

// Kategori seçince "Hepsi" ise kapat, değilse aç
function kategoriSec(kat) {
  if (seciliKategori.value === kat && kat !== 'Hepsi') {
    seciliKategori.value = 'Hepsi' // Tekrar basınca kapat
  } else {
    seciliKategori.value = kat
  }
}

// --- STANDART FONKSİYONLAR (Öncekilerle Aynı) ---
async function verileriGetir() {
  const { data: kilerData } = await supabase.from('kiler').select('malzeme_adi, miktar')
  kilerStoklari.value = kilerData.reduce((acc, item) => {
    acc[item.malzeme_adi] = (acc[item.malzeme_adi] || 0) + item.miktar
    return acc
  }, {})

  const { data: tarifData } = await supabase.from('tarifler').select(`*, tarif_malzemeleri (malzeme_adi, gerekli_miktar, birim)`)
  tarifler.value = tarifData.map(t => ({ ...t, malzemeler_detay: t.tarif_malzemeleri }))
}

function stokKontrol(malzemeAdi, gerekliMiktar) {
  const eldeki = kilerStoklari.value[malzemeAdi] || 0
  return eldeki >= gerekliMiktar
}

function pisirebilirMiyim(tarif) {
  return tarif.malzemeler_detay.every(m => stokKontrol(m.malzeme_adi, m.gerekli_miktar))
}

function modalAc(tarif) {
  secilenTarif.value = { ...tarif }; duzenlemeModu.value = false
  pisirmeListesi.value = tarif.malzemeler_detay.map(m => ({
    malzeme_adi: m.malzeme_adi, birim: m.birim, dusulecek_miktar: m.gerekli_miktar
  }))
}

function modalKapat() { secilenTarif.value = null; pisirmeListesi.value = [] }
function duzenlemeModunuAc() { duzenlemeModu.value = true }

async function tarifiKaydet() {
  const { error } = await supabase.from('tarifler').update({ tarif_adimlari: secilenTarif.value.tarif_adimlari }).eq('id', secilenTarif.value.id)
  if (!error) { alert("Kaydedildi!"); duzenlemeModu.value = false; verileriGetir() }
}

async function stoktanDusVeBitir() {
  if(!confirm("Stok düşülüyor?")) return;
  for (const malzeme of pisirmeListesi.value) {
    const { data: stocks } = await supabase.from('kiler').select('id, miktar').eq('malzeme_adi', malzeme.malzeme_adi).gt('miktar', 0).order('son_kullanma_tarihi', { ascending: true })
    let dus = malzeme.dusulecek_miktar
    if (stocks) {
       for (const s of stocks) {
         if (dus <= 0) break;
         if (s.miktar >= dus) { await supabase.from('kiler').update({ miktar: s.miktar - dus }).eq('id', s.id); dus = 0 }
         else { await supabase.from('kiler').update({ miktar: 0 }).eq('id', s.id); dus -= s.miktar }
       }
    }
  }
  alert('Afiyet olsun!'); modalKapat(); verileriGetir() 
}

onMounted(() => { verileriGetir() })
</script>

<style scoped>
.p-20 { padding: 20px; padding-bottom: 80px; }

/* ARAMA KUTUSU TASARIMI */
.arama-container { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
.input-wrapper { position: relative; width: 100%; }
.arama-input { width: 100%; padding: 15px 40px 15px 45px; border: 2px solid #000; border-radius: 50px; font-size: 16px; box-sizing: border-box; box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: 0.3s; }
.arama-input:focus { outline: none; border-color: #333; box-shadow: 0 6px 15px rgba(0,0,0,0.1); }
.search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-size: 20px; opacity: 0.5; }
.temizle-btn { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 18px; cursor: pointer; color: #999; }

/* SWITCH TASARIMI */
.switch-container { cursor: pointer; user-select: none; }
.switch-container input { display: none; }
.switch-kutusu { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f0f0f0; border-radius: 12px; transition: 0.3s; border: 2px solid transparent;}
.switch-text { font-weight: bold; font-size: 14px; color: #555; }
.switch-ikon { font-size: 20px; filter: grayscale(100%); }

/* Aktif Durum */
.switch-container.aktif .switch-kutusu { background: #e8f5e9; border-color: #2e7d32; }
.switch-container.aktif .switch-text { color: #2e7d32; }
.switch-container.aktif .switch-ikon { filter: grayscale(0%); transform: scale(1.1); }

/* BOŞ EKRAN TASARIMI */
.bos-ekran { text-align: center; padding: 50px 20px; color: #888; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.bos-ikon { font-size: 60px; margin-bottom: 10px; opacity: 0.7; }
.bos-ekran h3 { color: #333; margin: 0; }

.sonuc-sayisi { text-align: center; font-size: 12px; color: #999; margin-top: -10px; margin-bottom: 10px; }

/* Vurgulu Malzeme (Aramada çıkan) */
.malzeme-ozet span.vurgulu { background: #fff3e0; border-color: #ffb74d; color: #e65100; font-weight: bold; }

/* Diğer stiller aynı */
.kategori-satiri { display: flex; overflow-x: auto; gap: 8px; padding-bottom: 10px; margin-bottom: 10px; scrollbar-width: none; }
.kategori-satiri::-webkit-scrollbar { display: none; }
.kategori-satiri button { padding: 8px 16px; border: 1px solid #ccc; border-radius: 20px; background: white; white-space: nowrap; cursor: pointer; font-size: 13px; color: #555; }
.kategori-satiri button.active { background: black; color: white; border-color: black; font-weight: bold; }
.tarif-card { border: 2px solid #eee; border-radius: 12px; overflow: hidden; margin-bottom: 25px; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.tarif-img { width: 100%; height: 160px; object-fit: cover; cursor: pointer; }
.content { padding: 15px; }
.baslik-satir { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.content h3 { margin: 0; font-size: 18px; color: black; font-weight: 800;}
.kategori-badge { background: #eee; font-size: 10px; padding: 4px 8px; border-radius: 20px; font-weight: bold; color: #555; text-transform: uppercase; }
.malzeme-ozet { margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 5px; }
.malzeme-ozet span { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #ddd; font-weight: 500;}
.malzeme-ozet span.var { background: #e8f5e9; color: #1b5e20; border-color: #c8e6c9; }
.malzeme-ozet span.yok { background: #ffebee; color: #b71c1c; border-color: #ffcdd2; opacity: 0.6; }
.hazirla-btn { width: 100%; padding: 14px; border: none; font-weight: bold; cursor: pointer; border-radius: 8px; font-size: 15px; color: white;}
.hazirla-btn.yesil { background: #2e7d32; }
.hazirla-btn.turuncu { background: #f57f17; }
.modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:flex-end; z-index: 1000; }
.modal-content { background: white; width: 100%; max-width: 500px; height: 90vh; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; padding: 20px; box-sizing: border-box; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.modal-header h3 { margin: 0; font-size: 20px; }
.kapat-x { background: none; border: none; font-size: 24px; cursor: pointer; padding: 5px; }
.edit-btn { background: none; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; cursor: pointer; padding: 5px 10px; margin-right: 10px; }
.tarif-metni-kutusu { flex: 1; overflow-y: auto; background: #f9f9f9; padding: 15px; border-radius: 10px; border: 1px solid #eee; margin-bottom: 10px; }
.tarif-metni-kutusu p { white-space: pre-wrap; line-height: 1.6; color: #333; font-size: 15px; }
.editor-alani { display: flex; flex-direction: column; gap: 10px; }
.editor-alani textarea { width: 100%; padding: 10px; border: 2px solid #000; border-radius: 8px; font-family: inherit; box-sizing: border-box; }
.kaydet-btn { background: #000; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.modal-divider { margin: 10px 0; border: 0; border-top: 1px solid #eee; }
.malzeme-listesi-scroll { max-height: 150px; overflow-y: auto; margin-bottom: 15px; border: 1px solid #eee; padding: 5px; border-radius: 8px; }
.ayar-satir { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 5px; border-bottom: 1px solid #f9f9f9; }
.eksik-yazi { color: red; }
.input-group { display: flex; align-items: center; gap: 5px; }
.miktar-input { width: 60px; padding: 8px; border: 2px solid #000; border-radius: 8px; font-weight: bold; text-align: center; font-size: 16px;}
.onay-btn { width: 100%; background: black; color: white; border: none; padding: 15px; cursor: pointer; font-weight: bold; border-radius: 10px; font-size: 16px; margin-top: auto;}
@media (min-width: 600px) {
  .modal-overlay { align-items: center; }
  .modal-content { height: auto; max-height: 90vh; border-radius: 15px; }
}
</style>