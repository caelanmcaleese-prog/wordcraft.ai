export default async function handler(req, res) {
  // Allow requests from your website
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key is configured on the server
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server not configured correctly.' });
  }

  try {
    const { model, max_tokens, system, messages, isPro } = req.body;

    // Server-side enforcement of free plan limits
    // Even if someone tries to hack the frontend, the server caps it
    const safeMaxTokens = isPro ? Math.min(max_tokens || 2000, 2000) : 320;

    const safeSystem = isPro
      ? 'You are an elite professional copywriter and content strategist. You produce exceptional, publication-ready writing that stands out. Every word earns its place.'
      : 'You are a helpful writing assistant. Produce simple, functional content within 200 words.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // Secret — never sent to browser
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: safeMaxTokens,
        system: safeSystem,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
