const readScenarioMusicEnv = () => {
  const rawEndpoint = String(import.meta.env?.VITE_SCENARIO_MUSIC_API_URL || "").trim();
  const rawApiKey = String(import.meta.env?.VITE_SCENARIO_MUSIC_API_KEY || "").trim();
  return {
    endpoint: rawEndpoint,
    apiKey: rawApiKey,
    hasApiKey: !!rawApiKey,
    configured: !!rawEndpoint && !!rawApiKey,
  };
};

export const getScenarioMusicApiConfig = () => readScenarioMusicEnv();

export async function requestScenarioBackgroundMusic(payload = {}, options = {}) {
  const providedConfig = options?.config && typeof options.config === "object" ? options.config : null;
  const config = providedConfig || readScenarioMusicEnv();
  if (!config.configured) {
    throw new Error("music_api_not_configured");
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    signal: options?.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload || {}),
  });

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    const message = String(
      data?.message
      || data?.error
      || data?.code
      || `music_api_http_${response.status}`
    ).trim();
    throw new Error(message || "music_api_request_failed");
  }

  return data && typeof data === "object" ? data : {};
}
