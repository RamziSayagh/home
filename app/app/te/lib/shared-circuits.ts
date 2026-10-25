import type { Circuit, Device, Project } from "./model";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\blumieres?\b/g, "eclairage").replace(/\bvolets\b/g, "volet").replace(/\broulants\b/g, "roulant").replace(/\bsuite parentale\b/g, "chambre parentale").replace(/[^a-z0-9]+/g, " ").trim();
const identity = (circuit: Circuit) => [circuit.name, circuit.room, circuit.floor, circuit.usage].map(normalize).join("|");
const links = (device: Device) => [device.circuitId, device.secondCircuitId].filter(Boolean);

// Run once for earlier panel-local inventories. Never discard conflicting
// technical information or combine two circuits already assigned to devices.
export function shareCircuits(project: Project): Project {
  const boards = project.secondPanel ? [project, project.secondPanel] : [project];
  const circuits: Circuit[] = [];
  const redirects = boards.map(() => new Map<string, string>());
  const assigned = new Map<string, number>();
  const usedIds = new Set<string>();
  boards.forEach((board, panelIndex) => board.circuits.forEach(circuit => {
    const count = board.devices.reduce((sum, device) => sum + Number(links(device).includes(circuit.id)), 0);
    const match = circuits.find(candidate => identity(candidate) === identity(circuit)
      && (!candidate.cable || !circuit.cable || candidate.cable === circuit.cable)
      && (!candidate.load || !circuit.load || candidate.load === circuit.load)
      && (assigned.get(candidate.id) ?? 0) + count <= 1);
    if (match) {
      if (!match.cable) match.cable = circuit.cable;
      if (!match.load) match.load = circuit.load;
      redirects[panelIndex].set(circuit.id, match.id);
      assigned.set(match.id, (assigned.get(match.id) ?? 0) + count);
    } else {
      let id = circuit.id;
      let suffix = 1;
      while (usedIds.has(id)) id = `${circuit.id.slice(0, 68)}-p${panelIndex + 1}-${suffix++}`;
      usedIds.add(id);
      circuits.push({ ...circuit, id });
      assigned.set(id, count);
      redirects[panelIndex].set(circuit.id, id);
    }
  }));
  const remap = (devices: Device[], panelIndex: number) => devices.map(device => ({
    ...device,
    circuitId: redirects[panelIndex].get(device.circuitId) ?? device.circuitId,
    ...(device.secondCircuitId !== undefined ? { secondCircuitId: redirects[panelIndex].get(device.secondCircuitId) ?? device.secondCircuitId } : {}),
  }));
  return {
    ...project, sharedCircuits: true, circuits, devices: remap(project.devices, 0),
    ...(project.secondPanel ? { secondPanel: { ...project.secondPanel, circuits: [], devices: remap(project.secondPanel.devices, 1) } } : {}),
  };
}
