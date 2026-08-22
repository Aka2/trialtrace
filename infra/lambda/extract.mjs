import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: "eu-west-1" });
const MODEL_ID = "arn:aws:bedrock:eu-west-1:730763716314:inference-profile/eu.anthropic.claude-haiku-4-5-20251001-v1:0";

const PROMPT = `Extrais les données de ce compte-rendu clinique et renvoie UNIQUEMENT un objet JSON avec les champs subjectId, site, visitDate (format AAAA-MM-JJ), hemoglobin (nombre), dose (nombre). Aucun texte autour, juste le JSON.

Compte-rendu : `;

// --- Le garde-fou : valider chaque champ ---
function validate(data) {
  const errors = [];

  // subjectId : format SITE00-0000
  if (!/^SITE\d{2}-\d{4}$/.test(data.subjectId ?? "")) {
    errors.push("subjectId invalide (attendu : SITExx-xxxx)");
  }
  // site : chaîne non vide
  if (typeof data.site !== "string" || data.site.trim() === "") {
    errors.push("site manquant");
  }
  // visitDate : format AAAA-MM-JJ
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.visitDate ?? "")) {
    errors.push("visitDate invalide (attendu : AAAA-MM-JJ)");
  }
  // hemoglobin : nombre dans une plage physiologiquement plausible
  if (typeof data.hemoglobin !== "number" || data.hemoglobin < 2 || data.hemoglobin > 25) {
    errors.push("hemoglobin invalide ou hors plage plausible (2-25)");
  }
  // dose : nombre positif
  if (typeof data.dose !== "number" || data.dose < 0 || data.dose > 1000) {
    errors.push("dose invalide");
  }

  return errors;
}

export const handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};
  const reportText = body.text;

  if (!reportText) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing 'text' field" }) };
  }

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    messages: [{ role: "user", content: [{ text: PROMPT + reportText }] }],
    inferenceConfig: { maxTokens: 300, temperature: 0 },
  });

  const response = await bedrock.send(command);
  let rawText = response.output.message.content[0].text;
  rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

  let extracted;
  try {
    extracted = JSON.parse(rawText);
  } catch {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Le modèle n'a pas renvoyé de JSON valide", raw: rawText }),
    };
  }

  // --- On valide AVANT d'accepter ---
  const errors = validate(extracted);
  if (errors.length > 0) {
    return {
      statusCode: 422,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Données extraites invalides", details: errors, extracted }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valid: true, data: extracted }),
  };
};