import type { ProxyAdapter } from "./types.js";
import { notionAdapter } from "./notion.js";
import { linearAdapter } from "./linear.js";
import { postgresAdapter } from "./postgres.js";

/**
 * Registry of proxy adapters keyed by service id. New services = one file under
 * src/proxies/ + one entry here.
 */
export const PROXY_ADAPTERS: Record<string, ProxyAdapter> = {
  notion: notionAdapter,
  linear: linearAdapter,
  postgres: postgresAdapter,
};

export const PROXY_SERVICES = Object.keys(PROXY_ADAPTERS) as Array<keyof typeof PROXY_ADAPTERS>;

export function isProxyService(service: string): boolean {
  return service in PROXY_ADAPTERS;
}

export function getAdapter(service: string): ProxyAdapter | undefined {
  return PROXY_ADAPTERS[service];
}
