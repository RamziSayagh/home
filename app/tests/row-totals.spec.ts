import { expect, test } from "@playwright/test";
import { rowBreakerTotals } from "../app/te/lib/row-totals";
import type { Circuit, Device } from "../app/te/lib/model";

const circuit = (id: string, usage: string): Circuit => ({ id, usage, name: id, room: "", floor: "", load: "", cable: "" });
const breaker = (patch: Partial<Device> = {}): Device => ({ id: "d", reference: "R9EFC616", rowId: "r", slot: 0, label: "", circuitId: "", upstreamId: "", ...patch });

test("half weights only known all-lighting/socket circuits, counting each breaker once", () => {
  const circuits = [circuit("light", "Éclairage"), circuit("socket", "Prises"), circuit("tl", "Éclairage par télérupteur"), circuit("heat", "Chauffage"), circuit("unknown", "")];
  expect(rowBreakerTotals([breaker({ circuitId: "light", secondCircuitId: "socket" })], circuits)).toEqual({ count: 1, rawA: 16, weightedA: 8, halfWeightedCount: 1 });
  expect(rowBreakerTotals([breaker({ reference: "R9PFC610", circuitId: "tl" })], circuits).weightedA).toBe(5);
  expect(rowBreakerTotals([breaker({ reference: "A9F77240" })], circuits)).toEqual({ count: 1, rawA: 40, weightedA: 40, halfWeightedCount: 0 });
  const withShutters = [...circuits, circuit("shutter", "Circuit spécialisé · Volet roulant")];
  expect(rowBreakerTotals([breaker({ circuitId: "shutter" })], withShutters).weightedA).toBe(8);
  expect(rowBreakerTotals([breaker({ circuitId: "light", secondCircuitId: "shutter" })], withShutters).weightedA).toBe(8);
  expect(rowBreakerTotals([breaker({ circuitId: "shutter", secondCircuitId: "heat" })], withShutters).weightedA).toBe(16);
  for (const patch of [{}, { circuitId: "unknown" }, { circuitId: "missing" }, { circuitId: "heat" }, { circuitId: "light", secondCircuitId: "heat" }, { circuitId: "socket", secondCircuitId: "missing" }]) {
    expect(rowBreakerTotals([breaker(patch)], circuits).weightedA).toBe(16);
  }
  expect(rowBreakerTotals([breaker({ circuitId: "socket" }), breaker({ reference: "R9PFC610", circuitId: "tl" }), breaker({ reference: "R9EFC620", circuitId: "heat" }), breaker({ reference: "R9ERA263" }), breaker({ reference: "R9PCL216" }), breaker({ reference: "R9PLC" })], circuits)).toEqual({ count: 3, rawA: 46, weightedA: 33, halfWeightedCount: 2 });
});
