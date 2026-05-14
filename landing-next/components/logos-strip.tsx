import { SupabaseMark, GitHubMark, VercelMark, StripeMark, ClaudeMark } from "./icons";

const items = [
  { name: "Supabase", Icon: SupabaseMark },
  { name: "GitHub", Icon: GitHubMark },
  { name: "Vercel", Icon: VercelMark },
  { name: "Stripe", Icon: StripeMark },
  { name: "Claude Desktop", Icon: ClaudeMark },
  { name: "Model Context Protocol", Icon: ClaudeMark },
];

export function LogosStrip() {
  return (
    <section className="border-b border-border bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-center text-[10.5px] uppercase tracking-[0.22em] text-faint font-mono">
          Wraps the services you already use
        </p>
        <div className="mt-7 scroll-fade overflow-hidden">
          <div className="marquee flex items-center gap-14 whitespace-nowrap">
            {[...items, ...items].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 text-faint hover:text-muted transition"
              >
                <item.Icon className="h-4 w-4 opacity-70" />
                <span className="text-[15px] font-medium tracking-tight">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
