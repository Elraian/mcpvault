import type { ProxyAdapter } from "./types.js";

/**
 * AWS — proxies a community AWS MCP server with credentials injected as env
 * vars. Multi-account in mcpvault = multiple IAM users / accounts / profiles.
 *
 * Note: validating an AWS access key requires SigV4 signing, which is heavy
 * without aws-sdk as a dep. We do basic format checks and let the upstream
 * server fail loudly on first use if creds are wrong.
 */
export const awsAdapter: ProxyAdapter = {
  service: "aws",
  displayName: "AWS",
  tokenUrl: "https://console.aws.amazon.com/iam/home#/security_credentials",
  hint:
    "Create an IAM user with read-only AWS policies as a baseline. Copy the access key ID and secret. " +
    "For multi-account orgs, create a per-account IAM user and store each here.",

  credentialFields: [
    { key: "access_key_id", prompt: "AWS access key ID (AKIA...)", secret: false, placeholder: "AKIA..." },
    { key: "secret_access_key", prompt: "AWS secret access key", secret: true },
    { key: "region", prompt: "Default region (e.g. us-east-1)", placeholder: "us-east-1" },
    { key: "session_token", prompt: "Session token (only for temporary credentials)", optional: true, secret: true },
  ],

  validate: async (creds) => {
    const key = String(creds.access_key_id).trim();
    if (!/^(AKIA|ASIA|AIDA|AROA)[A-Z0-9]{16}$/.test(key)) {
      return { ok: false, error: "access key ID should be 20 chars starting with AKIA/ASIA/AIDA/AROA" };
    }
    if (String(creds.secret_access_key).trim().length < 30) {
      return { ok: false, error: "secret key looks too short — secrets are usually 40 chars" };
    }
    return {
      ok: true,
      identity: `aws ${key.slice(0, 4)}…${key.slice(-4)} (${String(creds.region || "no-region")})`,
      suggestedLabel: `aws-${String(creds.region || "main").replace(/[^a-z0-9-]/g, "-")}`,
      details: { region: creds.region },
    };
  },

  spawnCmd: "npx",
  spawnArgs: ["-y", "@yawlabs/aws-mcp"],
  authMapping: (creds) => {
    const env: Record<string, string> = {
      AWS_ACCESS_KEY_ID: String(creds.access_key_id),
      AWS_SECRET_ACCESS_KEY: String(creds.secret_access_key),
      AWS_REGION: String(creds.region || "us-east-1"),
      AWS_DEFAULT_REGION: String(creds.region || "us-east-1"),
    };
    if (creds.session_token) env.AWS_SESSION_TOKEN = String(creds.session_token);
    return env;
  },
};
