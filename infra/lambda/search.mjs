import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@smithy/signature-v4";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";

const OS_HOST = process.env.OS_ENDPOINT;
const INDEX = "participants";

const signer = new SignatureV4({
  service: "es",
  region: "eu-west-1",
  credentials: defaultProvider(),
  sha256: Sha256,
});

async function osRequest(method, path, body) {
  const request = new HttpRequest({
    method,
    hostname: OS_HOST,
    path,
    headers: { "Content-Type": "application/json", host: OS_HOST },
    body: body ? JSON.stringify(body) : undefined,
  });
  const signed = await signer.sign(request);
  const res = await fetch(`https://${OS_HOST}${path}`, {
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
  });
  return res.json();
}

export const handler = async (event) => {
  // Le terme de recherche arrive en paramètre d'URL : /search?q=lyon
  const q = event.queryStringParameters?.q ?? "";

  // Requête OpenSearch : recherche multi-champs, floue
  const query = q.trim()
    ? {
        multi_match: {
          query: q,
          fields: ["subjectId", "site", "status"],
          fuzziness: "AUTO",       // tolère les fautes de frappe
          type: "bool_prefix",     // recherche par préfixe (site0 → site01...)
        },
      }
    : { match_all: {} };           // pas de terme → tout renvoyer

  const result = await osRequest("POST", `/${INDEX}/_search`, {
    size: 50,
    query,
  });

  // On extrait juste les données utiles des résultats
  const hits = (result.hits?.hits ?? []).map((h) => h._source);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: hits.length, results: hits }),
  };
};