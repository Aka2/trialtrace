import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getIdentity, writeAudit } from "./audit.mjs";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
  const { email, groups } = getIdentity(event);

  // Contrôle du rôle : seul un data-manager peut modifier
  if (!groups.includes("data-manager")) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Accès refusé : rôle data-manager requis" }),
    };
  }

  const body = event.body ? JSON.parse(event.body) : {};

  const fields = ["hemoglobinMin", "hemoglobinMax", "doseExpected", "visitWindow"];
  for (const f of fields) {
    if (typeof body[f] !== "number" || body[f] < 0) {
      return { statusCode: 400, body: JSON.stringify({ error: `Champ ${f} invalide` }) };
    }
  }
  if (body.hemoglobinMin >= body.hemoglobinMax) {
    return { statusCode: 400, body: JSON.stringify({ error: "min doit être < max" }) };
  }

  await doc.send(new PutCommand({
    TableName: "trialtrace",
    Item: {
      PK: "PROTOCOL",
      SK: "CURRENT",
      hemoglobinMin: body.hemoglobinMin,
      hemoglobinMax: body.hemoglobinMax,
      doseExpected: body.doseExpected,
      visitWindow: body.visitWindow,
    },
  }));

  // --- Traçage de l'action ---
  await writeAudit({
    actor: email,
    action: "PROTOCOL_UPDATED",
    target: "Protocole de l'étude",
    details: `HB ${body.hemoglobinMin}-${body.hemoglobinMax}, dose ${body.doseExpected}, fenêtre ±${body.visitWindow}j`,
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updated: true }),
  };
};