<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { 
  ChefHat, Sparkles, Send, Utensils, ArrowLeft, Loader2, MessageSquare, 
  Refrigerator, Package, Plus, Trash2, Calendar, AlertTriangle, X, Check, 
  Search, Minus, Settings 
} from 'lucide-vue-next';

// --- GENEL STATE ---
const activeTab = ref('home'); // home, pantry, generator, chat
const apiKey = ref(""); // Buraya API Key gelecek (veya env'den çekilecek)

// --- CHAT & AI STATE ---
const ingredients = ref('');
const recipeResult = ref(null);
const isGenerating = ref(false);
const chatHistory = ref([{ role: 'model', text: 'Merhaba! Ben Şef Gemini. Mutfağına hoş geldim.' }]);
const chatInput = ref('');
const isChatting = ref(false);
const chatContainer = ref(null); // Scroll için ref

// --- KİLER STATE (LOCAL STORAGE) ---
const depoYerleri = [
  "Buzdolabı Üst Raf", "Buzdolabı Ara Raf", "Buzdolabı Alt Raf", 
  "Buzdolabı Kapak", "Buzdolabı Sebzelik",
  "Kiler", "Balkondolap", "Ezeldolap", "Yatakdolap", "Banyo", "Ivırzıvır"
];

const filtreSecenekleri = ["Hepsi", "Buzdolabı", "Kiler", "Balkondolap", "Ezeldolap", "Yatakdolap", "Banyo", "Ivırzıvır"];

const defaultItems = [
  { id: 1, name: 'Köy Yumurtası', location: 'Buzdolabı Üst Raf', quantity: 15, unit: 'adet', expiry: '2025-06-20', image: 'https://image.pollinations.ai/prompt/eggs%20carton%20product%20photo?width=300&height=300&nologo=true' },
  { id: 2, name: 'Süt', location: 'Buzdolabı Kapak', quantity: 2, unit: 'şişe', expiry: '2023-11-01', image: 'https://image.pollinations.ai/prompt/milk%20bottle%20product%20photo?width=300&height=300&nologo=true' }, 
  { id: 3, name: 'Osmancık Pirinç', location: 'Kiler', quantity: 2.5, unit: 'kg', expiry: '2025-12-01', image: 'https://image.pollinations.ai/prompt/rice%20bag%20product%20photo?width=300&height=300&nologo=true' },
];

// LocalStorage'dan Veri Çekme
const pantryItems = ref([]);

onMounted(() => {
  const saved = localStorage.getItem('yemekci_kiler_vue_v1');
  if (saved) {
    pantryItems.value = JSON.parse(saved);
  } else {
    pantryItems.value = defaultItems;
  }
});

// Veri Değiştikçe Kaydetme (Deep Watch)
watch(pantryItems, (newVal) => {
  localStorage.setItem('yemekci_kiler_vue_v1', JSON.stringify(newVal));
}, { deep: true });

// --- FİLTRELEME ---
const selectedFilter = ref('Hepsi');
const searchQuery = ref('');

// --- MODAL STATE ---
const isAddModalOpen = ref(false);
const isConsumeModalOpen = ref(false);
const aiLoading = ref(false);

const newItem = ref({
  ad: '', 
  konum: 'Kiler', 
  paketSayisi: 1, 
  paketAgirligi: 1, 
  birim: 'adet', 
  skt: '', 
  resim: ''
});

const selectedItemToConsume = ref(null);
const consumeAmount = ref('');

// --- COMPUTED (HESAPLAMALAR) ---
const toplamEklenecekMiktar = computed(() => {
  return newItem.value.paketSayisi * newItem.value.paketAgirligi;
});

// Düşük Stok Kontrolü
const checkLowStock = (item) => {
  const qty = parseFloat(item.quantity);
  const unit = item.unit.toLowerCase();
  
  if (['adet', 'paket', 'rulo', 'kavanoz', 'şişe'].includes(unit)) return qty <= 3;
  if (['gr', 'ml'].includes(unit)) return qty <= 500;
  if (['kg', 'litre', 'lt'].includes(unit)) return qty <= 0.5;
  
  return false;
};

