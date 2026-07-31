import "~/styles/global.css";

import {
  canAddBlockedDomain,
  canCreateSession,
  canCreateWorkspace,
  localFreeEntitlement,
} from "@clearhead/entitlements";
import type { EntitlementSnapshot } from "@clearhead/shared";
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Cloud,
  Crown,
  Download,
  EllipsisVertical,
  Focus,
  FolderOpen,
  FolderPlus,
  Gauge,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "~/components/Brand";
import { ClearHeadPicker } from "~/components/ClearHeadPicker";
import { FocusControl } from "~/components/FocusControl";
import { PlanBadge } from "~/components/PlanBadge";
import { SessionCapture } from "~/components/SessionCapture";
import { UpgradePrompt } from "~/components/UpgradePrompt";
import { useAccount } from "~/hooks/useAccount";
import { useClearhead } from "~/hooks/useClearhead";
import { disconnectAccount, openWeb } from "~/lib/account";
import { normaliseDomain } from "~/lib/domains";
import { updateState } from "~/lib/storage";
import { validFocusDuration, weekStart } from "~/lib/time";
import { send } from "~/types/messages";
import { newId, type ClearheadState, type Session } from "~/types/state";

type View = "Dashboard" | "Workspaces" | "Sessions" | "Focus" | "Settings";
const views: Array<{ name: View; icon: typeof LayoutDashboard }> = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Workspaces", icon: BriefcaseBusiness },
  { name: "Sessions", icon: FolderOpen },
  { name: "Focus", icon: Focus },
  { name: "Settings", icon: Settings2 },
];

