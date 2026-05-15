import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { apiCall, jsonResult, withActive } from "./common.js";
import { VERSION } from "../version.js";

const API = "https://api.vercel.com";

function teamQuery(account: any, override?: string): string {
  const tid = override ?? (account.credentials as any).team_id;
  return tid ? `?teamId=${encodeURIComponent(tid)}` : "";
}

function teamParam(account: any, override?: string, sep = "&"): string {
  const tid = override ?? (account.credentials as any).team_id;
  return tid ? `${sep}teamId=${encodeURIComponent(tid)}` : "";
}

function bearer(account: any): string {
  return `Bearer ${(account.credentials as any).token}`;
}

export async function startVercelWrapper(): Promise<void> {
  const server = new McpServer({ name: "mcpvault-vercel", version: VERSION });

  // ─── Projects ─────────────────────────────────────────────────────────────

  server.registerTool(
    "vercel_list_projects",
    {
      description: "List projects in the active Vercel account/team.",
      inputSchema: { team_id: z.string().optional().describe("Override team_id from active account") },
    },
    withActive("vercel", "list_projects", async ({ team_id }, account) => {
      const projects = await apiCall("GET", `${API}/v10/projects${teamQuery(account, team_id)}`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, projects });
    }),
  );

  server.registerTool(
    "vercel_get_project",
    {
      description: "Get a single Vercel project by id or name.",
      inputSchema: { id_or_name: z.string().min(1), team_id: z.string().optional() },
    },
    withActive("vercel", "get_project", async ({ id_or_name, team_id }, account) => {
      const project = await apiCall("GET", `${API}/v9/projects/${encodeURIComponent(id_or_name)}${teamQuery(account, team_id)}`, {
        auth: bearer(account),
      });
      return jsonResult({ active_label: account.label, project });
    }),
  );

  // ─── Deployments ──────────────────────────────────────────────────────────

  server.registerTool(
    "vercel_list_deployments",
    {
      description: "List recent deployments.",
      inputSchema: {
        project_id: z.string().optional(),
        team_id: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      },
    },
    withActive("vercel", "list_deployments", async ({ project_id, team_id, limit }, account) => {
      const base = `${API}/v6/deployments?limit=${limit}${project_id ? `&projectId=${encodeURIComponent(project_id)}` : ""}`;
      const url = base + teamParam(account, team_id);
      const data = await apiCall("GET", url, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, deployments: data });
    }),
  );

  server.registerTool(
    "vercel_get_deployment",
    {
      description: "Get a single deployment by id or URL.",
      inputSchema: { id_or_url: z.string().min(1), team_id: z.string().optional() },
    },
    withActive("vercel", "get_deployment", async ({ id_or_url, team_id }, account) => {
      const data = await apiCall("GET", `${API}/v13/deployments/${encodeURIComponent(id_or_url)}${teamQuery(account, team_id)}`, {
        auth: bearer(account),
      });
      return jsonResult({ active_label: account.label, deployment: data });
    }),
  );

  server.registerTool(
    "vercel_get_deployment_build_logs",
    {
      description: "Get build-time logs for a deployment. Use when a build failed and you want to see why.",
      inputSchema: { deployment_id: z.string().min(1), team_id: z.string().optional() },
    },
    withActive("vercel", "get_build_logs", async ({ deployment_id, team_id }, account) => {
      const data = await apiCall(
        "GET",
        `${API}/v3/deployments/${encodeURIComponent(deployment_id)}/events${teamQuery(account, team_id)}`,
        { auth: bearer(account) },
      );
      return jsonResult({ active_label: account.label, deployment_id, build_logs: data });
    }),
  );

  server.registerTool(
    "vercel_get_runtime_logs",
    {
      description: "Get runtime logs for a deployment (serverless/edge function logs). Use for debugging live function errors.",
      inputSchema: {
        deployment_id: z.string().min(1),
        team_id: z.string().optional(),
        limit: z.number().int().min(1).max(1000).default(100),
      },
    },
    withActive("vercel", "get_runtime_logs", async ({ deployment_id, team_id, limit }, account) => {
      const url =
        `${API}/v2/deployments/${encodeURIComponent(deployment_id)}/runtime-logs?limit=${limit}` +
        teamParam(account, team_id);
      const data = await apiCall("GET", url, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, deployment_id, runtime_logs: data });
    }),
  );

  // ─── Teams / Domains ──────────────────────────────────────────────────────

  server.registerTool(
    "vercel_list_teams",
    {
      description: "List Vercel teams the active account belongs to.",
      inputSchema: {},
    },
    withActive("vercel", "list_teams", async (_a, account) => {
      const data = await apiCall("GET", `${API}/v2/teams`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, teams: data });
    }),
  );

  server.registerTool(
    "vercel_list_domains",
    {
      description: "List domains in the active Vercel account/team.",
      inputSchema: { team_id: z.string().optional() },
    },
    withActive("vercel", "list_domains", async ({ team_id }, account) => {
      const data = await apiCall("GET", `${API}/v5/domains${teamQuery(account, team_id)}`, { auth: bearer(account) });
      return jsonResult({ active_label: account.label, domains: data });
    }),
  );

  server.registerTool(
    "vercel_check_domain_availability",
    {
      description: "Check whether a domain is available to register through Vercel and what it costs.",
      inputSchema: { domain: z.string().min(1) },
    },
    withActive("vercel", "check_domain", async ({ domain }, account) => {
      const data = await apiCall("GET", `${API}/v4/domains/status?name=${encodeURIComponent(domain)}`, {
        auth: bearer(account),
      });
      return jsonResult({ active_label: account.label, domain, availability: data });
    }),
  );

  // ─── Environment variables ────────────────────────────────────────────────

  server.registerTool(
    "vercel_list_env_vars",
    {
      description: "List environment variables for a Vercel project.",
      inputSchema: {
        project_id: z.string().min(1).describe("Project id or name"),
        team_id: z.string().optional(),
      },
    },
    withActive("vercel", "list_env", async ({ project_id, team_id }, account) => {
      const data = await apiCall(
        "GET",
        `${API}/v9/projects/${encodeURIComponent(project_id)}/env${teamQuery(account, team_id)}`,
        { auth: bearer(account) },
      );
      return jsonResult({ active_label: account.label, project_id, env: data });
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
