import { useId } from "react";

// Front elevation based on the manufacturer's R9ERA263_Image reference.
// Decorative controls, not an interactive switch or wiring diagram.
export default function SchneiderRcdFront({ reference, type, compact = false }: { reference: string; type: string; compact?: boolean }) {
  const id = useId();
  const paint = (name: string) => `url(#${id}-${name})`;

  return <div className={`te-equipment-face te-r9era263 ${compact ? "compact" : ""}`} aria-hidden="true">
    <svg viewBox="0 0 90 180" preserveAspectRatio="none" focusable="false" fontFamily="Arial, Helvetica, sans-serif">
      <defs>
        <linearGradient id={`${id}-body`}>
          <stop stopColor="#d4d5d0" /><stop offset=".07" stopColor="#f8f9f4" />
          <stop offset=".7" stopColor="#fffffb" /><stop offset="1" stopColor="#e8e9e3" />
        </linearGradient>
        <linearGradient id={`${id}-face`} x2=".2" y2="1">
          <stop stopColor="#fffffc" /><stop offset=".7" stopColor="#f9faf5" /><stop offset="1" stopColor="#ebede6" />
        </linearGradient>
        <linearGradient id={`${id}-test-well`}>
          <stop stopColor="#f7f8f1" /><stop offset=".55" stopColor="#e4e6df" /><stop offset="1" stopColor="#f5f6ef" />
        </linearGradient>
        <linearGradient id={`${id}-curve`} x2="0" y2="1">
          <stop stopColor="#fffffb" /><stop offset=".28" stopColor="#f7f8f2" />
          <stop offset=".78" stopColor="#e1e3dc" /><stop offset="1" stopColor="#b8bcb4" />
        </linearGradient>
        <linearGradient id={`${id}-rocker`} x2="0" y2="1">
          <stop stopColor="#d6d9d0" /><stop offset=".15" stopColor="#fffffc" />
          <stop offset=".65" stopColor="#fafbf7" /><stop offset="1" stopColor="#e4e7dd" />
        </linearGradient>
        <linearGradient id={`${id}-green`} x2=".15" y2="1">
          <stop stopColor="#19ae43" /><stop offset=".75" stopColor="#0a9e36" /><stop offset="1" stopColor="#0a8330" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x2="1" y2=".7">
          <stop stopColor="#f9faf7" /><stop offset=".4" stopColor="#d5d8d3" /><stop offset=".65" stopColor="#8e938b" /><stop offset="1" stopColor="#e0e3dc" />
        </linearGradient>
      </defs>

      {/* Narrow upper terminal housing, widening into the projecting face. */}
      <path d="M7 3h76v46l5 5v105h-9v17H11v-17H2V54l5-5z" fill={paint("body")} stroke="#cdd0c6" strokeWidth=".65" />
      <path d="M7 3h76l-5 7H12z" fill="#f4f5ef" />
      {[26, 64].map(x => <g key={x}>
        <ellipse cx={x} cy="7" rx="10" ry="2.1" fill="#d7dbd1" />
        <ellipse cx={x} cy="7.2" rx="7" ry="1.2" fill="#bfc5b9" />
        <ellipse cx={x} cy="28" rx="9.2" ry="11" fill="#e5e8df" stroke="#fff" strokeWidth="1.1" />
        <ellipse cx={x} cy="28" rx="6.5" ry="8.2" fill="#a9afa3" />
        <ellipse cx={x} cy="27.3" rx="5.9" ry="7.4" fill={paint("metal")} />
        <path d={`M${x - 1} 21h2v4h3v2h-3v5h-2v-5h-3v-2h3z`} fill="#7c8377" />
        <path d={`M${x - 3} 25h2v-4M${x + 2} 28v4`} fill="none" stroke="#fff" strokeWidth=".7" />
      </g>)}
      <text x="13" y="18" fontSize="5.5" fill="#d4d9cc">N</text>
      <path d="M8 48h74l6 6H2z" fill="#f2f4eb" />
      <path d="M3 54h84" stroke="#fff" strokeWidth="1" />

      {/* Oval test button on the left, branding on the right, as photographed. */}
      <path d="M3 55h84v62H3z" fill={paint("face")} />
      <path d="M10 57q13-4 26 0l-1 30q-1 16-12 17Q12 101 11 87z" fill={paint("test-well")} />
      <ellipse cx="23" cy="68" rx="10.6" ry="5.1" fill="#bfc5b6" opacity=".6" />
      <ellipse cx="23" cy="67" rx="10.5" ry="4.5" fill={paint("rocker")} stroke="#c4cbbc" strokeWidth=".5" />
      <path d="M14 66q9-5 18 0" fill="none" stroke="#fff" strokeWidth=".8" />
      <g textAnchor="middle" fontSize="6.7" fontWeight="500" fill="#464d40">
        <text x="23" y="81">Test</text><text x="23" y="89">régulier</text>
      </g>
      <g fill="#008b32">
        <text x="43" y="66" fontWeight="700" fontSize="10" textLength="40" lengthAdjust="spacingAndGlyphs">Schneider</text>
        <text x="47" y="75" fontWeight="600" fontSize="8" textLength="32" lengthAdjust="spacingAndGlyphs">Electric</text>
      </g>
      <text x="43" y="86" fontSize="8" fill="#464d40">Resi9</text>
      <path d="M43 89h23" stroke="#737c69" strokeWidth=".65" />
      <text x="43" y="98" fontSize="8" fill="#464d40">ID</text>
      <text x="43" y="108" fontSize="6.5" fill="#59624f">{reference}</text>
      <rect x="71" y="80" width="10" height="10" rx="1" fill="#069a38" />
      <path d="M73 84l3-2 3 2v4h-2v-2h-2v2h-2z" fill="none" stroke="#fff" strokeWidth=".65" />
      <rect x="71" y="92" width="10" height="8" rx="1" fill="#069a38" />
      <text x="76" y="98.5" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="6.3">XE</text>

      {/* Rounded lower ledge, white OFF rocker and short green tip. */}
      <path d="M3 116h84q4 12-1 25H3q4-12 0-25z" fill={paint("curve")} />
      <path d="M4 116h82" stroke="#fff" strokeWidth=".8" />
      <path d="M12 117h30q-2 12 1 24l-1 17H14l-3-17q4-13 1-24z" fill="#adb5a4" />
      <path d="M13 117h27q-2 12 1 23l-1 5H12l-1-5q5-11 2-23z" fill={paint("rocker")} stroke="#d1d7c8" strokeWidth=".55" />
      <text x="26" y="127" textAnchor="middle" fontSize="9" fontWeight="600" fill="#343c2f" textLength="24" lengthAdjust="spacingAndGlyphs">O.OFF</text>
      <path d="M14 134h24" stroke="#fff" strokeWidth="1.2" />
      <path d="M3 142h8l3 17h28l2-17h42v17H3z" fill={paint("face")} />
      <path d="M13 141q13-2 26 0l2 10q1 8-7 9H21q-8-1-8-7z" fill={paint("green")} stroke="#178b32" strokeWidth=".5" />
      <path d="M15 142q10-1 22 0" fill="none" stroke="#55be67" strokeWidth=".6" />
      {/* Stack enlarged ratings in the lower right so they survive board-scale rendering. */}
      <g textAnchor="middle" fill="#283323">
        <text x="65" y="126" fontSize="10.5" fontWeight="600" textLength="39" lengthAdjust="spacingAndGlyphs">Type {type}</text>
        <text x="65" y="142" fontSize="15" fontWeight="700">63 A</text>
        <text x="65" y="156" fontSize="12" fontWeight="600">30 mA</text>
      </g>

      {/* Stepped base visible beneath the protruding front. */}
      <path d="M3 160h83l-5 8H10z" fill="#d3d7cc" />
      <path d="M12 168h67v8H12z" fill="#c3c9bd" />
      <path d="M4 160h80" stroke="#fff" strokeWidth=".7" />
      <path d="M12 175h67" stroke="#aeb6a6" strokeWidth=".65" />
    </svg>
  </div>;
}
