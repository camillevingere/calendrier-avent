/** Une case ouverte, telle qu'elle est servie au visiteur inscrit. */
export type CaseOuverte = {
  jour: number;
  titre: string;
  skill: string;
  auteur: string;
  categorie: string;
  accroche: string;
  installation: string;
  lien: string;
  /** Corps de la case, déjà converti en HTML au build. */
  html: string;
};

/** Le fichier fabriqué au build : src/generated/cases.json. */
export type Genere = {
  /** Date simulée (YYYY-MM-DD) quand le fichier vient de `pnpm apercu`, sinon null. */
  apercu: string | null;
  cases: CaseOuverte[];
  /** Cases ouvertes par le robot mais sans contenu lisible : à corriger. */
  manquantes: number[];
};
