export interface AiJsonRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

/** Sağlayıcıdan bağımsız yapay zekâ arayüzü. Her sağlayıcı yalnızca ham metin (JSON) döndürür; doğrulama ayrı yapılır. */
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  generateJson(request: AiJsonRequest): Promise<string>;
}

export class AiProviderError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message);
    this.name = "AiProviderError";
  }
}
