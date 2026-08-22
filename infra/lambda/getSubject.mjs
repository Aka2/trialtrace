import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  // On récupère l'identifiant du participant depuis l'URL
  const subjectId = event.pathParameters?.id;

  if (!subjectId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing subject id" }),
    };
  }

  // On ouvre le tiroir SUBJECT#<id> et on prend toutes les fiches
  const command = new QueryCommand({
    TableName: "trialtrace",
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `SUBJECT#${subjectId}`,
    },
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.Items),
  };
};