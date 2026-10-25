import type { ReactNode } from "react";

export default function SingleLineIcon({ usage = "", kind }: { usage?: string; kind?: "supply" | "breaker" | "rcd" | "spd" | "impulse" }) {
  let drawing: ReactNode;
  if (kind === "supply") drawing = <><rect x="15" y="7" width="34" height="50" rx="5" /><rect x="21" y="15" width="22" height="12" rx="2" /><path d="m35 33-9 12h8l-4 9 11-14h-9z" /><path d="M25 7V3m14 4V3" /></>;
  else if (kind) drawing = <><rect x="18" y="7" width="28" height="50" rx="3" /><path d="M23 13h18M23 51h18M26 3v4m12-4v4M26 57v4m12-4v4" /><rect x="24" y="23" width="16" height="17" rx="2" /><path d="M24 28h16" />{kind === "rcd" ? <circle cx="36" cy="46" r="2" /> : kind === "spd" ? <path d="m34 26-6 7h6l-3 5" /> : <path d="M32 31v5" />}</>;
  else if (usage.includes("Éclairage")) drawing = <><path d="M23 40c0-7-8-8-8-19a17 17 0 0 1 34 0c0 11-8 12-8 19z" /><path d="M24 46h16m-14 6h12m-10 5h8M27 40V29l-5-5m15 16V29l5-5M5 21H1m62 0h-4M9 7 5 3m50 4 4-4" /></>;
  else if (usage === "Prises") drawing = <><rect x="7" y="7" width="50" height="50" rx="10" /><circle cx="32" cy="32" r="18" /><circle cx="25" cy="33" r="2.5" /><circle cx="39" cy="33" r="2.5" /><path d="M32 17v7" /></>;
  else if (/linge|vaisselle/.test(usage)) drawing = <><rect x="11" y="6" width="42" height="52" rx="4" /><path d="M11 19h42M17 12h11" /><circle cx="45" cy="12" r="2" />{usage.includes("vaisselle") ? <><path d="M20 29v18m8-18v18m8-18v18m8-18v18M17 49h30" /></> : <><circle cx="32" cy="37" r="13" /><path d="M20 38q6-7 12 0t12 0" /></>}</>;
  else if (/Réfrigérateur|Congélateur/.test(usage)) drawing = <><rect x="15" y="4" width="34" height="56" rx="4" /><path d="M15 25h34M21 14v6m0 12v13" />{usage.includes("Congélateur") ? <path d="M34 32v16m-7-12 14 8m-14 0 14-8" /> : null}</>;
  else if (/Four|Plaque/.test(usage)) drawing = <><rect x="8" y="8" width="48" height="48" rx="4" />{usage.includes("Four") ? <><path d="M8 20h48M16 14h2m8 0h2m8 0h2m8 0h2" /><rect x="16" y="28" width="32" height="20" rx="2" /></> : <>{[[22,22],[42,22],[22,42],[42,42]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" />)}</>}</>;
  else if (/Volet/.test(usage)) drawing = <><rect x="10" y="10" width="44" height="44" rx="2" /><path d="M10 18h44M14 26h36M14 34h36M14 42h36M8 56h48" /></>;
  else if (/Chauffe-eau/.test(usage)) drawing = <><rect x="17" y="5" width="30" height="46" rx="12" /><circle cx="32" cy="36" r="5" /><path d="M25 51v9m14-9v9M32 31v5l3 2" /></>;
  else if (/Chauffage/.test(usage)) drawing = <><path d="M8 23v24m48-24v24M8 28h48M8 42h48M16 49v7m32-7v7" />{[16,24,32,40,48].map(x => <rect key={x} x={x-3} y="20" width="6" height="30" rx="3" />)}<path d="M23 14c-7-7 7-7 0-14m17 14c-7-7 7-7 0-14" /></>;
  else if (/VMC|Pompe|Climatisation/.test(usage)) drawing = <><rect x="7" y="10" width="50" height="44" rx="5" /><circle cx="29" cy="32" r="15" /><circle cx="29" cy="32" r="3" /><path d="M29 29c-14-15-17 8-3 4m6-1c20-4 2-18-2-3m-3 6c-6 20 18 11 5-1M49 21v22" /></>;
  else if (/véhicule/.test(usage)) drawing = <><rect x="12" y="8" width="28" height="48" rx="5" /><rect x="18" y="15" width="16" height="13" rx="2" /><path d="m27 33-7 10h7l-3 8M40 21h6q7 0 7 7v17q0 7-7 7M49 17v-6m6 6v-6m-8 6h10v9H47z" /></>;
  else if (/Hotte/.test(usage)) drawing = <><path d="M25 5h14v20l17 18H8l17-18zM8 43v8h48v-8M21 57h22" /><path d="M18 47h2m6 0h2" /></>;
  else drawing = <><rect x="10" y="10" width="44" height="44" rx="8" /><path d="m34 19-12 16h10l-3 11 13-18H31z" /></>;
  return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{drawing}</svg>;
}
