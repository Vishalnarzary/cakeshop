const requiredSecrets = [
  'TEST_SUPABASE_URL',
  'TEST_SUPABASE_ANON_KEY',
  'TEST_SUPABASE_SERVICE_ROLE_KEY',
];

const errors = [];
let parsedSupabaseUrl;

function annotateError(message) {
  const escaped = message
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
  console.error(`::error title=Playwright CI configuration::${escaped}`);
}

for (const name of requiredSecrets) {
  if (!process.env[name]) {
    errors.push(`${name} is missing`);
  }
}

if (process.env.TEST_SUPABASE_URL) {
  try {
    parsedSupabaseUrl = new URL(process.env.TEST_SUPABASE_URL);
    if (parsedSupabaseUrl.protocol !== 'https:') {
      errors.push('TEST_SUPABASE_URL must start with https://');
    }
    if (!parsedSupabaseUrl.hostname.endsWith('.supabase.co')) {
      errors.push('TEST_SUPABASE_URL must be a Supabase project URL');
    }
  } catch {
    errors.push('TEST_SUPABASE_URL is not a valid URL');
  }
}

async function checkEndpoint(name, path, headers) {
  const endpoint = new URL(path, parsedSupabaseUrl);
  let response;

  try {
    response = await fetch(endpoint, { headers });
  } catch (error) {
    errors.push(`${name} could not reach ${parsedSupabaseUrl.hostname}: ${error.message}`);
    return null;
  }

  if (!response.ok) {
    errors.push(`${name} returned HTTP ${response.status}`);
    return null;
  }

  return response;
}

async function validateConnectivity() {
  if (errors.length > 0 || !parsedSupabaseUrl) return;

  await checkEndpoint(
    'TEST_SUPABASE_SERVICE_ROLE_KEY auth check',
    '/auth/v1/admin/users?page=1&per_page=1',
    {
      apikey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.TEST_SUPABASE_SERVICE_ROLE_KEY}`,
    }
  );

  const productsResponse = await checkEndpoint(
    'TEST_SUPABASE_ANON_KEY products seed check',
    '/rest/v1/products?select=id&limit=1',
    {
      apikey: process.env.TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.TEST_SUPABASE_ANON_KEY}`,
    }
  );

  if (productsResponse) {
    const products = await productsResponse.json().catch(() => []);
    if (!Array.isArray(products) || products.length === 0) {
      errors.push('TEST Supabase products table has no seed products');
    }
  }
}

function finish() {
  if (errors.length === 0) {
    console.log('Playwright CI configuration looks valid.');
    return;
  }

  console.error('Playwright CI configuration is invalid:');
  for (const error of errors) {
    annotateError(error);
    console.error(`- ${error}`);
  }
  process.exit(1);
}

validateConnectivity()
  .then(finish)
  .catch(error => {
    console.error(`Playwright CI configuration check crashed: ${error.message}`);
    process.exit(1);
  });
