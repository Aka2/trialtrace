import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { evaluateVisit } from "./rules.mjs";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function loadProtocol() {
  const res = await doc.send(new GetCommand({
    TableName: "trialtrace",
    Key: { PK: "PROTOCOL", SK: "CURRENT" },
  }));
  const p = res.Item;
  if (!p) throw new Error("Protocole introuvable");
  return {
    hemoglobin: { min: p.hemoglobinMin, max: p.hemoglobinMax },
    dose: { expected: p.doseExpected },
    visitWindow: p.visitWindow,
  };
}

export const handler = async () => {
  const protocol = await loadProtocol();

  const result = await doc.send(new ScanCommand({ TableName: "trialtrace" }));
  const visits = (result.Items ?? []).filter((it) => it.SK?.startsWith("VISIT#"));

  let critiques = 0;
  let mineures = 0;

  for (const visit of visits) {
    const deviations = evaluateVisit(visit, protocol);   // même moteur, même protocole
    for (const d of deviations) {
      if (d.severity === "critical") critiques++;
      else mineures++;
    }
  }

  const total = visits.length;
  const ecarts = critiques + mineures;
  const conformes = total - ecarts;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ total, conformes, mineures, critiques, ecarts }),
  };
};