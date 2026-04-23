import { logger } from '../lib/logger.js';
import { GoogleAuth } from 'google-auth-library';

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface AccessTokenLike {
  token?: string | null;
}

type GeminiProvider = 'direct' | 'vertex';

export class GeminiService {
  private readonly provider: GeminiProvider;
  private readonly directApiKey: string;
  private readonly model: string;
  private readonly vertexProjectId: string;
  private readonly vertexLocation: string;
  private readonly vertexServiceAccountJson: string;

  constructor() {
    const providerFromEnv = (process.env.GEMINI_PROVIDER || '').toLowerCase();
    const hasVertexContext = !!process.env.VERTEX_PROJECT_ID;

    if (providerFromEnv === 'vertex' || providerFromEnv === 'direct') {
      this.provider = providerFromEnv;
    } else {
      this.provider = hasVertexContext ? 'vertex' : 'direct';
    }

    this.directApiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    this.vertexProjectId = process.env.VERTEX_PROJECT_ID || '';
    this.vertexLocation = process.env.VERTEX_LOCATION || 'europe-west1';
    this.vertexServiceAccountJson = process.env.VERTEX_SERVICE_ACCOUNT_JSON || '';
  }

  async generateStrictJson(systemPrompt: string, userPrompt: string): Promise<unknown> {
    if (this.provider === 'vertex') {
      return this.generateWithVertex(systemPrompt, userPrompt);
    }

    return this.generateWithDirectApi(systemPrompt, userPrompt);
  }

  private async generateWithDirectApi(systemPrompt: string, userPrompt: string): Promise<unknown> {
    if (!this.directApiKey) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.directApiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, text }, 'Gemini API error');
      throw new Error(`Gemini API error ${response.status}`);
    }

    const payload = (await response.json()) as GeminiGenerateResponse;
    return this.parseStrictJsonResponse(payload);
  }

  private async generateWithVertex(systemPrompt: string, userPrompt: string): Promise<unknown> {
    if (!this.vertexProjectId) {
      throw new Error('VERTEX_PROJECT_ID is missing');
    }

    const auth = this.buildGoogleAuth();
    const client = await auth.getClient();
    const rawAccessToken = (await client.getAccessToken()) as string | null | AccessTokenLike;
    const accessToken =
      typeof rawAccessToken === 'string'
        ? rawAccessToken
        : rawAccessToken?.token || null;

    if (!accessToken) {
      throw new Error('Unable to obtain Vertex AI access token');
    }

    const url = `https://${this.vertexLocation}-aiplatform.googleapis.com/v1/projects/${this.vertexProjectId}/locations/${this.vertexLocation}/publishers/google/models/${this.model}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, text }, 'Vertex AI error');
      throw new Error(`Vertex AI error ${response.status}`);
    }

    const payload = (await response.json()) as GeminiGenerateResponse;
    return this.parseStrictJsonResponse(payload);
  }

  private buildGoogleAuth(): GoogleAuth {
    if (this.vertexServiceAccountJson) {
      const credentials = JSON.parse(this.vertexServiceAccountJson);
      return new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }

    return new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  private parseStrictJsonResponse(payload: GeminiGenerateResponse): unknown {
    const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text.trim()) {
      throw new Error('Gemini empty response');
    }

    try {
      return JSON.parse(text);
    } catch {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start >= 0 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
      throw new Error('Gemini returned non-JSON output');
    }
  }
}

export const geminiService = new GeminiService();
