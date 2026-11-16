/**
 * Lecture et écriture des fichiers du calendrier, partagées par les scripts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Chiffre } from "../../src/lib/coffre.ts";
import type { Config, Mode } from "../../src/lib/calendrier.ts";

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CHEMIN_CONFIG = join(RACINE, "calendrier.config.json");
export const DOSSIER_SOURCE = join(RACINE, "contenu", "source");
export const DOSSIER_CHIFFRE = join(RACINE, "contenu", "chiffre");
export const CHEMIN_ETAT = join(RACINE, "etat", "ouvertes.json");
export const CHEMIN_GENERE = join(RACINE, "src", "generated", "cases.json");

export const nomDeCase = (jour: number) => `case-${String(jour).padStart(2, "0")}`;

export const lireJson = <T>(chemin: string): T => JSON.parse(readFileSync(chemin, "utf8")) as T;

export const ecrireJson = (chemin: string, valeur: unknown) => {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, `${JSON.stringify(valeur, null, 2)}\n`);
};

export const lireConfig = (): Config => {
  const config = lireJson<Config>(CHEMIN_CONFIG);
  if (config.mode !== "normal" && config.mode !== "accelere") {
    throw new Error(`calendrier.config.json : mode "${config.mode}" inconnu (normal ou accelere).`);
  }
  return config;
};

/**
 * Ce que le robot publie : le mode, et pour chaque case ouverte sa clé.
 * C'est le seul fichier que le robot modifie.
 */
export type Etat = {
  mode: Mode;
  cases: Record<string, string>;
};

export const lireEtat = (): Etat =>
  existsSync(CHEMIN_ETAT) ? lireJson<Etat>(CHEMIN_ETAT) : { mode: "normal", cases: {} };

export const cheminChiffre = (jour: number) => join(DOSSIER_CHIFFRE, `${nomDeCase(jour)}.json`);
export const cheminSource = (jour: number) => join(DOSSIER_SOURCE, `${nomDeCase(jour)}.md`);

export const lireChiffre = (jour: number): Chiffre | null =>
  existsSync(cheminChiffre(jour)) ? lireJson<Chiffre>(cheminChiffre(jour)) : null;

/** Les champs attendus en tête de chaque case (entre deux lignes ---). */
export const CHAMPS = ["titre", "skill", "auteur", "categorie", "accroche", "installation", "lien"] as const;
export type EnTete = Record<(typeof CHAMPS)[number], string>;

export const lireCase = (texte: string): { enTete: EnTete; corps: string } => {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(texte.replace(/\r\n/g, "\n"));
  if (!m) throw new Error("en-tête --- manquant");
  const enTete: Record<string, string> = {};
  for (const ligne of m[1].split("\n")) {
    const i = ligne.indexOf(":");
    if (i > 0) enTete[ligne.slice(0, i).trim()] = ligne.slice(i + 1).trim();
  }
  const manquants = CHAMPS.filter((c) => !enTete[c]);
  if (manquants.length) throw new Error(`champs manquants : ${manquants.join(", ")}`);
  if (!m[2].trim()) throw new Error("contenu vide");
  return { enTete: enTete as EnTete, corps: m[2].trim() };
};
