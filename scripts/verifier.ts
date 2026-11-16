/**
 * La vérification avant mise en ligne (bonus du palier 5).
 *
 * Lancée au build (Vercel) et par le robot avant d'envoyer quoi que ce soit.
 * Si un contrôle échoue, la mise en ligne s'arrête et la version précédente
 * reste en place.
 */
import { existsSync } from "node:fs";
import { JOURS, ouvertureDe } from "../src/lib/calendrier.ts";
import type { Genere } from "../src/lib/types.ts";
import { CHEMIN_GENERE, cheminChiffre, lireConfig, lireEtat, lireJson } from "./lib/fichiers.ts";

const erreurs: string[] = [];
const config = lireConfig();
const etat = lireEtat();
const maintenant = new Date();

// 1. Aucune case publiée avant sa date (selon le mode en cours).
for (const jour of Object.keys(etat.cases).map(Number)) {
  const ouverture = ouvertureDe(config, jour);
  if (ouverture > maintenant) {
    erreurs.push(`La case ${jour} est publiée mais ne doit s'ouvrir que le ${ouverture.toISOString()}.`);
  }
}

// 2. Le site n'embarque que les cases publiées par le robot, et pas d'aperçu.
if (existsSync(CHEMIN_GENERE)) {
  const genere = lireJson<Genere>(CHEMIN_GENERE);
  if (genere.apercu) erreurs.push(`src/generated/cases.json est un aperçu (${genere.apercu}) : lance \`pnpm apercu stop\`.`);
  for (const c of genere.cases) {
    if (!etat.cases[String(c.jour)]) erreurs.push(`Le site embarque la case ${c.jour}, que le robot n'a pas ouverte.`);
  }
  if (genere.manquantes.length) erreurs.push(`Cases ouvertes illisibles : ${genere.manquantes.join(", ")}.`);
}

// 3. Les 24 cases existent (avertissement seulement : une case peut s'écrire plus tard).
const sansContenu = JOURS.filter((j) => !existsSync(cheminChiffre(j)));
if (sansContenu.length) console.warn(`⚠ Cases sans contenu chiffré : ${sansContenu.join(", ")}`);

if (erreurs.length) {
  console.error(`✗ Vérification échouée :\n  ${erreurs.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ Vérification réussie : ${Object.keys(etat.cases).length} case(s) publiée(s), aucune en avance.`);
