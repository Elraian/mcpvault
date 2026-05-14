import { z } from "zod";

export const ServiceSchema = z.enum(["supabase", "github", "vercel", "stripe"]);
export type Service = z.infer<typeof ServiceSchema>;

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

export const CredentialsByService = {
  supabase: SupabaseCredsSchema,
  github: GitHubCredsSchema,
  vercel: VercelCredsSchema,
  stripe: StripeCredsSchema,
} as const;

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
