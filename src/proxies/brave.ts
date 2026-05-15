import type { ProxyAdapter } from "./types.js";

export const braveSearchAdapter: ProxyAdapter = {
  service: "brave",
  displayName: "Brave Search",
  tokenUrl: "https://brave.com/search/api/",
  hint: "Sign up for Brave Search API, copy your subscription key. Free tier available.",

  credentialFields: [
    { key: "api_key", prompt: "Brave Search API subscription key", secret: true },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://api.search.brave.com/res/v1/web/search?q=ping&count=1", {
        headers: {
          "X-Subscription-Token": String(creds.api_key),
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      return { ok: true, identity: "brave search api", suggestedLabel: "brave" };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@modelcontextprotocol/server-brave-search"],
  authMapping: (creds) => ({ BRAVE_API_KEY: String(creds.api_key) }),
};
