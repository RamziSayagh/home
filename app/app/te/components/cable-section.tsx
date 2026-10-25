const SECTIONS = ["0,75", "1", "1,5", "2,5", "4", "6", "10", "16", "25", "35", "50", "70", "95", "120"];
const options = SECTIONS.map(section => `${section} mm²`);

export default function CableSection({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <select value={value} onChange={event => onChange(event.target.value)}>
    <option value="">À préciser</option>
    {options.map(section => <option key={section} value={section}>{section}</option>)}
    {value && !options.includes(value) ? <option value={value}>{value} (valeur enregistrée)</option> : null}
  </select>;
}
