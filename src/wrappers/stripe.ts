import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { jsonResult, withActive } from "./common.js";

const API = "https://api.stripe.com/v1";

/**
 * Stripe uses HTTP Basic auth with the secret key as the username, password empty.
 * Form-encoded requests; we wrap that here. v1 read-only: list customers, charges,
 * subscriptions, retrieve one. No writes — too easy to wreck production.
 */
async function stripeGet(path: string, secretKey: string, query?: Record<string, string | number | undefined>): Promise<unknown> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) qs.append(k, String(v));
  const url = `${API}${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const auth = "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch(url, { headers: { Authorization: auth } });
  const text = await res.text();
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = JSON.parse(text);
      msg += `: ${JSON.stringify(j)}`;
    } catch {
      msg += `: ${text.slice(0, 300)}`;
    }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : null;
}

export async function startStripeWrapper(): Promise<void> {
  const server = new McpServer({ name: "mcpvault-stripe", version: "0.1.0" });

  server.registerTool(
    "stripe_list_customers",
    {
      description: "List customers. Read-only.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(10),
        email: z.string().optional(),
      },
    },
    withActive("stripe", "list_customers", async ({ limit, email }, account) => {
      const c = account.credentials as any;
      const data = await stripeGet("/customers", c.secret_key, { limit, email });
      return jsonResult({ active_label: account.label, mode: c.mode, customers: data });
    }),
  );

  server.registerTool(
    "stripe_retrieve_customer",
    {
      description: "Retrieve a single customer by id.",
      inputSchema: { id: z.string().min(1) },
    },
    withActive("stripe", "retrieve_customer", async ({ id }, account) => {
      const c = account.credentials as any;
      const data = await stripeGet(`/customers/${id}`, c.secret_key);
      return jsonResult({ active_label: account.label, mode: c.mode, customer: data });
    }),
  );

  server.registerTool(
    "stripe_list_charges",
    {
      description: "List recent charges. Read-only.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(10),
        customer: z.string().optional(),
      },
    },
    withActive("stripe", "list_charges", async ({ limit, customer }, account) => {
      const c = account.credentials as any;
      const data = await stripeGet("/charges", c.secret_key, { limit, customer });
      return jsonResult({ active_label: account.label, mode: c.mode, charges: data });
    }),
  );

  server.registerTool(
    "stripe_list_subscriptions",
    {
      description: "List subscriptions. Read-only.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(10),
        customer: z.string().optional(),
        status: z.enum(["active", "past_due", "unpaid", "canceled", "incomplete", "incomplete_expired", "trialing", "all"]).optional(),
      },
    },
    withActive("stripe", "list_subscriptions", async ({ limit, customer, status }, account) => {
      const c = account.credentials as any;
      const data = await stripeGet("/subscriptions", c.secret_key, { limit, customer, status });
      return jsonResult({ active_label: account.label, mode: c.mode, subscriptions: data });
    }),
  );

  server.registerTool(
    "stripe_retrieve",
    {
      description:
        "Retrieve any Stripe resource by id. The id prefix determines the type (cus_, ch_, sub_, in_, pi_, etc.). Read-only.",
      inputSchema: { id: z.string().min(1) },
    },
    withActive("stripe", "retrieve", async ({ id }, account) => {
      const c = account.credentials as any;
      // Map prefix → endpoint
      const map: Record<string, string> = {
        cus: "customers",
        ch: "charges",
        sub: "subscriptions",
        in: "invoices",
        pi: "payment_intents",
        pm: "payment_methods",
        prod: "products",
        price: "prices",
        sess: "checkout/sessions",
        cs: "checkout/sessions",
      };
      const prefix = id.split("_")[0];
      const endpoint = map[prefix];
      if (!endpoint) throw new Error(`unknown stripe id prefix "${prefix}". Use stripe_list_* or stripe_retrieve_customer.`);
      const data = await stripeGet(`/${endpoint}/${id}`, c.secret_key);
      return jsonResult({ active_label: account.label, mode: c.mode, resource: data });
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
