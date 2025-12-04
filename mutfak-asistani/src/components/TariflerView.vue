<template>
  <div class="view-container">
    
    <!-- 1. SABİT ÜST KISIM -->
    <div class="fixed-header">
      <h2 class="title">✨ Lezzet Sihirbazı & Şef</h2>
      <div class="tabs">
        <button @click="mod = 'tarif'" :class="{ active: mod === 'tarif' }">Tarif Üret</button>
        <button @click="mod = 'chat'" :class="{ active: mod === 'chat' }">Şef'e Sor</button>
      </div>
    </div>

    <!-- 2. KAYDIRILABİLİR İÇERİK -->
    <div class="scroll-content">
      
      <!-- MOD: TARİF ÜRETİCİ -->
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

const mod = ref('tarif') // tarif | chat
const loading = ref(false)
const apiKey = "" // API KEY BURAYA (İsteğe bağlı)

// Tarif State
const malzemeler = ref('')
const sonuc = ref(null)

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
/* ANA YAPI: Relative pozisyon ve %100 yükseklik önemli */
.view-container { 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
  background: #f8f9fa; 
  position: relative;
}

/* HEADER: Küçülmemesi için flex-shrink 0 */
.fixed-header { 
  flex-shrink: 0; 
  background: white; 
  padding: 15px; 
  border-bottom: 1px solid #eee; 
  text-align: center; 
}
.title { margin: 0 0 10px 0; font-size: 18px; color: #333; }
.tabs { display: flex; gap: 10px; justify-content: center; }
.tabs button { 
  padding: 8px 16px; 
  border: 1px solid #eee; 
  background: #fff; 
  border-radius: 20px; 
  font-size: 13px; 
  font-weight: 600; 
  color: #666; 
  transition: all 0.2s;
}
.tabs button.active { background: #f97316; color: white; border-color: #f97316; }

/* CONTENT: Kalan alanı doldur ve kaydır */
.scroll-content { 
  flex: 1; 
  overflow-y: auto; 
  padding: 20px; 
  overflow-x: hidden; /* Sağa sola oynamayı engelle */
  -webkit-overflow-scrolling: touch; /* iOS için akıcı kaydırma */
}

/* TARİF STİLLERİ */
.input-area label { display: block; font-weight: 700; color: #555; margin-bottom: 8px; }
.big-textarea { 
  width: 100%; 
  height: 120px; 
  padding: 15px; 
  border: 1px solid #ddd; 
  border-radius: 12px; 
  font-size: 16px; 
  resize: none; 
  margin-bottom: 15px; 
  background: white;
}
.action-btn { 
  width: 100%; 
  padding: 15px; 
  background: #f97316; 
  color: white; 
  border: none; 
  border-radius: 12px; 
  font-weight: 700; 
  font-size: 16px; 
  cursor: pointer;
}
.result-area { background: white; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
.reset-btn { width: 100%; margin-top: 15px; padding: 10px; background: #f1f3f5; color: #444; border: none; border-radius: 8px; font-weight: 600; }
.markdown-body { white-space: pre-wrap; color: #333; line-height: 1.6; }

/* CHAT STİLLERİ */
.chat-box { display: flex; flex-direction: column; gap: 10px; }
.chat-bubble { max-width: 80%; padding: 12px; border-radius: 12px; font-size: 14px; line-height: 1.4; }
.chat-bubble.model { align-self: flex-start; background: white; border: 1px solid #eee; color: #333; border-top-left-radius: 0; }
.chat-bubble.user { align-self: flex-end; background: #f97316; color: white; border-top-right-radius: 0; }
.chat-bubble.loading { opacity: 0.5; }

/* FIXED BOTTOM INPUT */
.fixed-bottom-input { 
  position: absolute; 
  bottom: 0; 
  left: 0; 
  width: 100%; 
  padding: 10px; 
  background: white; 
  border-top: 1px solid #eee; 
  display: flex; 
  gap: 10px;
  z-index: 20;
}
.fixed-bottom-input input { 
  flex: 1; 
  padding: 10px; 
  background: #f1f3f5; 
  border: none; 
  border-radius: 20px; 
  padding-left: 15px; 
  outline: none;
}
.fixed-bottom-input button { 
  width: 40px; 
  height: 40px; 
  border-radius: 50%; 
  background: #f97316; 
  color: white; 
  border: none; 
  font-size: 18px; 
  cursor: pointer;
}

/* Spacer: Inputun yüksekliğinden biraz fazla olmalı */
.bottom-spacer { height: 70px; }
</style>