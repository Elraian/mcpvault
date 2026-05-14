import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { apiCall, jsonResult, withActive } from "./common.js";

const API = "https://api.supabase.com/v1";

export async function startSupabaseWrapper(): Promise<void> {
  const server = new McpServer({ name: "mcp-vault-supabase", version: "0.1.0" });

  server.registerTool(
    "supabase_list_projects",
    {
      description: "List all Supabase projects visible to the active account.",
      inputSchema: {},
    },
    withActive("supabase", "list_projects", async (_a, account) => {
      const pat = (account.credentials as any).pat as string;
      const projects = await apiCall("GET", `${API}/projects`, { auth: `Bearer ${pat}` });
      return jsonResult({ active_label: account.label, projects });
    }),
  );

  server.registerTool(
    "supabase_list_organizations",
    {
      description: "List Supabase organizations visible to the active account.",
      inputSchema: {},
    },
    withActive("supabase", "list_orgs", async (_a, account) => {
      const pat = (account.credentials as any).pat as string;
      const orgs = await apiCall("GET", `${API}/organizations`, { auth: `Bearer ${pat}` });
      return jsonResult({ active_label: account.label, organizations: orgs });
    }),
  );

  server.registerTool(
    "supabase_run_sql",
    {
      description:
        "Run a SQL query against a Supabase project's Postgres database via the Management API. Falls back to default_project_ref on the active account if project_ref is omitted.",
      inputSchema: {
        query: z.string().min(1),
        project_ref: z.string().optional(),
      },
    },
    withActive("supabase", "run_sql", async ({ query, project_ref }, account) => {
      const creds = account.credentials as any;
      const ref = project_ref ?? creds.default_project_ref;
      if (!ref) throw new Error("project_ref required (no default_project_ref on active account)");
      const result = await apiCall("POST", `${API}/projects/${ref}/database/query`, {
        auth: `Bearer ${creds.pat}`,
        body: { query },
      });
      return jsonResult({ active_label: account.label, project_ref: ref, result });
    }),
  );

  server.registerTool(
    "supabase_list_tables",
    {
      description: "List tables in a Supabase project (public schema by default).",
      inputSchema: {
        project_ref: z.string().optional(),
        schema: z.string().default("public"),
      },
    },
    withActive("supabase", "list_tables", async ({ project_ref, schema }, account) => {
      const creds = account.credentials as any;
      const ref = project_ref ?? creds.default_project_ref;
      if (!ref) throw new Error("project_ref required (no default_project_ref on active account)");
      const query = `select table_schema, table_name from information_schema.tables where table_schema = '${schema}' order by table_name`;
      const result = await apiCall("POST", `${API}/projects/${ref}/database/query`, {
        auth: `Bearer ${creds.pat}`,
        body: { query },
      });
      return jsonResult({ active_label: account.label, project_ref: ref, schema, tables: result });
    }),
  );

  server.registerTool(
    "supabase_get_logs",
    {
      description: "Fetch recent project logs (api, postgres, edge functions, auth, etc.).",
      inputSchema: {
        project_ref: z.string().optional(),
        service: z.enum(["api", "postgres", "edge-function", "auth", "realtime", "storage"]).default("api"),
      },
    },
    withActive("supabase", "get_logs", async ({ project_ref, service }, account) => {
      const creds = account.credentials as any;
      const ref = project_ref ?? creds.default_project_ref;
      if (!ref) throw new Error("project_ref required (no default_project_ref on active account)");
      const logs = await apiCall("GET", `${API}/projects/${ref}/analytics/endpoints/logs.all?service=${service}`, {
        auth: `Bearer ${creds.pat}`,
      });
      return jsonResult({ active_label: account.label, project_ref: ref, service, logs });
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
