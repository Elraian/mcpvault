const items = [
  {
    q: "Does Claude ever see my actual tokens?",
    a: "No. Wrappers decrypt the active credential in their own process and call the upstream API. Claude only sees what the API returned — project lists, query results, deployments. The PAT never crosses the MCP wire.",
  },
  {
    q: "What if my laptop is stolen?",
    a: "The vault file is AES-256-GCM with an Argon2id-derived key. The session key cached in the OS keychain is protected by your OS login (DPAPI on Windows, Keychain on macOS). Without your OS password, neither file is useful.",
  },
  {
    q: "Do I have to re-enter my master password every day?",
    a: (
      <>
        No — the derived key is cached in your OS keychain across reboots. If
        you'd rather have it expire, run{" "}
        <code className="font-mono text-[13px] text-fg">mcp-vault lock</code>{" "}
        before shutting down (or call{" "}
        <code className="font-mono text-[13px] text-fg">lock_vault</code>{" "}
        through Claude).
      </>
    ),
  },
  {
    q: "Why is the Stripe wrapper read-only?",
    a: (
      <>
        Because money moves are not the kind of thing you want a chat interface
        to be one prompt away from. No{" "}
        <code className="font-mono text-[13px] text-fg">create_charge</code>,
        no <code className="font-mono text-[13px] text-fg">refund</code>, by
        design.
      </>
    ),
  },
  {
    q: "Can I add more services?",
    a: "v1 covers bearer-token / API-key auth: Supabase, GitHub, Vercel, Stripe. v2+ brings OAuth services (Gmail, Drive, Slack) with refresh logic, plus 1Password / Bitwarden adapters and multi-service contexts.",
  },
  {
    q: "Is this hosted anywhere?",
    a: "No. mcp-vault is local-first by design — there is no server, no account, no telemetry. The vault file lives on your machine; that's it.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-b border-border bg-bg">
      <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[1.05]">
          Questions{" "}
          <span className="font-serif italic font-normal text-fg/60">
            worth answering.
          </span>
        </h2>

        <div className="mt-12 divide-y divide-border border-y border-border">
          {items.map((item, i) => (
            <details key={i} className="group py-6">
              <summary className="flex items-start justify-between gap-6 text-left">
                <span className="text-[16px] font-medium tracking-tight">
                  {item.q}
                </span>
                <span className="chev mt-1 text-faint text-2xl leading-none font-light">
                  +
                </span>
              </summary>
              <div className="mt-3 text-[14.5px] text-muted leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-px w-8 bg-acid-500/60" />
      <span className="text-[10.5px] uppercase tracking-[0.22em] text-acid-400 font-mono">
        {children}
      </span>
    </div>
  );
}
