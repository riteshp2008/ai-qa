"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [notice, setNotice] = useState("");

  async function startRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsStarting(true);
    setNotice("");

    try {
      const response = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, instruction }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to start the test run.");
      }

      setNotice(result.message ?? "Test run queued.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to start the test run.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div>
            <strong>Sentinel</strong>
            <span>AI quality control</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><span>◈</span> Overview</a>
          <a className="nav-item" href="#test-suites"><span>▣</span> Test suites</a>
          <a className="nav-item" href="#runs"><span>↻</span> Runs</a>
          <a className="nav-item" href="#issues"><span>⚠</span> Issues</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="usage-card">
            <div className="usage-header"><span>Monthly usage</span><strong>—</strong></div>
            <div className="usage-track"><div className="usage-value empty" /></div>
            <small>No usage recorded</small>
          </div>
          <a className="nav-item" href="#settings"><span>⚙</span> Settings</a>
          <div className="user-row">
            <div className="avatar">?</div>
            <div><strong>Workspace owner</strong><span>Not signed in</span></div>
            <span className="more">•••</span>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Projects</span><b>/</b><strong>New project</strong></div>
          <div className="top-actions"><span className="environment"><i /> Production</span><button className="icon-button" aria-label="Notifications">♢</button><button className="help-button">?</button></div>
        </header>

        <div className="page-content" id="overview">
          <div className="page-heading">
            <div>
              <p className="eyebrow">PROJECT OVERVIEW</p>
              <h1>AI quality control <span>✦</span></h1>
              <p className="subheading">Connect a project to start your first evidence-based test run.</p>
            </div>
            <button className="primary-button" onClick={() => document.getElementById("run-form")?.scrollIntoView({ behavior: "smooth" })}>＋ New test run</button>
          </div>

          <div className="metric-grid">
            <Metric label="Test health" value="—" detail="No runs yet" trend="neutral" icon="♡" />
            <Metric label="Tests passed" value="—" detail="No results yet" trend="neutral" icon="✓" />
            <Metric label="Avg. run time" value="—" detail="No runs yet" trend="neutral" icon="◷" />
            <Metric label="AI confidence" value="—" detail="No findings yet" trend="neutral" icon="✦" />
          </div>

          <div className="dashboard-grid">
            <section className="panel test-panel" id="test-suites">
              <div className="panel-heading">
                <div><h2>Latest test run</h2><p>No test runs have been created.</p></div>
              </div>
              <EmptyState message="Your first test run will appear here." />
            </section>

            <section className="panel activity-panel" id="issues">
              <div className="panel-heading"><div><h2>Recent findings</h2><p>AI findings will appear after a run.</p></div></div>
              <EmptyState message="No findings yet." />
            </section>
          </div>

          <section className="run-section" id="run-form">
            <div className="section-heading"><div><p className="eyebrow">RUN A NEW CHECK</p><h2>Tell your AI tester what to explore</h2></div><span className="secure-label">⌁ Your key stays private</span></div>
            <form className="run-form" onSubmit={startRun}>
              <label>Target URL<input type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-app.com" /></label>
              <label>Testing instruction<textarea required value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={3} /></label>
              <div className="form-footer"><span>Gemini 2.5 Flash · Browserbase cloud browser</span><button className="primary-button" disabled={isStarting}>{isStarting ? "Queueing…" : "Start AI test  →"}</button></div>
              {notice && <p className="form-notice" role="status">{notice}</p>}
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, detail, trend, icon }: { label: string; value: string; detail: string; trend: "positive" | "warning" | "neutral"; icon: string }) {
  return <article className="metric-card"><div className={`metric-icon ${trend}`}>{icon}</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small className={trend}>{detail}</small></div></article>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state"><span>○</span><p>{message}</p></div>;
}
