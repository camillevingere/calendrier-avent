/**
 * Ce que la page montre pour chaque case, calculé côté serveur.
 *
 * L'ouverture d'une case ne dépend que de ce que le robot a publié (le fichier
 * fabriqué au build), jamais de l'horloge du visiteur. L'horloge du serveur ne
 * sert qu'aux libellés : « case du jour », « s'ouvre le 7 déc. à 07:00 ».
 */
import config from "../../calendrier.config.json" with { type: "json" };
import genereBrut from "../generated/cases.json" with { type: "json" };
import { estTermine, heureDeParis, JOURS, libelleOuverture, ouvertureDe, type Config } from "./calendrier";
import type { CaseOuverte, Genere } from "./types";

export const CONFIG = config as Config;
const genere = genereBrut as Genere;

export type EtatCase = "ouverte" | "jour" | "fermee";

export type CaseAffichee = {
  jour: number;
  etat: EtatCase;
  /** "7 déc. à 07:00" pour une case fermée. */
  ouverture: string;
  /** Présent seulement pour une case ouverte ET un visiteur inscrit. */
  contenu: CaseOuverte | null;
  manquante: boolean;
};

export type Grille = {
  cases: CaseAffichee[];
  ouvertes: number;
  termine: boolean;
  prochaine: string | null;
  apercu: string | null;
  mode: Config["mode"];
};

/** En local, un aperçu (`pnpm apercu 2026-12-12`) remplace l'horloge pour les libellés. */
const maintenant = (): Date => {
  if (genere.apercu && process.env.NODE_ENV !== "production") {
    const [a, m, j] = genere.apercu.split("-").map(Number);
    return heureDeParis(a, m, j, 12, 0);
  }
  return new Date();
};

export const construireGrille = (inscrit: boolean): Grille => {
  const ouvertes = new Map(genere.cases.map((c) => [c.jour, c]));
  const publiees = new Set([...ouvertes.keys(), ...genere.manquantes]);
  const termine = estTermine(CONFIG, maintenant());
  const derniere = Math.max(0, ...publiees);

  const cases = JOURS.map((jour): CaseAffichee => {
    const publiee = publiees.has(jour);
    return {
      jour,
      etat: !publiee ? "fermee" : jour === derniere && !termine ? "jour" : "ouverte",
      ouverture: libelleOuverture(ouvertureDe(CONFIG, jour)),
      contenu: inscrit ? (ouvertes.get(jour) ?? null) : null,
      manquante: genere.manquantes.includes(jour),
    };
  });

  const prochaine = cases.find((c) => c.etat === "fermee");
  return {
    cases,
    ouvertes: publiees.size,
    termine,
    prochaine: prochaine ? prochaine.ouverture : null,
    apercu: process.env.NODE_ENV !== "production" ? genere.apercu : null,
    mode: CONFIG.mode,
  };
};
