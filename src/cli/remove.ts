import { intro, outro, log } from "@clack/prompts";
import { openWithCachedKey } from "../session.js";
import { persistVault } from "../vault.js";
import { ServiceSchema, type Service } from "../schema.js";
import { readActive, clearActive } from "../active.js";
import { ask, c } from "./prompt.js";
import { logEvent } from "../log.js";

export async function cmdRemove(serviceArg: string, label: string): Promise<void> {
  const service = ServiceSchema.parse(serviceArg) as Service;
  const vault = await openWithCachedKey();
  vault.get(service, label); // throws if missing

  intro(c.bgRed(c.black(` mvault remove ${service} ${label} `)));
  log.warn(`This will permanently delete the ${service} account "${label}" and its stored credentials.`);

  const typed = await ask(`Type ${c.cyan(label)} to confirm`);
  if (typed.trim() !== label) {
    outro(c.yellow("Confirmation did not match. Nothing changed."));
    process.exit(1);
  }

  vault.remove(service, label);
  await persistVault(vault);
  const active = await readActive();
  if (active.active[service] === label) await clearActive(service);
  await logEvent({ kind: "remove", service, label });

  outro(`${c.green("✓")} Removed ${service} account ${c.cyan(label)}.`);
}
