import { useId } from "react";
import type { Product } from "../data/catalog";

// Decorative front elevations based on Schneider's Resi9 XE/XP and Acti9 photos.
export default function SchneiderBreakerFront({ product, compact = false }: { product: Product; compact?: boolean }) {
  const id = useId();
  const acti = product.reference === "A9F77240";
  const xp = product.range === "Resi9 XP";
  const width = acti ? 90 : 50;
  const body = `url(#${id}-body)`;
  const ledge = `url(#${id}-ledge)`;
  const metal = `url(#${id}-metal)`;
  const screw = (x: number, y: number) => <g key={`${x}-${y}`}>
    <circle cx={x} cy={y} r="6.5" fill="#d8ded5" stroke="#fdfefa" strokeWidth="1" />
    <circle cx={x} cy={y} r="4.5" fill={metal} stroke="#a2aba1" strokeWidth=".5" />
    <path d={`M${x - 2.6} ${y}h5.2M${x} ${y - 2.6}v5.2`} stroke="#7b857b" strokeWidth="1" />
  </g>;

  return <div className={`te-equipment-face te-breaker-front ${acti ? "te-breaker-double" : ""} ${compact ? "compact" : ""}`} aria-hidden="true">
    <svg viewBox={`0 0 ${width} 180`} preserveAspectRatio="none" focusable="false" fontFamily="Arial, Helvetica, sans-serif">
      <defs>
        <linearGradient id={`${id}-body`}><stop stopColor="#d9dcd4" /><stop offset=".1" stopColor="#fff" /><stop offset=".82" stopColor="#f8f9f4" /><stop offset="1" stopColor="#daddd5" /></linearGradient>
        <linearGradient id={`${id}-ledge`} x2="0" y2="1"><stop stopColor="#fff" /><stop offset=".6" stopColor="#f3f5ef" /><stop offset="1" stopColor="#c3c9bf" /></linearGradient>
        <linearGradient id={`${id}-metal`} x2="1" y2="1"><stop stopColor="#f8faf7" /><stop offset=".6" stopColor="#aab3a8" /><stop offset="1" stopColor="#e3e8e1" /></linearGradient>
      </defs>
      {acti ? <>
        {/* Two-pole Acti9: two terminals, two white toggles and one black handle. */}
        <rect x="2" y="3" width="86" height="174" rx="3" fill={body} stroke="#c5cdc2" />
        <path d="M4 6h82v39H4z" fill="#f8faf6" stroke="#e0e5dc" />
        {screw(24, 25)}{screw(66, 25)}
        <path d="M5 48h80v61H5z" fill="#fafbf8" stroke="#e2e6de" />
        <text x="11" y="61" fontSize="10" fontWeight="700" fill="#008c35">Schneider</text>
        <text x="16" y="69" fontSize="6.5" fontWeight="600" fill="#008c35">Electric</text>
        <rect x="64" y="54" width="18" height="3" rx="1" fill="#009a3b" />
        <text x="11" y="80" fontSize="8" fill="#4f5c4d">Acti9</text>
        <text x="11" y="86" fontSize="6" fill="#59665a">iC60N · 2P</text>
        <text x="11" y="102" fontSize="15" fontWeight="700" fill="#253324">{product.short}</text>
        <path d="M5 110h80v43H5z" fill={ledge} stroke="#d3dbd0" />
        {[24, 62].map(x => <g key={x}><rect x={x - 13} y="114" width="26" height="31" rx="3" fill="#c8d0c4" /><path d={`M${x-10} 117h20l2 20q0 5-4 5h-16q-4 0-4-5z`} fill="#fafbf8" stroke="#bfc9bc" /><rect x={x-9} y="118" width="18" height="5" fill="#1d9848" /></g>)}
        <path d="M7 139h76v11H7z" fill="#414943" stroke="#303932" /><path d="M10 140h70" stroke="#727d72" />
        <path d="M5 153h80v22H5z" fill="#f1f4ee" stroke="#d8ded5" />{screw(24, 164)}{screw(66, 164)}
        <rect x="8" y="2" width="11" height="3" fill="#e7cb00" />
      </> : <>
        {/* XE has an enclosed upper shoulder and a green lower rocker; XP has screw terminals and a white rocker. */}
        <path d="M3 3h44v174H3z" fill={body} stroke="#c7cfc3" />
        {xp ? <><path d="M4 5h42v39H4z" fill="#f8faf6" stroke="#e1e6de" />{screw(15, 23)}{screw(35, 23)}<text x="8" y="39" fontSize="6" fill="#7b8577">N</text></> : <><path d="M4 5h42v39H4z" fill={ledge} /><path d="M6 32h38" stroke="#e2e8dc" /><path d="M9 7h32" stroke="#fff" /></>}
        <path d="M3 48h44v60H3z" fill="#fcfdf9" stroke="#e1e6dd" />
        <text x="5" y="59" fontSize="8.8" fontWeight="700" fill="#008b32" textLength="39" lengthAdjust="spacingAndGlyphs">Schneider</text>
        <text x="10" y="67" fontSize="6.7" fontWeight="600" fill="#008b32" textLength="30" lengthAdjust="spacingAndGlyphs">Electric</text>
        <text x="5" y="77" fontSize="8" fill="#495448">Resi9</text>
        <path d="M5 80h24" stroke="#99a497" strokeWidth=".7" />
        <text x="5" y="89" fontSize="7" fill="#4b5848">DM · {xp ? "XP" : "XE"}</text>
        <rect x="36" y="72" width="8" height="8" rx="1" fill="#009637" /><text x="40" y="78.5" textAnchor="middle" fontSize="5.2" fontWeight="700" fill="#fff">{xp ? "P" : "E"}</text>
        <text x="5" y="99" fontSize="6.5" fill="#5b6757" textLength="37" lengthAdjust="spacingAndGlyphs">{product.reference}</text>
        <path d="M3 110h44q3 10 0 24H3q3-12 0-24z" fill={ledge} />
        <path d="M10 111h30q-3 12 0 24l-2 15H12l-2-15q3-12 0-24z" fill="#b7c0b2" />
        <path d="M11 112h28q-2 12 0 22l-1 9H12l-1-9q3-10 0-22z" fill="#fbfcf8" stroke="#d1d9cd" />
        <text x="25" y="122" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#343c33">O.OFF</text>
        {xp ? <path d="M12 134h26v16H12z" fill="#f3f5ef" stroke="#c4cec0" /> : <path d="M12 134q13-2 26 0l2 9q0 8-7 8H19q-7 0-7-8z" fill="#0da343" stroke="#098437" />}
        <path d="M3 153h44v24H3z" fill="#eef2eb" stroke="#d2dace" />
        <text x="25" y="164" textAnchor="middle" fontSize="14" fontWeight="700" fill="#233322">{product.short}</text>
        {xp ? <>{screw(15, 174)}{screw(35, 174)}</> : <path d="M16 173h18v4H16z" fill="#438fc0" />}
      </>}
    </svg>
  </div>;
}
