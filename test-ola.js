const fs = require('fs');
const path = require('path');

// 1. Manually parse .env file so you don't need any extra npm packages
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
  }
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

loadEnv();

const apiKey = process.env.OLA_MAPS_API_KEY;
const rawOrigin = process.env.BAKERY_ORIGIN_COORDS;

if (!apiKey) {
  console.error('❌ OLA_MAPS_API_KEY is missing in .env');
  process.exit(1);
}

if (!rawOrigin) {
  console.error('❌ BAKERY_ORIGIN_COORDS is missing in .env');
  process.exit(1);
}

const origin = rawOrigin.replace(/[^\d.,-]/g, '');

async function runTests() {
  console.log('====== OLA MAPS LOCAL TEST ======');
  console.log(`API Key: ${apiKey.substring(0, 5)}...`);
  console.log(`Clean Origin: ${origin}`);
  console.log('---------------------------------');

  // TEST 1: Places Autocomplete
  console.log('\n[TEST 1] Places Autocomplete (Query: "Park Street")');
  try {
    const input = 'Park Street';
    const acUrl = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(input)}&api_key=${apiKey}`;
    const acRes = await fetch(acUrl, {
      headers: {
        'X-Request-Id': 'local-test-12345'
      }
    });
    const acData = await acRes.json();
    console.log(`Status Code: ${acRes.status}`);
    console.log('Response JSON:');
    console.log(JSON.stringify(acData, null, 2));
  } catch (err) {
    console.error('❌ JS/Network Error during Autocomplete:', err.message);
  }

  // TEST 2: Routing (Distance)
  console.log('\n[TEST 2] Routing / Distance Calculation');
  try {
    // Destination in Kolkata (Howrah Bridge coords for test)
    const destination = '22.5851,88.3468'; 
    const routeUrl = `https://api.olamaps.io/routing/v1/directions?origin=${origin}&destination=${destination}&api_key=${apiKey}`;
    
    console.log(`Testing Route From: ${origin} To: ${destination}`);
    const routeRes = await fetch(routeUrl);
    const routeData = await routeRes.json();
    
    console.log(`Status Code: ${routeRes.status}`);
    console.log('Response JSON:');
    console.log(JSON.stringify(routeData, null, 2));

    if (routeRes.ok && routeData.routes && routeData.routes.length > 0) {
      const distanceMeters = routeData.routes[0].legs[0].distance;
      console.log(`✅ Success! Distance calculated: ${(distanceMeters / 1000).toFixed(2)} km`);
    } else {
      console.log('❌ Failed to extract distance from response.');
    }
  } catch (err) {
    console.error('❌ JS/Network Error during Routing:', err.message);
  }
}

// Run the tests
runTests();
