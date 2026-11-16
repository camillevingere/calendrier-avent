/**
 * Chiffre contenu/source/case-XX.md (en clair, jamais envoyé sur GitHub)
 * vers contenu/chiffre/case-XX.json (envoyé sur GitHub, illisible sans clé).
 *
 * Une case inchangée garde son fichier chiffré tel quel, pour que l'historique
 * ne bouge que quand le contenu bouge.
 */
import { existsSync, readFileSync } from "node:fs";
import { JOURS } from "../src/lib/calendrier.ts";
import { chiffrer, cleDeLaCase, dechiffrer, lireCleMaitresse } from "../src/lib/coffre.ts";
import { cheminChiffre, cheminSource, ecrireJson, lireCase, lireChiffre } from "./lib/fichiers.ts";

const maitresse = lireCleMaitresse(process.env.CONTENU_CLE);
let modifiees = 0;
const absentes: number[] = [];
const invalides: string[] = [];

for (const jour of JOURS) {
  if (!existsSync(cheminSource(jour))) {
    absentes.push(jour);
    continue;
  }
  const texte = readFileSync(cheminSource(jour), "utf8");
  try {
    lireCase(texte);
  } catch (erreur) {
    invalides.push(`case ${jour} : ${(erreur as Error).message}`);
    continue;
  }

  const cle = cleDeLaCase(maitresse, jour);
  const existant = lireChiffre(jour);
  if (existant) {
    try {
      if (dechiffrer(cle, existant) === texte) continue;
    } catch {
      // Clé changée ou fichier abîmé : on rechiffre.
    }
  }
  ecrireJson(cheminChiffre(jour), chiffrer(cle, jour, texte));
  modifiees++;
}

console.log(`✓ ${modifiees} case(s) chiffrée(s), ${JOURS.length - absentes.length - invalides.length - modifiees} inchangée(s).`);
if (absentes.length) console.warn(`⚠ Sans contenu : cases ${absentes.join(", ")}`);
if (invalides.length) {
  console.error(`✗ À corriger :\n  ${invalides.join("\n  ")}`);
  process.exit(1);
}
