import type { ProxyAdapter } from "./types.js";

export const gitlabAdapter: ProxyAdapter = {
  service: "gitlab",
  displayName: "GitLab",
  tokenUrl: "https://gitlab.com/-/profile/personal_access_tokens",
  hint:
    "Personal Access Token with scopes: api (read+write) for full agent use, or read_api for read-only. " +
    "Self-hosted GitLab? Set the host URL too.",

  credentialFields: [
    { key: "personal_access_token", prompt: "GitLab Personal Access Token", secret: true, placeholder: "glpat-..." },
    { key: "host", prompt: "GitLab host", optional: true, placeholder: "https://gitlab.com" },
  ],

  validate: async (creds) => {
    const host = String(creds.host || "https://gitlab.com").replace(/\/$/, "");
    try {
      const res = await fetch(`${host}/api/v4/user`, {
        headers: {
          "PRIVATE-TOKEN": String(creds.personal_access_token),
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const user = (await res.json()) as { username?: string; name?: string; email?: string };
      return {
        ok: true,
        identity: `gitlab (${user.username ?? user.email ?? "user"})`,
        suggestedLabel: slugify(user.username ?? "gitlab"),
        details: { user },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@modelcontextprotocol/server-gitlab"],
  authMapping: (creds) => ({
    GITLAB_PERSONAL_ACCESS_TOKEN: String(creds.personal_access_token),
    GITLAB_API_URL: `${String(creds.host || "https://gitlab.com").replace(/\/$/, "")}/api/v4`,
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "gitlab";
}
