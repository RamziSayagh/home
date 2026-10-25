type Props = { type: "kit" | "panel" | "accessory"; reference?: string; modules?: number; rows?: number; communication?: boolean };

export default function GtlIllustration({ type, reference = "", modules = 13, rows = 3, communication = false }: Props) {
  const width = modules * 9 + 26;
  const height = type === "kit" ? 198 : communication ? 112 : rows * 35 + 30;
  const frame = { fill: "#fffefa", stroke: "#84958b", strokeWidth: 2 };
  return <svg className={`te-gtl-icon ${type}`} viewBox={`0 0 214 ${height + 28}`} role="img" aria-label={communication ? "Coffret de communication avec brassage RJ45" : type === "panel" ? `Coffret ${rows} rangées de ${modules} modules` : type === "kit" ? `Goulotte GTL ${modules} modules` : reference}>
    {type === "kit" ? <g transform={`translate(${(214 - width) / 2},0)`}>
      <rect x="0" y="3" width={width} height={height - 8} rx="5" {...frame} />
      <rect x="7" y="9" width={width * .7 - 10} height={height - 20} rx="2" fill="#e5eae5" stroke="#b9c5bc" />
      <rect x={width * .7 + 2} y="9" width={width * .3 - 9} height={height - 20} rx="2" fill="#eef1ed" stroke="#b9c5bc" />
      <path d={`M0 ${height / 2}H${width}`} stroke="#a0afa4" strokeWidth="2" />
      <text x={width / 2} y="56" textAnchor="middle" fill="#357454" fontSize="28" fontWeight="700">{modules}</text>
      <text x={width / 2} y="74" textAnchor="middle" fill="#52715c" fontSize="11">MODULES</text>
    </g> : type === "accessory" ? <g fill="#eee8d7" stroke="#9b8965" strokeWidth="2">
      {reference.endsWith("35") || reference.endsWith("40") ? <path d="M43 12H171L150 85H64Z M64 85H150V105H64Z" /> : reference.endsWith("39") ? <path d="M32 45H182V77H32Z M40 45V34H174V45" /> : <>{[0, 1, 2].map(n => <path key={n} d={`M${40 + n * 48} 25v63h30V74h-17V25Z`} />)}</>}
      <text x="107" y={height - 7} textAnchor="middle" stroke="none" fill="#6e6046" fontSize="11">{reference}</text>
    </g> : <g transform={`translate(${(214 - width) / 2},0)`}>
      <rect x="0" y="3" width={width} height={height - 8} rx="6" {...frame} />
      <text x="9" y="16" fontSize="7" fill="#357454">{communication ? "COMMUNICATION" : "RESI9"}</text>
      {communication ? <>
        <rect x="10" y="24" width={width - 20} height="22" rx="3" fill="#e4e8f1" stroke="#a0abc4" />
        {Array.from({ length: 6 }, (_, i) => <rect key={i} x={17 + i * (width - 38) / 6} y="30" width="10" height="9" fill="#596681" />)}
        <path d={`M25 51v27h${width - 50}V51M45 51v15h${width - 90}v15`} fill="none" stroke="#7e9dba" strokeWidth="3" />
      </> : Array.from({ length: rows }, (_, row) => <g key={row} data-illustration-row={row + 1}>
        <rect x="8" y={23 + row * 35} width={width - 16} height="23" rx="2" fill="#dae0dc" />
        {Array.from({ length: modules }, (_, module) => <rect key={module} x={13 + module * 9} y={25 + row * 35} width="7" height="19" rx="1" fill="#fff" stroke="#aab7ad" strokeWidth=".6" />)}
        <text x={width - 4} y={39 + row * 35} textAnchor="end" fontSize="7" fill="#39644c">{row + 1}</text>
      </g>)}
    </g>}
    <text x="107" y={height + 16} textAnchor="middle" fill="#375d49" fontSize="12" fontWeight="600">{type === "kit" ? `${modules} modules` : type === "panel" && !communication ? `${rows} rangées × ${modules} modules` : communication ? "Brassage RJ45" : "Accessoire GTL"}</text>
  </svg>;
}
