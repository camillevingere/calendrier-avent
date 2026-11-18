/**
 * Les sprites du décor, en pixel art (une ligne = une rangée, « . » est vide).
 * Le décor 2D les dessine en SVG, le monde 3D les extrude en voxels.
 */

export const LUNE = [
  "....mmmm....",
  "..mmmmmmmm..",
  ".mmmmmmcmmm.",
  ".mmcmmmmmmm.",
  "mmcccmmmmmmm",
  "mmmcmmmmmcmm",
  "mmmmmmmmcccm",
  "mmmmmmmmmcmm",
  ".mmmmcmmmmm.",
  ".mmmmmmmmmm.",
  "..mmmmmmmm..",
  "....mmmm....",
];

export const TRAINEAU = [
  "..........................a.a.",
  "...........................aa.",
  "........w.................bbbr",
  ".......rrr.......gggggggggbbb.",
  "......rrrrr.....g....bbbbbbb..",
  "..sssssssssss..g.....bbbbbbb..",
  "...sssssssssggg......b.b.b.b..",
  "....sssssssss.................",
  "..yyyyyyyyyyyy................",
];

export const SAPIN = [
  ".....y.....",
  "....yyy....",
  ".....v.....",
  "....vvv....",
  "...vvovv...",
  "....vvv....",
  "...vvvvv...",
  "..vvovvov..",
  "...vvvvv...",
  "..vvvvvvv..",
  ".vvovvvvov.",
  "..vvvvvvv..",
  ".vvvvvvvvv.",
  "vvovvvovvvv",
  ".....t.....",
  "....ttt....",
];

export const MAISON = [
  "..cc..........",
  "..cc.wwww.....",
  "..wwwwwwwww...",
  ".wwwwwwwwwwww.",
  "wwwwwwwwwwwwww",
  ".hhhhhhhhhhhh.",
  ".hhllhhhhhddh.",
  ".hhllhhhhhddh.",
  ".hhhhhhhhhddh.",
  ".hhhhhhhhhddh.",
];

export const PALETTE_TRAINEAU = {
  a: "#8b5a2b",
  b: "#a0522d",
  r: "#e3342f",
  w: "#fff4e8",
  s: "#c81e1e",
  g: "#ffcc33",
  y: "#ffcc33",
};

export const paletteLune = (fyliz: boolean) =>
  fyliz ? { m: "#ff781a", c: "#b8500a" } : { m: "#fff4e8", c: "#d9cbb8" };

export const paletteSapin = (allume: boolean) => ({
  v: "#1f6b3a",
  t: "#6b3a2a",
  y: allume ? "#ffcc33" : "#55555c",
  o: allume ? "#ff781a" : "#174f2b",
});

export const paletteMaison = (lumiere: boolean) => ({
  c: "#6b3a2a",
  w: "#fff4e8",
  h: "#3a2a22",
  d: "#8b5a2b",
  l: lumiere ? "#ffcc33" : "#1c1c1f",
});
