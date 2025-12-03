// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rgfbelamzofpookkfsqr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZmJlbGFtem9mcG9va2tmc3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTA5MDEsImV4cCI6MjA4MDMyNjkwMX0.xvvoFKQMvHGzpoc4ZIkhGY7FKcMKaHJl6_SQasMXRvY'

export const supabase = createClient(supabaseUrl, supabaseKey)