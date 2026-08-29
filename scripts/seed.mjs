import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });
const doc = DynamoDBDocumentClient.from(client);
const TABLE = "trialtrace";

const SITES = ["SITE01", "SITE02", "SITE03", "SITE04", "SITE05"];
const CITIES = { SITE01: "Paris", SITE02: "Lyon", SITE03: "Marseille", SITE04: "Toulouse", SITE05: "Lille" };

// Bornes "normales" attendues par le protocole
const HB_MIN = 12.0, HB_MAX = 16.0;   // hémoglobine attendue
const DOSE_OK = 50;                     // dose prévue

let anomaliesInjected = 0;

function rnd(min, max) { return +(Math.random() * (max - min) + min).toFixed(1); }
function pad(n) { return String(n).padStart(4, "0"); }

// Écrit une fiche dans DynamoDB
async function put(item) {
  await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
}

async function seed() {
  let count = 0;

  for (const site of SITES) {
    // 6 participants par centre
    for (let i = 1; i <= 6; i++) {
      const subjectId = `${site}-${pad(i)}`;
      const pk = `SUBJECT#${subjectId}`;

      // Fiche PROFIL
      await put({
        PK: pk, SK: "PROFILE",
        subjectId, site: CITIES[site],
        status: "active", inclusionDate: "2026-01-15",
      });

      // 3 visites par participant
      for (let v = 1; v <= 3; v++) {
        const day = 28 * v; // J28, J56, J84 (théorique)
        let visitDay = day;
        let hb = rnd(HB_MIN, HB_MAX);   // valeur normale par défaut
        let dose = DOSE_OK;

        // --- INJECTION D'ANOMALIES (environ 1 fiche sur 6) ---
        const roll = Math.random();
        if (roll < 0.06) {
          hb = rnd(5.5, 8.0);           // hémoglobine anormalement basse
          anomaliesInjected++;
        } else if (roll < 0.12) {
          visitDay = day + 10;          // visite hors fenêtre (J+10)
          anomaliesInjected++;
        } else if (roll < 0.16) {
          dose = 75;                    // dose non conforme
          anomaliesInjected++;
        }

        await put({
          PK: pk, SK: `VISIT#${String(visitDay).padStart(3, "0")}`,
          subjectId, visitNumber: v,
          plannedDay: day, actualDay: visitDay,
          hemoglobin: hb, dose,
        });
        count++;
      }
      count++; // le profil
    }
  }

  console.log(`✅ ${count} fiches écrites.`);
  console.log(`⚠️  ${anomaliesInjected} anomalies injectées volontairement.`);
  console.log(`    → Garde ce nombre en tête : c'est ce que ton moteur de règles devra retrouver.`);
}

seed().catch((e) => { console.error(e); process.exit(1); });