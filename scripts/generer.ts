/**
 * Fabrique src/generated/cases.json à partir de etat/ouvertes.json.
 *
 * Seules les cases dont le robot a publié la clé sont déchiffrées : les autres
 * n'existent pas dans ce que le site embarque. Lancé avant chaque build.
 *
 *   node scripts/generer.ts          → ne remplace pas un aperçu en cours
 *   node scripts/generer.ts --force  → toujours (utilisé par le build)
 */
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { marked } from "marked";
import { dechiffrer } from "../src/lib/coffre.ts";
import type { CaseOuverte, Genere } from "../src/lib/types.ts";
import { CHEMIN_GENERE, ecrireJson, lireCase, lireChiffre, lireEtat, lireJson } from "./lib/fichiers.ts";

export const fabriquer = (cles: Record<string, string>, apercu: string | null): Genere => {
  const cases: CaseOuverte[] = [];
  const manquantes: number[] = [];

  for (const [jourTexte, cle] of Object.entries(cles)) {
    const jour = Number(jourTexte);
    const chiffre = lireChiffre(jour);
    try {
      if (!chiffre) throw new Error("fichier chiffré absent");
      const { enTete, corps } = lireCase(dechiffrer(Buffer.from(cle, "base64"), chiffre));
      cases.push({ jour, ...enTete, html: marked.parse(corps, { async: false }) });
    } catch (erreur) {
      console.error(`✗ case ${jour} : ${(erreur as Error).message}`);
      manquantes.push(jour);
    }
  }

  cases.sort((a, b) => a.jour - b.jour);
  return { apercu, cases, manquantes };
};

const principal = () => {
  const force = process.argv.includes("--force") || process.env.VERCEL === "1" || process.env.CI === "true";
  if (!force && existsSync(CHEMIN_GENERE) && lireJson<Genere>(CHEMIN_GENERE).apercu) {
    console.log("Aperçu en cours : src/generated/cases.json conservé (`pnpm apercu stop` pour revenir au réel).");
    return;
  }
  const genere = fabriquer(lireEtat().cases, null);
  ecrireJson(CHEMIN_GENERE, genere);
  console.log(`✓ ${genere.cases.length} case(s) ouverte(s) embarquée(s) dans le site.`);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) principal();
