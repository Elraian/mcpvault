import { ArrowRight, GitHubMark } from "./icons";

export function CTA() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-bg">
      <div className="aurora opacity-70" aria-hidden="true" />
      <div className="absolute inset-0 gridbg gridbg-fade" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-6 py-28 md:py-36 text-center">
        <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[1.0]">
          Stop pasting tokens.
          <br />
          <span className="font-serif italic font-normal text-fg/60">
            Start switching contexts.
          </span>
        </h2>
        <p className="mt-6 text-[16.5px] text-muted leading-relaxed max-w-xl mx-auto">
          mcp-vault is open source, MIT-licensed, and runs entirely on your
          machine. Get it running in five minutes.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#install"
            className="btn-acid inline-flex items-center gap-2 h-11 px-5 rounded-lg text-[14px] font-semibold tracking-tight"
          >
            Install mcp-vault
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://github.com/"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border-strong bg-surface/70 backdrop-blur text-[14px] text-muted hover:text-fg hover:bg-surface-2 transition"
          >
            <GitHubMark className="h-3.5 w-3.5" />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
