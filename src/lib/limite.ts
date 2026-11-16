/**
 * Limite d'inscriptions par adresse IP, en mémoire.
 *
 * Un visiteur s'inscrit une fois : quelques essais par fenêtre suffisent
 * largement. Sur Vercel, chaque instance a sa propre mémoire, donc la limite
 * freine un script mais ne remplace pas une règle du pare-feu Vercel.
 */
const ESSAIS_MAX = 5;
const FENETRE_MS = 10 * 60 * 1000;
const IPS_MAX = 10_000;

const essais = new Map<string, number[]>();

/** L'IP du visiteur, telle que la transmet l'hébergeur. */
export const ipDe = (requete: Request): string =>
  requete.headers.get("x-real-ip") ?? requete.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";

/** true si cette IP peut encore tenter une inscription, et compte l'essai. */
export const autoriser = (ip: string, maintenant = Date.now()): boolean => {
  const recents = (essais.get(ip) ?? []).filter((t) => maintenant - t < FENETRE_MS);
  if (recents.length >= ESSAIS_MAX) {
    essais.set(ip, recents);
    return false;
  }
  recents.push(maintenant);
  essais.set(ip, recents);

  // Évite que la mémoire grossisse sans fin : on oublie les IP les plus anciennes.
  if (essais.size > IPS_MAX) {
    for (const cle of essais.keys()) {
      essais.delete(cle);
      if (essais.size <= IPS_MAX / 2) break;
    }
  }
  return true;
};
