/**
 * Les objets en voxels du sélecteur 3D, dessinés en pixel art puis extrudés.
 *
 * Chaque modèle est une grille de caractères (une ligne = une rangée, du haut
 * vers le bas) ; chaque caractère renvoie à une couleur de PALETTE, « . » est vide.
 * Pas de fichier 3D à charger : tout est généré ici.
 */

const PALETTE: Record<string, string> = {
  o: "#ff781a", // orange Fyliz
  O: "#ffb27a", // orange clair
  s: "#b8500a", // orange sombre
  c: "#fff4e8", // crème
  v: "#3ddc84", // sapin
  V: "#1f8a50", // sapin sombre
  r: "#ff3b3b", // rouge
  j: "#ffd23f", // jaune
  b: "#4cc9f0", // bleu
  B: "#2a6f97", // bleu sombre
  g: "#8a8a93", // gris
  m: "#6b3e1f", // marron
};

const DESSINS: { nom: string; profondeur: number; lignes: string[] }[] = [
  {
    nom: "cadeau",
    profondeur: 9,
    lignes: [
      "...j...j...",
      "....j.j....",
      ".....j.....",
      "rrrrrjrrrrr",
      "rrrrrjrrrrr",
      "jjjjjjjjjjj",
      "rrrrrjrrrrr",
      "rrrrrjrrrrr",
      "rrrrrjrrrrr",
      "rrrrrjrrrrr",
    ],
  },
  {
    nom: "eclair",
    profondeur: 2,
    lignes: [
      ".....jjjj",
      "....jjjj.",
      "...jjjj..",
      "..jjjj...",
      ".jjjjjjjj",
      "jjjjjjjj.",
      "....jjj..",
      "...jjj...",
      "..jjj....",
      ".jj......",
    ],
  },
  {
    nom: "coeur",
    profondeur: 3,
    lignes: [
      ".rrr...rrr.",
      "rrcrr.rrrrr",
      "rcrrrrrrrrr",
      "rrrrrrrrrrr",
      "rrrrrrrrrrr",
      ".rrrrrrrrr.",
      "..rrrrrrr..",
      "...rrrrr...",
      "....rrr....",
      ".....r.....",
    ],
  },
  {
    nom: "fusee",
    profondeur: 3,
    lignes: [
      "....c....",
      "...ccc...",
      "...ccc...",
      "..ccbcc..",
      "..cbBbc..",
      "..ccbcc..",
      "..ccccc..",
      ".occccco.",
      "oo.ccc.oo",
      "o..jOj..o",
      "....j....",
    ],
  },
  {
    nom: "sapin",
    profondeur: 5,
    lignes: [
      ".....j.....",
      "....vvv....",
      "...vvrvv...",
      "....vvv....",
      "..vvvvvvv..",
      ".vvjvvvbvv.",
      "...vvvvv...",
      ".vvvvvvvvv.",
      "vvbvvvvvrvv",
      "....mmm....",
      "....mmm....",
    ],
  },
  {
    nom: "cle",
    profondeur: 2,
    lignes: [
      "..jjjjj..",
      ".jj...jj.",
      ".j.....j.",
      ".jj...jj.",
      "..jjjjj..",
      "....j....",
      "....j....",
      "....jjj..",
      "....j....",
      "....jj...",
    ],
  },
  {
    nom: "etoile",
    profondeur: 3,
    lignes: [
      ".....o.....",
      "....ooo....",
      "....oOo....",
      "ooooOOOoooo",
      ".ooOOcOOoo.",
      "..ooOOOoo..",
      "...ooooo...",
      "..ooo.ooo..",
      ".oo.....oo.",
      "oo.......oo",
    ],
  },
  {
    nom: "manette",
    profondeur: 3,
    lignes: [
      ".ggggggggggg.",
      "ggggggggggggg",
      "ggcgggggggrgg",
      "gcccgggggjgbg",
      "ggcgggggggvgg",
      "ggggg...ggggg",
      ".ggg.....ggg.",
    ],
  },
];

export type Voxel = { x: number; y: number; z: number; couleur: string; car: string };
export type Modele = { nom: string; voxels: Voxel[]; hauteur: number; largeur: number };

/** Extrude un dessin en pixel art : chaque pixel devient une colonne de `profondeur` cubes, centrée sur l'origine. */
export const extruder = (lignes: readonly string[], palette: Record<string, string>, profondeur: number, nom = ""): Modele => {
  const hauteur = lignes.length;
  const largeur = Math.max(...lignes.map((l) => l.length));
  const voxels: Voxel[] = [];
  lignes.forEach((ligne, rangee) => {
    [...ligne].forEach((car, colonne) => {
      const couleur = palette[car];
      if (!couleur) return;
      for (let z = 0; z < profondeur; z++) {
        voxels.push({
          x: colonne - (largeur - 1) / 2,
          y: hauteur - 1 - rangee - (hauteur - 1) / 2,
          z: z - (profondeur - 1) / 2,
          couleur,
          car,
        });
      }
    });
  });
  return { nom, voxels, hauteur, largeur };
};

const MODELES = DESSINS.map((d) => extruder(d.lignes, PALETTE, d.profondeur, d.nom));

/** Le modèle d'un jour : on fait tourner la collection sur les 24 jours. */
export const modeleDuJour = (jour: number): Modele => MODELES[(jour - 1) % MODELES.length];

/** Police pixel 3×5 pour les numéros des arches et l'enseigne finale. */
const POLICE: Record<string, string[]> = {
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["###", "..#", "###", "#..", "###"],
  "3": ["###", "..#", ".##", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "###", "..#", "###"],
  "6": ["###", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  L: ["#..", "#..", "#..", "#..", "###"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  Z: ["###", "..#", ".#.", "#..", "###"],
};

/** Les pixels allumés d'un texte, centrés : x vers la droite, y vers le haut. */
export const pixelsDuTexte = (texte: string): { x: number; y: number }[] => {
  const lettres = [...texte].map((c) => POLICE[c] ?? POLICE["0"]);
  const largeur = lettres.length * 4 - 1;
  const pixels: { x: number; y: number }[] = [];
  lettres.forEach((motif, i) =>
    motif.forEach((ligne, rangee) =>
      [...ligne].forEach((c, col) => {
        if (c === "#") pixels.push({ x: i * 4 + col - (largeur - 1) / 2, y: 2 - rangee });
      }),
    ),
  );
  return pixels;
};
