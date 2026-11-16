/**
 * La règle du calendrier, sans effet de bord : quelles cases sont dues à un
 * instant donné, et quand chacune s'ouvre.
 *
 * Partagée par le robot (scripts/robot.ts) et par le site, pour que la page
 * affiche exactement l'heure que le robot respecte. Elle ne lit ni l'horloge
 * ni le disque : l'instant et la configuration lui sont passés.
 */

export const NOMBRE_DE_CASES = 24;
export const FUSEAU = "Europe/Paris";

export type Mode = "normal" | "accelere";

export type Config = {
  annee: number;
  /** Heure d'ouverture d'une case, à l'heure de Paris, "HH:MM". */
  heureOuverture: string;
  mode: Mode;
  accelere: {
    /** Instant de départ du mode soirée, ISO 8601 avec fuseau. */
    depart: string;
    intervalleMinutes: number;
  };
};

export const JOURS = Array.from({ length: NOMBRE_DE_CASES }, (_, i) => i + 1);

/** Décalage (ms) entre l'heure de Paris et UTC à un instant donné. */
const decalageParis = (instant: number): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSEAU,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const v = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const commeUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  return commeUtc - Math.floor(instant / 1000) * 1000;
};

/** L'instant UTC qui correspond à une heure murale de Paris. */
export const heureDeParis = (annee: number, mois: number, jour: number, heure: number, minute: number): Date => {
  const naif = Date.UTC(annee, mois - 1, jour, heure, minute);
  const premier = naif - decalageParis(naif);
  // Second passage : corrige le cas où le décalage change entre les deux instants.
  return new Date(naif - decalageParis(premier));
};

const lireHeure = (hhmm: string): [number, number] => {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`heureOuverture invalide : "${hhmm}" (attendu HH:MM)`);
  return [Number(m[1]), Number(m[2])];
};

/** Quand la case `jour` s'ouvre, selon le mode en cours. */
export const ouvertureDe = (config: Config, jour: number): Date => {
  if (config.mode === "accelere") {
    const depart = Date.parse(config.accelere.depart);
    if (Number.isNaN(depart)) throw new Error(`accelere.depart invalide : "${config.accelere.depart}"`);
    return new Date(depart + (jour - 1) * config.accelere.intervalleMinutes * 60_000);
  }
  const [h, min] = lireHeure(config.heureOuverture);
  return heureDeParis(config.annee, 12, jour, h, min);
};

/**
 * Les cases dues à l'instant `maintenant`, dans l'ordre.
 *
 * Un calcul, pas un compteur : un passage sauté ou un robot lancé deux fois
 * donnent toujours le même résultat pour le même instant.
 */
export const casesDues = (config: Config, maintenant: Date): number[] =>
  JOURS.filter((jour) => ouvertureDe(config, jour).getTime() <= maintenant.getTime());

/** Le calendrier est fini quand le 25 décembre est arrivé (rythme normal). */
export const estTermine = (config: Config, maintenant: Date): boolean =>
  config.mode === "normal" && maintenant.getTime() >= heureDeParis(config.annee, 12, 25, 0, 0).getTime();

const formatJour = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, day: "numeric", month: "short" });
const formatHeure = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" });

/** "7 déc. à 07:00" — l'heure d'ouverture affichée au visiteur. */
export const libelleOuverture = (date: Date): string => `${formatJour.format(date)} à ${formatHeure.format(date)}`;
