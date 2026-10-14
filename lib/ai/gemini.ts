import fs from "fs";
import path from "path";

interface GeminiOptions {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}

// Model cascade in priority order
// gemini-3.5-flash-lite is active, fastest, and verified 200 OK on current v1beta API
export const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

export function getGeminiApiKey(): string {
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey && envKey.length > 5) {
    return envKey;
  }

  // Fallback to direct file read if server process was started prior to editing .env.local
  try {
    const cwd = process.cwd();
    const envLocalPath = path.join(cwd, ".env.local");
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, "utf-8");
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }

    const envPath = path.join(cwd, ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (err) {
    // Ignore file read errors on restricted environments
  }

  return "";
}

export function isGeminiConfigured(): boolean {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 10);
}

export async function callGemini(options: GeminiOptions): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }

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

  let lastError: Error | null = null;

  // Try models in cascade order
  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000), // 8s timeout per model attempt
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text === "string" && text.length > 0) {
          return text;
        }
      } else {
        const errorText = await res.text().catch(() => "");
        console.warn(`[Gemini] Model ${model} returned HTTP ${res.status}: ${errorText.slice(0, 120)}. Trying fallback...`);
        lastError = new Error(`Model ${model} failed with HTTP ${res.status}`);
      }
    } catch (modelErr: any) {
      console.warn(`[Gemini] Model ${model} execution error: ${modelErr?.message || modelErr}. Trying fallback...`);
      lastError = modelErr;
    }
  }

  throw new Error(`All Gemini candidate models failed: ${lastError?.message || "Service unavailable"}`);
}