export default function SidePanel() {
  const { state, error, refresh } = useClearhead(),
    { account, refreshAccount } = useAccount();
  const [view, setView] = useState<View>("Dashboard"),
    [flow, setFlow] = useState<"save" | "park" | "clear" | null>(null),
    [notice, setNotice] = useState(""),
    [upgrade, setUpgrade] = useState<{ title: string; copy: string } | null>(
      null,
    );
  if (!state)
    return (
      <main className="app side">
        <Brand />
        <p className="muted">Loading your workspace…</p>
      </main>
    );
  const entitlement = account?.entitlement ?? localFreeEntitlement();
  const done = (message: string) => {
    setNotice(message);
    setFlow(null);
    void refresh();
  };
  const promptUpgrade = (title: string, copy: string) =>
    setUpgrade({ title, copy });
  return (
    <main className="side-app">
      <aside className="side-sidebar">
        <Brand />
        <nav aria-label="Main views">
          {views.map(({ name, icon: Icon }) => (
            <button
              className={view === name ? "active" : ""}
              onClick={() => {
                setView(name);
                setFlow(null);
              }}
              key={name}
            >
              <Icon size={18} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-plan">
          <Crown size={18} />
          <strong>
            {entitlement.plan === "free"
              ? "Unlock your full flow"
              : "You’re on Pro"}
          </strong>
          <span>
            {entitlement.plan === "trial"
              ? `${entitlement.trialDaysRemaining} trial days remaining`
              : entitlement.plan === "pro"
                ? "Premium focus is active"
                : "Unlimited sessions, sync & more"}
          </span>
          {entitlement.plan === "free" && (
            <button onClick={() => void openWeb("/pricing")}>
              Explore Pro
            </button>
          )}
        </div>
      </aside>
      <section className="side-main">
        <header className="side-header">
          <div>
            <span className="mobile-brand">
              <Brand />
            </span>
            <p className="eyebrow-extension">
              {view === "Dashboard" ? "Your focus home" : view}
            </p>
            <h1>
              {view === "Dashboard"
                ? state.focus.active
                  ? "Stay with what matters"
                  : "What will you move forward?"
                : view}
            </h1>
          </div>
          <div className="row">
            <PlanBadge compact entitlement={entitlement} />
            <button className="icon-button" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <button className="icon-button" aria-label="More options">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Main views">
          {views.map(({ name, icon: Icon }) => (
            <button
              className={view === name ? "active" : ""}
              aria-label={name}
              onClick={() => {
                setView(name);
                setFlow(null);
              }}
              key={name}
            >
              <Icon size={18} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="side-content">
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button aria-label="Dismiss" onClick={() => setNotice("")}>
                <X size={14} />
              </button>
            </div>
          )}
          {error && <div className="notice error">{error}</div>}
          {flow === "clear" ? (
            <ClearHeadPicker
              workspaceId={state.currentWorkspaceId!}
              onDone={done}
              onCancel={() => setFlow(null)}
            />
          ) : flow ? (
            <SessionCapture
              workspaceId={state.currentWorkspaceId!}
              park={flow === "park"}
              onDone={done}
              onCancel={() => setFlow(null)}
            />
          ) : view === "Dashboard" ? (
            <Dashboard
              state={state}
              entitlement={entitlement}
              onFlow={setFlow}
              done={done}
              upgrade={promptUpgrade}
            />
          ) : view === "Workspaces" ? (
            <Workspaces
              state={state}
              entitlement={entitlement}
              done={done}
              upgrade={promptUpgrade}
            />
          ) : view === "Sessions" ? (
            <Sessions
              state={state}
              entitlement={entitlement}
              onSave={() =>
                canCreateSession(entitlement, state.sessions.length)
                  ? setFlow("save")
                  : promptUpgrade(
                      "Save unlimited sessions",
                      "Free includes five editable sessions. Pro removes the limit and adds cloud backup.",
                    )
              }
              done={done}
            />
          ) : view === "Focus" ? (
            <FocusView
              state={state}
              entitlement={entitlement}
              done={done}
              upgrade={promptUpgrade}
            />
          ) : (
            <Settings
              state={state}
              entitlement={entitlement}
              account={account}
              done={done}
              refreshAccount={refreshAccount}
            />
          )}
        </div>
      </section>
      {upgrade && (
        <UpgradePrompt
          title={upgrade.title}
          copy={upgrade.copy}
          onClose={() => setUpgrade(null)}
        />
      )}
    </main>
  );
}

function Dashboard({
  state,
  entitlement,
  onFlow,
  done,
  upgrade,
}: {
  state: ClearheadState;
  entitlement: EntitlementSnapshot;
  onFlow: (value: "save" | "park" | "clear") => void;
  done: (message: string) => void;
  upgrade: (title: string, copy: string) => void;
}) {
  const workspace = state.workspaces.find(
      (item) => item.id === state.currentWorkspaceId,
    )!,
    sessions = state.sessions
      .filter((item) => item.workspaceId === workspace.id)
      .sort(
        (a, b) =>
          (b.lastRestoredAt ?? b.createdAt) - (a.lastRestoredAt ?? a.createdAt),
      ),
    weekly = state.stats.weekly.find((item) => item.weekStart === weekStart()),
    [tabs, setTabs] = useState(0);
  useEffect(() => {
    void chrome.tabs
      .query({ currentWindow: true })
      .then((items) => setTabs(items.length));
  }, []);
  async function restore(id: string) {
    const response = await send({ type: "RESTORE_SESSION", sessionId: id });
    done(response.ok ? response.message || "Restored." : response.error);
  }
  const save = () =>
    canCreateSession(entitlement, state.sessions.length)
      ? onFlow("save")
      : upgrade(
          "Save unlimited sessions",
          "You’ve reached the five-session Free limit. Pro keeps every project editable and backed up.",
        );
  return (
    <div className="dashboard-grid">
      <div className="dashboard-primary">
        <section className="welcome-card">
          <div>
            <span className="eyebrow-extension">The work that matters</span>
            <h2>
              {state.focus.active ? state.focus.objective : workspace.name}
            </h2>
            <p>
              {state.focus.active
                ? "Clearhead is protecting the outcome you chose."
                : "Name the result. Clearhead will prepare the browser and remember where you stop."}
            </p>
          </div>
          <span className="workspace-orb">
            <BookOpen size={22} />
          </span>
        </section>
        {sessions[0] && (
          <section className="continue-card">
            <span className="feature-icon">
              <Clock3 size={19} />
            </span>
            <div className="ellipsis">
              <span className="tiny">Resume with context</span>
              <h3>
                {sessions[0].nextStep ||
                  sessions[0].objective ||
                  sessions[0].name}
              </h3>
              <p className="muted">
                {sessions[0].outcome === "completed"
                  ? "Completed"
                  : "Checkpoint saved"}{" "}
                · {sessions[0].tabs.length} tabs ready
              </p>
            </div>
            <button
              className="btn compact"
              onClick={() => void restore(sessions[0].id)}
            >
              Bring it back
            </button>
          </section>
        )}
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow-extension">Prepare the environment</span>
              <h2>Make room for the work</h2>
            </div>
          </div>
          <div className="quick-actions">
            <button onClick={() => onFlow("clear")}>
              <span className="quick-icon indigo">
                <Sparkles size={23} />
              </span>
              <strong>Clear My Head</strong>
              <small>Park clutter safely</small>
            </button>
            <button onClick={save}>
              <span className="quick-icon green">
                <FolderPlus size={23} />
              </span>
              <strong>Save a checkpoint</strong>
              <small>Remember this state</small>
            </button>
            <button
              onClick={() =>
                document
                  .querySelector<HTMLButtonElement>('[aria-label="Focus"]')
                  ?.click()
              }
            >
              <span className="quick-icon amber">
                <Focus size={23} />
              </span>
              <strong>Choose an objective</strong>
              <small>Enter focused work</small>
            </button>
          </div>
        </section>
        <section className="panel-section">
          <div className="section-heading">
            <h2>Return without starting over</h2>
            <button
              onClick={() =>
                document
                  .querySelector<HTMLButtonElement>('[aria-label="Sessions"]')
                  ?.click()
              }
            >
              All checkpoints
            </button>
          </div>
          {sessions.length ? (
            <div className="session-list">
              {sessions.slice(0, 4).map((item) => (
                <button
                  className="session-row"
                  key={item.id}
                  onClick={() => void restore(item.id)}
                >
                  <span className="session-icon">
                    <FolderOpen size={17} />
                  </span>
                  <span className="ellipsis">
                    <strong>
                      {item.nextStep || item.objective || item.name}
                    </strong>
                    <small>
                      {item.checkpoint ? "Focus checkpoint" : "Saved context"} ·{" "}
                      {item.tabs.length} tabs
                    </small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FolderOpen size={25} />
              <strong>Your first checkpoint will appear here</strong>
              <span>
                Enter Focus and Clearhead will remember where you stop.
              </span>
            </div>
          )}
        </section>
      </div>
      <aside className="dashboard-secondary">
        <FocusControl
          state={state}
          entitlement={entitlement}
          onDone={done}
          onUpgrade={() =>
            upgrade(
              "Shape focus around your work",
              "Free includes focused 25 and 50 minute sessions. Pro adds custom durations, strict mode and scheduling.",
            )
          }
        />
        <section className="stats-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow-extension">Momentum</span>
              <h2>Progress protected</h2>
            </div>
            <BarChart3 size={18} />
          </div>
          <div className="stats-premium">
            <Stat
              value={weekly?.completedFocusSessions ?? 0}
              label="Outcomes"
              tone="green"
            />
            <Stat
              value={`${weekly?.totalFocusMinutes ?? 0}m`}
              label="Focused"
              tone="blue"
            />
            <Stat
              value={weekly?.distractionsBlocked ?? 0}
              label="Deflected"
              tone="amber"
            />
            <Stat value={tabs} label="Tabs now" tone="indigo" />
          </div>
        </section>
      </aside>
    </div>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div>
      <strong className={tone}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Workspaces({
  state,
  entitlement,
  done,
  upgrade,
}: {
  state: ClearheadState;
  entitlement: EntitlementSnapshot;
  done: (message: string) => void;
  upgrade: (title: string, copy: string) => void;
}) {
  const [name, setName] = useState(""),
    [domain, setDomain] = useState<Record<string, string>>({});
  async function mutate(
    fn: (state: ClearheadState) => ClearheadState,
    message: string,
  ) {
    try {
      await updateState(fn);
      done(message);
    } catch (error) {
      done(error instanceof Error ? error.message : "Failed.");
    }
  }
  const create = () => {
    const next = name.trim();
    if (!next) return;
    if (!canCreateWorkspace(entitlement, state.workspaces.length)) {
      upgrade(
        "Build with unlimited workspaces",
        "Multiple editable workspaces keep different parts of your life cleanly separated with Clearhead Pro.",
      );
      return;
    }
    void mutate((current) => {
      if (
        current.workspaces.some(
          (item) => item.name.toLowerCase() === next.toLowerCase(),
        )
      )
        throw new Error("That workspace already exists.");
      const now = Date.now(),
        id = newId();
      current.workspaces.push({
        id,
        name: next,
        createdAt: now,
        updatedAt: now,
        blockedDomains: [],
      });
      current.currentWorkspaceId = id;
      return current;
    }, "Workspace created.");
    setName("");
  };
  const editableId = state.workspaces[0]?.id;
  return (
    <div className="content-stack">
      <section className="toolbar-card">
        <div>
          <span className="eyebrow-extension">Organise your mind</span>
          <h2>Workspaces</h2>
          <p className="muted">
            Separate projects, blocklists and saved context.
          </p>
        </div>
        <div className="row responsive">
          <input
            className="input"
            aria-label="New workspace name"
            placeholder="New workspace"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") create();
            }}
          />
          <button
            className="btn compact"
            disabled={!name.trim()}
            onClick={create}
          >
            <Plus size={16} />
            Create
          </button>
        </div>
      </section>
      <div className="workspace-grid">
        {state.workspaces.map((workspace) => {
          const editable =
            entitlement.plan !== "free" || workspace.id === editableId;
          return (
            <section
              className={`workspace-card ${!editable ? "locked" : ""}`}
              key={workspace.id}
            >
              <div className="row between">
                <span className="workspace-icon">
                  <BriefcaseBusiness size={20} />
                </span>
                {state.currentWorkspaceId === workspace.id ? (
                  <span className="plan-badge">Current</span>
                ) : (
                  <button
                    className="icon-button"
                    aria-label={`Select ${workspace.name}`}
                    onClick={() =>
                      void mutate(
                        (current) => ({
                          ...current,
                          currentWorkspaceId: workspace.id,
                        }),
                        "Workspace selected.",
                      )
                    }
                  >
                    <ChevronRight size={17} />
                  </button>
                )}
              </div>
              <h3>{workspace.name}</h3>
              <p className="muted">
                {
                  state.sessions.filter(
                    (item) => item.workspaceId === workspace.id,
                  ).length
                }{" "}
                sessions · {workspace.blockedDomains.length} blocked
              </p>
              {!editable && (
                <span className="readonly-label">
                  <Crown size={13} />
                  Read-only on Free
                </span>
              )}
              <div className="workspace-actions">
                <button
                  disabled={!editable}
                  onClick={() => {
                    const next = prompt(
                      "Rename workspace",
                      workspace.name,
                    )?.trim();
                    if (next)
                      void mutate((current) => {
                        const item = current.workspaces.find(
                          (candidate) => candidate.id === workspace.id,
                        )!;
                        item.name = next;
                        item.updatedAt = Date.now();
                        return current;
                      }, "Workspace renamed.");
                  }}
                >
                  Rename
                </button>
                <button
                  disabled={!editable || state.workspaces.length === 1}
                  onClick={() => {
                    const count = state.sessions.filter(
                      (item) => item.workspaceId === workspace.id,
                    ).length;
                    if (
                      !confirm(
                        `Delete ${workspace.name}${count ? ` and its ${count} sessions` : ""}?`,
                      )
                    )
                      return;
                    void mutate((current) => {
                      current.workspaces = current.workspaces.filter(
                        (item) => item.id !== workspace.id,
                      );
                      current.sessions = current.sessions.filter(
                        (item) => item.workspaceId !== workspace.id,
                      );
                      if (current.currentWorkspaceId === workspace.id)
                        current.currentWorkspaceId = current.workspaces[0].id;
                      return current;
                    }, "Workspace deleted.");
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
              <div className="divider" />
              <strong className="tiny">Blocked sites & routes</strong>
              {workspace.blockedDomains.map((item) => (
                <div className="domain-row" key={item}>
                  <ShieldCheck size={15} />
                  <span className="ellipsis">{item}</span>
                  <button
                    disabled={!editable}
                    aria-label={`Remove ${item}`}
                    onClick={() =>
                      void mutate((current) => {
                        const target = current.workspaces.find(
                          (candidate) => candidate.id === workspace.id,
                        )!;
                        target.blockedDomains = target.blockedDomains.filter(
                          (value) => value !== item,
                        );
                        return current;
                      }, "Blocked site removed.")
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="row">
                <input
                  disabled={!editable}
                  className="input"
                  aria-label={`Domain for ${workspace.name}`}
                  placeholder="youtube.com/shorts"
                  value={domain[workspace.id] ?? ""}
                  onChange={(event) =>
                    setDomain({ ...domain, [workspace.id]: event.target.value })
                  }
                />
                <button
                  disabled={!editable}
                  className="btn secondary compact"
                  onClick={() => {
                    const target = normaliseDomain(domain[workspace.id] ?? "");
                    if (!target) {
                      done("Enter a valid public domain or route.");
                      return;
                    }
                    const total = state.workspaces.reduce(
                      (sum, item) => sum + item.blockedDomains.length,
                      0,
                    );
                    if (!canAddBlockedDomain(entitlement, total)) {
                      upgrade(
                        "Block without limits",
                        "Free includes three active blocked sites or routes. Pro gives every workspace its own unlimited blocklist.",
                      );
                      return;
                    }
                    void mutate((current) => {
                      const item = current.workspaces.find(
                        (candidate) => candidate.id === workspace.id,
                      )!;
                      if (item.blockedDomains.includes(target))
                        throw new Error(
                          "That domain or route is already blocked.",
                        );
                      item.blockedDomains.push(target);
                      return current;
                    }, "Blocked site added.");
                    setDomain({ ...domain, [workspace.id]: "" });
                  }}
                >
                  Add
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Sessions({
  state,
  entitlement,
  onSave,
  done,
}: {
  state: ClearheadState;
  entitlement: EntitlementSnapshot;
  onSave: () => void;
  done: (message: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(state.currentWorkspaceId ?? "all"),
    [open, setOpen] = useState<Session | null>(null),
    [busy, setBusy] = useState("");
  const editableIds = new Set(
    [...state.sessions]
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, entitlement.limits.sessions ?? state.sessions.length)
      .map((item) => item.id),
  );
  const rows = useMemo(
    () =>
      state.sessions
        .filter(
          (item) =>
            (filter === "all" || item.workspaceId === filter) &&
            [item.name, item.objective, item.nextStep].some((value) =>
              value?.toLowerCase().includes(query.toLowerCase()),
            ),
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [state, query, filter],
  );
  async function restore(id: string) {
    setBusy(id);
    const response = await send({ type: "RESTORE_SESSION", sessionId: id });
    setBusy("");
    done(response.ok ? response.message || "Restored." : response.error);
  }
  return (
    <div className="content-stack">
      <div className="section-heading">
        <div>
          <span className="eyebrow-extension">Saved context</span>
          <h2>Sessions</h2>
        </div>
        <button className="btn compact" onClick={onSave}>
          <Plus size={16} />
          New session
        </button>
      </div>
      <div className="filter-bar">
        <label>
          <Search size={16} />
          <input
            aria-label="Search sessions"
            placeholder="Search sessions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          className="select"
          aria-label="Filter workspace"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All workspaces</option>
          {state.workspaces.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {!rows.length ? (
        <div className="empty-state large">
          <FolderOpen size={30} />
          <strong>Your saved research will appear here</strong>
          <span>Capture the tabs you want to return to.</span>
          <button className="btn compact" onClick={onSave}>
            Save first session
          </button>
        </div>
      ) : (
        <div className="session-table">
          {rows.map((item) => {
            const editable =
              entitlement.plan !== "free" || editableIds.has(item.id);
            return (
              <section className="session-table-row" key={item.id}>
                <span className="session-icon">
                  <FolderOpen size={17} />
                </span>
                <div className="ellipsis">
                  <div className="row">
                    <h3>{item.name}</h3>
                    {!editable && (
                      <span className="readonly-label">
                        <Crown size={12} />
                        Pro edit
                      </span>
                    )}
                  </div>
                  <p>
                    {
                      state.workspaces.find(
                        (workspace) => workspace.id === item.workspaceId,
                      )?.name
                    }{" "}
                    · {new Date(item.createdAt).toLocaleDateString()} ·{" "}
                    {item.tabs.length} tabs
                  </p>
                </div>
                <div className="row session-buttons">
                  <button
                    className="btn compact"
                    disabled={busy === item.id}
                    onClick={() => void restore(item.id)}
                  >
                    {busy === item.id ? "Restoring…" : "Restore"}
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Inspect ${item.name}`}
                    onClick={() => setOpen(item)}
                  >
                    <EllipsisVertical size={17} />
                  </button>
                  <button
                    className="icon-button danger-text"
                    disabled={!editable}
                    aria-label={`Delete ${item.name}`}
                    onClick={() => {
                      if (confirm(`Delete ${item.name}?`))
                        void updateState((current) => {
                          current.sessions = current.sessions.filter(
                            (candidate) => candidate.id !== item.id,
                          );
                          return current;
                        }).then(() => done("Session deleted."));
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
      {open && (
        <SessionDetails
          session={open}
          editable={entitlement.plan !== "free" || editableIds.has(open.id)}
          onClose={() => setOpen(null)}
          done={done}
        />
      )}
    </div>
  );
}

function SessionDetails({
  session,
  editable,
  onClose,
  done,
}: {
  session: Session;
  editable: boolean;
  onClose: () => void;
  done: (message: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="session-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="stack">
        <div className="row between">
          <div className="dialog-title">
            <span className="eyebrow-extension">Session details</span>
            <strong id="session-dialog-title">{session.name}</strong>
          </div>
          <button
            autoFocus
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>
        {session.tabs.map((tab) => (
          <div className="tab-detail" key={tab.id} title={`${tab.title}\n${tab.url}`}>
            <span className="tab-detail-copy">
              <span>{tab.title}</span>
              <small>{tab.url}</small>
            </span>
          </div>
        ))}
        <button
          className="btn secondary"
          disabled={!editable}
          onClick={() => {
            const name = prompt("Rename session", session.name)?.trim();
            if (name)
              void updateState((current) => {
                const item = current.sessions.find(
                  (candidate) => candidate.id === session.id,
                )!;
                item.name = name;
                item.updatedAt = Date.now();
                return current;
              }).then(() => {
                done("Session renamed.");
                onClose();
              });
          }}
        >
          Rename session{!editable && " · Pro"}
        </button>
      </div>
    </dialog>
  );
}

function FocusView({
  state,
  entitlement,
  done,
  upgrade,
}: {
  state: ClearheadState;
  entitlement: EntitlementSnapshot;
  done: (message: string) => void;
  upgrade: (title: string, copy: string) => void;
}) {
  return (
    <div className="content-stack">
      <div>
        <span className="eyebrow-extension">Protected time</span>
        <h2>Focus</h2>
        <p className="muted">
          Choose what matters. Clearhead handles the boundaries.
        </p>
      </div>
      <label className="field">
        Focus workspace
        <select
          className="select"
          disabled={state.focus.active}
          value={state.currentWorkspaceId ?? ""}
          onChange={(event) =>
            void updateState((current) => ({
              ...current,
              currentWorkspaceId: event.target.value,
            })).then(() => done("Workspace selected."))
          }
        >
          {state.workspaces.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <FocusControl
        state={state}
        entitlement={entitlement}
        onDone={done}
        onUpgrade={() =>
          upgrade(
            "Custom focus is a Pro feature",
            "Free includes 25 and 50 minute sessions. Pro adds custom durations, strict mode and scheduling.",
          )
        }
      />
      <div className="feature-grid">
        <Feature
          icon={ShieldCheck}
          title="Route-aware blocking"
          copy="Block YouTube Shorts without blocking the rest of YouTube."
        />
        <Feature
          icon={CalendarDays}
          title="Scheduled focus"
          copy={
            entitlement.features.scheduledFocus
              ? "Available with your plan."
              : "Available with Pro."
          }
          locked={!entitlement.features.scheduledFocus}
        />
        <Feature
          icon={Gauge}
          title="Strict mode"
          copy={
            entitlement.features.strictMode
              ? "Available with your plan."
              : "Available with Pro."
          }
          locked={!entitlement.features.strictMode}
        />
      </div>
    </div>
  );
}
function Feature({
  icon: Icon,
  title,
  copy,
  locked,
}: {
  icon: typeof ShieldCheck;
  title: string;
  copy: string;
  locked?: boolean;
}) {
  return (
    <div className="feature-card">
      <span className="feature-icon">
        <Icon size={18} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
      {locked && <Crown className="ml-auto text-amber-400" size={15} />}
    </div>
  );
}

function Settings({
  state,
  entitlement,
  account,
  done,
  refreshAccount,
}: {
  state: ClearheadState;
  entitlement: EntitlementSnapshot;
  account: ReturnType<typeof useAccount>["account"];
  done: (message: string) => void;
  refreshAccount: (force?: boolean) => Promise<void>;
}) {
  async function save(values: Partial<ClearheadState["settings"]>) {
    await updateState((current) => ({
      ...current,
      settings: { ...current.settings, ...values },
    }));
    done("Settings saved.");
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      const json = JSON.parse(await file.text()),
        response = await send({ type: "IMPORT", state: json });
      done(response.ok ? response.message || "Imported." : response.error);
    } catch {
      done("That file is not valid JSON.");
    }
  }
  return (
    <div className="settings-layout">
      <nav className="settings-nav">
        <button className="active">
          <Settings2 size={16} />
          General
        </button>
        <button>
          <Focus size={16} />
          Focus
        </button>
        <button>
          <ShieldCheck size={16} />
          Blocked sites
        </button>
        <button>
          <Cloud size={16} />
          Data & sync
        </button>
        <button>
          <CircleUserRound size={16} />
          Account
        </button>
      </nav>
      <div className="settings-panels">
        <section className="card stack">
          <div>
            <span className="eyebrow-extension">Personalise</span>
            <h2 className="section-title">General</h2>
          </div>
          <label className="field">
            Theme
            <select
              className="select"
              value={state.settings.theme}
              onChange={(event) =>
                void save({
                  theme: event.target
                    .value as ClearheadState["settings"]["theme"],
                })
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="field">
            Default focus duration
            <input
              className="input"
              type="number"
              min="1"
              max="1440"
              value={state.settings.defaultFocusDuration}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (validFocusDuration(value))
                  void save({ defaultFocusDuration: value });
                else done("Choose a duration from 1 to 1,440 minutes.");
              }}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Completion notifications</strong>
              <small>Know when a focus session finishes</small>
            </span>
            <input
              type="checkbox"
              checked={state.settings.notificationsEnabled}
              onChange={(event) =>
                void save({ notificationsEnabled: event.target.checked })
              }
            />
          </label>
        </section>
        <AccountPlanCard
          account={account}
          entitlement={entitlement}
          refreshAccount={refreshAccount}
        />
        <section className="card stack">
          <div>
            <span className="eyebrow-extension">Ownership</span>
            <h2 className="section-title">Your data</h2>
          </div>
          <p className="muted">
            Your local research remains portable regardless of plan.
          </p>
          <button
            className="btn secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify(state, null, 2)], {
                  type: "application/json",
                }),
                anchor = document.createElement("a");
              anchor.href = URL.createObjectURL(blob);
              anchor.download = `clearhead-${new Date().toLocaleDateString("en-CA")}.json`;
              anchor.click();
              URL.revokeObjectURL(anchor.href);
            }}
          >
            <Download size={16} />
            Export data
          </button>
          <label className="btn secondary text-center">
            <Upload size={16} />
            Import data
            <input
              hidden
              type="file"
              accept="application/json"
              onChange={(event) => void importFile(event.target.files?.[0])}
            />
          </label>
          <button
            className="btn danger"
            onClick={async () => {
              if (
                !confirm(
                  "Reset all local Clearhead data? This cannot be undone.",
                )
              )
                return;
              const response = await send({ type: "RESET" });
              done(response.ok ? response.message || "Reset." : response.error);
            }}
          >
            <RotateCcw size={16} />
            Reset local data
          </button>
        </section>
        <span className="tiny">
          Clearhead version {chrome.runtime.getManifest().version}
        </span>
      </div>
    </div>
  );
}

function AccountPlanCard({
  account,
  entitlement,
  refreshAccount,
}: {
  account: ReturnType<typeof useAccount>["account"];
  entitlement: EntitlementSnapshot;
  refreshAccount: (force?: boolean) => Promise<void>;
}) {
  const connected = account?.status === "connected";
  return (
    <section className="plan-card">
      <div className="row between">
        <span className="plan-crown">
          <Crown size={20} />
        </span>
        <PlanBadge entitlement={entitlement} />
      </div>
      <h2>{connected ? account.snapshot.user.name : "Connect Clearhead"}</h2>
      <p>
        {connected
          ? account.snapshot.user.email
          : "Sign in to start your 30-day Pro trial and enable account-backed features."}
      </p>
      {connected ? (
        <div className="stack">
          <div className="usage-row">
            <span>
              {entitlement.limits.sessions === null
                ? "Unlimited sessions"
                : `${entitlement.limits.sessions} Free sessions`}
            </span>
            <span>
              {entitlement.features.cloudSync
                ? "Sync available"
                : "Sync paused"}
            </span>
          </div>
          <button
            className="btn"
            onClick={() =>
              void openWeb(
                entitlement.plan === "free" ? "/pricing" : "/account/billing",
              )
            }
          >
            {entitlement.plan === "free" ? "Upgrade to Pro" : "Manage billing"}
          </button>
          <div className="row">
            <button
              className="text-button"
              onClick={() => void openWeb("/account")}
            >
              View account
            </button>
            <button
              className="text-button danger-text"
              onClick={async () => {
                await disconnectAccount();
                await refreshAccount(true);
              }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="actions">
          <button className="btn" onClick={() => void openWeb("/sign-in")}>
            Sign in
          </button>
          <button
            className="btn secondary"
            onClick={() => void openWeb("/sign-up")}
          >
            Create account
          </button>
          <span className="tiny">You’re currently using local Free mode.</span>
        </div>
      )}
    </section>
  );
}
