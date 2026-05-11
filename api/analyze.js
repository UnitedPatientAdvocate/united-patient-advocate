export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[api/analyze] Missing ANTHROPIC_API_KEY runtime environment variable');
    return res.status(500).json({ error: 'Server API key is not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON request body' });
    }
  }

  const outbound = {
    model: (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6').trim(),
    max_tokens: Number(body?.max_tokens) || 4000,
    messages: Array.isArray(body?.messages) ? body.messages : [],
  };

  if (!outbound.messages.length) {
    return res.status(400).json({ error: 'Missing messages array' });
  }

  outbound.messages = outbound.messages.map(message => ({
    role: message.role,
    content: typeof message.content === 'string'
      ? message.content
      : Array.isArray(message.content)
        ? message.content
        : String(message.content ?? ''),
  }));

  const sendToAnthropic = async requestBody => {
    console.log('[api/analyze] Anthropic request summary', {
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      messages: requestBody.messages.map(message => ({
        role: message.role,
        contentType: Array.isArray(message.content) ? 'blocks' : typeof message.content,
        contentLength: Array.isArray(message.content)
          ? message.content.length
          : message.content.length,
      })),
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    return { response, data };
  };

  const modelCandidates = process.env.ANTHROPIC_MODEL
    ? [outbound.model]
    : [...new Set([
        outbound.model,
        'claude-haiku-4-5-20251001',
        'claude-sonnet-4-5-20250929',
        body?.model,
        'claude-sonnet-4-20250514',
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-haiku-20240307',
      ].filter(Boolean))];

  let response;
  let data;
  for (const model of modelCandidates) {
    ({ response, data } = await sendToAnthropic({ ...outbound, model }));

    const modelNotFound = response.status === 404
      && data?.error?.type === 'not_found_error'
      && /model/i.test(data?.error?.message || '');

    if (!modelNotFound || process.env.ANTHROPIC_MODEL) break;

    console.warn('[api/analyze] Model unavailable, trying next model', {
      model,
      next: modelCandidates[modelCandidates.indexOf(model) + 1],
    });
  }

  if (!response.ok) {
    console.error('[api/analyze] Anthropic error', {
      status: response.status,
      data,
    });
    return res.status(502).json({
      error: 'Anthropic request failed',
      upstreamStatus: response.status,
      upstream: data,
    });
  }

  res.status(response.status).json(data);
}



