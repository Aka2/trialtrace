import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { evaluateVisit } from "./rules.mjs";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Lit le protocole depuis la base et le met au format attendu par le moteur
async function loadProtocol() {
  const res = await doc.send(new GetCommand({
    TableName: "trialtrace",
    Key: { PK: "PROTOCOL", SK: "CURRENT" },
  }));
  const p = res.Item;
  if (!p) throw new Error("Protocole introuvable en base");

  return {
    hemoglobin: { min: p.hemoglobinMin, max: p.hemoglobinMax },
    dose: { expected: p.doseExpected },
    visitWindow: p.visitWindow,
  };
}

export const handler = async () => {
  // 1. Charger le protocole depuis la base (au lieu du code en dur)
  const protocol = await loadProtocol();

  // 2. Lire toutes les visites
  const result = await doc.send(new ScanCommand({ TableName: "trialtrace" }));
  const visits = (result.Items ?? []).filter((it) => it.SK?.startsWith("VISIT#"));

  // 3. Faire tourner le moteur avec le protocole chargé
  const deviations = [];
  for (const visit of visits) {
    const found = evaluateVisit(visit, protocol);  // ← on passe le protocole de la base
    for (const d of found) {
      deviations.push({
        subjectId: visit.subjectId,
        visitNumber: visit.visitNumber,
        type: d.type,
        severity: d.severity,
        detail: d.detail,
      });
    }
  }

  deviations.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "critical" ? -1 : 1;
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: deviations.length, deviations }),
  };
};