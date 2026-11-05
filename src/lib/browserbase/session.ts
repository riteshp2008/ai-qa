import { getServerEnv } from "@/lib/config";

type BrowserbaseSession = {
  id: string;
  connectUrl?: string;
};

export async function createBrowserbaseSession(targetUrl: string): Promise<BrowserbaseSession> {
  const response = await fetch("https://api.browserbase.com/v1/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getServerEnv("BROWSERBASE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: getServerEnv("BROWSERBASE_PROJECT_ID"),
      startUrl: targetUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Browserbase session creation failed with status ${response.status}.`);
  }

  return (await response.json()) as BrowserbaseSession;
}