// Sıralı ve Filtreli Liste
const filteredItems = computed(() => {
  let list = pantryItems.value;
  
  if (searchQuery.value) {
    list = list.filter(item => item.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }

  if (selectedFilter.value !== 'Hepsi') {
    if (selectedFilter.value === 'Buzdolabı') {
      list = list.filter(item => item.location.includes('Buzdolabı'));
    } else {
      list = list.filter(item => item.location === selectedFilter.value);
    }
  }
  
  // Sıralama
  return [...list].sort((a, b) => {
    const aLow = checkLowStock(a);
    const bLow = checkLowStock(b);
    if (aLow && !bLow) return -1;
    if (!aLow && bLow) return 1;
    return 0;
  });
});

// --- FONKSİYONLAR ---

const checkExpiryStatus = (dateString) => {
  if (!dateString) return 'safe';
  const today = new Date();
  const expiry = new Date(dateString);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  if (diffDays < 0) return 'expired';
  if (diffDays <= 3) return 'warning';
  return 'safe';
};

// AI Resim Üretme
const aiResimUret = async () => {
  if (!newItem.value.ad) return alert("Önce ürün adını yazmalısın!");
  aiLoading.value = true;
  
  const arananKelime = newItem.value.ad.toLowerCase().trim();
  const trToEn = { 'domates': 'tomato', 'biber': 'pepper', 'süt': 'milk', 'yumurta': 'egg', 'deterjan': 'detergent', 'salça': 'tomato paste', 'pirinç': 'rice', 'mercimek': 'lentils', 'makarna': 'pasta', 'ekmek': 'bread', 'peynir': 'cheese' };
  const ingilizceIsim = trToEn[arananKelime] || arananKelime;
  
  const prompt = `${ingilizceIsim} product photography, sharp focus, highly detailed, realistic white background, studio lighting, 8k`;
  const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=300&height=300&nologo=true`;
  
  await new Promise(r => setTimeout(r, 1000));
  newItem.value.resim = aiUrl;
  aiLoading.value = false;
};

// Ürün Ekleme
const handleAddItem = async () => {
  if (!newItem.value.ad) return;
  
  let finalResim = newItem.value.resim;
  if (!finalResim) {
    const arananKelime = newItem.value.ad.toLowerCase().trim();
    finalResim = `https://image.pollinations.ai/prompt/${encodeURIComponent(arananKelime + " product photo") }?width=300&height=300&nologo=true`;
  }

  const newItemObj = {
    id: Date.now(),
    name: newItem.value.ad,
    location: newItem.value.konum,
    quantity: toplamEklenecekMiktar.value,
    unit: newItem.value.birim,
    expiry: newItem.value.skt,
    image: finalResim
  };

  pantryItems.value.push(newItemObj);
  isAddModalOpen.value = false;
  // Reset form
  newItem.value = { ...newItem.value, ad: '', resim: '', paketSayisi: 1, paketAgirligi: 1, skt: '' };
};

// Tüketim Modal Aç
const openConsumeModal = (item) => {
  selectedItemToConsume.value = item;
  consumeAmount.value = '';
  isConsumeModalOpen.value = true;
};

// Stoktan Düş
const handleConsume = () => {
  if (!selectedItemToConsume.value || !consumeAmount.value) return;
  
  const amount = parseFloat(consumeAmount.value);
  if (isNaN(amount) || amount <= 0) return alert("Geçerli miktar girin");

  const itemIndex = pantryItems.value.findIndex(i => i.id === selectedItemToConsume.value.id);
  if (itemIndex !== -1) {
    const item = pantryItems.value[itemIndex];
    const newQty = Math.max(0, item.quantity - amount);
    pantryItems.value[itemIndex] = { ...item, quantity: newQty };
  }

  isConsumeModalOpen.value = false;
};

