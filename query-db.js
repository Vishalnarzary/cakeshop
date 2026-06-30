const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://asfkzpltvjvyjiqjkqgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZmt6cGx0dmp2eWppcWprcWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTUxNTMsImV4cCI6MjA5ODAzMTE1M30.ryHeukWAXmg6VYBgUK9Rsmsc9etKDlKyX7x8lTgShBk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: product } = await supabase.from('products').select('id').limit(1).single();
  const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
  
  if (product && profile) {
    console.log('Inserting with pending...');
    const res1 = await supabase.from('orders').insert({
      user_id: profile.id,
      product_id: product.id,
      status: 'pending'
    });
    console.log('Result for pending:', res1.error);
    
    console.log('Inserting with Pending...');
    const res2 = await supabase.from('orders').insert({
      user_id: profile.id,
      product_id: product.id,
      status: 'Pending'
    });
    console.log('Result for Pending:', res2.error);
  } else {
    console.log('Could not find product or profile');
  }
}
run();
