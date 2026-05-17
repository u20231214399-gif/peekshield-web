export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, params } = req.body;

  const FACEPP_KEY = process.env.FACEPP_KEY;
  const FACEPP_SECRET = process.env.FACEPP_SECRET;

  const formData = new URLSearchParams();
  formData.append('api_key', FACEPP_KEY);
  formData.append('api_secret', FACEPP_SECRET);
  
  for (const [key, value] of Object.entries(params || {})) {
    formData.append(key, value);
  }

  try {
    const url = `https://api-cn.faceplusplus.com/facepp/v3/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData.toString(),
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
