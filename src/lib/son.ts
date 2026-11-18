/**
 * Petits sons 8-bit synthétisés à la volée (Web Audio) : aucun fichier à charger.
 * Le son ne joue qu'après un geste du visiteur, comme l'exigent les navigateurs.
 */

let contexte: AudioContext | null = null;
let actif = true;

const CLE = "skill-quest-son";

export const sonActif = (): boolean => {
  try {
    actif = localStorage.getItem(CLE) !== "off";
  } catch {
    // Stockage indisponible : on garde la valeur en mémoire.
  }
  return actif;
};

export const reglerSon = (on: boolean) => {
  actif = on;
  try {
    localStorage.setItem(CLE, on ? "on" : "off");
  } catch {
    // Rien à faire : le réglage vaut pour cette visite.
  }
};

const ctx = (): AudioContext | null => {
  if (!actif || typeof window === "undefined") return null;
  contexte ??= new AudioContext();
  if (contexte.state === "suspended") void contexte.resume();
  return contexte;
};

const note = (c: AudioContext, frequence: number, debut: number, duree: number, volume = 0.06, forme: OscillatorType = "square") => {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = forme;
  osc.frequency.setValueAtTime(frequence, debut);
  gain.gain.setValueAtTime(volume, debut);
  gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
  osc.connect(gain).connect(c.destination);
  osc.start(debut);
  osc.stop(debut + duree);
};

/** Le « tic » quand le carrousel change de niveau. */
export const sonTic = () => {
  const c = ctx();
  if (!c) return;
  note(c, 880, c.currentTime, 0.05, 0.03);
};

/** Refus : niveau verrouillé. */
export const sonVerrou = () => {
  const c = ctx();
  if (!c) return;
  note(c, 196, c.currentTime, 0.12, 0.05);
  note(c, 147, c.currentTime + 0.1, 0.18, 0.05);
};

/** L'arpège « power-up » qui accompagne l'assemblage de l'objet. */
export const sonPowerUp = () => {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => note(c, f, t + i * 0.09, 0.14));
  note(c, 1568, t + 1.5, 0.35, 0.05, "triangle");
};
