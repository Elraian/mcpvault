#!/usr/bin/env node
// Add mcp-vault MCP servers to ~/.claude.json, preserving everything else.
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const cfgPath = join(homedir(), ".claude.json");
const entry = join(process.cwd(), "dist", "index.js");

const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
cfg.mcpServers = cfg.mcpServers ?? {};

const wantedEntries = {
  vault: { command: "node", args: [entry, "server"] },
  "vault-supabase": { command: "node", args: [entry, "wrap", "supabase"] },
  "vault-github": { command: "node", args: [entry, "wrap", "github"] },
  "vault-vercel": { command: "node", args: [entry, "wrap", "vercel"] },
  "vault-stripe": { command: "node", args: [entry, "wrap", "stripe"] },
};

for (const [name, val] of Object.entries(wantedEntries)) {
  cfg.mcpServers[name] = val;
}

const tmp = `${cfgPath}.tmp-${process.pid}-${Date.now()}`;
writeFileSync(tmp, JSON.stringify(cfg, null, 2));
renameSync(tmp, cfgPath);

console.log("Added MCP servers to ~/.claude.json:");
for (const k of Object.keys(wantedEntries)) console.log("  -", k);
console.log("\nRestart Claude Code (close this VS Code window and reopen, or run /restart in Claude Code).");
