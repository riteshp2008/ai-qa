"use client";

import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type DashboardUser = { email: string; name?: string };
type Project = { id: string; name: string; target_url: string; team_id?: string };
type TestRun = {
  id: string;
  project_id: string;
  status: "queued" | "running" | "retry_wait" | "passed" | "failed" | "needs_review" | "cancelled";
  instruction: string;
  target_url: string;
  created_at: string;
  projects?: { name?: string } | null;
};
type Team = { id: string; name: string; slug: string };
type TeamMember = { user_id: string; role: "owner" | "admin" | "member"; created_at: string };
type Invite = { id: string; email: string; role: string; status: string; expires_at: string };

type ApiResult = { message?: string; project?: Project; projects?: Project[]; runs?: TestRun[] };

export default function DashboardClient({ user }: { user: DashboardUser }) {
  const router = useRouter();
  const [view, setView] = useState<"overview" | "projects" | "runs" | "team" | "settings" | "new-project" | "new-run">("overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamRole, setTeamRole] = useState("member");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsResponse, runsResponse, teamResponse] = await Promise.all([
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/test-runs", { cache: "no-store" }),
        fetch("/api/team", { cache: "no-store" }),
      ]);
      const projectResult = (await projectsResponse.json()) as ApiResult;
      const runsResult = (await runsResponse.json()) as ApiResult;
      const teamResult = (await teamResponse.json()) as { team?: Team; role?: string; members?: TeamMember[]; invites?: Invite[]; message?: string };
      if (!projectsResponse.ok) throw new Error(projectResult.message ?? "Unable to load projects.");
      if (!runsResponse.ok) throw new Error(runsResult.message ?? "Unable to load runs.");
      if (!teamResponse.ok) throw new Error(teamResult.message ?? "Unable to load workspace team.");
      const loadedProjects = projectResult.projects ?? [];
      setProjects(loadedProjects);
      setRuns(runsResult.runs ?? []);
      setTeam(teamResult.team ?? null);
      setTeamRole(teamResult.role ?? "member");
      setMembers(teamResult.members ?? []);
      setInvites(teamResult.invites ?? []);
      if (!selectedProjectId && loadedProjects[0]) {
        setSelectedProjectId(loadedProjects[0].id);
        setUrl(loadedProjects[0].target_url);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadWorkspace(), 0);
    const interval = window.setInterval(() => void loadWorkspace(), 10000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadWorkspace]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, targetUrl: url }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok || !result.project) throw new Error(result.message ?? "Unable to create project.");
      setNotice("Project created in the team workspace.");
      setProjectName("");
      await loadWorkspace();
      setView("projects");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create project.");
    } finally {
      setBusy(false);
    }
  }

  async function startRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      if (!selectedProjectId) throw new Error("Select a project before starting a run.");
      const response = await fetch("/api/test-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId, url, instruction, idempotencyKey: crypto.randomUUID() }),
      });
      const result = (await response.json()) as { message?: string; runId?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to start the test run.");
      setNotice(result.runId ? `Run ${result.runId.slice(0, 8)} queued.` : "Test run accepted.");
      await loadWorkspace();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to start the test run.");
    } finally {
      setBusy(false);
    }
  }

  async function inviteCollaborator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: "member" }),
      });
      const result = (await response.json()) as { message?: string; inviteUrl?: string };
      if (!response.ok || !result.inviteUrl) throw new Error(result.message ?? "Unable to invite collaborator.");
      setInviteUrl(`${window.location.origin}${result.inviteUrl}`);
      setInviteEmail("");
      setNotice("Invite created. Copy the link and send it to your collaborator.");
      await loadWorkspace();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to invite collaborator.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    const { error } = await createSupabaseBrowserClient().auth.signOut();
    if (error) {
      setNotice("Unable to sign out. Please try again.");
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  const latestRun = runs[0];
  const canInvite = teamRole === "owner" || teamRole === "admin";
  const nav = [
    ["overview", "◈", "Overview"],
    ["projects", "▣", "Projects"],
    ["runs", "↻", "Runs"],
    ["team", "◎", "Team"],
    ["settings", "⚙", "Settings"],
  ] as const;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">✦</div><div><strong>Sentinel</strong><span>AI quality control</span></div></div>
        <div className="workspace-switcher"><small>WORKSPACE</small><strong>{team?.name ?? "Loading workspace"}</strong><span>{members.length} collaborator{members.length === 1 ? "" : "s"}</span></div>
        <nav className="nav-list" aria-label="Workspace navigation">
          {nav.map(([key, icon, label]) => <button className={`nav-item ${view === key ? "active" : ""}`} key={key} type="button" onClick={() => setView(key)}><span>{icon}</span>{label}{key === "projects" && <b>{projects.length}</b>}{key === "runs" && <b>{runs.length}</b>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="usage-card"><div className="usage-header"><span>Workspace status</span><strong>Ready</strong></div><div className="usage-track"><div className="usage-value" /></div><small>Durable data is enabled</small></div>
          <button className="user-row user-row-button" type="button" onClick={() => setView("settings")}><div className="avatar">{(user.name ?? user.email).slice(0, 1).toUpperCase()}</div><div><strong>{user.name ?? "Workspace member"}</strong><span>{user.email}</span></div></button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="breadcrumbs"><span>{team?.name ?? "Workspace"}</span><b>/</b><strong>{nav.find(([key]) => key === view)?.[2]}</strong></div><div className="top-actions"><span className="environment"><i /> Production</span><span className="user-pill">{user.email}</span></div></header>
        <div className="page-content">
          {view === "overview" && <Overview projects={projects} runs={runs} latestRun={latestRun} onNavigate={setView} />}
          {view === "projects" && <section><PageHeading eyebrow="PROJECTS" title="Authorized applications" description="Projects are the team-owned boundary for targets, runs, and evidence." action={<button className="primary-button" type="button" onClick={() => setView("new-project")}>＋ New project</button>} /><div className="project-list">{projects.length ? projects.map((project) => <div className="project-row" key={project.id}><span className="project-icon">◇</span><span className="project-copy"><strong>{project.name}</strong><small>{project.target_url}</small></span><span className="project-check">Team project</span></div>) : <EmptyState message="No projects yet. Create the first authorized project." />}</div></section>}
          {view === "new-project" && <section><PageHeading eyebrow="NEW PROJECT" title="Register an application" description="Only add web applications your team owns or is explicitly authorized to test." /><form className="project-create-form panel" onSubmit={createProject}><label>Project name<input required maxLength={100} value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="My web application" /></label><label>Authorized target URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://your-app.com" /></label><div><button className="primary-button" disabled={busy}>{busy ? "Creating..." : "Create project"}</button><button className="text-button form-cancel" type="button" onClick={() => setView("projects")}>Cancel</button></div></form></section>}
          {view === "runs" && <section><PageHeading eyebrow="TEST RUNS" title="Quality checks" description="Every run belongs to a team project and keeps its durable lifecycle." action={<button className="primary-button" type="button" onClick={() => setView("new-run")}>＋ New run</button>} />{runs.length ? <div className="run-table">{runs.map((run) => <div className="run-table-row" key={run.id}><div><strong>{run.projects?.name ?? "Project run"}</strong><small>{run.instruction}</small></div><span className={`status status-${run.status}`}>{run.status.replace("_", " ")}</span><small>{new Date(run.created_at).toLocaleDateString()}</small></div>)}</div> : <EmptyState message="No test runs have been created." />}</section>}
          {view === "new-run" && <section><PageHeading eyebrow="NEW TEST RUN" title="Describe what to verify" description="Sentinel will queue a durable run for the selected authorized project." /><form className="run-form panel" onSubmit={startRun}><label>Project<select required value={selectedProjectId} onChange={(event) => { setSelectedProjectId(event.target.value); const project = projects.find((item) => item.id === event.target.value); if (project) setUrl(project.target_url); }}><option value="" disabled>Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>Target URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} /></label><label>Testing instruction<textarea required value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={4} placeholder="Verify the login flow and success state." /></label><button className="primary-button" disabled={busy || !projects.length}>{busy ? "Queueing..." : "Start test run →"}</button></form></section>}
          {view === "team" && <section><PageHeading eyebrow="TEAM" title="Workspace collaborators" description="Invite teammates once; they can access every project this workspace owns." action={canInvite ? <button className="primary-button" type="button" onClick={() => document.getElementById("invite-form")?.scrollIntoView({ behavior: "smooth" })}>＋ Invite collaborator</button> : undefined} /><div className="panel team-list"><div className="panel-heading"><div><h2>Members</h2><p>Role-based access for this workspace.</p></div></div>{members.map((member) => <div className="team-member" key={member.user_id}><div className="avatar">{member.user_id === user.email ? "Y" : "•"}</div><div><strong>{member.user_id === user.email ? user.email : `Member ${member.user_id.slice(0, 8)}`}</strong><small>{member.role}</small></div></div>)}</div>{canInvite && <form id="invite-form" className="panel invite-form" onSubmit={inviteCollaborator}><h2>Invite a collaborator</h2><p>We generate a single-use link valid for seven days. Send it through your team’s trusted channel.</p><label>Email address<input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" /></label><button className="primary-button" disabled={busy}>{busy ? "Creating invite..." : "Create invite link"}</button>{inviteUrl && <label>Invite link<input readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} /></label>}{invites.length > 0 && <small>{invites.length} pending invite{invites.length === 1 ? "" : "s"}.</small>}</form>}</section>}
          {view === "settings" && <section><PageHeading eyebrow="SETTINGS" title="Workspace and account" description="Manage the current session and review the workspace boundary." /><div className="settings-section panel"><strong>{team?.name}</strong><p>Workspace slug: {team?.slug}</p><p>Signed in as {user.email}</p><button className="outline-button" disabled={busy} onClick={signOut}>{busy ? "Signing out..." : "Sign out"}</button></div></section>}
          {notice && <p className="form-notice" role="status">{notice}</p>}
          {loading && <p className="workspace-loading">Refreshing workspace data…</p>}
        </div>
      </section>
    </main>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subheading">{description}</p></div>{action}</div>;
}

function Overview({ projects, runs, latestRun, onNavigate }: { projects: Project[]; runs: TestRun[]; latestRun?: TestRun; onNavigate: (view: "projects" | "runs" | "team" | "new-project" | "new-run") => void }) {
  return <section><PageHeading eyebrow="WORKSPACE OVERVIEW" title="Quality at a glance" description="A focused view of your team’s authorized applications and recent checks." action={<button className="primary-button" type="button" onClick={() => onNavigate("new-run")}>＋ New test run</button>} /><div className="metric-grid"><Metric label="Projects" value={String(projects.length)} detail="Team-owned targets" /><Metric label="Runs" value={String(runs.length)} detail="Durable run history" /><Metric label="Passed" value={String(runs.filter((run) => run.status === "passed").length)} detail="Verified outcomes" /><Metric label="Review" value={String(runs.filter((run) => run.status === "needs_review").length)} detail="Needs attention" /></div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><h2>Latest run</h2><p>Canonical state from the run store.</p></div><button className="text-button" type="button" onClick={() => onNavigate("runs")}>View all</button></div>{latestRun ? <div className="run-summary"><strong>{latestRun.projects?.name ?? "Project run"}</strong><span className={`status status-${latestRun.status}`}>{latestRun.status.replace("_", " ")}</span><p>{latestRun.instruction}</p></div> : <EmptyState message="No runs yet." />}</section><section className="panel"><div className="panel-heading"><div><h2>Next step</h2><p>Keep the workspace organized.</p></div></div><div className="overview-actions"><button type="button" onClick={() => onNavigate("projects")}>Manage projects <b>→</b></button><button type="button" onClick={() => onNavigate("team")}>Invite collaborators <b>→</b></button></div></section></div></section>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="metric-card"><div className="metric-icon neutral">•</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state"><span>◇</span>{message}</div>;
}
