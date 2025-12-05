<template>
  <div class="view-container">
    
    <!-- 1. SABİT ÜST KISIM -->
    <div class="fixed-header">
      <h2 class="title">📝 Alışveriş Listesi</h2>
      
      <div class="input-row">
        <input 
          v-model="yeniUrun" 
          placeholder="Eksik ne var? (Örn: Süt)" 
          class="main-input"
          @keyup.enter="ekle"
          ref="inputRef"
        />
        <button @click="ekle" class="add-btn" :disabled="yukleniyor">
          {{ yukleniyor ? '...' : '➕' }}
        </button>
      </div>
    </div>

    <!-- 2. LİSTE ALANI -->
    <div class="scroll-content">
      
      <!-- Yükleniyor Durumu -->
      <div v-if="yukleniyor && liste.length === 0" class="loading-text">Liste yükleniyor...</div>

      <!-- Boş Liste Durumu -->
      <div v-else-if="liste.length === 0" class="empty-state">
        <div class="empty-icon">🛒</div>
        <p>Listeniz bomboş! Her şey tamam mı?</p>
      </div>

      <!-- Dolu Liste -->
      <div v-else class="shopping-list">
        <div 
          v-for="item in liste" 
          :key="item.id" 
          class="list-item"
          :class="{ completed: item.alindi }"
        >
          <!-- Checkbox ve İsim -->
          <div class="item-left" @click="toggleDurum(item)">
            <div class="checkbox">
              <span v-if="item.alindi">✔</span>
            </div>
            <span class="item-text">{{ item.malzeme_adi }}</span>
          </div>

          <!-- Sil Butonu -->
          <button @click="sil(item.id)" class="del-btn">🗑️</button>
        </div>
      </div>

      <!-- Alınanları Temizle Butonu -->
      <div v-if="tamamlananVarMi" class="clear-container">
        <button @click="tamamlananlariSil" class="clear-btn">
          🧹 Alınanları Temizle
        </button>
      </div>

      <div class="bottom-spacer"></div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { supabase } from '../supabase'

const liste = ref([])
const yeniUrun = ref('')
const yukleniyor = ref(false)
const inputRef = ref(null)

const tamamlananVarMi = computed(() => liste.value.some(i => i.alindi))

// Listeyi Çek
async function listeyiGetir() {
  yukleniyor.value = true
  const { data } = await supabase
    .from('alisveris_listesi')
    .select('*')
    .order('alindi', { ascending: true }) // Alınmayanlar üstte kalsın
    .order('created_at', { ascending: false })
  
  if (data) liste.value = data
  yukleniyor.value = false
}

// Ekle
async function ekle() {
  if (!yeniUrun.value.trim()) return
  const text = yeniUrun.value.trim()
  
  // Optimistik güncelleme (Hemen ekranda göster)
  const tempId = Date.now()
  liste.value.unshift({ id: tempId, malzeme_adi: text, alindi: false })
  yeniUrun.value = ''
  
  const { error } = await supabase.from('alisveris_listesi').insert({ malzeme_adi: text })
  
  if (error) {
    alert("Hata!")
    listeyiGetir() // Hata varsa geri al
  } else {
    // ID güncellemek için arka planda yenile
    listeyiGetir()
  }
  
  nextTick(() => inputRef.value?.focus())
}

// Durum Değiştir (Tik At)
async function toggleDurum(item) {
  // Anlık değişim
  item.alindi = !item.alindi
  
  // Listeyi yeniden sırala (alınanlar alta gitsin diye)
  liste.value.sort((a, b) => a.alindi === b.alindi ? 0 : a.alindi ? 1 : -1)

  await supabase
    .from('alisveris_listesi')
    .update({ alindi: item.alindi })
    .eq('id', item.id)
}

// Tek Sil
async function sil(id) {
  if(!confirm("Silinsin mi?")) return
  liste.value = liste.value.filter(i => i.id !== id)
  await supabase.from('alisveris_listesi').delete().eq('id', id)
}

// Toplu Sil (Sadece alınanları)
async function tamamlananlariSil() {
  if(!confirm("İşaretli olanların hepsi silinsin mi?")) return
  
  // Sadece işaretlilerin ID'lerini al
  const silinecekler = liste.value.filter(i => i.alindi).map(i => i.id)
  
  // UI Temizle
  liste.value = liste.value.filter(i => !i.alindi)
  
  // DB Temizle
  await supabase.from('alisveris_listesi').delete().in('id', silinecekler)
}

onMounted(() => {
  listeyiGetir()
})
</script>

<style scoped>
.view-container { 
  display: flex; flex-direction: column; height: 100%; 
  background: #fffbeb; /* Hafif sarımsı not defteri rengi */
  position: relative;
}

.fixed-header { 
  flex-shrink: 0; background: #fffbeb; padding: 15px; 
  border-bottom: 2px dashed #e5e7eb; text-align: center; 
}
.title { margin: 0 0 15px 0; font-size: 20px; color: #78350f; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }

.input-row { display: flex; gap: 10px; }
.main-input { 
  flex: 1; padding: 12px; border: 2px solid #fcd34d; background: white;
  border-radius: 12px; font-size: 16px; outline: none; font-weight: 500;
}
.main-input:focus { border-color: #f59e0b; }
.add-btn { 
  width: 50px; background: #f59e0b; color: white; border: none; 
  border-radius: 12px; font-size: 24px; cursor: pointer; 
}

.scroll-content { 
  flex: 1; overflow-y: auto; padding: 20px; 
  -webkit-overflow-scrolling: touch;
}

/* LİSTE STİLLERİ */
.shopping-list { display: flex; flex-direction: column; gap: 8px; }

.list-item { 
  display: flex; align-items: center; justify-content: space-between;
  background: white; padding: 12px; border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: all 0.2s;
  border-left: 4px solid #fbbf24;
}

.list-item.completed { 
  background: #f3f4f6; opacity: 0.6; border-left-color: #d1d5db; 
}

.item-left { display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer; }

.checkbox { 
  width: 24px; height: 24px; border: 2px solid #d1d5db; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; color: #10b981; font-weight: bold; font-size: 16px;
}
.completed .checkbox { border-color: #10b981; background: #d1fae5; }

.item-text { font-size: 16px; color: #374151; font-weight: 500; }
.completed .item-text { text-decoration: line-through; color: #9ca3af; }

.del-btn { background: none; border: none; font-size: 18px; cursor: pointer; padding: 5px; opacity: 0.5; }
.list-item:not(.completed) .del-btn { display: none; } /* Sadece tamamlanınca veya basınca görünsün istersen */
.list-item .del-btn { display: block; opacity: 1; } /* Her zaman görünür olsun */

/* CLEAN BUTTON */
.clear-container { margin-top: 20px; text-align: center; }
.clear-btn { 
  background: #fee2e2; color: #ef4444; border: none; 
  padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; cursor: pointer;
}

.empty-state { text-align: center; margin-top: 60px; color: #b45309; opacity: 0.6; }
.empty-icon { font-size: 50px; margin-bottom: 10px; }
.bottom-spacer { height: 80px; }
</style>