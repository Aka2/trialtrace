import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Extrait les groupes (rôles) depuis le JWT transmis par l'authorizer
function getGroups(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const raw = claims["cognito:groups"];
  if (!raw) return [];
  // Selon le format, ça peut être un tableau ou une chaîne "[data-manager]"
  if (Array.isArray(raw)) return raw;
  return String(raw).replace(/[[\]]/g, "").split(/[\s,]+/).filter(Boolean);
}

export const handler = async (event) => {
  // --- Contrôle du rôle : seul un data-manager peut modifier ---
  const groups = getGroups(event);
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

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updated: true }),
  };
};