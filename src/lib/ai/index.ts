import "server-only";
import { getEnv } from "../env";
import { OpenAiCompatibleProvider } from "./providers/openai-compatible";
import type { AiProvider } from "./types";

/**
 * Yapılandırılmış yapay zekâ sağlayıcısını döndürür. Yapılandırma yoksa null döner;
 * bu durumda uygulama yalnızca kalite kontrolünden geçmiş soru havuzunu kullanır.
 */
export function getAiProvider(): AiProvider | null {
  const env = getEnv();
  if (env.AI_PROVIDER === "openai") {
    if (!env.AI_API_KEY || !env.AI_MODEL) return null;
    const base = (env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    return new OpenAiCompatibleProvider({
      name: "openai",
      url: `${base}/chat/completions`,
      model: env.AI_MODEL,
      headers: { Authorization: `Bearer ${env.AI_API_KEY}` },
      timeoutMs: env.AI_TIMEOUT_MS,
      sendModelInBody: true,
    });
  }
  if (env.AI_PROVIDER === "azure-openai") {
    if (!env.AI_API_KEY || !env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_DEPLOYMENT) return null;
    const endpoint = env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
    return new OpenAiCompatibleProvider({
      name: "azure-openai",
      url: `${endpoint}/openai/deployments/${encodeURIComponent(env.AZURE_OPENAI_DEPLOYMENT)}/chat/completions?api-version=${encodeURIComponent(env.AZURE_OPENAI_API_VERSION)}`,
      model: env.AZURE_OPENAI_DEPLOYMENT,
      headers: { "api-key": env.AI_API_KEY },
      timeoutMs: env.AI_TIMEOUT_MS,
      sendModelInBody: false,
    });
  }
  return null;
}

export function aiVerifyWithSolver(): boolean {
  return getEnv().AI_VERIFY_WITH_SOLVER;
}
