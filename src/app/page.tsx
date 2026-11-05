import Link from "next/link";

const capabilities = [
  ["✦", "Plan with context", "Turn a plain-language requirement into a bounded, reviewable test plan."],
  ["◇", "Run safely", "Test authorized web applications in isolated browser sessions with policy gates."],
  ["✓", "Prove every result", "Use deterministic assertions, diagnostics, and evidence instead of guesswork."],
];

export default function Home() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" href="/">
          <span className="brand-mark">✦</span>
          <span><strong>Sentinel</strong><small>AI quality control</small></span>
        </Link>
        <nav className="landing-links" aria-label="Public navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#principles">Principles</a>
          <Link href="/sign-in">Sign in</Link>
          <Link className="primary-button" href="/sign-up">Get started</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">EVIDENCE-BASED WEB QUALITY</p>
          <h1>Ship with confidence, not assumptions.</h1>
          <p className="landing-lead">Sentinel helps teams test authorized web applications with AI-assisted planning, safe browser execution, and results backed by deterministic evidence.</p>
          <div className="landing-actions">
            <Link className="primary-button" href="/sign-up">Create free account <span>→</span></Link>
            <Link className="landing-secondary-action" href="/sign-in">Already have an account? Sign in</Link>
          </div>
          <p className="landing-note">Your credentials and test evidence stay protected server-side.</p>
        </div>
        <div className="landing-visual" aria-label="Sentinel evidence workflow preview">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="visual-card visual-card-main">
            <div className="visual-card-header"><span className="live-dot" /> Test run evidence</div>
            <strong>Checkout flow</strong><span className="visual-status">Needs review</span>
            <div className="visual-progress"><span /></div>
            <small>3 deterministic assertions · 2 evidence items</small>
          </div>
          <div className="visual-card visual-card-mini"><span>✓</span><div><strong>Assertion captured</strong><small>URL and visible text verified</small></div></div>
        </div>
      </section>

      <section className="landing-section" id="how-it-works">
        <p className="eyebrow">ONE CONTROLLED WORKFLOW</p><h2>From requirement to reviewable result.</h2>
        <div className="capability-grid">
          {capabilities.map(([icon, title, description]) => <article className="capability-card" key={title}><span className="capability-icon">{icon}</span><h3>{title}</h3><p>{description}</p></article>)}
        </div>
      </section>

      <section className="landing-principles" id="principles">
        <div><p className="eyebrow">BUILT FOR TRUST</p><h2>AI proposes. Deterministic checks decide.</h2></div>
        <p>Every run keeps authorization, policy, attempts, assertions, and evidence traceable. Ambiguous outcomes go to human review instead of becoming false confidence.</p>
      </section>
      <footer className="landing-footer"><span>Sentinel · AI quality control</span><Link href="/sign-up">Start testing safely →</Link></footer>
    </main>
  );
}
