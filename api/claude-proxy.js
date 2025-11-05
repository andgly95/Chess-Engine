// Vercel Serverless Function - Proxy for Claude API
// This avoids CORS issues by proxying requests from the backend

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, prompt, tools, tool_choice } = req.body;

    if (!apiKey || !prompt) {
      return res.status(400).json({ error: 'Missing apiKey or prompt' });
    }

    console.log('Calling Claude API...', { hasTools: !!tools, hasToolChoice: !!tool_choice });

    // Build the request body
    const requestBody = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    // Add tools and tool_choice if provided (for structured outputs)
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }
    if (tool_choice) {
      requestBody.tool_choice = tool_choice;
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error'
    });
  }
}
