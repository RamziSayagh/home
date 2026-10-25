export const enclosureHeightCm = (rows: number): number | null => ({ 1: 25, 2: 37.5, 3: 50, 4: 62.5 }[rows] ?? null);
export const DEFAULT_HEIGHTS_CM = { primary: 90, secondary: 90, communication: 40 };

type Cabinet = { key: string; label: string; bottom: number; height: number | null; modules: number };
export default function GtlElevation({ cabinets }: { cabinets: Cabinet[] }) {
  return <figure className="te-gtl-elevation">
    <svg viewBox="0 0 260 285" role="img" aria-label="Hauteurs de pose au-dessus du sol fini, repères à 90 et 180 centimètres">
      <rect x="68" y="10" width="132" height="240" fill="#f3f3ed" stroke="#c5cfc1" />
      <rect x="68" y="70" width="132" height="90" fill="#dfebdb" />
      {[0, 40, 90, 130, 180, 240].map(cm => <g key={cm}><line x1="55" x2="224" y1={250 - cm} y2={250 - cm} stroke={cm === 90 || cm === 180 ? "#58815d" : "#c5cfc1"} strokeDasharray={cm ? "3 3" : undefined} /><text x="49" y={254 - cm} textAnchor="end" fontSize="10" fill="#4c6250">{cm} cm</text></g>)}
      {cabinets.map((cabinet, index) => {
        const x = 76 + index * 42;
        const y = 250 - cabinet.bottom;
        return <g key={cabinet.key}>{cabinet.height !== null ? <rect x={x} y={y - cabinet.height} width={cabinet.modules === 18 ? 34 : 26} height={cabinet.height} rx="2" fill="#fffef9" stroke="#4f7055" strokeWidth="1.5" /> : <circle cx={x + 16} cy={y} r="4" fill="#6b76a1" />}<text x={x + 16} y={cabinet.height ? y - cabinet.height / 2 : y - 8} textAnchor="middle" fontSize="8" fill="#354d3c">{cabinet.key === "communication" ? "Com." : cabinet.label}</text><text x={x + 16} y={y + 11} textAnchor="middle" fontSize="8" fill="#53654c">{cabinet.bottom} cm</text></g>;
      })}
      <text x="134" y="273" textAnchor="middle" fontSize="10" fill="#4c6250">SOL FINI · 0 cm</text>
    </svg>
    <figcaption>Zone repère 90–180 cm pour les manettes. Rectangles : encombrement des coffrets ; point : communication sans dimensions renseignées.</figcaption>
  </figure>;
}
