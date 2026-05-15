import { spawn } from "node:child_process";
import { getActiveCredentials } from "../wrappers/common.js";
import type { Service } from "../schema.js";
import type { ProxyAdapter } from "./types.js";
import { logEvent } from "../log.js";

/**
 * Spawn an upstream MCP server with the active account's credentials injected
 * via env vars (and optionally extra args), then proxy stdio between the chat
 * client and the child process.
 *
 * mcpvault becomes a transparent middleman: the chat client thinks it's talking
 * to mcpvault; the child server thinks it's talking to the chat client.
 */
export async function runProxy(adapter: ProxyAdapter): Promise<void> {
  let account;
  try {
    account = await getActiveCredentials(adapter.service as Service);
  } catch (e: any) {
    process.stderr.write(`mcpvault proxy (${adapter.service}): ${e.message}\n`);
    process.exit(1);
  }

  await logEvent({ kind: "use", service: adapter.service, label: account.label, op: "proxy_spawn" });

  const creds = account.credentials as Record<string, unknown>;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...adapter.authMapping(creds),
  };
  const args = [...adapter.spawnArgs, ...(adapter.argMapping?.(creds) ?? [])];

  // shell:true on Windows so `npx` (a .cmd shim) resolves on PATH.
  const child = spawn(adapter.spawnCmd, args, {
    env,
    stdio: ["pipe", "pipe", "inherit"],
    shell: process.platform === "win32",
  });

  child.on("error", async (err) => {
    await logEvent({ kind: "error", where: `proxy.${adapter.service}.spawn`, message: err.message });
    process.stderr.write(`mcpvault proxy (${adapter.service}): failed to spawn ${adapter.spawnCmd}: ${err.message}\n`);
    process.exit(1);
  });

  // Wire stdio in both directions.
  process.stdin.pipe(child.stdin);
  child.stdout.pipe(process.stdout);

  // Pass through exit code.
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });

  // Cleanly forward Ctrl-C / SIGTERM to the child.
  const forward = (sig: NodeJS.Signals) => () => {
    if (!child.killed) child.kill(sig);
  };
  process.on("SIGINT", forward("SIGINT"));
  process.on("SIGTERM", forward("SIGTERM"));
}
