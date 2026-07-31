import "~/styles/global.css";

import {
  canCreateSession,
  localFreeEntitlement,
} from "@clearhead/entitlements";
import {
  ExternalLink,
  FolderPlus,
  Layers3,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "~/components/Brand";
import { ClearHeadPicker } from "~/components/ClearHeadPicker";
import { FocusControl } from "~/components/FocusControl";
import { PlanBadge } from "~/components/PlanBadge";
import { SessionCapture } from "~/components/SessionCapture";
import { UpgradePrompt } from "~/components/UpgradePrompt";
import { useAccount } from "~/hooks/useAccount";
import { useClearhead } from "~/hooks/useClearhead";
import { updateState } from "~/lib/storage";

export default function Popup() {
  const { state, error, setError, refresh } = useClearhead(),
    { account } = useAccount();
  const [flow, setFlow] = useState<"save" | "park" | "clear" | null>(null),
    [notice, setNotice] = useState(""),
    [upgrade, setUpgrade] = useState(false);
  if (!state)
    return (
      <main className="app popup">
        <Brand />
        <p className="muted">Loading Clearhead…</p>
      </main>
    );
  const entitlement = account?.entitlement ?? localFreeEntitlement(),
    count = state.sessions.filter(
      (item) => item.workspaceId === state.currentWorkspaceId,
    ).length;
  const done = (message: string) => {
    setNotice(message);
    setFlow(null);
    void refresh();
  };
  const begin = (mode: "save" | "park") =>
    canCreateSession(entitlement, state.sessions.length)
      ? setFlow(mode)
      : setUpgrade(true);
  const openSidePanel = () => {
    setError("");
    void chrome.sidePanel
      .open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
      .then(() => window.close())
      .catch(() =>
        setError(
          "Clearhead could not open the side panel. Open it from the Chrome toolbar and try again.",
        ),
      );
  };
  return (
    <main className="popup-shell">
      <header className="popup-header">
        <Brand />
        <div className="row">
          <PlanBadge compact entitlement={entitlement} />
          <button
            className="icon-button"
            aria-label="Settings"
            onClick={() => void chrome.runtime.openOptionsPage()}
          >
            <Settings2 size={17} />
          </button>
        </div>
      </header>
      <div className="popup-content stack">
        <label className="field">
          Working in
          <select
            aria-label="Current workspace"
            className="select"
            value={state.currentWorkspaceId ?? ""}
            onChange={async (event) => {
              await updateState((current) => ({
                ...current,
                currentWorkspaceId: event.target.value,
              }));
              void refresh();
            }}
          >
            {state.workspaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
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
        ) : (
          <>
            <FocusControl
              state={state}
              entitlement={entitlement}
              onDone={done}
              onUpgrade={() => setUpgrade(true)}
            />
            {!state.focus.active && (
              <>
                <button
                  className="clear-head-button"
                  onClick={() => setFlow("clear")}
                >
                  <span>
                    <Sparkles size={18} />
                    <strong>Clear My Head</strong>
                  </span>
                  <small>
                    Park background clutter in one recoverable checkpoint
                  </small>
                </button>
                <div className="popup-support-actions">
                  <button
                    aria-label="Save New Session"
                    onClick={() => begin("save")}
                  >
                    <FolderPlus size={15} />
                    Save checkpoint
                  </button>
                  <button aria-label="Park Tabs" onClick={() => begin("park")}>
                    <Layers3 size={15} />
                    Park selected tabs
                  </button>
                </div>
              </>
            )}
          </>
        )}
        <button className="open-panel" onClick={openSidePanel}>
          Open focus home <ExternalLink size={15} />
        </button>
        <div className="popup-stats">
          <div>
            <strong>{count}</strong>
            <span>Checkpoints</span>
          </div>
          <OpenTabCount />
        </div>
      </div>
      {upgrade && (
        <UpgradePrompt
          title="Keep every thread of momentum"
          copy="Free keeps five editable checkpoints. Pro gives every project an unlimited, searchable memory."
          onClose={() => setUpgrade(false)}
        />
      )}
    </main>
  );
}

function OpenTabCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    void chrome.tabs
      .query({ currentWindow: true })
      .then((items) => setCount(items.length));
  }, []);
  return (
    <div>
      <strong>{count ?? "–"}</strong>
      <span>Tabs now</span>
    </div>
  );
}
