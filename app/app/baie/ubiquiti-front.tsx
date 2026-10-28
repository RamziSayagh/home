import { useId } from "react";

// Front elevations traced from the official reference images in assets/ubiquiti.
function Ethernet({ x, y, number, light = false }: { x: number; y: number; number: number; light?: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect width="29" height="24" rx="1" fill={light ? "#cce4ed" : "#9b9fa1"} stroke="#656b70" strokeWidth=".8" />
    <path d="M3 4h6V2h11v2h6v16H3z" fill={light ? "#e8f5fc" : "#171b20"} />
    {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${6 + i * 2.4} 15v5`} stroke="#b89d67" strokeWidth=".9" />)}
    <rect x="22" y="1" width="5" height="2" fill={light ? "#74caff" : "#a6d28c"} />
    <text x="14.5" y="31" textAnchor="middle" fill="#4f555c" fontSize="5">{number}</text>
  </g>;
}

function Screen({ legacy = false }: { legacy?: boolean }) {
  return <g transform="translate(30 24)">
    <rect width="48" height="49" rx="4" fill={legacy ? "#cfd3d7" : "#091323"} stroke={legacy ? "#5f9fda" : "#6d747e"} strokeWidth={legacy ? 3 : 1} />
    {legacy ? <text x="24" y="33" textAnchor="middle" fontSize="27" fontWeight="700" fill="#a7adb4">U</text> : <><circle cx="24" cy="26" r="15" stroke="#2879c3" fill="none" strokeWidth="1" /><circle cx="24" cy="26" r="7" fill="#c5d4ed" /><circle cx="24" cy="26" r="3" fill="#365f87" /><text x="24" y="8" textAnchor="middle" fontSize="4" fill="#cddff6">UniFi Network</text><path d="M8 44h32" stroke="#3062a8" /></>}
  </g>;
}

function NasFront({ model, name }: { model: string; name: string }) {
  const id = useId();
  const enterprise = model === "enas";
  const pro = model === "unas-pro";
  const height = enterprise ? 300 : model === "unas-pro-4" ? 100 : 200;
  const bays = enterprise ? 16 : pro ? 7 : model === "unas-pro-8" ? 8 : 4;
  return <svg className="ubiquiti-front" viewBox={`0 0 1000 ${height}`} role="img" aria-label={`Façade illustrée du ${name}`}>
    <defs><linearGradient id={`${id}-metal`} x2="0" y2="1"><stop stopColor="#eceef0" /><stop offset="1" stopColor="#afb4bb" /></linearGradient></defs>
    <rect x="1" y="1" width="998" height={height - 2} rx="3" fill={`url(#${id}-metal)`} stroke="#939aa1" />
    <rect x="28" y="8" width="52" height="3" rx="1" fill="#4ca2fa" />
    {pro && <><Screen /><Ethernet x={875} y={30} number={1} /><rect x="920" y="32" width="28" height="20" fill="#29323a" /><text x="54" y="85" textAnchor="middle" fontSize="6" fill="#3a4148">UNAS Pro</text></>}
    {Array.from({ length: bays }, (_, i) => {
      const row = enterprise ? Math.floor(i / 4) : pro && i < 3 ? 0 : pro ? 1 : Math.floor(i / 4);
      const column = enterprise ? i % 4 : pro && i < 3 ? i : pro ? i - 3 : i % 4;
      const x = pro && row === 0 ? 100 + column * 245 : 28 + column * 235;
      const width = pro && row === 0 ? 240 : 230;
      const y = enterprise ? 27 + row * 64 : 20 + row * 85;
      return <g key={i}><rect x={x} y={y} width={width} height={enterprise ? 61 : 65} fill={`url(#${id}-metal)`} stroke="#535b62" strokeWidth="2" /><rect x={x + 2} y={y + 2} width="4" height={enterprise ? 57 : 61} fill="#697179" />{enterprise && <path d={`M${x + width - 35} ${y}v61`} stroke="#555e66" strokeWidth="2" />}<circle cx={x + width - 18} cy={y + 33} r="2" fill="#f8fafb" /></g>;
    })}
    {!pro && <text x="28" y={height - 7} fontSize="7" fill="#4f565d">{name}</text>}
  </svg>;
}

export default function UbiquitiFront({ reference, name }: { reference: string; name: string }) {
  const id = useId();
  const model = reference.toLowerCase();
  if (model.startsWith("unas-") || model === "enas") return <NasFront model={model} name={name} />;
  const gateway = model.startsWith("udm-");
  const maxGateway = model === "udm-pro-max";
  const maxSwitch = model.startsWith("usw-pro-max");
  const legacy = model === "us-24-250w";
  const patch = model === "uacc-rack-panel-patch-blank-24";
  const shelf = model === "uacc-rack-shelf-clv";
  const poe = model.includes("poe") || model === "udm-se" || legacy;
  return <svg className="ubiquiti-front" viewBox="0 0 1000 100" role="img" aria-label={`Façade illustrée du ${name}`}>
    <defs><linearGradient id={`${id}-metal`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#f0f1f3" /><stop offset=".4" stopColor="#d6d8dc" /><stop offset="1" stopColor="#afb4bb" /></linearGradient><linearGradient id={`${id}-tray`} x2="0" y2="1"><stop stopColor="#9098a1" /><stop offset="1" stopColor="#e0e3e7" /></linearGradient></defs>
    <rect x="1" y="1" width="998" height="98" rx="3" fill={`url(#${id}-metal)`} stroke="#9b9fa7" />
    <path d="M4 3h992" stroke="#fff" strokeOpacity=".9" /><path d="M3 97h994" stroke="#777f88" />
    {[9, 981].map(x => <g key={x}>{[12, 78].map(y => <rect key={y} x={x} y={y} width="10" height="10" rx="4" fill="#5f656b" stroke="#eef0f3" />)}</g>)}
    {shelf ? <><path d="M25 18h950v72H25z" fill="#343b43" /><path d="M25 82l45-48h860l45 48z" fill={`url(#${id}-tray)`} />{Array.from({ length: 42 }, (_, i) => <g key={i}><ellipse cx={90 + i * 20} cy="57" rx="3" ry="1.8" fill="#6d767f" /><ellipse cx={90 + i * 20} cy="65" rx="3" ry="1.8" fill="#6d767f" /></g>)}<rect x="25" y="83" width="950" height="12" fill={`url(#${id}-metal)`} /></> : patch ? <>{Array.from({ length: 24 }, (_, i) => <g key={i}><rect x={33 + i * 39} y="30" width="29" height="40" fill="#24292e" stroke="#989ea5" /><path d={`M${34 + i * 39} 31v37h6V31`} fill="#525961" /><text x={47 + i * 39} y="24" fontSize="7" textAnchor="middle" fill="#626973">{i + 1}</text></g>)}</> : <>
      <Screen legacy={legacy} />
      <text x="54" y="85" textAnchor="middle" fontSize="6" fill="#3a4148">{gateway ? (maxGateway ? "UDM Pro Max" : poe ? "Dream Machine SE" : "UDM Pro") : legacy ? "UniFi Switch" : maxSwitch ? "USW Pro Max" : model.includes("pro") ? "USW Pro" : "USW"}{poe ? " ⚡" : ""}</text>
      {!legacy && Array.from({ length: 5 }, (_, i) => <rect key={i} x={95 + i * 174} y="6" width="167" height="2.5" rx="1" fill="#4c5157" />)}
      {gateway ? <>
        {(maxGateway ? [100, 344] : [425]).map(x => <g key={x}><rect x={x} y="18" width="241" height="64" rx="1" fill={`url(#${id}-metal)`} stroke="#51565d" strokeWidth="1.5" /><rect x={x + 2} y="21" width="3" height="58" fill="#5a6068" /><circle cx={x + 218} cy="50" r="1.5" fill="#5d646c" /></g>)}
        {Array.from({ length: 8 }, (_, i) => <Ethernet key={i} x={700 + Math.floor(i / 2) * 35} y={i % 2 ? 54 : 22} number={i + 1} />)}
        <Ethernet x={875} y={54} number={9} />
      </> : Array.from({ length: 24 }, (_, i) => <Ethernet key={i} x={maxSwitch ? 100 + i * 32.3 + Math.floor(i / 8) * 5 : 480 + Math.floor(i / 2) * 34} y={maxSwitch ? 50 : i % 2 ? 54 : 22} number={i + 1} light={maxSwitch} />)}
      {[0, 1].map(i => <g key={i} transform={`translate(${maxSwitch ? 899 + i * 33 : 920} ${maxSwitch ? 55 : 22 + i * 32})`}><rect width="29" height="23" fill="#555d66" stroke="#90969e" /><rect x="3" y="4" width="23" height="14" fill="#1c232c" /><path d="M4 18h21" stroke="#a0a8af" /><rect x="22" y="1" width="4" height="2" fill="#a8c991" /></g>)}
      <circle cx="966" cy="85" r="1.5" fill="#303740" />
    </>}
  </svg>;
}
