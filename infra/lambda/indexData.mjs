import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@smithy/signature-v4";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// L'adresse de ton domaine OpenSearch (SANS https://)
const OS_HOST = process.env.OS_ENDPOINT;
const INDEX = "participants";

// Prépare le signataire SigV4
const signer = new SignatureV4({
  service: "es",
  region: "eu-west-1",
  credentials: defaultProvider(),
  sha256: Sha256,
});

// Envoie une requête signée à OpenSearch
async function osRequest(method, path, body) {
  const request = new HttpRequest({
    method,
    hostname: OS_HOST,
    path,
    headers: {
      "Content-Type": "application/json",
      host: OS_HOST,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const signed = await signer.sign(request);
  const res = await fetch(`https://${OS_HOST}${path}`, {
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
  });
  return res;
}

export const handler = async () => {
  // 1. Lire tous les profils de participants depuis DynamoDB
  const result = await doc.send(new ScanCommand({ TableName: "trialtrace" }));
  const profiles = (result.Items ?? []).filter((it) => it.SK === "PROFILE");

  // 2. Indexer chaque participant dans OpenSearch
  let indexed = 0;
  for (const p of profiles) {
    const res = await osRequest("PUT", `/${INDEX}/_doc/${p.subjectId}`, {
      subjectId: p.subjectId,
      site: p.site,
      status: p.status,
      inclusionDate: p.inclusionDate,
    });
    if (res.ok) indexed++;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ indexed, total: profiles.length }),
  };
};