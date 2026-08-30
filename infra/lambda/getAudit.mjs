import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async () => {
  // Query sur PK = AUDIT, triés du plus récent au plus ancien
  const res = await doc.send(new QueryCommand({
    TableName: "trialtrace",
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: { ":pk": "AUDIT" },
    ScanIndexForward: false,   // ordre décroissant = plus récent d'abord
    Limit: 100,
  }));

  const entries = (res.Items ?? []).map((it) => ({
    timestamp: it.timestamp,
    actor: it.actor,
    action: it.action,
    target: it.target,
    details: it.details,
  }));

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: entries.length, entries }),
  };
};