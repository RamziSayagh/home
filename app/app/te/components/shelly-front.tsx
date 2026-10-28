import { useId, type CSSProperties } from "react";
import type { Product } from "../data/catalog";

// Decorative front elevations based on official photography, not wiring diagrams.
export default function ShellyFront({ product, compact }: { product: Product; compact: boolean }) {
  const id = useId().replaceAll(":", "");
  const ref = product.reference;
  const network = ref === "SHELLY-LAN-SWITCH";
  const screen = ref === "SHELLY-PRO-4PM";
  const cover = ref === "SHELLY-PRO-DUAL-COVER-SHUTTER-PM";
  const lime = ref === "SHELLY-PRO-DIMMER-1PM" || ref === "SHELLY-PRO-DIMMER-2PM";
  const yellow = !lime && (ref.includes("DIMMER") || ref.includes("RGBWW"));
  const white = ref === "SHELLY-PRO-EM-50";
  const blue = ref === "SHELLY-PRO-DIMMER-0-1-10V-PM" || ref === "SHELLY-PRO-1";
  const color = blue ? "#087ebc" : lime ? "#a6c928" : yellow ? "#f3cd28" : ref === "SHELLY-PRO-1PM" ? "#bd3644" : white ? "#e4e6e1" : "#292c30";
  const ink = !blue && (lime || yellow || white) ? "#282c2b" : "#f1f4f5";
  const width = product.modules * 36;
  const terminals = (y: number) => <g><rect x="5" y={y} width={width - 10} height="13" rx="1.5" fill="#1c302c" />{Array.from({ length: product.modules * 2 }, (_, i) => {
    const x = 5 + (width - 10) * (i + .5) / (product.modules * 2);
    return <g key={i}><rect x={x - 4} y={y + 2} width="8" height="9" rx="1" fill="#4c9870" /><circle cx={x} cy={y + 6.5} r="3" fill="#b9c7c8" stroke="#53656a" strokeWidth=".6" /><path d={`M${x - 2},${y + 8.5}l4,-4`} stroke="#42535a" /></g>;
  })}</g>;
  const ports = (y: number, count: number) => <g>{Array.from({ length: count }, (_, i) => <g key={i}><rect x={8 + i * 28} y={y} width="23" height="16" rx="1" fill="#111517" stroke="#687277" strokeWidth=".7" /><rect x={12 + i * 28} y={y + 3} width="15" height="8" fill="#303a3d" />{Array.from({ length: 6 }, (_, pin) => <path key={pin} d={`M${14 + i * 28 + pin * 2},${y + 3}v4`} stroke="#c7aa62" strokeWidth=".7" />)}</g>)}</g>;
  return <div className={`te-shelly-front ${compact ? "compact" : ""}`} style={{ "--shelly-width": `${width}px` } as CSSProperties} aria-hidden="true">
    <svg viewBox={`0 0 ${width} 180`} preserveAspectRatio="none" focusable="false">
      <defs><linearGradient id={id}><stop stopColor="#000" stopOpacity=".25" /><stop offset=".1" stopColor="#fff" stopOpacity=".16" /><stop offset=".25" stopColor="#fff" stopOpacity="0" /><stop offset=".9" stopColor="#000" stopOpacity=".05" /><stop offset="1" stopColor="#000" stopOpacity=".3" /></linearGradient></defs>
      <rect x=".7" y="1" width={width - 1.4} height="178" rx="3" fill={color} stroke="#172124" strokeOpacity=".5" strokeWidth=".7" />
      <rect x="1" y="1" width={width - 2} height="178" rx="3" fill={`url(#${id})`} />
      <path d={`M2,29H${width - 2}M2,150H${width - 2}`} stroke="#000" strokeOpacity=".22" />
      <path d={`M2,31H${width - 2}M2,152H${width - 2}`} stroke="#fff" strokeOpacity=".2" />
      {network ? <>{ports(7, 3)}{ports(156, 2)}</> : <>{terminals(8)}{terminals(158)}</>}
      <rect x="3" y="36" width={width - 6} height="108" rx="2" fill={color} stroke={ink} strokeOpacity=".25" strokeWidth=".6" />
      {cover ? <><rect x="8" y="40" width="92" height="101" rx="2" fill="#101316" stroke="#677078" strokeWidth=".7" /><text x="13" y="92" transform="rotate(-90 13 92)" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="bold" fontSize="10" fill="#fff">Shelly</text><rect x="22" y="46" width="69" height="71" fill="#202b32" /><text x="26" y="53" fill="#86d6aa" fontSize="4.5">Wi-Fi · LAN</text>{[0, 1].map(i => <g key={i}><text x="26" y={64 + i * 24} fill="#fff" fontSize="5">COVER {i + 1}</text><rect x="26" y={68 + i * 24} width="43" height="8" rx="1" fill="#315a8a" /><rect x="26" y={68 + i * 24} width={i ? 15 : 34} height="8" rx="1" fill="#4e9cc2" /><text x="72" y={74 + i * 24} fill="#fff" fontSize="5">{i ? "35%" : "80%"}</text></g>)}{[-1, 0, 1].map(i => <circle key={i} cx={54 + i * 16} cy="129" r="3.5" fill="#161b1d" stroke="#899397" strokeWidth=".5" />)}</> : screen ? <><rect x="10" y="43" width={width - 20} height="78" rx="2" fill="#102a3e" stroke="#6a7880" strokeWidth=".5" /><text x="16" y="52" fill="#a6d2e0" fontSize="4.8">Wi-Fi · LAN</text>{[0, 1, 2, 3].map(i => <g key={i}><rect x="14" y={57 + i * 14} width={width - 28} height="12" rx="1" fill={i % 2 ? "#234e72" : "#1c4061"} /><text x="18" y={65 + i * 14} fill="#fff" fontSize="5.5">CH {i + 1}</text><rect x={width - 33} y={60 + i * 14} width="14" height="6" rx="3" fill="#78bbda" /><circle cx={width - 22} cy={63 + i * 14} r="2.2" fill="#fff" /></g>)}{[-1, 0, 1].map(i => <circle key={i} cx={width / 2 + i * 18} cy="132" r="4" fill="#171c20" stroke="#727d82" strokeWidth=".5" />)}</> : <>
        {(network ? ["Activity", "Link", "Power"] : ["Power", "Wi-Fi", "LAN", "Out"]).map((label, i) => <g key={label}><text x={width / 2 - 1} y={47 + i * 10} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={product.modules === 1 ? 4 : 5} fill={ink}>{label}</text><circle cx={width - 8} cy={45.5 + i * 10} r="1.6" fill={i === 0 ? "#7cc4a0" : "#c0a56a"} /></g>)}
        <text x={width / 2} y="103" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="bold" fontSize={product.modules === 1 ? 8 : 14} fill={ink}>Shelly</text>
        <circle cx={width / 2} cy="121" r={product.modules === 1 ? 6 : 4} fill={color} stroke={ink} strokeOpacity=".25" strokeWidth=".6" />
        <text x={width / 2} y="137" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={product.modules === 1 ? 3.6 : 5.5} fill={ink}>{product.short}</text>
      </>}
    </svg>
  </div>;
}
