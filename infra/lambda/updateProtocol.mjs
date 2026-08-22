import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};

  // Validation : on n'accepte que des nombres cohérents
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