const requiredSecrets = [
  'TEST_SUPABASE_URL',
  'TEST_SUPABASE_ANON_KEY',
  'TEST_SUPABASE_SERVICE_ROLE_KEY',
];

const errors = [];

for (const name of requiredSecrets) {
  if (!process.env[name]) {
    errors.push(`${name} is missing`);
  }
}

if (process.env.TEST_SUPABASE_URL) {
  try {
    const url = new URL(process.env.TEST_SUPABASE_URL);
    if (url.protocol !== 'https:') {
      errors.push('TEST_SUPABASE_URL must start with https://');
    }
    if (!url.hostname.endsWith('.supabase.co')) {
      errors.push('TEST_SUPABASE_URL must be a Supabase project URL');
    }
  } catch {
    errors.push('TEST_SUPABASE_URL is not a valid URL');
  }
}

if (errors.length > 0) {
  console.error('Playwright CI configuration is invalid:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Playwright CI configuration looks valid.');
