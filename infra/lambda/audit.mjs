import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Extrait l'identité (email + groupes) depuis le JWT transmis par l'authorizer
export function getIdentity(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {};
  const email = claims["email"] ?? claims["cognito:username"] ?? "inconnu";
  const raw = claims["cognito:groups"];
  let groups = [];
  if (Array.isArray(raw)) groups = raw;
  else if (raw) groups = String(raw).replace(/[[\]]/g, "").split(/[\s,]+/).filter(Boolean);
  return { email, groups };
}

// Écrit une entrée d'audit (append-only) dans DynamoDB
export async function writeAudit({ actor, action, target, details }) {
  const timestamp = new Date().toISOString();
  const id = Math.random().toString(36).slice(2, 8);
  await doc.send(new PutCommand({
    TableName: "trialtrace",
    Item: {
      PK: "AUDIT",
      SK: `${timestamp}#${id}`,   // trié par date naturellement
      timestamp,
      actor,        // qui
      action,       // quoi (ex: PROTOCOL_UPDATED, QUERY_EMITTED)
      target,       // sur quoi (ex: SITE05-0006 / visite 3)
      details,      // infos complémentaires
    },
  }));
}