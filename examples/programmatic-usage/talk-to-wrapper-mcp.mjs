#!/usr/bin/env node
// Smoke test: spawn `mcp-vault wrap supabase`, send tools/call, print result.
import { spawn } from "node:child_process";
import { join } from "node:path";

const entry = join(process.cwd(), "dist", "index.js");
const child = spawn(process.execPath, [entry, "wrap", "supabase"], {
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
      try {
        responses.push(JSON.parse(line));
      } catch {
        // ignore non-JSON
      }
    }
  }
});

let stderr = "";
child.stderr.on("data", (c) => (stderr += c.toString()));

function send(msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

async function waitFor(predicate, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("timeout");
}

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "0.0.1" } },
});

await waitFor(() => responses.some((r) => r.id === 1), 5000);
send({ jsonrpc: "2.0", method: "notifications/initialized" });

const toolName = process.argv[2] || "supabase_list_organizations";
send({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: toolName, arguments: {} } });
await waitFor(() => responses.some((r) => r.id === 2), 15000);

const result = responses.find((r) => r.id === 2);
console.log("---");
console.log("tool:", toolName);
console.log("isError:", result?.result?.isError ?? false);
console.log("body:");
console.log(result?.result?.content?.[0]?.text ?? JSON.stringify(result));
if (stderr.trim()) {
  console.log("--- stderr ---");
  console.log(stderr);
}
child.kill();
