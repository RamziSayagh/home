export const RELAY_LIGHTING_USAGE = "Éclairage par télérupteur";
const GENERAL_USAGES = ["Éclairage", RELAY_LIGHTING_USAGE, "Prises", "Chauffage", "Autre"];
const SPECIALIZED_USAGES = [
  "Volet roulant", "VMC", "Lave-linge", "Sèche-linge", "Lave-vaisselle",
  "Plaque de cuisson", "Four", "Chauffe-eau", "Congélateur",
  "Réfrigérateur", "Hotte", "Pompe à chaleur", "Climatisation",
  "Recharge de véhicule électrique", "Autre circuit spécialisé",
];
const specializedValue = (usage: string) => `Circuit spécialisé · ${usage}`;

export default function CircuitUsage({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
  const custom = value && value !== "Circuit spécialisé" && !GENERAL_USAGES.includes(value) && !SPECIALIZED_USAGES.some(usage => specializedValue(usage) === value);
  return <select name="usage" value={value} defaultValue={value === undefined ? "" : undefined} onChange={event => onChange?.(event.target.value)}>
    <option value="">À préciser</option>
    {GENERAL_USAGES.map(usage => <option key={usage}>{usage}</option>)}
    <optgroup label="Circuits spécialisés">
      <option value="Circuit spécialisé">Circuit spécialisé · à préciser</option>
      {SPECIALIZED_USAGES.map(usage => <option key={usage} value={specializedValue(usage)}>{usage}</option>)}
    </optgroup>
    {custom ? <option value={value}>{value}</option> : null}
  </select>;
}
