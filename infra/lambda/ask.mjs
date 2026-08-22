import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { evaluateVisit } from "./rules.mjs";

const bedrock = new BedrockRuntimeClient({ region: "eu-west-1" });
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const MODEL_ID = "arn:aws:bedrock:eu-west-1:730763716314:inference-profile/eu.anthropic.claude-haiku-4-5-20251001-v1:0";

// --- Les opérations SÛRES que le LLM peut invoquer (lecture seule) ---
const TOOLS = [
  {
    toolSpec: {
      name: "compter_ecarts",
      description: "Compte les écarts détectés, avec filtre optionnel par sévérité (critical/minor) et/ou par centre (ville).",
      inputSchema: { json: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["critical", "minor"], description: "Filtrer par sévérité" },
          site: { type: "string", description: "Filtrer par centre, ex: Lyon" },
        },
      }},
    },
  },
  {
    toolSpec: {
      name: "statistiques_globales",
      description: "Renvoie les statistiques globales : total de visites, conformes, mineures, critiques.",
      inputSchema: { json: { type: "object", properties: {} } },
    },
  },
  {
    toolSpec: {
      name: "lister_participants_centre",
      description: "Liste les participants d'un centre donné.",
      inputSchema: { json: {
        type: "object",
        properties: { site: { type: "string", description: "Le centre, ex: Marseille" } },
        required: ["site"],
      }},
    },
  },
];

// --- Chargement des données + protocole ---
async function loadAll() {
  const protoRes = await doc.send(new GetCommand({ TableName: "trialtrace", Key: { PK: "PROTOCOL", SK: "CURRENT" } }));
  const p = protoRes.Item;
  const protocol = {
    hemoglobin: { min: p.hemoglobinMin, max: p.hemoglobinMax },
    dose: { expected: p.doseExpected },
    visitWindow: p.visitWindow,
  };
  const scan = await doc.send(new ScanCommand({ TableName: "trialtrace" }));
  const items = scan.Items ?? [];
  return { protocol, items };
}

// --- Exécution déterministe de l'opération choisie par le LLM ---
async function runTool(name, input) {
  const { protocol, items } = await loadAll();
  const visits = items.filter((it) => it.SK?.startsWith("VISIT#"));
  const profiles = items.filter((it) => it.SK === "PROFILE");

  // Calcule tous les écarts
  const allDeviations = [];
  for (const v of visits) {
    for (const d of evaluateVisit(v, protocol)) {
      allDeviations.push({ ...d, subjectId: v.subjectId, site: profiles.find((pr) => pr.subjectId === v.subjectId)?.site });
    }
  }

  if (name === "compter_ecarts") {
    let filtered = allDeviations;
    if (input.severity) filtered = filtered.filter((d) => d.severity === input.severity);
    if (input.site) filtered = filtered.filter((d) => d.site?.toLowerCase() === input.site.toLowerCase());
    return { count: filtered.length, filtre: input };
  }

  if (name === "statistiques_globales") {
    const critiques = allDeviations.filter((d) => d.severity === "critical").length;
    const mineures = allDeviations.filter((d) => d.severity === "minor").length;
    return { total: visits.length, critiques, mineures, conformes: visits.length - critiques - mineures };
  }

  if (name === "lister_participants_centre") {
    const list = profiles.filter((pr) => pr.site?.toLowerCase() === input.site?.toLowerCase()).map((pr) => pr.subjectId);
    return { site: input.site, count: list.length, participants: list };
  }

  return { error: "Opération inconnue" };
}

export const handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};
  const question = body.question;
  if (!question) return { statusCode: 400, body: JSON.stringify({ error: "Question manquante" }) };

  const systemPrompt = `Tu es un assistant pour une plateforme de revue de données cliniques.
Réponds aux questions en utilisant UNIQUEMENT les outils fournis.
Après avoir reçu le résultat d'un outil, formule une réponse claire et concise en français.
Ne jamais inventer de chiffres : utilise seulement les résultats des outils.`;

  const messages = [{ role: "user", content: [{ text: question }] }];

  // --- Premier appel : le LLM choisit un outil ---
  const first = await bedrock.send(new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: systemPrompt }],
    messages,
    toolConfig: { tools: TOOLS },
    inferenceConfig: { maxTokens: 500, temperature: 0 },
  }));

  const toolUse = first.output.message.content.find((c) => c.toolUse)?.toolUse;

  // Si le LLM n'a pas demandé d'outil, il répond directement
  if (!toolUse) {
    const text = first.output.message.content.find((c) => c.text)?.text ?? "Je ne peux répondre qu'aux questions sur les données de l'étude.";
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: text, tool: null }) };
  }

  // --- On exécute l'outil nous-mêmes (déterministe) ---
  const result = await runTool(toolUse.name, toolUse.input ?? {});

  // --- Second appel : le LLM reformule le résultat ---
  messages.push({ role: "assistant", content: first.output.message.content });
  messages.push({ role: "user", content: [{ toolResult: { toolUseId: toolUse.toolUseId, content: [{ json: result }] } }] });

  const second = await bedrock.send(new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: systemPrompt }],
    messages,
    toolConfig: { tools: TOOLS },
    inferenceConfig: { maxTokens: 500, temperature: 0 },
  }));

  const answer = second.output.message.content.find((c) => c.text)?.text ?? "Réponse indisponible.";

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer, tool: toolUse.name, toolInput: toolUse.input, rawResult: result }),
  };
};