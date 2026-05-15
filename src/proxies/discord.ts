import type { ProxyAdapter } from "./types.js";

export const discordAdapter: ProxyAdapter = {
  service: "discord",
  displayName: "Discord",
  tokenUrl: "https://discord.com/developers/applications",
  hint:
    "Create an application, go to Bot, copy the bot token. Invite the bot to your server with appropriate intents. " +
    "Server (guild) ID is optional — useful if you want the agent scoped to one server.",

  credentialFields: [
    { key: "bot_token", prompt: "Discord bot token", secret: true },
    { key: "guild_id", prompt: "Guild (server) id", optional: true },
  ],

  validate: async (creds) => {
    try {
      const res = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `Bot ${String(creds.bot_token)}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `${res.status} ${res.statusText}: ${body.slice(0, 200)}` };
      }
      const me = (await res.json()) as { username?: string; id?: string; bot?: boolean };
      return {
        ok: true,
        identity: `discord bot ${me.username ?? me.id ?? "unknown"}`,
        suggestedLabel: slugify(me.username ?? "discord"),
        details: { me },
      };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "mcp-server-discord"],
  authMapping: (creds) => ({
    DISCORD_BOT_TOKEN: String(creds.bot_token),
    DISCORD_GUILD_ID: String(creds.guild_id ?? ""),
  }),
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "discord";
}
