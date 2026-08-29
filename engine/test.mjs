import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { evaluateVisit } from "./rules.mjs";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "eu-west-1" }));

async function run() {
  // 1. Récupérer toutes les visites depuis DynamoDB
  const result = await doc.send(new ScanCommand({ TableName: "trialtrace" }));
  const visits = (result.Items ?? []).filter((it) => it.SK?.startsWith("VISIT#"));

  console.log(`\n ${visits.length} visites analysées\n`);

  // 2. Faire tourner le moteur sur chaque visite
  let critiques = 0;
  let mineures = 0;
  let visitesAvecEcart = 0;

  for (const visit of visits) {
    const deviations = evaluateVisit(visit);
    if (deviations.length > 0) {
      visitesAvecEcart++;
      for (const d of deviations) {
        if (d.severity === "critical") critiques++;
        else mineures++;
      }
    }
  }

  // 3. Afficher le bilan
  console.log(` Écarts critiques : ${critiques}`);
  console.log(` Écarts mineurs   : ${mineures}`);
  console.log(` Total écarts      : ${critiques + mineures}`);
  console.log(` Visites avec au moins un écart : ${visitesAvecEcart}\n`);
  console.log(` Compare "visites avec écart" à tes 14 anomalies injectées.`);
}

run().catch((e) => { console.error(e); process.exit(1); });