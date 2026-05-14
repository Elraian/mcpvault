import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { LOG_FILE } from "./paths.js";

export type LogEvent =
  | { kind: "unlock"; ok: boolean }
  | { kind: "lock" }
  | { kind: "activate"; service: string; label: string }
  | { kind: "add"; service: string; label: string }
  | { kind: "update"; service: string; label: string }
  | { kind: "remove"; service: string; label: string }
  | { kind: "use"; service: string; label: string; op: string }
  | { kind: "error"; where: string; message: string };

export async function logEvent(ev: LogEvent, path = LOG_FILE): Promise<void> {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...ev }) + "\n";
  try {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, line, { mode: 0o600 });
  } catch {
    // Audit logging is best-effort — don't kill the request if disk is full.
  }
}
