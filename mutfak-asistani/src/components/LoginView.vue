<template>
  <div class="login-container">
    <div class="login-box">
      <div class="icon">🔐</div>
      <h2>Mutfak Asistanı</h2>
      <p>Lütfen giriş yapın</p>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>Email</label>
          <input type="email" v-model="email" placeholder="mail@adresin.com" required />
        </div>

        <div class="input-group">
          <label>Şifre</label>
          <input type="password" v-model="password" placeholder="******" required />
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? 'Giriş Yapılıyor...' : 'GİRİŞ YAP' }}
        </button>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) throw error
    
    // Başarılı olursa App.vue otomatik algılayacak (Session değiştiği için)
    
  } catch (error) {
    errorMsg.value = 'Hatalı mail veya şifre!'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f4f4f4;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 350px;
  text-align: center;
  border: 2px solid #000;
}

.icon { font-size: 50px; margin-bottom: 10px; }
h2 { margin: 10px 0 5px; color: #000; }
p { color: #666; margin-bottom: 30px; }

.input-group { text-align: left; margin-bottom: 15px; }
.input-group label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
.input-group input { 
  width: 100%; padding: 12px; border: 2px solid #ddd; 
  border-radius: 8px; box-sizing: border-box; font-size: 16px; 
}
.input-group input:focus { border-color: #000; outline: none; }

.login-btn {
  width: 100%; padding: 15px; background: #000; color: white;
  border: none; border-radius: 10px; font-weight: bold; cursor: pointer;
  font-size: 16px; margin-top: 10px;
}
.login-btn:disabled { opacity: 0.7; cursor: wait; }

.error { color: red; margin-top: 15px; font-weight: bold; }
</style>