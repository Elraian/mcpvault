import type { ProxyAdapter } from "./types.js";

export const slackAdapter: ProxyAdapter = {
  service: "slack",
  displayName: "Slack",
  tokenUrl: "https://api.slack.com/apps",
  hint:
    "Create a Slack app, install it to your workspace, copy the Bot User OAuth Token (`xoxb-...`). " +
    "Team ID is shown in the workspace URL or at api.slack.com/methods/auth.test.",

  credentialFields: [
    { key: "bot_token", prompt: "Slack Bot User OAuth Token (xoxb-...)", secret: true },
    { key: "team_id", prompt: "Team id (starts with T...)", optional: true },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${String(creds.bot_token)}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; team?: string; user?: string; team_id?: string };
      if (!data.ok) return { ok: false, error: data.error ?? "auth.test failed" };
      return {
        ok: true,
        identity: `${data.team ?? "slack"} (bot: ${data.user ?? "unknown"})`,
        suggestedLabel: slugify(data.team ?? "slack"),
        details: { auth: data },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@modelcontextprotocol/server-slack"],
  authMapping: (creds) => ({
    SLACK_BOT_TOKEN: String(creds.bot_token),
    SLACK_TEAM_ID: String(creds.team_id ?? ""),
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "slack";
}
