import { openWithCachedKey } from "../session.js";
import { readActive } from "../active.js";
import { ServiceSchema, type Service } from "../schema.js";
import { c } from "./prompt.js";

const SERVICE_ORDER: Service[] = ["supabase", "github", "vercel", "stripe"];

export async function cmdList(serviceArg?: string): Promise<void> {
  const vault = await openWithCachedKey();
  const active = await readActive();
  const filter = serviceArg ? (ServiceSchema.parse(serviceArg) as Service) : undefined;
  const rows = vault.list(filter);
  if (rows.length === 0) {
    process.stdout.write(c.dim("No accounts. Run `mcpvault add <service>` to add one.\n"));
    return;
  }
  const grouped = new Map<Service, typeof rows>();
  for (const r of rows) {
    if (!grouped.has(r.service)) grouped.set(r.service, []);
    grouped.get(r.service)!.push(r);
  }
  const sortedServices = SERVICE_ORDER.filter((s) => grouped.has(s));
  for (const svc of sortedServices) {
    const list = grouped.get(svc)!;
    const activeLabel = active.active[svc];
    process.stdout.write(`\n${c.bold(c.cyan(svc))} ${c.dim(`(${list.length})`)}\n`);
    for (const r of list) {
      const isActive = r.label === activeLabel;
      const marker = isActive ? c.green("●") : c.dim("○");
      const label = isActive ? c.bold(r.label) : r.label;
      const desc = r.description ? c.dim(` — ${r.description}`) : "";
      const tags = r.tags.length ? c.dim(` [${r.tags.join(", ")}]`) : "";
      process.stdout.write(`  ${marker} ${label}${desc}${tags}\n`);
    }
  }
  process.stdout.write(`\n${c.dim(c.green("●") + " = currently active")}\n`);
}
