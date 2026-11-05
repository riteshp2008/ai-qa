import Link from "next/link";

const capabilities = [
  ["01", "Describe the goal", "Give Sentinel an authorized target and a plain-language flow to verify."],
  ["02", "Review the plan", "Turn intent into a bounded, inspectable sequence before execution."],
  ["03", "Trace the outcome", "Keep statuses, assertions, diagnostics, and evidence connected to the run."],
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
          <a href="#workflow">Workflow</a>
          <a href="#trust">Trust model</a>
          <Link href="/sign-in">Sign in</Link>
          <Link className="primary-button" href="/sign-up">Get started</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">AI QUALITY CONTROL FOR THE WEB</p>
          <h1>Know what works before your users do.</h1>
          <p className="landing-lead">Sentinel turns authorized web-testing goals into traceable runs. AI helps plan the work; deterministic checks and evidence keep the result honest.</p>
          <div className="landing-actions">
            <Link className="primary-button" href="/sign-up">Create free account <span>→</span></Link>
            <Link className="landing-secondary-action" href="/sign-in">Already have an account? Sign in</Link>
          </div>
          <div className="landing-proof-row"><span><i /> Authenticated workspaces</span><span><i /> Scope-checked targets</span><span><i /> Reviewable outcomes</span></div>
        </div>
        <div className="landing-visual" aria-label="Sentinel evidence workflow preview">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="visual-card visual-card-main">
            <div className="visual-card-header"><span className="live-dot" /> LIVE RUN RECORD</div>
            <strong>Checkout flow</strong><span className="visual-status">Needs review</span>
            <div className="visual-progress"><span /></div>
            <small>2 assertions pending · evidence stays attached</small>
          </div>
          <div className="visual-card visual-card-mini"><span>✓</span><div><strong>Scope verified</strong><small>Authorized project target</small></div></div>
          <div className="visual-card visual-card-side"><span>↗</span><div><strong>Traceable by default</strong><small>Run · attempt · evidence</small></div></div>
        </div>
      </section>

      <section className="landing-section" id="workflow">
        <div className="section-intro"><div><p className="eyebrow">ONE CONTROLLED WORKFLOW</p><h2>From requirement to reviewable result.</h2></div><p>Start small, keep ownership clear, and see what happened at every stage. No black-box pass button.</p></div>
        <div className="capability-grid">
          {capabilities.map(([step, title, description]) => <article className="capability-card" key={title}><span className="capability-step">{step}</span><h3>{title}</h3><p>{description}</p><span className="capability-arrow">Explore step <b>→</b></span></article>)}
        </div>
      </section>

      <section className="landing-principles" id="trust">
        <div><p className="eyebrow">BUILT FOR TRUST</p><h2>AI proposes. Evidence decides.</h2></div>
        <div className="principle-list"><p><b>Authorized by design.</b> Projects define the target scope before a run can start.</p><p><b>Honest states.</b> Queued, failed, and needs-review are never disguised as passed.</p><p><b>Private by default.</b> Credentials and server-side evidence do not belong in the browser UI.</p></div>
      </section>
      <section className="landing-cta"><p className="eyebrow">READY WHEN YOU ARE</p><h2>Make your next release easier to trust.</h2><p>Create a workspace, register an authorized target, and bring your first quality check into the open.</p><Link className="primary-button" href="/sign-up">Create your workspace <span>→</span></Link></section>
      <footer className="landing-footer"><span>Sentinel · AI quality control</span><div><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></div></footer>
    </main>
  );
}
