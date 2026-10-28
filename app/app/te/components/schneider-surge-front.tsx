import { useId } from "react";

// Decorative R9PLC front elevation based on Schneider's product photograph.
export default function SchneiderSurgeFront({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const body = `url(#${id}-body)`;
  const ledge = `url(#${id}-ledge)`;
  const screw = (x: number, y: number) => <g key={`${x}-${y}`}>
    <circle cx={x} cy={y} r="6.5" fill="#d9ded7" stroke="#fafbf8" strokeWidth="1" />
    <circle cx={x} cy={y} r="4.5" fill="#b1bab0" stroke="#97a396" strokeWidth=".5" />
    <path d={`M${x-2.5} ${y}h5M${x} ${y-2.5}v5`} stroke="#f7f9f6" strokeWidth="1.3" />
  </g>;

  return <div className={`te-equipment-face te-surge-front ${compact ? "compact" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 90 180" preserveAspectRatio="none" focusable="false" fontFamily="Arial, Helvetica, sans-serif">
      <defs>
        <linearGradient id={`${id}-body`}><stop stopColor="#d4d9d1" /><stop offset=".09" stopColor="#fff" /><stop offset=".82" stopColor="#fafbf7" /><stop offset="1" stopColor="#d8ded5" /></linearGradient>
        <linearGradient id={`${id}-ledge`} x2="0" y2="1"><stop stopColor="#fff" /><stop offset=".7" stopColor="#f4f6f1" /><stop offset="1" stopColor="#c9d0c6" /></linearGradient>
      </defs>
      {/* Two-pole housing and upper N/L terminals. */}
      <rect x="2" y="3" width="86" height="156" rx="2" fill={body} stroke="#c4cdc1" />
      <path d="M4 5h82v39H4z" fill="#f8faf6" stroke="#e0e6dc" />
      <path d="M22 3h20v4H22z" fill="#e5ca00" />
      {screw(53, 21)}{screw(73, 21)}
      <text x="53" y="35" textAnchor="middle" fontSize="8" fill="#4d594b">N</text><text x="73" y="35" textAnchor="middle" fontSize="8" fill="#4d594b">L</text>
      <path d="M4 47h82v62H4z" fill="#fcfdf9" stroke="#e0e6dc" />
      <text x="9" y="59" fontSize="9.5" fontWeight="700" fill="#008b32">Schneider</text>
      <text x="15" y="67" fontSize="6.5" fontWeight="600" fill="#008b32">Electric</text>
      <rect x="59" y="53" width="23" height="3" rx="1" fill="#009a3b" />
      <text x="9" y="78" fontSize="8" fill="#485548">Resi9</text><text x="9" y="88" fontSize="7" fill="#485548">XP PF</text>
      <text x="9" y="98" fontSize="6.5" fill="#5f6c5c">R9PLC</text>
      <path d="M67 78q-4-5-7 0-5 0-5 4h15q1-4-3-4zm-5 5-2 4 4-1-2 5" fill="none" stroke="#657162" strokeWidth=".9" />
      {/* Red status window and integrated white OFF switch. */}
      <path d="M4 109h82v30H4z" fill={ledge} stroke="#e0e6dc" />
      <text x="8" y="119" fontSize="6" fill="#586456">Rouge</text><text x="8" y="127" fontSize="6" fill="#586456" textLength="19" lengthAdjust="spacingAndGlyphs">hors service</text>
      <rect x="29" y="115" width="12" height="12" rx="1" fill="#7f392e" stroke="#a5afa1" />
      <rect x="30" y="116" width="10" height="10" fill="#b83829" />
      <path d="M50 109h31q-2 9 1 20l-1 10H50l-1-10q3-11 1-20z" fill="#c5cec2" />
      <path d="M52 110h27q-2 9 1 18l-1 7H51l-1-7q4-9 2-18z" fill="#fbfcf9" stroke="#d0d9cd" />
      <text x="65" y="120" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#354234">O.OFF</text>
      <path d="M51 132h29v8H51z" fill="#f6f8f4" stroke="#c5cec1" />
      <path d="M4 140h82v19H4z" fill="#f7f9f4" stroke="#e0e6dc" />
      <text x="8" y="153" fontSize="10.5" fontWeight="700" fill="#293b29">T2 · 10 kA</text>
      {/* Green lower terminal block present in the product image. */}
      <path d="M7 159h42v18H7z" fill="#168b3a" stroke="#0b7830" />
      <path d="M9 160h38" stroke="#50bc68" />{screw(19, 169)}{screw(37, 169)}
    </svg>
  </div>;
}
