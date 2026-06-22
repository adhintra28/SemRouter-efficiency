import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { provider, modelId, query, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
    if (!query) {
      return NextResponse.json({ error: 'Query prompt is required' }, { status: 400 });
    }

    const startTime = Date.now();
    let textResponse = '';
    let inputTokens = 0;
    let outputTokens = 0;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: query }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `OpenAI returned status ${response.status}`);
      }

      const data = await response.json();
      textResponse = data.choices[0]?.message?.content || '';
      inputTokens = data.usage?.prompt_tokens || 0;
      outputTokens = data.usage?.completion_tokens || 0;

    } else if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: query }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      textResponse = data.choices[0]?.message?.content || '';
      inputTokens = data.usage?.prompt_tokens || 0;
      outputTokens = data.usage?.completion_tokens || 0;

    } else if (provider === 'google') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Google API error status ${response.status}`);
      }

      const data = await response.json();
      textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      inputTokens = data.usageMetadata?.promptTokenCount || 0;
      outputTokens = data.usageMetadata?.candidatesTokenCount || 0;

    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 1024,
          messages: [{ role: 'user', content: query }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Anthropic API error status ${response.status}`);
      }

      const data = await response.json();
      textResponse = data.content?.[0]?.text || '';
      inputTokens = data.usage?.input_tokens || 0;
      outputTokens = data.usage?.output_tokens || 0;
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const endTime = Date.now();
    const latency = endTime - startTime;

    return NextResponse.json({
      response: textResponse,
      inputTokens,
      outputTokens,
      latency,
    });

  } catch (error) {
    const err = error as Error;
    console.error('API proxy error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
