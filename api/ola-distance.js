export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { destination } = req.body;
  if (!destination) return res.status(400).json({ message: 'Missing destination coordinates' });

  const apiKey = process.env.OLA_MAPS_API_KEY;
  // Default origin if not set in environment
  const rawOrigin = process.env.BAKERY_ORIGIN_COORDS || '12.971598,77.594562'; 
  
  // Clean coordinates to remove any spaces, parentheses, etc. (e.g. "(22.57,88.49)" -> "22.57,88.49")
  const origin = rawOrigin.replace(/[^\d.,-]/g, '');
  const cleanDestination = destination.replace(/[^\d.,-]/g, '');

  if (!apiKey) return res.status(500).json({ message: 'Ola Maps API Key missing' });

  try {
    const url = `https://api.olamaps.io/routing/v1/directions?origin=${origin}&destination=${cleanDestination}&api_key=${apiKey}`;
    const olaRes = await fetch(url, { method: 'POST' });
    const data = await olaRes.json();
    
    if (!olaRes.ok) {
      const errMsg = data.error_message || data.message || (typeof data.error === 'string' ? data.error : data.error?.message) || JSON.stringify(data);
      return res.status(olaRes.status).json({ message: errMsg, details: data });
    }

    // Extract distance from routing response
    if (data.routes && data.routes.length > 0) {
      const distanceMeters = data.routes[0].legs[0].distance;
      const distanceKm = (distanceMeters / 1000).toFixed(2);
      return res.status(200).json({ distanceKm: parseFloat(distanceKm) });
    } else {
      return res.status(400).json({ message: 'No route found', details: data });
    }
  } catch (error) {
    console.error('Error fetching Ola distance:', error);
    return res.status(500).json({ message: 'Error calculating distance' });
  }
}
