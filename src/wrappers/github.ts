import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { apiCall, jsonResult, withActive } from "./common.js";
import { VERSION } from "../version.js";

const API = "https://api.github.com";

function ghHeaders(): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "mcpvault",
  };
}

export async function startGithubWrapper(): Promise<void> {
  const server = new McpServer({ name: "mcpvault-github", version: VERSION });

  server.registerTool(
    "github_list_repos",
    {
      description: "List repositories the active account can see (user repos by default).",
      inputSchema: {
        owner: z.string().optional().describe("Org or user (defaults to authenticated user)"),
        per_page: z.number().int().min(1).max(100).default(30),
      },
    },
    withActive("github", "list_repos", async ({ owner, per_page }, account) => {
      const pat = (account.credentials as any).pat as string;
      const url = owner ? `${API}/users/${owner}/repos?per_page=${per_page}` : `${API}/user/repos?per_page=${per_page}`;
      const repos = await apiCall("GET", url, { auth: `Bearer ${pat}`, headers: ghHeaders() });
      return jsonResult({ active_label: account.label, repos });
    }),
  );

  server.registerTool(
    "github_get_repo",
    {
      description: "Get details for a single repository.",
      inputSchema: { owner: z.string(), repo: z.string() },
    },
    withActive("github", "get_repo", async ({ owner, repo }, account) => {
      const pat = (account.credentials as any).pat as string;
      const data = await apiCall("GET", `${API}/repos/${owner}/${repo}`, { auth: `Bearer ${pat}`, headers: ghHeaders() });
      return jsonResult({ active_label: account.label, repo: data });
    }),
  );

  server.registerTool(
    "github_list_issues",
    {
      description: "List issues on a repository.",
      inputSchema: {
        owner: z.string(),
        repo: z.string(),
        state: z.enum(["open", "closed", "all"]).default("open"),
      },
    },
    withActive("github", "list_issues", async ({ owner, repo, state }, account) => {
      const pat = (account.credentials as any).pat as string;
      const issues = await apiCall("GET", `${API}/repos/${owner}/${repo}/issues?state=${state}`, {
        auth: `Bearer ${pat}`,
        headers: ghHeaders(),
      });
      return jsonResult({ active_label: account.label, issues });
    }),
  );

  server.registerTool(
    "github_create_issue",
    {
      description: "Create a new issue.",
      inputSchema: {
        owner: z.string(),
        repo: z.string(),
        title: z.string().min(1),
        body: z.string().optional(),
        labels: z.array(z.string()).optional(),
      },
    },
    withActive("github", "create_issue", async ({ owner, repo, title, body, labels }, account) => {
      const pat = (account.credentials as any).pat as string;
      const issue = await apiCall("POST", `${API}/repos/${owner}/${repo}/issues`, {
        auth: `Bearer ${pat}`,
        headers: ghHeaders(),
        body: { title, body, labels },
      });
      return jsonResult({ active_label: account.label, issue });
    }),
  );

  server.registerTool(
    "github_list_pulls",
    {
      description: "List pull requests on a repository.",
      inputSchema: {
        owner: z.string(),
        repo: z.string(),
        state: z.enum(["open", "closed", "all"]).default("open"),
      },
    },
    withActive("github", "list_pulls", async ({ owner, repo, state }, account) => {
      const pat = (account.credentials as any).pat as string;
      const pulls = await apiCall("GET", `${API}/repos/${owner}/${repo}/pulls?state=${state}`, {
        auth: `Bearer ${pat}`,
        headers: ghHeaders(),
      });
      return jsonResult({ active_label: account.label, pulls });
    }),
  );

  server.registerTool(
    "github_get_file",
    {
      description: "Read a file's contents from a repository.",
      inputSchema: {
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
        ref: z.string().optional().describe("branch, tag, or commit SHA"),
      },
    },
    withActive("github", "get_file", async ({ owner, repo, path, ref }, account) => {
      const pat = (account.credentials as any).pat as string;
      const url = `${API}/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ""}`;
      const data: any = await apiCall("GET", url, { auth: `Bearer ${pat}`, headers: ghHeaders() });
      const content = data?.encoding === "base64" && data?.content ? Buffer.from(data.content, "base64").toString("utf8") : null;
      return jsonResult({ active_label: account.label, path, sha: data?.sha, content });
    }),
  );

  server.registerTool(
    "github_search_code",
    {
      description: "Search code across repositories using GitHub's code-search syntax.",
      inputSchema: { q: z.string().min(1) },
    },
    withActive("github", "search_code", async ({ q }, account) => {
      const pat = (account.credentials as any).pat as string;
      const results = await apiCall("GET", `${API}/search/code?q=${encodeURIComponent(q)}`, {
        auth: `Bearer ${pat}`,
        headers: ghHeaders(),
      });
      return jsonResult({ active_label: account.label, results });
    }),
  );

  server.registerTool(
    "github_get_authenticated_user",
    {
      description: "Get info about the authenticated GitHub user (login, name, scopes). Useful for sanity-checking which account is active.",
      inputSchema: {},
    },
    withActive("github", "get_user", async (_a, account) => {
      const pat = (account.credentials as any).pat as string;
      const user = await apiCall("GET", `${API}/user`, { auth: `Bearer ${pat}`, headers: ghHeaders() });
      return jsonResult({ active_label: account.label, user });
    }),
  );

  server.registerTool(
    "github_list_branches",
    {
      description: "List branches on a repository.",
      inputSchema: { owner: z.string(), repo: z.string(), per_page: z.number().int().min(1).max(100).default(30) },
    },
    withActive("github", "list_branches", async ({ owner, repo, per_page }, account) => {
      const pat = (account.credentials as any).pat as string;
      const branches = await apiCall("GET", `${API}/repos/${owner}/${repo}/branches?per_page=${per_page}`, {
        auth: `Bearer ${pat}`,
        headers: ghHeaders(),
      });
      return jsonResult({ active_label: account.label, branches });
    }),
  );

  server.registerTool(
    "github_create_pull_request",
    {
      description: "Open a pull request on a repository.",
      inputSchema: {
        owner: z.string(),
        repo: z.string(),
        title: z.string().min(1),
        head: z.string().min(1).describe("Source branch (e.g. 'feature-x')"),
        base: z.string().min(1).describe("Target branch (e.g. 'main')"),
        body: z.string().optional(),
        draft: z.boolean().default(false),
      },
    },
    withActive("github", "create_pr", async ({ owner, repo, title, head, base, body, draft }, account) => {
      const pat = (account.credentials as any).pat as string;
      const pr = await apiCall("POST", `${API}/repos/${owner}/${repo}/pulls`, {
        auth: `Bearer ${pat}`,
        headers: ghHeaders(),
        body: { title, head, base, body, draft },
      });
      return jsonResult({ active_label: account.label, pull_request: pr });
    }),
  );

  server.registerTool(
    "github_list_workflow_runs",
    {
      description: "List recent GitHub Actions workflow runs for a repository. Use to check CI status.",
      inputSchema: {
        owner: z.string(),
        repo: z.string(),
        per_page: z.number().int().min(1).max(100).default(20),
        branch: z.string().optional(),
        status: z.enum(["queued", "in_progress", "completed", "success", "failure", "cancelled"]).optional(),
      },
    },
    withActive("github", "list_runs", async ({ owner, repo, per_page, branch, status }, account) => {
      const pat = (account.credentials as any).pat as string;
      const qs = new URLSearchParams({ per_page: String(per_page) });
      if (branch) qs.set("branch", branch);
      if (status) qs.set("status", status);
      const runs = await apiCall("GET", `${API}/repos/${owner}/${repo}/actions/runs?${qs}`, {
        auth: `Bearer ${pat}`,
        headers: ghHeaders(),
      });
      return jsonResult({ active_label: account.label, runs });
    }),
  );

  server.registerTool(
    "github_get_workflow_run",
    {
      description: "Get details for a single GitHub Actions workflow run, including conclusion + job summary.",
      inputSchema: { owner: z.string(), repo: z.string(), run_id: z.number().int() },
    },
    withActive("github", "get_run", async ({ owner, repo, run_id }, account) => {
      const pat = (account.credentials as any).pat as string;
      const run = await apiCall("GET", `${API}/repos/${owner}/${repo}/actions/runs/${run_id}`, {
        auth: `Bearer ${pat}`,
        headers: ghHeaders(),
      });
      return jsonResult({ active_label: account.label, run });
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
