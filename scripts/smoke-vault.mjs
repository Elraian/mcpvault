#!/usr/bin/env node
// Hit the vault MCP server (control plane) directly with a tools/call.
import { spawn } from "node:child_process";
import { join } from "node:path";

const entry = join(process.cwd(), "dist", "index.js");
const child = spawn(process.execPath, [entry, "server"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: process.env,
});

const responses = [];
let buf = "";
child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl);
    buf = buf.slice(nl + 1);
    if (line.trim()) {
      try { responses.push(JSON.parse(line)); } catch {}
    }
  }
});

function send(msg) { child.stdin.write(JSON.stringify(msg) + "\n"); }
async function waitFor(p, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (p()) return; await new Promise((r) => setTimeout(r, 50)); }
  throw new Error("timeout");
}

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "0.0.1" } } });
await waitFor(() => responses.some((r) => r.id === 1), 5000);
send({ jsonrpc: "2.0", method: "notifications/initialized" });

const tool = process.argv[2];
const args = process.argv[3] ? JSON.parse(process.argv[3]) : {};
send({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: tool, arguments: args } });
await waitFor(() => responses.some((r) => r.id === 2), 10000);

const r = responses.find((r) => r.id === 2);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r));
child.kill();
