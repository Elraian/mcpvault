import type { ProxyAdapter } from "./types.js";

export const mixpanelAdapter: ProxyAdapter = {
  service: "mixpanel",
  displayName: "Mixpanel",
  tokenUrl: "https://mixpanel.com/settings/project",
  hint:
    "Project settings → copy the Project Token. The mixpanel-mcp-server uses this single token (write API). " +
    "One mcpvault account = one Mixpanel project.",

  credentialFields: [
    { key: "project_token", prompt: "Mixpanel project token", secret: true },
  ],

  validate: async (creds) => {
    // Mixpanel's project token doesn't have a clean validation endpoint without
    // also having a service-account secret. We do format check only — the
    // upstream server will fail loudly on first track call if the token is wrong.
    const tok = String(creds.project_token).trim();
    if (tok.length < 16) {
      return { ok: false, error: "project token looks too short — typically ~32 chars" };
    }
    return {
      ok: true,
      identity: `mixpanel project (${tok.slice(0, 4)}…${tok.slice(-4)})`,
      suggestedLabel: "mixpanel",
    };
  },

  spawnCmd: "npx",
  // Upstream takes the token as a CLI arg via --token, not env var.
  spawnArgs: ["-y", "mixpanel-mcp-server", "--token"],
  authMapping: () => ({}),
  argMapping: (creds) => [String(creds.project_token)],
};
