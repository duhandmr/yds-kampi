import { AiProviderError, type AiJsonRequest, type AiProvider } from "../types";

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

export interface OpenAiCompatibleConfig {
  name: string;
  url: string;
  model: string;
  headers: Record<string, string>;
  timeoutMs: number;
  /** Azure dağıtımlarında model adı URL'de olduğu için gövdeye eklenmez. */
  sendModelInBody: boolean;
}

/** OpenAI Chat Completions uyumlu sağlayıcılar (OpenAI, Azure OpenAI ve uyumlu servisler). */
export class OpenAiCompatibleProvider implements AiProvider {
  readonly name: string;
  readonly model: string;

  constructor(private readonly config: OpenAiCompatibleConfig) {
    this.name = config.name;
    this.model = config.model;
  }

  async generateJson(request: AiJsonRequest): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const body: Record<string, unknown> = {
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user },
        ],
        response_format: { type: "json_object" },
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7,
      };
      if (this.config.sendModelInBody) body.model = this.config.model;
      const res = await fetch(this.config.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...this.config.headers },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) {
        // Yanıt gövdesi anahtar veya iç bilgi içerebileceği için loglanmaz; yalnızca durum kodu.
        throw new AiProviderError(`Sağlayıcı ${res.status} durum kodu döndürdü.`, res.status >= 500 || res.status === 429);
      }
      const json = (await res.json()) as ChatCompletionResponse;
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new AiProviderError("Sağlayıcı boş yanıt döndürdü.");
      return content;
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw new AiProviderError("Sağlayıcı zaman aşımına uğradı.", true);
      throw new AiProviderError("Sağlayıcıya bağlanılamadı.", true);
    } finally {
      clearTimeout(timer);
    }
  }
}
