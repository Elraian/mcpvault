import { z } from "zod";

export const ServiceSchema = z.enum([
  // First-party (hand-written wrappers)
  "supabase",
  "github",
  "vercel",
  "stripe",
  // Proxied (spawn community MCP server with creds injected)
  "notion",
  "linear",
  "postgres",
  "posthog",
  "slack",
  "cloudflare",
  "sentry",
  "brave",
  "aws",
  "resend",
  "figma",
  "airtable",
  "datadog",
]);
export type Service = z.infer<typeof ServiceSchema>;

// ─── First-party credential schemas ──────────────────────────────────────────

export const SupabaseCredsSchema = z.object({
  pat: z.string().min(1),
  default_project_ref: z.string().optional(),
  org_id: z.string().optional(),
});

export const GitHubCredsSchema = z.object({
  pat: z.string().min(1),
  username: z.string().optional(),
});

export const VercelCredsSchema = z.object({
  token: z.string().min(1),
  team_id: z.string().optional(),
});

export const StripeCredsSchema = z.object({
  secret_key: z.string().min(1),
  mode: z.enum(["test", "live"]).default("test"),
});

// ─── Proxied service credential schemas ──────────────────────────────────────

export const NotionCredsSchema = z.object({
  api_key: z.string().min(1),
});

export const LinearCredsSchema = z.object({
  api_key: z.string().min(1),
});

export const PostgresCredsSchema = z.object({
  connection_string: z
    .string()
    .min(1)
    .regex(/^postgres(ql)?:\/\//i, "must start with postgres:// or postgresql://"),
});

export const PostHogCredsSchema = z.object({
  personal_api_key: z.string().min(1),
  project_id: z.string().min(1),
  host: z.string().url().optional(),
});

export const SlackCredsSchema = z.object({
  bot_token: z.string().min(1),
  team_id: z.string().optional(),
});

export const CloudflareCredsSchema = z.object({
  api_token: z.string().min(1),
  account_id: z.string().optional(),
});

export const SentryCredsSchema = z.object({
  auth_token: z.string().min(1),
  org_slug: z.string().min(1),
  host: z.string().url().optional(),
});

export const BraveCredsSchema = z.object({
  api_key: z.string().min(1),
});

export const AwsCredsSchema = z.object({
  access_key_id: z.string().min(1),
  secret_access_key: z.string().min(1),
  region: z.string().min(1),
  session_token: z.string().optional(),
});

export const ResendCredsSchema = z.object({
  api_key: z.string().min(1),
});

export const FigmaCredsSchema = z.object({
  access_token: z.string().min(1),
});

export const AirtableCredsSchema = z.object({
  personal_access_token: z.string().min(1),
});

export const DatadogCredsSchema = z.object({
  api_key: z.string().min(1),
  app_key: z.string().min(1),
  site: z.string().optional(),
});

export const CredentialsByService = {
  supabase: SupabaseCredsSchema,
  github: GitHubCredsSchema,
  vercel: VercelCredsSchema,
  stripe: StripeCredsSchema,
  notion: NotionCredsSchema,
  linear: LinearCredsSchema,
  postgres: PostgresCredsSchema,
  posthog: PostHogCredsSchema,
  slack: SlackCredsSchema,
  cloudflare: CloudflareCredsSchema,
  sentry: SentryCredsSchema,
  brave: BraveCredsSchema,
  aws: AwsCredsSchema,
  resend: ResendCredsSchema,
  figma: FigmaCredsSchema,
  airtable: AirtableCredsSchema,
  datadog: DatadogCredsSchema,
} as const;

// ─── Account / vault data ────────────────────────────────────────────────────

export const AccountSchema = z.object({
  service: ServiceSchema,
  label: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9_\-]+$/, "label must be alphanumeric with - or _"),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  credentials: z.record(z.unknown()), // validated per-service below
  created_at: z.string(),
  updated_at: z.string(),
});

export type Account = z.infer<typeof AccountSchema>;

// Validates that the credentials shape matches the declared service.
export function validateAccount(input: unknown): Account {
  const parsed = AccountSchema.parse(input);
  const credsSchema = CredentialsByService[parsed.service];
  credsSchema.parse(parsed.credentials); // throws on mismatch
  return parsed;
}

export const VaultDataSchema = z.object({
  version: z.literal(1),
  accounts: z.array(AccountSchema),
});

export type VaultData = z.infer<typeof VaultDataSchema>;

export interface RedactedAccount {
  service: Service;
  label: string;
  description: string;
  tags: string[];
}

export function redactAccount(a: Account): RedactedAccount {
  return {
    service: a.service,
    label: a.label,
    description: a.description,
    tags: a.tags,
  };
}
