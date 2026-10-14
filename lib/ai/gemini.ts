interface GeminiOptions {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}

export function isGeminiConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10
  );
}

export async function callGemini(options: GeminiOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const contents: any[] = [
    {
      role: "user",
      parts: [{ text: options.prompt }],
    },
  ];

  const body: any = {
    contents,
    generationConfig: {
      temperature: options.temperature !== undefined ? options.temperature : 0.2,
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.responseMimeType) {
    body.generationConfig.responseMimeType = options.responseMimeType;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // 12s timeout for resilience
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    // Try fallback to gemini-1.5-flash if 2.5 returns 404 or model not found
    if (res.status === 404 || res.status === 400) {
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    }
    throw new Error(`Gemini API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}
