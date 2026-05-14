import { openWithCachedKey } from "../session.js";
import { setActive, readActive } from "../active.js";
import { ServiceSchema, type Service } from "../schema.js";
import { logEvent } from "../log.js";
import { c } from "./prompt.js";

export async function cmdActivate(serviceArg: string, label: string): Promise<void> {
  const service = ServiceSchema.parse(serviceArg) as Service;
  const vault = await openWithCachedKey();
  vault.get(service, label); // throws if missing
  await setActive(service, label);
  await logEvent({ kind: "activate", service, label });
  process.stdout.write(`${c.green("✓")} Active ${c.bold(service)} → ${c.cyan(label)}\n`);
}

export async function cmdActive(): Promise<void> {
  const state = await readActive();
  const entries = Object.entries(state.active);
  if (entries.length === 0) {
    process.stdout.write(c.dim("No active accounts set.\n"));
    return;
  }
  for (const [svc, label] of entries) {
    process.stdout.write(`${c.bold(svc)}: ${c.cyan(label)}\n`);
  }
}
