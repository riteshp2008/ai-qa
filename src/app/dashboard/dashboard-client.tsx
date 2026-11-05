"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type DashboardUser = {
  email: string;
  name?: string;
};

type Project = {
  id: string;
  name: string;
  target_url: string;
};

type ProjectResponse = {
  project?: Project;
  projects?: Project[];
  message?: string;
};

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("");
  const [projectName, setProjectName] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      setIsLoadingProjects(true);
      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        const result = (await response.json()) as ProjectResponse;
        if (!response.ok) {
          throw new Error(result.message ?? "Unable to load projects.");
        }

        const loadedProjects = result.projects ?? [];
        setProjects(loadedProjects);
        if (loadedProjects[0]) {
          setSelectedProjectId(loadedProjects[0].id);
          setUrl(loadedProjects[0].target_url);
          setProjectName(loadedProjects[0].name);
        }
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Unable to load projects.");
      } finally {
        setIsLoadingProjects(false);
      }
    }

    void loadProjects();
  }, []);

  function selectProject(project: Project, availableProjects = projects) {
    setProjects(availableProjects);
    setSelectedProjectId(project.id);
    setUrl(project.target_url);
    setProjectName(project.name);
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProject(true);
    setNotice("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, targetUrl: url }),
      });
      const result = (await response.json()) as ProjectResponse;
      if (!response.ok || !result.project) {
        throw new Error(result.message ?? "Unable to create project.");
      }

      const nextProjects = [result.project, ...projects];
      selectProject(result.project, nextProjects);
      setNotice("Project created and selected.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create project.");
    } finally {
      setIsSavingProject(false);
    }
  }

  async function startRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsStarting(true);
    setNotice("");

    try {
      if (!selectedProjectId) {
        throw new Error("Create or select a project before starting a run.");
      }

      const response = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          url,
          instruction,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const result = (await response.json()) as { message?: string; missing?: string[] };
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to start the test run.");
      }

      setNotice(result.message ?? "Test run accepted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to start the test run.");
    } finally {
      setIsStarting(false);
    }
  }

  async function signOut() {
    setIsSigningOut(true);
    const { error } = await createSupabaseBrowserClient().auth.signOut();
    if (error) {
      setNotice("Unable to sign out. Please try again.");
      setIsSigningOut(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">✦</div><div><strong>Sentinel</strong><span>AI quality control</span></div></div>
        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item active" href="#overview"><span>◈</span> Overview</a>
          <a className="nav-item" href="#projects"><span>▣</span> Projects <b>{projects.length}</b></a>
          <a className="nav-item" href="#runs"><span>↻</span> Runs</a>
          <a className="nav-item" href="#issues"><span>⚠</span> Issues</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="usage-card"><div className="usage-header"><span>Monthly usage</span><strong>—</strong></div><div className="usage-track"><div className="usage-value empty" /></div><small>No usage recorded</small></div>
          <a className="nav-item" href="#settings"><span>⚙</span> Settings</a>
          <button className="user-row user-row-button" type="button" onClick={() => document.getElementById("settings")?.scrollIntoView({ behavior: "smooth" })}>
            <div className="avatar">{(user.name ?? user.email).slice(0, 1).toUpperCase()}</div><div><strong>{user.name ?? "Workspace member"}</strong><span>{user.email}</span></div><span className="more">•••</span>
          </button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{selectedProject?.name ?? "Overview"}</strong></div>
          <div className="top-actions">
            <span className="environment"><i /> Production</span>
            <span className="user-pill">{user.email}</span>
            <div className="header-action-wrap">
              <button className="icon-button" aria-label="Notifications" aria-expanded={showNotifications} onClick={() => setShowNotifications((current) => !current)}>♢</button>
              {showNotifications && <div className="popover"><strong>No notifications</strong><span>Run updates and review requests will appear here.</span></div>}
            </div>
            <div className="header-action-wrap">
              <button className="help-button" aria-label="Help" aria-expanded={showHelp} onClick={() => setShowHelp((current) => !current)}>?</button>
              {showHelp && <div className="popover help-popover"><strong>Need help?</strong><span>Start by creating a project, then describe the flow you want Sentinel to verify.</span></div>}
            </div>
          </div>
        </header>

        <div className="page-content" id="overview">
          <div className="page-heading"><div><p className="eyebrow">PROJECT OVERVIEW</p><h1>AI quality control <span>✦</span></h1><p className="subheading">Welcome back, {user.name ?? user.email}. Manage authorized projects and evidence-based checks.</p></div><button className="primary-button" onClick={() => document.getElementById("run-form")?.scrollIntoView({ behavior: "smooth" })}>＋ New test run</button></div>

          <div className="metric-grid"><Metric label="Projects" value={String(projects.length)} detail={isLoadingProjects ? "Loading workspace" : "Owned projects"} trend="neutral" icon="▣" /><Metric label="Tests passed" value="—" detail="No results yet" trend="neutral" icon="✓" /><Metric label="Avg. run time" value="—" detail="No runs yet" trend="neutral" icon="◷" /><Metric label="AI confidence" value="—" detail="No findings yet" trend="neutral" icon="✦" /></div>

          <section className="panel projects-panel" id="projects">
            <div className="panel-heading"><div><h2>Your projects</h2><p>Each project defines the authorized target scope for its runs.</p></div><button className="text-button" onClick={() => document.getElementById("project-form")?.scrollIntoView({ behavior: "smooth" })}>＋ Add project</button></div>
            {isLoadingProjects ? <EmptyState message="Loading your projects..." /> : projects.length === 0 ? <EmptyState message="Create your first authorized project below." /> : <div className="project-list">{projects.map((project) => <button className={`project-row ${project.id === selectedProjectId ? "selected" : ""}`} key={project.id} onClick={() => selectProject(project)}><span className="project-icon">◇</span><span className="project-copy"><strong>{project.name}</strong><small>{project.target_url}</small></span><span className="project-check">{project.id === selectedProjectId ? "Selected" : "Select"}</span></button>)}</div>}
          </section>

          <div className="dashboard-grid" id="runs">
            <section className="panel test-panel"><div className="panel-heading"><div><h2>Latest test run</h2><p>Persisted run results will appear here.</p></div></div><EmptyState message="No test runs have been created." /></section>
            <section className="panel activity-panel" id="issues"><div className="panel-heading"><div><h2>Recent findings</h2><p>Evidence-backed findings will appear after a run.</p></div></div><EmptyState message="No findings yet." /></section>
          </div>

          <section className="run-section" id="run-form"><div className="section-heading"><div><p className="eyebrow">RUN A NEW CHECK</p><h2>Tell your AI tester what to explore</h2></div><span className="secure-label">⌁ Your key stays private</span></div>
            <form className="run-form" onSubmit={startRun}>
              <label>Project<select required value={selectedProjectId} onChange={(event) => { const project = projects.find((item) => item.id === event.target.value); if (project) selectProject(project); }}><option value="" disabled>{projects.length ? "Select an authorized project" : "Create a project first"}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label>Target URL<input type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-app.com" /></label>
              <label>Testing instruction<textarea required value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={3} placeholder="Test the login flow safely and verify the success state." /></label>
              <div className="form-footer"><span>Gemini 2.5 Flash · Browserbase cloud browser</span><button className="primary-button" disabled={isStarting || !selectedProjectId}>{isStarting ? "Queueing…" : "Start AI test  →"}</button></div>
              {notice && <p className="form-notice" role="status">{notice}</p>}
            </form>
          </section>

          <section className="settings-section" id="settings"><div><p className="eyebrow">WORKSPACE SETTINGS</p><h2>Account and session</h2><p className="subheading">Signed in as {user.email}. Your session is managed by Supabase.</p></div><button className="outline-button" disabled={isSigningOut} onClick={signOut}>{isSigningOut ? "Signing out..." : "Sign out"}</button></section>
          <section className="project-create-section" id="project-form"><div><p className="eyebrow">ADD AUTHORIZED PROJECT</p><h2>Register a target application</h2><p className="subheading">Only test applications you own or are explicitly authorized to test.</p></div><form className="project-create-form" onSubmit={createProject}><label>Project name<input required maxLength={100} value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="My web application" /></label><label>Target URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-app.com" /></label><button className="primary-button" disabled={isSavingProject}>{isSavingProject ? "Creating..." : "Create project"}</button></form></section>
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
