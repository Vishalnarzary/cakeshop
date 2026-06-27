// ============================================================
//  SUPABASE CONFIGURATION
//  Replace the values below with your own Supabase project keys
//  Found at: https://supabase.com → Your Project → Settings → API
// ============================================================

const SUPABASE_URL = 'https://asfkzpltvjvyjiqjkqgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmt6cGx0dmp2eWppcWprcWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTUxNTMsImV4cCI6MjA5ODAzMTE1M30.ryHeukWAXmg6VYBgUK9Rsmsc9etKDlKyX7x8lTgShBk';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
