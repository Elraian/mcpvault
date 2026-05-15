import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { apiCall, jsonResult, withActive } from "./common.js";
import { VERSION } from "../version.js";

const API = "https://api.supabase.com/v1";

function resolveRef(account: any, override?: string): string {
  const ref = override ?? (account.credentials as any).default_project_ref;
  if (!ref) throw new Error("project_ref required (no default_project_ref on active account)");
  return ref;
}

function bearer(account: any): string {
  return `Bearer ${(account.credentials as any).pat}`;
}

export async function startSupabaseWrapper(): Promise<void> {
  const server = new McpServer({ name: "mcpvault-supabase", version: VERSION });

  // ─── Org / Project lookups ────────────────────────────────────────────────

  server.registerTool(
    "supabase_list_organizations",
    {
      description: "List Supabase organizations visible to the active account.",
      inputSchema: {},
    },
    withActive("supabase", "list_orgs", async (_a, account) => {
      const orgs = await apiCall("GET", `${API}/organizations`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, organizations: orgs });
    }),
  );

  server.registerTool(
    "supabase_list_projects",
    {
      description: "List all Supabase projects visible to the active account.",
      inputSchema: {},
    },
    withActive("supabase", "list_projects", async (_a, account) => {
      const projects = await apiCall("GET", `${API}/projects`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, projects });
    }),
  );

  server.registerTool(
    "supabase_get_project",
    {
      description: "Get details for a single Supabase project.",
      inputSchema: { project_ref: z.string().optional() },
    },
    withActive("supabase", "get_project", async ({ project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const data = await apiCall("GET", `${API}/projects/${ref}`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, project: data });
    }),
  );

  server.registerTool(
    "supabase_get_project_url",
    {
      description: "Get the canonical URL for a project's REST API (e.g. https://<ref>.supabase.co).",
      inputSchema: { project_ref: z.string().optional() },
    },
    withActive("supabase", "get_project_url", async ({ project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      return jsonResult({ active_label: account.label, project_ref: ref, url: `https://${ref}.supabase.co` });
    }),
  );

  server.registerTool(
    "supabase_get_publishable_keys",
    {
      description: "Get a project's publishable API keys (anon + service role JWTs). Use these to call the project's data API from clients.",
      inputSchema: { project_ref: z.string().optional() },
    },
    withActive("supabase", "get_keys", async ({ project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const keys = await apiCall("GET", `${API}/projects/${ref}/api-keys`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, project_ref: ref, keys });
    }),
  );

  // ─── Database ─────────────────────────────────────────────────────────────

  server.registerTool(
    "supabase_run_sql",
    {
      description: "Run a SQL query against a Supabase Postgres database via the Management API.",
      inputSchema: { query: z.string().min(1), project_ref: z.string().optional() },
    },
    withActive("supabase", "run_sql", async ({ query, project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const result = await apiCall("POST", `${API}/projects/${ref}/database/query`, {
        auth: bearer(account),
        body: { query },
      });
      return jsonResult({ active_label: account.label, project_ref: ref, result });
    }),
  );

  server.registerTool(
    "supabase_list_tables",
    {
      description: "List tables in a Supabase project's schema (public by default).",
      inputSchema: { project_ref: z.string().optional(), schema: z.string().default("public") },
    },
    withActive("supabase", "list_tables", async ({ project_ref, schema }, account) => {
      const ref = resolveRef(account, project_ref);
      const query = `select table_schema, table_name from information_schema.tables where table_schema = '${schema}' order by table_name`;
      const result = await apiCall("POST", `${API}/projects/${ref}/database/query`, {
        auth: bearer(account),
        body: { query },
      });
      return jsonResult({ active_label: account.label, project_ref: ref, schema, tables: result });
    }),
  );

  server.registerTool(
    "supabase_list_extensions",
    {
      description: "List installed Postgres extensions on a Supabase project.",
      inputSchema: { project_ref: z.string().optional() },
    },
    withActive("supabase", "list_extensions", async ({ project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const query = "select name, default_version, installed_version, comment from pg_available_extensions where installed_version is not null order by name";
      const result = await apiCall("POST", `${API}/projects/${ref}/database/query`, {
        auth: bearer(account),
        body: { query },
      });
      return jsonResult({ active_label: account.label, project_ref: ref, extensions: result });
    }),
  );

  // ─── Migrations ───────────────────────────────────────────────────────────

  server.registerTool(
    "supabase_list_migrations",
    {
      description: "List applied database migrations on a Supabase project.",
      inputSchema: { project_ref: z.string().optional() },
    },
    withActive("supabase", "list_migrations", async ({ project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const migrations = await apiCall("GET", `${API}/projects/${ref}/database/migrations`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, project_ref: ref, migrations });
    }),
  );

  server.registerTool(
    "supabase_apply_migration",
    {
      description: "Apply a SQL migration to a Supabase project's database. The migration is recorded so it can be replayed elsewhere.",
      inputSchema: {
        name: z.string().min(1).describe("Migration name (e.g. 'add_users_table')"),
        query: z.string().min(1).describe("SQL to apply"),
        project_ref: z.string().optional(),
      },
    },
    withActive("supabase", "apply_migration", async ({ name, query, project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const result = await apiCall("POST", `${API}/projects/${ref}/database/migrations`, {
        auth: bearer(account),
        body: { name, query },
      });
      return jsonResult({ active_label: account.label, project_ref: ref, migration: result });
    }),
  );

  // ─── Edge Functions ───────────────────────────────────────────────────────

  server.registerTool(
    "supabase_list_edge_functions",
    {
      description: "List edge functions deployed on a Supabase project.",
      inputSchema: { project_ref: z.string().optional() },
    },
    withActive("supabase", "list_edge_functions", async ({ project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const fns = await apiCall("GET", `${API}/projects/${ref}/functions`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, project_ref: ref, functions: fns });
    }),
  );

  server.registerTool(
    "supabase_get_edge_function",
    {
      description: "Get details + source of a single edge function.",
      inputSchema: { slug: z.string().min(1), project_ref: z.string().optional() },
    },
    withActive("supabase", "get_edge_function", async ({ slug, project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const fn = await apiCall("GET", `${API}/projects/${ref}/functions/${slug}`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, project_ref: ref, function: fn });
    }),
  );

  server.registerTool(
    "supabase_deploy_edge_function",
    {
      description: "Deploy (create or update) an edge function on a Supabase project.",
      inputSchema: {
        slug: z.string().min(1),
        body: z.string().min(1).describe("TypeScript/JavaScript source for the function (Deno runtime)"),
        verify_jwt: z.boolean().default(true),
        project_ref: z.string().optional(),
      },
    },
    withActive("supabase", "deploy_edge_function", async ({ slug, body, verify_jwt, project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const fn = await apiCall("POST", `${API}/projects/${ref}/functions`, {
        auth: bearer(account),
        body: { slug, name: slug, body, verify_jwt },
      });
      return jsonResult({ active_label: account.label, project_ref: ref, function: fn });
    }),
  );

  // ─── Advisors / Health ────────────────────────────────────────────────────

  server.registerTool(
    "supabase_get_advisors",
    {
      description: "Get security or performance advisors for a project — Supabase's automated checks for common issues.",
      inputSchema: {
        type: z.enum(["security", "performance"]).default("security"),
        project_ref: z.string().optional(),
      },
    },
    withActive("supabase", "get_advisors", async ({ type, project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const advisors = await apiCall("GET", `${API}/projects/${ref}/advisors/${type}`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, project_ref: ref, type, advisors });
    }),
  );

  server.registerTool(
    "supabase_get_logs",
    {
      description: "Fetch recent project logs (api, postgres, edge-function, auth, realtime, storage).",
      inputSchema: {
        project_ref: z.string().optional(),
        service: z.enum(["api", "postgres", "edge-function", "auth", "realtime", "storage"]).default("api"),
      },
    },
    withActive("supabase", "get_logs", async ({ project_ref, service }, account) => {
      const ref = resolveRef(account, project_ref);
      const logs = await apiCall("GET", `${API}/projects/${ref}/analytics/endpoints/logs.all?service=${service}`, {
        auth: bearer(account),
      });
      return jsonResult({ active_label: account.label, project_ref: ref, service, logs });
    }),
  );

  // ─── TypeScript types ─────────────────────────────────────────────────────

  server.registerTool(
    "supabase_generate_typescript_types",
    {
      description: "Generate TypeScript types from a project's database schema. Returns the .ts source as text.",
      inputSchema: { project_ref: z.string().optional() },
    },
    withActive("supabase", "generate_ts_types", async ({ project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const data = await apiCall("GET", `${API}/projects/${ref}/types/typescript`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, project_ref: ref, types: data });
    }),
  );

  // ─── Branches (preview environments) ──────────────────────────────────────

  server.registerTool(
    "supabase_list_branches",
    {
      description: "List preview branches for a Supabase project.",
      inputSchema: { project_ref: z.string().optional() },
    },
    withActive("supabase", "list_branches", async ({ project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const branches = await apiCall("GET", `${API}/projects/${ref}/branches`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, project_ref: ref, branches });
    }),
  );

  server.registerTool(
    "supabase_create_branch",
    {
      description: "Create a new preview branch for a Supabase project.",
      inputSchema: {
        name: z.string().min(1).describe("Branch name (e.g. 'feature-x')"),
        project_ref: z.string().optional(),
      },
    },
    withActive("supabase", "create_branch", async ({ name, project_ref }, account) => {
      const ref = resolveRef(account, project_ref);
      const branch = await apiCall("POST", `${API}/projects/${ref}/branches`, {
        auth: bearer(account),
        body: { branch_name: name },
      });
      return jsonResult({ active_label: account.label, project_ref: ref, branch });
    }),
  );

  server.registerTool(
    "supabase_merge_branch",
    {
      description: "Merge a preview branch into production (the main project database).",
      inputSchema: { branch_id: z.string().min(1) },
    },
    withActive("supabase", "merge_branch", async ({ branch_id }, account) => {
      const result = await apiCall("POST", `${API}/branches/${branch_id}/merge`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, branch_id, result });
    }),
  );

  // ─── Docs ─────────────────────────────────────────────────────────────────

  server.registerTool(
    "supabase_search_docs",
    {
      description: "Search the Supabase documentation. Useful for grounding code suggestions in current docs.",
      inputSchema: { query: z.string().min(1) },
    },
    withActive("supabase", "search_docs", async ({ query }, account) => {
      const result = await apiCall("POST", "https://supabase.com/docs/api/search", {
        body: { query },
      });
      return jsonResult({ active_label: account.label, query, results: result });
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
