"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SceneController } from "./world";

const moments = ["Plein jour", "Heure dorée", "Coucher de soleil", "Heure bleue", "Nuit"];
const stops = [0, 38, 62, 80, 100];
const phaseOf = (value: number) => value < 20 ? 0 : value < 51 ? 1 : value < 73 ? 2 : value < 92 ? 3 : 4;
const skies = [[187, 211, 214], [231, 210, 188], [185, 163, 178], [71, 83, 112], [20, 29, 54]];
const horizons = [[230, 230, 214], [237, 231, 212], [237, 177, 142], [163, 139, 156], [68, 77, 105]];
function skyColor(colors: number[][], progress: number) {
  const index = Math.min(3, stops.findIndex((stop) => stop > progress) - 1);
  const start = index < 0 ? 3 : index;
  const blend = (progress - stops[start]) / (stops[start + 1] - stops[start]);
  return `rgb(${colors[start].map((value, i) => Math.round(value + (colors[start + 1][i] - value) * blend)).join(",")})`;
}

export default function Experience() {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<SceneController | null>(null);
  const [light, setLight] = useState(38);
  const [playing, setPlaying] = useState(false);
  const [orbit, setOrbit] = useState(false);
  const [view, setView] = useState<"district" | "house">("district");
  const [neighbors, setNeighbors] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const phase = phaseOf(light);
  const finished = light >= 100;

  useEffect(() => {
    let cancelled = false;
    let controller: SceneController | undefined;
    import("./world").then(({ createWorld }) => {
      if (cancelled || !host.current) return;
      controller = createWorld(host.current, () => setStatus("error"));
      world.current = controller;
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; controller?.dispose(); world.current = null; };
  }, [attempt]);

  useEffect(() => { world.current?.setLight(light / 100); }, [light, status]);
  useEffect(() => { world.current?.setOrbit(orbit); }, [orbit, status]);
  useEffect(() => { world.current?.focus(view); }, [view, status]);
  useEffect(() => { world.current?.setNeighbors(neighbors); }, [neighbors, status]);
  useEffect(() => {
    if (!playing || finished || status !== "ready") return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setLight((previous) => Math.min(100, previous + 0.2));
    }, 100);
    return () => window.clearInterval(timer);
  }, [playing, finished, status]);

  function selectMoment(value: number) { setPlaying(false); setLight(value); }

  return (
    <main className="world-page">
      <header className="world-nav">
        <Link href="/" className="world-brand">MAISON <span>1973</span></Link>
        <nav aria-label="Navigation principale"><Link href="/">Le projet</Link><span aria-current="page">3D <i /></span><Link href="/te">TE</Link></nav>
        <Link href="/" className="world-back">← <span>Retour à la maison</span></Link>
      </header>

      <section className={`world-stage phase-${phase}`} aria-labelledby="world-title" style={{ "--sky-top": skyColor(skies, light), "--sky-bottom": skyColor(horizons, light) } as CSSProperties}>
        <div className="world-sky" aria-hidden="true"><div className="world-sun" style={{ transform: `translateY(${light * 2}px)`, opacity: Math.max(0, 1 - Math.max(0, light - 60) / 25) }} /></div>
        <div className="world-heading"><p className="world-eyebrow">LE PROJET SOUS UN AUTRE ANGLE</p><h1 id="world-title">Un lieu.<br /><em>Mille lumières.</em></h1><p>La maison et son quartier, du jour à la nuit.</p></div>
        <div className="world-location"><span className="world-location-pin">◎</span><div><strong>Ormesson-sur-Marne</strong><span>4 rue du Champ de l’Alouette</span><small>94490 · Val-de-Marne</small></div></div>

        <div ref={host} className="world-canvas" role="img" aria-label="Maquette 3D stylisée de la maison et d’un quartier pavillonnaire. Utilisez les commandes pour changer de vue, tourner et zoomer." />
        {status !== "ready" ? <div className="world-status" role="status">{status === "loading" ? <><span className="world-loader" />La maquette prend vie…</> : <><strong>La vue 3D n’a pas pu démarrer.</strong><p>Vérifiez que WebGL est disponible et que l’accélération graphique est activée dans votre navigateur.</p><button onClick={() => { setStatus("loading"); setAttempt((n) => n + 1); }}>Réessayer</button></>}</div> : null}

        <div className="world-view-controls" aria-label="Point de vue">
          <button disabled={status !== "ready"} aria-pressed={view === "district"} onClick={() => setView("district")}><span aria-hidden="true">⌘</span><span>Le quartier</span></button>
          <button disabled={status !== "ready"} aria-pressed={view === "house"} onClick={() => setView("house")}><span aria-hidden="true">⌂</span><span>La maison</span></button>
        </div>

        <div className="world-tools" aria-label="Commandes de la maquette">
          <button disabled={status !== "ready"} aria-label="Zoom avant" onClick={() => world.current?.zoom(0.8)}>＋</button>
          <button disabled={status !== "ready"} aria-label="Zoom arrière" onClick={() => world.current?.zoom(1.25)}>−</button>
          <span />
          <button disabled={status !== "ready"} aria-label="Tourner vers la gauche" onClick={() => world.current?.rotate(-0.25)}>↶</button>
          <button disabled={status !== "ready"} aria-label="Tourner vers la droite" onClick={() => world.current?.rotate(0.25)}>↷</button>
          <span />
          <button disabled={status !== "ready"} aria-label="Recentrer la vue" onClick={() => { setOrbit(false); world.current?.focus(view); }}>⌖</button>
        </div>

        <div className="world-scene-footer"><span><i /> MAISON 1973 <b>·</b> MAQUETTE 3D</span><p>Glissez pour explorer · Faites défiler pour zoomer</p></div>
      </section>

      <section className="world-timeline" aria-label="Ambiance lumineuse">
        <div className="world-time-heading"><span className="world-sun-icon" aria-hidden="true">☼</span><div><p>AU FIL DE LA LUMIÈRE</p><h2>{moments[phase]}</h2></div><button className="world-play" disabled={status !== "ready"} aria-label={playing && light < 100 ? "Mettre en pause" : "Animer du jour à la nuit"} onClick={() => { if (light >= 100) { setLight(0); setPlaying(true); } else setPlaying(!playing); }}>{playing && light < 100 ? "Ⅱ" : "▶"}</button></div>
        <div className="world-slider"><label htmlFor="sunlight" className="world-sr">Évolution du jour vers la nuit</label><input id="sunlight" type="range" min="0" max="100" step="0.1" value={light} aria-valuetext={moments[phase]} onChange={(event) => selectMoment(Number(event.target.value))} /><div className="world-moments">{moments.map((moment, i) => <button key={moment} aria-pressed={phase === i} onClick={() => selectMoment(stops[i])}>{moment}</button>)}</div></div>
      </section>

      <footer className="world-bottom"><p><strong>Une petite parenthèse à Ormesson.</strong> Volume, ombres et lumières se découvrent en mouvement.</p><div><button disabled={status !== "ready"} aria-pressed={orbit} onClick={() => setOrbit(!orbit)}><span className="world-toggle" />Rotation douce</button><button disabled={status !== "ready"} aria-pressed={neighbors} onClick={() => setNeighbors(!neighbors)}><span className="world-toggle" />Voisinage</button></div></footer>
      <p className="world-disclaimer">Interprétation artistique : volumes, implantation du quartier et course du soleil illustratifs, sans relevé cadastral ni simulation d’ensoleillement. L’adresse situe le projet ; la maquette n’est pas une reproduction exacte.</p>
    </main>
  );
}
