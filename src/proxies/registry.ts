import type { ProxyAdapter } from "./types.js";
import { notionAdapter } from "./notion.js";
import { linearAdapter } from "./linear.js";
import { postgresAdapter } from "./postgres.js";
import { posthogAdapter } from "./posthog.js";
import { slackAdapter } from "./slack.js";
import { cloudflareAdapter } from "./cloudflare.js";
import { sentryAdapter } from "./sentry.js";
import { braveSearchAdapter } from "./brave.js";
import { awsAdapter } from "./aws.js";
import { resendAdapter } from "./resend.js";
import { figmaAdapter } from "./figma.js";
import { airtableAdapter } from "./airtable.js";
import { datadogAdapter } from "./datadog.js";

/**
 * Registry of proxy adapters keyed by service id. New services = one file under
 * src/proxies/ + one entry here + one entry in ServiceSchema (schema.ts).
 */
export const PROXY_ADAPTERS: Record<string, ProxyAdapter> = {
  notion: notionAdapter,
  linear: linearAdapter,
  postgres: postgresAdapter,
  posthog: posthogAdapter,
  slack: slackAdapter,
  cloudflare: cloudflareAdapter,
  sentry: sentryAdapter,
  brave: braveSearchAdapter,
  aws: awsAdapter,
  resend: resendAdapter,
  figma: figmaAdapter,
  airtable: airtableAdapter,
  datadog: datadogAdapter,
};

export const PROXY_SERVICES = Object.keys(PROXY_ADAPTERS) as Array<keyof typeof PROXY_ADAPTERS>;

export function isProxyService(service: string): boolean {
  return service in PROXY_ADAPTERS;
}

export function getAdapter(service: string): ProxyAdapter | undefined {
  return PROXY_ADAPTERS[service];
}