// Silme
const removeItem = (id) => {
  if (confirm('Bu ürünü kalıcı olarak silmek istediğine emin misin?')) {
    pantryItems.value = pantryItems.value.filter(i => i.id !== id);
  }
};

// --- GEMINI API ---
const callGemini = async (prompt) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey.value}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Hata oluştu.";
  } catch (e) { return "Bağlantı hatası."; }
};

const handleGenerateRecipe = async () => {
  let promptIng = ingredients.value;
  if (!ingredients.value.trim() && pantryItems.value.length > 0) {
     promptIng = pantryItems.value.map(i => i.name).join(', ');
  }
  if (!promptIng.trim()) return;
  isGenerating.value = true;
  recipeResult.value = null;
  const result = await callGemini(`Sen bir Türk şefisin. Malzemeler: "${promptIng}". Harika bir tarif ver.`);
  recipeResult.value = result;
  isGenerating.value = false;
};

const handleSendMessage = async () => {
  if (!chatInput.value.trim()) return;
  const msg = chatInput.value;
  chatHistory.value.push({ role: 'user', text: msg });
  chatInput.value = '';
  isChatting.value = true;
  
  // Scroll to bottom
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  });

  const reply = await callGemini(`Mutfak asistanısın. Soru: ${msg}`);
  chatHistory.value.push({ role: 'model', text: reply });
  isChatting.value = false;
  
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  });
};
</script>

