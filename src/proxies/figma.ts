import type { ProxyAdapter } from "./types.js";

export const figmaAdapter: ProxyAdapter = {
  service: "figma",
  displayName: "Figma",
  tokenUrl: "https://www.figma.com/settings",
  hint:
    "Settings → Account → Personal access tokens → Generate new token. " +
    "Scope: File content (read) at minimum. Dev Mode access if you want code-from-design.",

  credentialFields: [
    { key: "access_token", prompt: "Figma personal access token", secret: true, placeholder: "figd_..." },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://api.figma.com/v1/me", {
        headers: {
          "X-Figma-Token": String(creds.access_token),
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const me = (await res.json()) as { handle?: string; email?: string; id?: string };
      const identity = me.handle ?? me.email ?? me.id ?? "figma user";
      return {
        ok: true,
        identity: `figma (${identity})`,
        suggestedLabel: slugify(me.handle ?? me.email ?? "figma"),
        details: { me },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@tmegit/figma-developer-mcp", "--stdio"],
  authMapping: (creds) => ({
    FIGMA_API_KEY: String(creds.access_token),
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "figma";
}
