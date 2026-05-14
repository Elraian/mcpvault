import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { apiCall, jsonResult, withActive } from "./common.js";

const API = "https://api.vercel.com";

function teamQuery(account: any, override?: string): string {
  const tid = override ?? account.credentials.team_id;
  return tid ? `?teamId=${encodeURIComponent(tid)}` : "";
}

function teamParam(account: any, override?: string, sep = "&"): string {
  const tid = override ?? account.credentials.team_id;
  return tid ? `${sep}teamId=${encodeURIComponent(tid)}` : "";
}

export async function startVercelWrapper(): Promise<void> {
  const server = new McpServer({ name: "mcp-vault-vercel", version: "0.1.0" });

  server.registerTool(
    "vercel_list_projects",
    {
      description: "List projects in the active Vercel account/team.",
      inputSchema: {
        team_id: z.string().optional().describe("Override team_id from active account"),
      },
    },
    withActive("vercel", "list_projects", async ({ team_id }, account) => {
      const token = (account.credentials as any).token as string;
      const projects = await apiCall("GET", `${API}/v10/projects${teamQuery(account, team_id)}`, { auth: `Bearer ${token}` });
      return jsonResult({ active_label: account.label, projects });
    }),
  );

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
      const token = (account.credentials as any).token as string;
      const base = `${API}/v6/deployments?limit=${limit}${project_id ? `&projectId=${encodeURIComponent(project_id)}` : ""}`;
      const url = base + teamParam(account, team_id);
      const data = await apiCall("GET", url, { auth: `Bearer ${token}` });
      return jsonResult({ active_label: account.label, deployments: data });
    }),
  );

  server.registerTool(
    "vercel_get_deployment",
    {
      description: "Get a single deployment by id or URL.",
      inputSchema: {
        id_or_url: z.string().min(1),
        team_id: z.string().optional(),
      },
    },
    withActive("vercel", "get_deployment", async ({ id_or_url, team_id }, account) => {
      const token = (account.credentials as any).token as string;
      const data = await apiCall("GET", `${API}/v13/deployments/${encodeURIComponent(id_or_url)}${teamQuery(account, team_id)}`, {
        auth: `Bearer ${token}`,
      });
      return jsonResult({ active_label: account.label, deployment: data });
    }),
  );

  server.registerTool(
    "vercel_list_domains",
    {
      description: "List domains in the active Vercel account/team.",
      inputSchema: {
        team_id: z.string().optional(),
      },
    },
    withActive("vercel", "list_domains", async ({ team_id }, account) => {
      const token = (account.credentials as any).token as string;
      const data = await apiCall("GET", `${API}/v5/domains${teamQuery(account, team_id)}`, { auth: `Bearer ${token}` });
      return jsonResult({ active_label: account.label, domains: data });
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
