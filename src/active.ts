import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { ACTIVE_FILE } from "./paths.js";
import { ServiceSchema, type Service } from "./schema.js";

const ActiveStateSchema = z.object({
  version: z.literal(1).default(1),
  active: z.record(ServiceSchema, z.string()).default({}),
});

export type ActiveState = z.infer<typeof ActiveStateSchema>;

export async function readActive(path = ACTIVE_FILE): Promise<ActiveState> {
  try {
    const buf = await readFile(path, "utf8");
    return ActiveStateSchema.parse(JSON.parse(buf));
  } catch (e: any) {
    if (e?.code === "ENOENT") return { version: 1, active: {} };
    throw e;
  }
}

export async function setActive(service: Service, label: string, path = ACTIVE_FILE): Promise<ActiveState> {
  const state = await readActive(path);
  state.active[service] = label;
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
  await rename(tmp, path);
  return state;
}

export async function clearActive(service: Service, path = ACTIVE_FILE): Promise<ActiveState> {
  const state = await readActive(path);
  delete state.active[service];
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
  await rename(tmp, path);
  return state;
}

export async function getActiveLabel(service: Service, path = ACTIVE_FILE): Promise<string | null> {
  const state = await readActive(path);
  return state.active[service] ?? null;
}
