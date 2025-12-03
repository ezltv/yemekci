import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Kontrol: Eğer şifreler yoksa konsola hata bas ama uygulamayı çökertme
if (!supabaseUrl || !supabaseKey) {
  console.error('🚨 HATA: Supabase URL veya KEY bulunamadı! .env dosyasını veya Netlify ayarlarını kontrol et.')
}

export const supabase = createClient(
  supabaseUrl || 'https://rgfbelamzofpookkfsqr.supabase.co', // Boşsa patlamasın diye geçici URL
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZmJlbGFtem9mcG9va2tmc3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTA5MDEsImV4cCI6MjA4MDMyNjkwMX0.xvvoFKQMvHGzpoc4ZIkhGY7FKcMKaHJl6_SQasMXRvY'
)