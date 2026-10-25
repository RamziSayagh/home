"use client";

import { useEffect, useEffectEvent, useState, type Dispatch, type SetStateAction } from "react";
import { parseProject, STORAGE_KEY, type HistoryAction, type Project } from "./model";

const endpoint = "/api/te/project";
const syncKey = `${STORAGE_KEY}.sync`;
const conflictKey = `${STORAGE_KEY}.conflict`;
type Remote = { revision: number; project: Project | null };

export function useSharedProject(workspace: Project, dispatch: Dispatch<HistoryAction>, setNotice: Dispatch<SetStateAction<string>>) {
  const [ready, setReady] = useState(false);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Chargement…");
  const [conflict, setConflict] = useState<Project | null>(null);
  const current = useEffectEvent(() => ({ workspace, saveBlocked }));

  const remember = useEffectEvent((project: Project) => {
    setConflict(project);
    try { localStorage.setItem(conflictKey, JSON.stringify(project)); } catch { /* Still available for export in memory. */ }
    setNotice("Une version plus récente a été chargée depuis un autre appareil. Votre copie différente reste disponible avec « Exporter ma copie précédente ».");
  });

  useEffect(() => {
    let stopped = false;
    let initialized = false;
    let initial: Project | null = null;
    let pending = false;
    const state = { revision: 0, baseline: "", connected: false, localOnly: false, busy: false };
    async function read() {
      const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error((await response.json()).error);
      const remote: Remote = await response.json();
      if (remote.project) remote.project = parseProject(JSON.stringify(remote.project));
      return remote;
    }
    function markSynced(project: Project, revision: number) {
      state.baseline = JSON.stringify(project);
      state.revision = revision;
      try { localStorage.setItem(syncKey, JSON.stringify({ revision, baseline: state.baseline })); } catch { /* Local saving has a separate status. */ }
    }
    function accept(remote: Remote, local: Project, keepLocal: boolean) {
      if (!remote.project) { state.revision = 0; state.baseline = ""; return; }
      const json = JSON.stringify(remote.project);
      if (json !== JSON.stringify(local)) {
        if (keepLocal) remember(local);
        dispatch({ type: "restore", project: remote.project });
      }
      markSynced(remote.project, remote.revision);
    }
    async function tick() {
      if (state.busy || stopped) return;
      state.busy = true;
      try {
        const { workspace: local, saveBlocked: blocked } = current();
        if (blocked) return;
        if (!state.connected) {
          const remote = await read();
          if (stopped) return;
          const localProject = initialized ? local : initial ?? local;
          const dirty = initialized ? JSON.stringify(local) !== state.baseline : pending;
          if (dirty && remote.project && JSON.stringify(remote.project) === state.baseline) {
            // Reopening after an offline edit: the server has not changed, so upload the pending copy.
            state.revision = remote.revision;
          } else accept(remote, localProject, dirty);
          state.connected = true;
          setSaveStatus(remote.project ? "À jour · sauvegarde partagée" : "Enregistrement en ligne…");
          return;
        }
        const serialized = JSON.stringify(local);
        if (serialized !== state.baseline) {
          setSaveStatus("Enregistrement en ligne…");
          const response = await fetch(endpoint, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ revision: state.revision, project: local }),
            signal: AbortSignal.timeout(10000), keepalive: serialized.length < 60000,
          });
          if (stopped) return;
          if (!response.ok) throw new Error("storage_unavailable");
          const remote: Remote = await response.json();
          markSynced(local, remote.revision);
        }
        setSaveStatus("À jour · sauvegarde partagée");
      } catch (error) {
        const unconfigured = error instanceof Error && error.message === "not_configured";
        if (unconfigured) state.localOnly = true;
        if (!stopped) setSaveStatus(unconfigured
          ? "Sauvegarde locale · stockage Vercel à configurer"
          : "Connexion à la sauvegarde partagée…");
      } finally {
        state.busy = false;
        // Never expose an editable temporary project while a configured shared
        // project is still loading. Otherwise a delayed first response could
        // replace an edit made against the empty initial project.
        if (!stopped && !initialized && (state.connected || state.localOnly)) { initialized = true; setReady(true); }
      }
    }
    async function start() {
      // Restoration precedes every write, including the first shared save.
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) { initial = parseProject(saved); dispatch({ type: "restore", project: initial }); }
        const metadata = localStorage.getItem(syncKey);
        if (metadata) {
          const previous = JSON.parse(metadata);
          state.baseline = previous.baseline;
          pending = Boolean(initial && JSON.stringify(initial) !== previous.baseline);
        } else state.baseline = initial ? JSON.stringify(initial) : "";
        const previousConflict = localStorage.getItem(conflictKey);
        if (previousConflict) setConflict(parseProject(previousConflict));
      } catch {
        setSaveBlocked(true);
        setSaveStatus("Sauvegarde suspendue");
        setNotice("Restauration locale impossible. Les données existantes sont conservées ; exportez votre travail ou importez une sauvegarde.");
        initialized = true;
        setReady(true);
        return;
      }
      await tick();
    }
    void start();
    // The shared project is read once on page load. Only a local edit may
    // trigger a subsequent write; focus and background polling never reload it.
    const onLocalChange = () => void tick();
    window.addEventListener("te-project-change", onLocalChange);
    return () => {
      stopped = true;
      window.removeEventListener("te-project-change", onLocalChange);
    };
  }, [dispatch, setNotice]);

  useEffect(() => {
    if (!ready || saveBlocked) return;
    const save = () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); }
      catch { setSaveBlocked(true); setSaveStatus("Sauvegarde locale indisponible · exportez le JSON"); }
    };
    save();
    const timer = window.setTimeout(() => window.dispatchEvent(new Event("te-project-change")), 500);
    window.addEventListener("pagehide", save);
    return () => { window.clearTimeout(timer); window.removeEventListener("pagehide", save); };
  }, [workspace, ready, saveBlocked]);

  return { ready, saveBlocked, setSaveBlocked, saveStatus, setSaveStatus, conflict };
}
