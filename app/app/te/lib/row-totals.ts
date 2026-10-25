import { PRODUCT_BY_REF } from "../data/catalog";
import type { Circuit, Device } from "./model";

const HALF_WEIGHT_USAGES = new Set(["Éclairage", "Éclairage par télérupteur", "Prises", "Circuit spécialisé · Volet roulant"]);

export function rowBreakerTotals(devices: Device[], circuits: Circuit[]) {
  const byId = new Map(circuits.map(circuit => [circuit.id, circuit]));
  let count = 0;
  let rawA = 0;
  let weightedA = 0;
  let halfWeightedCount = 0;
  for (const device of devices) {
    const product = PRODUCT_BY_REF[device.reference];
    if (product?.kind !== "breaker") continue;
    const amps = product.ratedCurrentA ?? 0;
    const ids = [device.circuitId, device.secondCircuitId].filter((id): id is string => !!id);
    const halfWeight = ids.length > 0 && ids.every(id => HALF_WEIGHT_USAGES.has(byId.get(id)?.usage ?? ""));
    count++;
    rawA += amps;
    weightedA += amps * (halfWeight ? 0.5 : 1);
    if (halfWeight) halfWeightedCount++;
  }
  return { count, rawA, weightedA, halfWeightedCount };
}
