/**
 * Le robot : publie la clé des cases dues dans etat/ouvertes.json.
 *
 * Lancé par GitHub Actions (planifié ou à la main), il fait toujours la même
 * chose : il calcule les cases dues à l'instant présent, vérifie que chacune
 * se déchiffre, puis écrit l'état. Un passage sauté se rattrape au suivant ;
 * deux passages de suite n'ouvrent rien de plus. Le journal ne contient que
 * des numéros de cases, jamais leur contenu.
 *
 * Localement, pour essayer : pnpm robot --maintenant 2026-12-12T08:00:00+01:00
 * (refusé sur GitHub, pour qu'aucune case ne s'ouvre avant sa date).
 */
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { casesDues, FUSEAU, type Config } from "../src/lib/calendrier.ts";
import { cleDeLaCase, dechiffrer, lireCleMaitresse } from "../src/lib/coffre.ts";
import { CHEMIN_ETAT, ecrireJson, lireCase, lireChiffre, lireConfig, lireEtat, type Etat } from "./lib/fichiers.ts";

const lireMaintenant = (): Date => {
  const i = process.argv.indexOf("--maintenant");
  if (i === -1) return new Date();
  if (process.env.GITHUB_ACTIONS) throw new Error("--maintenant est interdit sur GitHub : le robot suit l'horloge réelle.");
  const date = new Date(process.argv[i + 1] ?? "");
  if (Number.isNaN(date.getTime())) throw new Error("--maintenant attend une date ISO, ex. 2026-12-12T08:00:00+01:00");
  return date;
};

export const calculerEtat = (config: Config, maintenant: Date, maitresse: Buffer): Etat => {
  const cases: Record<string, string> = {};
  for (const jour of casesDues(config, maintenant)) {
    const chiffre = lireChiffre(jour);
    if (!chiffre) throw new Error(`La case ${jour} est due mais contenu/chiffre/case-${String(jour).padStart(2, "0")}.json n'existe pas.`);
    const cle = cleDeLaCase(maitresse, jour);
    // Vérifie la case sans jamais l'afficher : mauvaise clé ou case mal formée = échec visible.
    lireCase(dechiffrer(cle, chiffre));
    cases[String(jour)] = cle.toString("base64");
  }
  return { mode: config.mode, cases };
};

const principal = () => {
  const maintenant = lireMaintenant();
  const config = lireConfig();
  const avant = lireEtat();
  const apres = calculerEtat(config, maintenant, lireCleMaitresse(process.env.CONTENU_CLE));

  const ouvertesAvant = Object.keys(avant.cases).map(Number);
  const ouvertesApres = Object.keys(apres.cases).map(Number);
  const nouvelles = ouvertesApres.filter((j) => !ouvertesAvant.includes(j));
  const refermees = ouvertesAvant.filter((j) => !ouvertesApres.includes(j));
  const change = JSON.stringify(avant) !== JSON.stringify(apres);

  if (change) ecrireJson(CHEMIN_ETAT, apres);

  const heureParis = maintenant.toLocaleString("fr-FR", { timeZone: FUSEAU });
  const resume = nouvelles.length
    ? `Ouvre la case ${nouvelles.join(", ")}`
    : refermees.length
      ? `Referme les cases ${refermees.join(", ")} (mode ${config.mode})`
      : change
        ? `Passe en mode ${config.mode}`
        : "Rien à ouvrir";

  const journal = [
    `Passage du robot — ${maintenant.toISOString()} (UTC) / ${heureParis} (Paris)`,
    `Mode : ${config.mode}${config.mode === "accelere" ? ` (départ ${config.accelere.depart}, une case toutes les ${config.accelere.intervalleMinutes} min)` : ` (ouverture à ${config.heureOuverture}, heure de Paris)`}`,
    `Cases ouvertes : ${ouvertesApres.length ? ouvertesApres.join(", ") : "aucune"}`,
    `Résultat : ${resume}`,
  ];
  console.log(journal.join("\n"));

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## 🎄 Robot du calendrier\n\n${journal.map((l) => `- ${l}`).join("\n")}\n`);
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `change=${change}\nmessage=${resume}\n`);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) principal();