<template>
  <div class="h-screen w-full bg-white sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-200 overflow-hidden relative">
    
    <!-- HOME TAB -->
    <div v-if="activeTab === 'home'" class="p-6 flex flex-col items-center justify-center h-full space-y-6 animate-fadeIn">
      <div class="bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-full shadow-lg ring-4 ring-white">
        <ChefHat :size="64" class="text-orange-600" />
      </div>
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-800">Yemekçi App</h1>
        <p class="text-gray-500 text-sm mt-1">Stok Takip & Şef Asistanı</p>
      </div>
      
      <div class="w-full grid grid-cols-2 gap-4 mt-8">
        <button @click="activeTab = 'pantry'" class="col-span-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-between group">
          <div class="flex items-center gap-4">
            <div class="bg-white p-3 rounded-xl shadow-sm"><Refrigerator :size="28" class="text-blue-600"/></div>
            <div class="text-left">
              <div class="font-bold text-xl text-gray-800">Kiler & Depo</div>
              <div class="text-gray-500 text-xs">{{ pantryItems.length }} Ürün Mevcut</div>
            </div>
          </div>
          <Settings class="text-blue-400 group-hover:rotate-45 transition-transform" />
        </button>

        <button @click="activeTab = 'generator'" class="bg-orange-600 text-white p-4 rounded-2xl shadow-md active:scale-95 transition-all flex flex-col items-center justify-center gap-2">
          <Sparkles :size="32" />
          <span class="font-bold">Tarif Üret</span>
        </button>

        <button @click="activeTab = 'chat'" class="bg-white border-2 border-orange-100 text-gray-800 p-4 rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-2">
          <MessageSquare :size="32" class="text-orange-500"/>
          <span class="font-bold">Şef'e Sor</span>
        </button>
      </div>
    </div>

    <!-- PANTRY TAB -->
    <div v-if="activeTab === 'pantry'" class="flex flex-col h-full bg-gray-50 relative">
      <div class="bg-white p-4 shadow-sm flex items-center gap-3 z-20">
        <button @click="activeTab = 'home'" class="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft :size="24" /></button>
        <div class="flex-1">
           <h2 class="font-bold text-xl text-gray-800">Stoklarım</h2>
           <span class="text-xs text-gray-400 font-medium">{{ pantryItems.length }} parça ürün</span>
        </div>
        <button @click="isAddModalOpen = true" class="bg-blue-600 text-white p-2 rounded-xl active:scale-90 transition-transform shadow-lg shadow-blue-200">
           <Plus :size="24" />
        </button>
      </div>

      <!-- Filtreler -->
      <div class="bg-white border-b border-gray-100 px-4 pb-3">
        <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <button 
            v-for="filter in filtreSecenekleri" 
            :key="filter"
            @click="selectedFilter = filter"
            class="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors"
            :class="selectedFilter === filter ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ filter }}
          </button>
        </div>
        <div class="mt-2 relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
          <input 
            type="text" 
            placeholder="Envanterde ara..." 
            v-model="searchQuery"
            class="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <!-- Liste -->
      <div class="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
        <div v-if="filteredItems.length === 0" class="text-center text-gray-400 mt-20 flex flex-col items-center">
             <Package :size="64" class="mb-4 opacity-20" />
             <p>Bu konumda ürün yok.</p>
        </div>
        
        <div v-else v-for="item in filteredItems" :key="item.id" 
             class="bg-white p-3 rounded-2xl shadow-sm border flex gap-3 items-center animate-fadeIn"
             :class="[
               checkExpiryStatus(item.expiry) === 'expired' ? 'opacity-60 grayscale border-gray-100' : '',
               checkLowStock(item) ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'
             ]"
        >
          <!-- Resim -->
          <div class="w-20 h-20 bg-gray-50 rounded-xl shrink-0 overflow-hidden border border-gray-100 relative">
             <img :src="item.image" class="w-full h-full object-cover" :alt="item.name" @error="$event.target.src = 'https://placehold.co/150x150?text=Urun'" />
             <div v-if="checkExpiryStatus(item.expiry) === 'expired'" class="absolute inset-0 bg-red-500/20 flex items-center justify-center text-white font-bold text-xs">SKT!</div>
          </div>

          <!-- Bilgi -->
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
              <h3 class="font-bold text-gray-800 truncate pr-2">{{ item.name }}</h3>
              <span class="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold uppercase tracking-wide truncate max-w-[80px]">
                {{ item.location }}
              </span>
            </div>
            
            <div class="flex items-center gap-2 mt-1">
              <span class="text-lg font-bold" :class="checkLowStock(item) ? 'text-orange-600' : 'text-blue-600'">{{ item.quantity }}</span>
              <span class="text-sm font-medium text-gray-500">{{ item.unit }}</span>
              
              <span v-if="checkLowStock(item)" class="flex items-center gap-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded ml-auto">
                <AlertTriangle :size="10" /> AZ KALDI
              </span>
            </div>

            <div v-if="item.expiry" class="text-xs mt-1 font-medium flex items-center gap-1"
                 :class="[
                    checkExpiryStatus(item.expiry) === 'expired' ? 'text-red-500' : 
                    checkExpiryStatus(item.expiry) === 'warning' ? 'text-orange-500' : 'text-green-600'
                 ]"
            >
               <Calendar :size="10" />
               {{ 
                  checkExpiryStatus(item.expiry) === 'expired' ? 'Tarihi Geçti' : 
                  checkExpiryStatus(item.expiry) === 'warning' ? 'SKT Yakın' : item.expiry 
               }}
            </div>
          </div>

          <!-- Butonlar -->
          <div class="flex flex-col gap-2">
             <button @click="openConsumeModal(item)" class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:scale-95">
                <Utensils :size="18" />
             </button>
             <button @click="removeItem(item.id)" class="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 active:scale-95">
                <Trash2 :size="18" />
             </button>
          </div>
        </div>
      </div>

      <!-- EKLEME MODALI -->
      <div v-if="isAddModalOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div class="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
             <div class="flex justify-between items-center mb-6">
               <h3 class="text-xl font-bold text-gray-800">Yeni Ürün Ekle</h3>
               <button @click="isAddModalOpen = false" class="p-2 bg-gray-100 rounded-full"><X :size="20"/></button>
             </div>

             <div class="space-y-4">
               <div class="flex items-center gap-4">
                 <div class="w-20 h-20 bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    <img v-if="newItem.resim" :src="newItem.resim" class="w-full h-full object-cover" />
                    <Loader2 v-else-if="aiLoading" class="animate-spin text-blue-500"/>
                    <Package v-else class="text-gray-300"/>
                 </div>
                 <div class="flex-1">
                    <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Ürün Adı</label>
                    <div class="flex gap-2">
                      <input 
                        type="text" 
                        v-model="newItem.ad"
                        placeholder="Örn: Süt"
                        class="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                      />
                      <button @click="aiResimUret" :disabled="aiLoading || !newItem.ad" class="bg-purple-100 text-purple-600 px-3 py-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center">
                        <Sparkles :size="14"/> AI Resim
                      </button>
                    </div>
                 </div>
               </div>

               <div>
                 <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Konum</label>
                 <select v-model="newItem.konum" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700">
                   <option v-for="yer in depoYerleri" :key="yer" :value="yer">{{ yer }}</option>
                 </select>
               </div>

               <div class="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div class="text-center">
                    <label class="text-[10px] font-bold text-gray-400 block mb-1">Paket</label>
                    <input type="number" v-model="newItem.paketSayisi" class="w-full text-center bg-white p-2 rounded-lg border outline-none font-bold"/>
                  </div>
                  <div class="flex items-center justify-center text-gray-400 font-bold">X</div>
                  <div class="text-center">
                    <label class="text-[10px] font-bold text-gray-400 block mb-1">Miktar/Pkt</label>
                    <input type="number" v-model="newItem.paketAgirligi" class="w-full text-center bg-white p-2 rounded-lg border outline-none font-bold"/>
                  </div>
               </div>
               
               <div class="flex gap-3">
                 <div class="flex-1">
                   <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Birim</label>
                   <select v-model="newItem.birim" class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none">
                     <option value="adet">Adet</option>
                     <option value="kg">Kg</option>
                     <option value="gr">Gram</option>
                     <option value="litre">Litre</option>
                     <option value="şişe">Şişe</option>
                     <option value="kavanoz">Kavanoz</option>
                     <option value="rulo">Rulo</option>
                     <option value="paket">Paket</option>
                   </select>
                 </div>
                 <div class="flex-1">
                   <label class="text-xs font-bold text-gray-500 uppercase block mb-1">SKT</label>
                   <input type="date" v-model="newItem.skt" class="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm"/>
                 </div>
               </div>

               <div class="bg-blue-50 p-3 rounded-xl flex justify-between items-center">
                 <span className="text-blue-700 font-medium text-sm">Toplam Eklenecek:</span>
                 <span className="text-blue-700 font-bold text-lg">{{ toplamEklenecekMiktar }} {{ newItem.birim }}</span>
               </div>

               <button @click="handleAddItem" class="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-200">
                 <Check :size="20" /> Kaydet
               </button>
             </div>
          </div>
      </div>

      <!-- TÜKETİM MODALI -->
      <div v-if="isConsumeModalOpen && selectedItemToConsume" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scaleIn text-center">
              <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils class="text-blue-600" :size="32" />
              </div>
              <h3 class="text-xl font-bold text-gray-800">Ne kadar kullandın?</h3>
              <p class="text-gray-500 text-sm mb-6">{{ selectedItemToConsume.name }} ({{ selectedItemToConsume.quantity }} {{ selectedItemToConsume.unit }} kaldı)</p>
              
              <div class="flex items-center justify-center gap-2 mb-6">
                <input type="number" v-model="consumeAmount" placeholder="0" class="w-24 text-center text-3xl font-bold border-b-2 border-blue-500 outline-none pb-1 placeholder-gray-200" autoFocus />
                <span class="text-xl font-medium text-gray-400">{{ selectedItemToConsume.unit }}</span>
              </div>

              <div class="flex gap-3">
                <button @click="isConsumeModalOpen = false" class="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">İptal</button>
                <button @click="handleConsume" class="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200">Düş</button>
              </div>
          </div>
      </div>
    </div>

    <!-- GENERATOR TAB -->
    <div v-if="activeTab === 'generator'" class="flex flex-col h-full bg-gray-50">
       <div class="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button @click="activeTab = 'home'" class="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft :size="24" /></button>
        <h2 className="font-bold text-xl text-gray-800">Lezzet Sihirbazı ✨</h2>
      </div>
      <div class="flex-1 overflow-y-auto p-4 pb-24">
        <div v-if="!recipeResult" class="space-y-4">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
              <label class="block text-gray-700 font-medium mb-2">Mutfakta ne var?</label>
              <textarea v-model="ingredients" class="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none min-h-[120px] text-lg resize-none" placeholder="Örn: 2 yumurta, biraz bayat ekmek..."></textarea>
              <button v-if="pantryItems.length > 0" @click="ingredients = pantryItems.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')" class="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"><Refrigerator :size="14" /> Tüm stokları ekle</button>
            </div>
        </div>
        <div v-else class="bg-white p-6 rounded-2xl shadow-sm animate-slideUp">
             <div class="prose prose-orange max-w-none whitespace-pre-wrap font-medium text-gray-700">{{ recipeResult }}</div>
             <button @click="recipeResult = null" class="mt-6 w-full py-3 text-orange-600 font-semibold bg-orange-50 rounded-xl hover:bg-orange-100">Yeni Tarif</button>
        </div>
      </div>
      <div v-if="!recipeResult" class="p-4 bg-white border-t border-gray-100 sticky bottom-0 safe-area-bottom">
          <button @click="handleGenerateRecipe" :disabled="(!ingredients.trim() && pantryItems.length === 0) || isGenerating" class="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all" :class="(ingredients.trim() || pantryItems.length > 0) ? 'bg-orange-600 text-white active:scale-95' : 'bg-gray-300 text-gray-500 cursor-not-allowed'">
            <span v-if="isGenerating" class="flex items-center gap-2"><Loader2 class="animate-spin" /> Şef Düşünüyor...</span>
            <span v-else class="flex items-center gap-2"><Sparkles /> Tarif Oluştur</span>
          </button>
      </div>
    </div>

    <!-- CHAT TAB -->
    <div v-if="activeTab === 'chat'" class="flex flex-col h-full bg-gray-50">
      <div class="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button @click="activeTab = 'home'" class="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft :size="24" /></button>
        <h2 className="font-bold text-xl text-gray-800">Şef'e Sor 👨‍🍳</h2>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-4 pb-4" ref="chatContainer">
        <div v-for="(msg, idx) in chatHistory" :key="idx" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            <div class="max-w-[85%] p-4 rounded-2xl shadow-sm" :class="msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'">{{ msg.text }}</div>
        </div>
        <div v-if="isChatting" class="flex justify-start"><div class="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-2 items-center text-gray-500"><Loader2 :size="16" class="animate-spin text-orange-500" /> Şef yazıyor...</div></div>
      </div>
      <div class="p-4 bg-white border-t border-gray-100 sticky bottom-0 safe-area-bottom">
        <div class="flex gap-2">
          <input type="text" v-model="chatInput" @keydown.enter="handleSendMessage" placeholder="Soru sor..." class="flex-1 p-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
          <button @click="handleSendMessage" :disabled="!chatInput.trim() || isChatting" class="p-3 bg-orange-600 text-white rounded-xl active:scale-95 disabled:opacity-50"><Send :size="24" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Basit animasyonlar */
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-slideUp { animation: slideUp 0.3s ease-out; }
.animate-scaleIn { animation: scaleIn 0.2s ease-out; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>