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

// 1. L'état du robot en avance sur la config (la config vient de changer) :
//    simple avertissement, le site ne les embarque pas (contrôle 2) et le
//    robot, lancé par le push de la config, les referme.
const enAvance = Object.keys(etat.cases)
  .map(Number)
  .filter((jour) => ouvertureDe(config, jour) > maintenant);
if (enAvance.length) console.warn(`⚠ Cases ${enAvance.join(", ")} publiées par le robot mais pas encore dues avec la config actuelle : non embarquées.`);

// 2. Le site n'embarque que les cases publiées par le robot, et pas d'aperçu.
if (existsSync(CHEMIN_GENERE)) {
  const genere = lireJson<Genere>(CHEMIN_GENERE);
  if (genere.apercu) erreurs.push(`src/generated/cases.json est un aperçu (${genere.apercu}) : lance \`pnpm apercu stop\`.`);
  for (const c of genere.cases) {
    if (!etat.cases[String(c.jour)]) erreurs.push(`Le site embarque la case ${c.jour}, que le robot n'a pas ouverte.`);
    const ouverture = ouvertureDe(config, c.jour);
    if (ouverture > maintenant) erreurs.push(`Le site embarque la case ${c.jour}, qui ne doit s'ouvrir que le ${ouverture.toISOString()}.`);
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
const embarquees = existsSync(CHEMIN_GENERE) ? lireJson<Genere>(CHEMIN_GENERE).cases.length : 0;
console.log(`✓ Vérification réussie : ${embarquees} case(s) dans le site, aucune en avance.`);
