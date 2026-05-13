export default async function handler(req, res) {
  // Consentiamo solo richieste POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Metodo ${req.method} non consentito` });
  }

  try {
    const apiKey = process.env.REMOVE_BG_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key Remove.bg non configurata nelle Environment Variables di Vercel' });
    }

    // Su Vercel req.body viene analizzato automaticamente se l'header Content-Type è application/json
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { imageBase64 } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nessuna immagine Base64 fornita nella richiesta' });
    }

    const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const blob = new Blob([buffer], { type: 'image/png' });
    
    const formData = new FormData();
    formData.append('image_file', blob, 'input.png');
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Errore Remove.bg (${response.status}): ${errText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);
    const resultBase64 = `data:image/png;base64,${resultBuffer.toString('base64')}`;

    return res.status(200).json({ success: true, resultBase64 });
  } catch (err) {
    console.error('Vercel Remove.bg Proxy Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
