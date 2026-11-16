/**
 * Inscription du visiteur sur Lumail, avec le tag du calendrier.
 *
 * Même appel que dans Estimaker : POST /subscribers crée l'abonné s'il
 * n'existe pas et ajoute le tag sans toucher aux autres. Le tag déclenche les
 * workflows Lumail qui l'écoutent (séquence de bienvenue, par exemple).
 */
const LUMAIL_API_URL = "https://lumail.io/api/v1";

export const LUMAIL_TAG = process.env.LUMAIL_TAG || "calendrier-avent";

export type ResultatLumail = "inscrit" | "ignore" | "erreur";

export const inscrireSurLumail = async (email: string): Promise<ResultatLumail> => {
  const cle = process.env.LUMAIL_API_KEY;
  if (!cle) {
    if (process.env.NODE_ENV === "production") {
      console.error("[lumail] LUMAIL_API_KEY manquante : inscription refusée pour ne perdre aucun contact.");
      return "erreur";
    }
    console.warn(`[lumail] Pas de LUMAIL_API_KEY en local : ${email} n'est pas envoyé.`);
    return "ignore";
  }

  try {
    const reponse = await fetch(`${LUMAIL_API_URL}/subscribers`, {
      method: "POST",
      headers: { authorization: `Bearer ${cle}`, "content-type": "application/json" },
      body: JSON.stringify({
        email,
        tags: [LUMAIL_TAG],
        replaceTags: false,
        resubscribe: true,
        triggerWorkflows: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!reponse.ok) {
      console.error("[lumail] refus", reponse.status, await reponse.text().catch(() => ""));
      return "erreur";
    }
    return "inscrit";
  } catch (erreur) {
    console.error("[lumail] requête échouée", erreur);
    return "erreur";
  }
};
