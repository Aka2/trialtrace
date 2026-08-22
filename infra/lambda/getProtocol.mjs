import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async () => {
  const result = await doc.send(new GetCommand({
    TableName: "trialtrace",
    Key: { PK: "PROTOCOL", SK: "CURRENT" },
  }));

  const p = result.Item;
  if (!p) {
    return { statusCode: 404, body: JSON.stringify({ error: "Protocole introuvable" }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hemoglobinMin: p.hemoglobinMin,
      hemoglobinMax: p.hemoglobinMax,
      doseExpected: p.doseExpected,
      visitWindow: p.visitWindow,
    }),
  };
};