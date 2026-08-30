import { getIdentity, writeAudit } from "./audit.mjs";

export const handler = async (event) => {
  const { email } = getIdentity(event);
  const body = event.body ? JSON.parse(event.body) : {};
  const { subjectId, visitNumber, deviationType } = body;

  if (!subjectId) {
    return { statusCode: 400, body: JSON.stringify({ error: "subjectId manquant" }) };
  }

  await writeAudit({
    actor: email,
    action: "QUERY_EMITTED",
    target: `${subjectId} / visite ${visitNumber}`,
    details: `Query émise sur l'écart : ${deviationType ?? "non précisé"}`,
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emitted: true }),
  };
};