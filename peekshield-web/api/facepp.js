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

  const FACEPP_KEY = "emeeMX6Pjmlr4SVUGE-dl7N1WYc1MQsH";
  const FACEPP_SECRET = "viqVQaj-5yw6879NCxFDyEwdS5qH1Hz_";

  const formData = new URLSearchParams();
  formData.append('api_key', FACEPP_KEY);
  formData.append('api_secret', FACEPP_SECRET);
  
  for (const [key, value] of Object.entries(params || {})) {
    formData.append(key, value);
  }

  try {
    const url = `https://api-us.faceplusplus.com/facepp/v3/${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData.toString(),
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();
    console.log('Face++ response:', JSON.stringify(data));
    return res.status(200).json(data);
  } catch(e) {
    console.error('Face++ error:', e);
    return res.status(500).json({ error: e.message });
  }
}
