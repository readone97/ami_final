import { createClient } from '@supabase/supabase-js'

// Environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pifbldakoykhavivriwu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZmJsZGFrb3lraGF2aXZyaXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjMxMTYsImV4cCI6MjA1NjIzOTExNn0.xM8EPguadI_c97XLD2vi7mqV51M-YZdW6f5TtwPyuxU' ;

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 
