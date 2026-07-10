const fs = require('fs');

const supabaseUrl = process.env.TEST_SUPABASE_URL;
const supabaseAnonKey = process.env.TEST_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Cannot write supabase.js: TEST_SUPABASE_URL or TEST_SUPABASE_ANON_KEY is missing.');
  process.exit(1);
}

const config = [
  `const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};`,
  `const SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};`,
  'const { createClient } = supabase;',
  'const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);',
  '',
].join('\n');

fs.writeFileSync('supabase.js', config);
console.log('supabase.js rewritten for the CI test database.');
