/**
 * L'état du voyage partagé entre la page (qui défile) et la scène 3D (qui
 * dessine 60 fois par seconde). Un simple objet mutable : écrire dedans ne
 * provoque aucun rendu React.
 */
export const voyage = {
  /** Où le scroll demande d'aller. */
  cible: -2,
  /** Où la caméra se trouve, amortie vers la cible à chaque image. */
  actuel: -2,
};
