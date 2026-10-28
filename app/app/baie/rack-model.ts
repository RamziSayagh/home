export type RackItem = { id: string; name: string; reference: string; units: number; slot: number };
export type RackConfig = { version: 2; height: number; items: RackItem[] };

export function canPlace(config: RackConfig, units: number, slot: number, ignoreId?: string) {
  return Number.isInteger(units) && units > 0 && Number.isInteger(slot) && slot >= 0 && slot + units <= config.height &&
    config.items.every(item => item.id === ignoreId || slot + units <= item.slot || slot >= item.slot + item.units);
}

export function firstFreeSlot(config: RackConfig, units: number) {
  for (let slot = 0; slot <= config.height - units; slot++) {
    if (canPlace(config, units, slot)) return slot;
  }
  return -1;
}

// Legacy projects were a packed top-to-bottom list; preserve that exact order.
export function readRackConfig(value: unknown): RackConfig {
  if (!value || typeof value !== "object") throw new Error("Invalid rack");
  const input = value as Record<string, unknown>;
  if (input.version !== undefined && input.version !== 2) throw new Error("Unknown version");
  if (!Number.isInteger(input.height) || Number(input.height) < 1 || Number(input.height) > 48 || !Array.isArray(input.items)) throw new Error("Invalid rack");
  const config: RackConfig = { version: 2, height: Number(input.height), items: [] };
  let cursor = 0;
  for (const entry of input.items) {
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string" || typeof entry.name !== "string" || typeof entry.reference !== "string" || config.items.some(item => item.id === entry.id)) throw new Error("Invalid equipment");
    const slot = input.version === 2 ? entry.slot : cursor;
    if (!canPlace(config, entry.units, slot)) throw new Error("Invalid placement");
    config.items.push({ id: entry.id, name: entry.reference === "UACC-Rack-Shelf-CLV" && entry.name === "?tag?re fixe" ? "Étagère fixe" : entry.name, reference: entry.reference, units: entry.units, slot });
    cursor += entry.units;
  }
  return config;
}
