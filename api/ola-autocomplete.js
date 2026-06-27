export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { input } = req.query;
  if (!input) return res.status(400).json({ message: 'Missing input query' });

  const apiKey = process.env.OLA_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ message: 'Ola Maps API Key is missing in Vercel Environment Variables.' });

  try {
    const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(input)}&api_key=${apiKey}`;
    const olaRes = await fetch(url, {
      headers: {
        'X-Request-Id': crypto.randomUUID ? crypto.randomUUID() : Math.random().toString()
      }
    });
    const data = await olaRes.json();
    
    if (!olaRes.ok) {
      return res.status(olaRes.status).json({ message: data.error_message || data.message || data.error || 'Ola Maps API Error', details: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Ola autocomplete:', error);
    return res.status(500).json({ message: error.message || 'Error fetching locations' });
  }
}
