import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });
  const token = authHeader.replace('Bearer ', '');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ message: 'Server misconfiguration' });
  }
  
  const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
  }

  const { destination } = req.body;
  if (!destination) return res.status(400).json({ message: 'Missing destination coordinates' });

  const apiKey = process.env.OLA_MAPS_API_KEY;
  // Default origin if not set in environment
  const rawOrigin = process.env.BAKERY_ORIGIN_COORDS || '22.572510,88.4937940'; 
  
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
