import {
  canUseCustomFocusDuration,
  localFreeEntitlement,
} from "@clearhead/entitlements";
import type { EntitlementSnapshot } from "@clearhead/shared";
import {
  CheckCircle2,
  Clock3,
  PauseCircle,
  Play,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { remainingMs } from "~/lib/time";
import { send } from "~/types/messages";
import type { ClearheadState } from "~/types/state";

export function FocusControl({
  state,
  onDone,
  entitlement = localFreeEntitlement(),
  onUpgrade,
}: {
  state: ClearheadState;
  onDone: (message: string) => void;
  entitlement?: EntitlementSnapshot;
  onUpgrade?: () => void;
}) {
  const latest = useMemo(
    () =>
      state.sessions
        .filter(
          (session) =>
            session.workspaceId === state.currentWorkspaceId &&
            session.checkpoint,
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)[0],
    [state.sessions, state.currentWorkspaceId],
  );
  const [objective, setObjective] = useState(
    latest?.nextStep || latest?.objective || "",
  );
  const [resume, setResume] = useState(latest?.id || "");
  const [duration, setDuration] = useState(state.settings.defaultFocusDuration),
    [custom, setCustom] = useState(""),
    [busy, setBusy] = useState(false),
    [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((value) => value + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  async function start() {
    if (!objective.trim()) return;
    setBusy(true);
    const response = await send<ClearheadState>({
      type: "START_FOCUS",
      workspaceId: state.currentWorkspaceId!,
      duration: custom ? Number(custom) : duration,
      objective: objective.trim(),
      resumeSessionId: resume || undefined,
    });
    setBusy(false);
    onDone(response.ok ? response.message || "Ready." : response.error);
  }
  async function finish(outcome: "completed" | "paused") {
    const nextStep =
      outcome === "paused"
        ? prompt(
            "What is the first step when you return?",
            state.focus.active ? state.focus.objective : "",
          )?.trim()
        : "";
    if (outcome === "paused" && nextStep === undefined) return;
    setBusy(true);
    const response = await send<ClearheadState>({
      type: "END_FOCUS",
      outcome,
      nextStep,
    });
    setBusy(false);
    onDone(
      response.ok ? response.message || "Your place is saved." : response.error,
    );
  }

  if (state.focus.active) {
    const focus = state.focus,
      milliseconds = remainingMs(focus.endsAt),
      minutes = Math.floor(milliseconds / 60_000),
      seconds = Math.floor((milliseconds % 60_000) / 1_000),
      workspace = state.workspaces.find(
        (item) => item.id === focus.workspaceId,
      )?.name,
      total = focus.endsAt - focus.startedAt,
      progress = Math.max(0, Math.min(100, (milliseconds / total) * 100));
    return (
      <section className="focus-active-card">
        <div className="focus-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle
              className="focus-ring-track"
              cx="60"
              cy="60"
              r="52"
              pathLength="100"
            />
            <circle
              className="focus-ring-value"
              cx="60"
              cy="60"
              r="52"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - progress}
            />
          </svg>
          <div>
            <strong>
              {minutes}:{String(seconds).padStart(2, "0")}
            </strong>
            <span>remaining</span>
          </div>
        </div>
        <div className="focus-active-copy">
          <span className="status-live">
            <span /> Focus protected
          </span>
          <p className="tiny">THE OUTCOME</p>
          <h2>{focus.objective}</h2>
          <p className="muted">{workspace} · Everything else can wait.</p>
          <div className="focus-metric">
            <ShieldCheck size={16} />
            <strong>{focus.distractionsBlocked}</strong>
            <span>distractions kept out</span>
          </div>
          <div className="actions">
            <button
              className="btn"
              disabled={busy}
              onClick={() => void finish("completed")}
            >
              <CheckCircle2 size={15} />
              Mark complete
            </button>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => void finish("paused")}
            >
              <PauseCircle size={15} />
              Save my place
            </button>
          </div>
        </div>
      </section>
    );
  }

  const customAllowed = canUseCustomFocusDuration(entitlement);
  return (
    <section className="card focus-start stack">
      <div className="row between">
        <div>
          <span className="eyebrow-extension">Set your direction</span>
          <h2 className="section-title">What would you like to acheive?</h2>
        </div>
        <span className="feature-icon">
          <Clock3 size={19} />
        </span>
      </div>
      <label className="field">
        Outcome
        <input
          className="input objective-input"
          value={objective}
          maxLength={120}
          onChange={(event) => setObjective(event.target.value)}
          placeholder="Finish the first draft of my proposal"
        />
      </label>
      {latest && (
        <label className="field">
          Starting point
          <select
            className="select"
            value={resume}
            onChange={(event) => setResume(event.target.value)}
          >
            <option value="">Continue with the tabs open now</option>
            <option value={latest.id}>
              Pick up: {latest.nextStep || latest.objective || latest.name}
            </option>
          </select>
        </label>
      )}
      <label className="field">
        Protected time
        <select
          className="select"
          aria-label="Duration"
          value={custom ? "custom" : duration}
          onChange={(event) => {
            if (event.target.value === "custom") {
              if (!customAllowed) {
                onUpgrade?.();
                return;
              }
              setCustom(String(duration));
            } else {
              setCustom("");
              setDuration(Number(event.target.value));
            }
          }}
        >
          <option value={25}>25 minutes</option>
          <option value={50}>50 minutes</option>
          {customAllowed && <option value={90}>90 minutes</option>}
          <option value="custom">
            {customAllowed ? "Choose a duration" : "Choose a duration · Pro"}
          </option>
        </select>
      </label>
      {custom && customAllowed && (
        <label className="field">
          Minutes
          <input
            className="input"
            type="number"
            min="1"
            max="1440"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
          />
        </label>
      )}
      <button
        className="btn enter-focus"
        disabled={busy || !state.currentWorkspaceId || !objective.trim()}
        onClick={() => void start()}
      >
        {busy ? (
          "Preparing your workspace…"
        ) : (
          <>
            <Play size={16} />
            Begin focus
          </>
        )}
      </button>
      <p className="tiny text-center">
        Your outcome stays visible. Your place is saved when you stop.
      </p>
    </section>
  );
}
