// --- Les règles du protocole, sous forme de DONNÉES (pas de code en dur) ---
export const PROTOCOL = {
  hemoglobin: { min: 12.0, max: 16.0 },   // bornes attendues
  dose: { expected: 50 },                  // dose prévue
  visitWindow: 5,                          // tolérance en jours autour de la date théorique
};

// --- Le moteur : une fonction pure. Visite + règles → écarts détectés ---
export function evaluateVisit(visit, protocol = PROTOCOL) {
  const deviations = [];

  // Règle 1 : hémoglobine hors bornes → CRITIQUE
  if (visit.hemoglobin < protocol.hemoglobin.min || visit.hemoglobin > protocol.hemoglobin.max) {
    deviations.push({
      type: "HEMOGLOBIN_OUT_OF_RANGE",
      severity: "critical",
      detail: `Hémoglobine ${visit.hemoglobin} g/dL hors bornes [${protocol.hemoglobin.min}–${protocol.hemoglobin.max}]`,
    });
  }

  // Règle 2 : visite hors fenêtre → MINEUR
  const dayGap = Math.abs((visit.actualDay ?? 0) - (visit.plannedDay ?? 0));
  if (dayGap > protocol.visitWindow) {
    deviations.push({
      type: "VISIT_OUT_OF_WINDOW",
      severity: "minor",
      detail: `Visite à J+${dayGap} du théorique (fenêtre ±${protocol.visitWindow} j)`,
    });
  }

  // Règle 3 : dose non conforme → MINEUR
  if (visit.dose !== protocol.dose.expected) {
    deviations.push({
      type: "DOSE_MISMATCH",
      severity: "minor",
      detail: `Dose ${visit.dose} mg (attendu ${protocol.dose.expected} mg)`,
    });
  }

  return deviations;
}