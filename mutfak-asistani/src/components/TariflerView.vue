<template>
  <div class="view-container">
    
    <!-- 1. SABİT ÜST KISIM -->
    <div class="fixed-header">
      <h2 class="title">✨ Lezzet Sihirbazı & Şef</h2>
      <div class="tabs">
        <button @click="mod = 'tarif'" :class="{ active: mod === 'tarif' }">Tek Tarif</button>
        <button @click="mod = 'menu'" :class="{ active: mod === 'menu' }">Günün Menüsü</button>
        <button @click="mod = 'chat'" :class="{ active: mod === 'chat' }">Şef'e Sor</button>
      </div>
    </div>

    <!-- 2. KAYDIRILABİLİR İÇERİK -->
    <div class="scroll-content">
      
      <!-- MOD: TEK TARİF ÜRETİCİ -->
      <div v-if="mod === 'tarif'" class="generator-box">
        <div v-if="!sonuc" class="input-area">
          <label>Dolapta ne var?</label>
          <textarea 
            v-model="malzemeler" 
            placeholder="Örn: 2 yumurta, biraz bayat ekmek, kaşar..."
            class="big-textarea"
          ></textarea>
          <button @click="tarifUret" class="action-btn" :disabled="loading">
            {{ loading ? 'Şef Düşünüyor... 🤔' : 'Tarif Oluştur ✨' }}
          </button>
        </div>

        <div v-else class="result-area">
          <div class="markdown-body">{{ sonuc }}</div>
          <button @click="sonuc = null" class="reset-btn">Yeni Tarif Dene</button>
        </div>
      </div>

      <!-- MOD: GÜNÜN MENÜSÜ (YENİ) -->
      <div v-else-if="mod === 'menu'" class="menu-box">
        <div class="menu-intro" v-if="!menuSonuc">
          <div class="chef-icon">👨‍🍳</div>
          <h3>Bugün Ne Pişirsem?</h3>
          <p>Kilerindeki tüm malzemeleri analiz edip sana özel <strong>tam bir menü</strong> (Ana yemek, yancı, salata vb.) hazırlayayım mı?</p>
          <button @click="menuOluştur" class="menu-btn" :disabled="loading">
            {{ loading ? 'Menü Hazırlanıyor... 🍳' : 'Günün Menüsünü Oluştur 🍽️' }}
          </button>
        </div>

        <div v-else class="menu-result">
          <h3 class="menu-title">🎉 Günün Menüsü</h3>
          <div class="menu-card">
            <div class="menu-content">{{ menuSonuc }}</div>
          </div>
          <div class="menu-actions">
            <button @click="menuOluştur" class="refresh-btn" :disabled="loading">
              {{ loading ? '...' : '🔄 Değiştir / Yeni Öneri' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MOD: CHAT -->
      <div v-else class="chat-box">
        <div v-for="(msg, i) in chatGecmisi" :key="i" class="chat-bubble" :class="msg.role">
          {{ msg.text }}
        </div>
        <div v-if="loading" class="chat-bubble model loading">...</div>
      </div>

      <!-- Alt inputun altında kalmaması için boşluk -->
      <div class="bottom-spacer"></div>
    </div>

    <!-- CHAT INPUT (Sadece Chat modunda en altta sabit) -->
    <div v-if="mod === 'chat'" class="fixed-bottom-input">
      <input v-model="chatInput" @keyup.enter="mesajGonder" placeholder="Bir soru sor..." />
      <button @click="mesajGonder">➤</button>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase' // Supabase eklendi

const mod = ref('tarif') // tarif | menu | chat
const loading = ref(false)
const apiKey = "" // API KEY BURAYA

// Tarif State
const malzemeler = ref('')
const sonuc = ref(null)

// Menü State
const menuSonuc = ref(null)

// Chat State
const chatInput = ref('')
const chatGecmisi = ref([
  { role: 'model', text: 'Merhaba! Ben Şef Gemini. Mutfağına hoş geldim.' }
])

// --- GEMINI API ÇAĞRISI ---
async function callGemini(prompt) {
  if(!apiKey) return "API Anahtarı eksik! Lütfen kodu güncelleyip API anahtarınızı girin.";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    
    if (!res.ok) throw new Error('API Hatası')
    
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Hata oluştu."
  } catch(e) { return "Bağlantı hatası veya API limiti." }
}

async function tarifUret() {
  if(!malzemeler.value) return;
  loading.value = true;
  const prompt = `Sen bir Türk şefisin. Elimdeki malzemeler: ${malzemeler.value}. Bana yaratıcı bir yemek tarifi ver.`;
  sonuc.value = await callGemini(prompt);
  loading.value = false;
}

// YENİ: GÜNÜN MENÜSÜ OLUŞTURMA
async function menuOluştur() {
  loading.value = true;
  
  // 1. Kilerdeki malzemeleri çek
  const { data: stoklar, error } = await supabase.from('kiler').select('malzeme_adi');
  
  if (error || !stoklar || stoklar.length === 0) {
    menuSonuc.value = "Kilerinde hiç ürün yok gibi görünüyor. Önce stok eklemelisin! 📦";
    loading.value = false;
    return;
  }

  const stokListesi = stoklar.map(i => i.malzeme_adi).join(', ');

  // 2. Gemini'ye Menü Sor
  const prompt = `
    Sen profesyonel bir ev aşçısısın. Evdeki stoklarım şunlar: [${stokListesi}].
    Bu malzemeleri (ve evde bulunabilecek temel yağ, salça, baharat gibi şeyleri) kullanarak bana birbiriyle uyumlu, tek öğünlük harika bir "Günün Menüsü" oluştur.
    Menüde Ana Yemek, Yardımcı Yemek (Pilav/Makarna vb.) ve Salata/İçecek olsun.
    
    Sadece menüdeki yemeklerin isimlerini alt alta şık bir liste olarak yaz. Tarif verme, sadece menüyü listele.
    Örnek Çıktı Formatı:
    🍲 Ana Yemek: [Yemek Adı]
    🍚 Yancı: [Yemek Adı]
    🥗 Ortaya: [Salata/Meze Adı]
    
    Not: Lütfen abartılı olmayan, bu malzemelerle yapılabilecek gerçekçi Türk mutfağı menüsü olsun.
  `;

  menuSonuc.value = await callGemini(prompt);
  loading.value = false;
}

async function mesajGonder() {
  if(!chatInput.value) return;
  const msg = chatInput.value;
  chatGecmisi.value.push({ role: 'user', text: msg });
  chatInput.value = '';
  loading.value = true;
  
  const cevap = await callGemini(`Kullanıcı mutfakla ilgili soruyor: ${msg}`);
  chatGecmisi.value.push({ role: 'model', text: cevap });
  loading.value = false;
}
</script>

<style scoped>
.view-container { 
  display: flex; flex-direction: column; height: 100%; 
  background: #f8f9fa; position: relative;
}

.fixed-header { 
  flex-shrink: 0; background: white; padding: 15px; 
  border-bottom: 1px solid #eee; text-align: center; 
}
.title { margin: 0 0 10px 0; font-size: 18px; color: #333; }
.tabs { display: flex; gap: 8px; justify-content: center; }
.tabs button { 
  padding: 8px 12px; border: 1px solid #eee; background: #fff; 
  border-radius: 20px; font-size: 12px; font-weight: 600; color: #666; transition: all 0.2s;
}
.tabs button.active { background: #f97316; color: white; border-color: #f97316; }

.scroll-content { 
  flex: 1; overflow-y: auto; padding: 20px; 
  overflow-x: hidden; -webkit-overflow-scrolling: touch;
}

/* TARİF ALANI */
.input-area label { display: block; font-weight: 700; color: #555; margin-bottom: 8px; }
.big-textarea { 
  width: 100%; height: 120px; padding: 15px; border: 1px solid #ddd; 
  border-radius: 12px; font-size: 16px; resize: none; margin-bottom: 15px; background: white;
}
.action-btn { width: 100%; padding: 15px; background: #f97316; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; }
.result-area { background: white; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
.reset-btn { width: 100%; margin-top: 15px; padding: 10px; background: #f1f3f5; color: #444; border: none; border-radius: 8px; font-weight: 600; }
.markdown-body { white-space: pre-wrap; color: #333; line-height: 1.6; }

/* YENİ: MENÜ ALANI */
.menu-box { text-align: center; padding: 10px; }
.menu-intro { display: flex; flex-direction: column; align-items: center; gap: 15px; margin-top: 20px; }
.chef-icon { font-size: 64px; margin-bottom: 10px; }
.menu-intro h3 { margin: 0; color: #333; font-size: 20px; }
.menu-intro p { color: #666; font-size: 14px; max-width: 280px; line-height: 1.5; margin: 0; }
.menu-btn { 
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
  color: white; border: none; padding: 15px 30px; border-radius: 30px; 
  font-weight: 700; font-size: 15px; cursor: pointer; 
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3); transition: transform 0.2s;
}
.menu-btn:active { transform: scale(0.95); }

.menu-result { animation: slideUp 0.3s ease-out; }
.menu-title { color: #ea580c; margin-bottom: 15px; font-size: 22px; }
.menu-card { 
  background: white; border: 2px solid #f97316; border-radius: 20px; 
  padding: 25px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-bottom: 20px; position: relative; overflow: hidden;
}
/* Arka plana şık bir desen */
.menu-card::after {
  content: "🍽️"; position: absolute; right: -10px; bottom: -10px; font-size: 100px; opacity: 0.05; pointer-events: none;
}
.menu-content { font-size: 16px; line-height: 1.8; color: #333; white-space: pre-wrap; font-weight: 500; }
.refresh-btn { 
  background: white; border: 2px solid #f97316; color: #f97316; 
  padding: 10px 20px; border-radius: 20px; font-weight: 700; cursor: pointer;
}

/* CHAT ALANI */
.chat-box { display: flex; flex-direction: column; gap: 10px; }
.chat-bubble { max-width: 80%; padding: 12px; border-radius: 12px; font-size: 14px; line-height: 1.4; }
.chat-bubble.model { align-self: flex-start; background: white; border: 1px solid #eee; color: #333; border-top-left-radius: 0; }
.chat-bubble.user { align-self: flex-end; background: #f97316; color: white; border-top-right-radius: 0; }
.chat-bubble.loading { opacity: 0.5; }

.fixed-bottom-input { 
  position: absolute; bottom: 0; left: 0; width: 100%; padding: 10px; 
  background: white; border-top: 1px solid #eee; display: flex; gap: 10px; z-index: 20;
}
.fixed-bottom-input input { 
  flex: 1; padding: 10px; background: #f1f3f5; border: none; 
  border-radius: 20px; padding-left: 15px; outline: none;
}
.fixed-bottom-input button { 
  width: 40px; height: 40px; border-radius: 50%; background: #f97316; 
  color: white; border: none; font-size: 18px; cursor: pointer;
}

.bottom-spacer { height: 70px; }

@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>