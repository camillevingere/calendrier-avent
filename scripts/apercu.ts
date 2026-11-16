/**
 * Voir le calendrier tel qu'il sera à une date donnée, sur ton ordinateur.
 *
 *   pnpm apercu 2026-12-12   → le site local se comporte comme le 12 décembre à midi
 *   pnpm apercu stop         → retour à l'état réel publié par le robot
 *
 * Ne touche ni à etat/ouvertes.json ni à Git : seul src/generated/cases.json
 * (ignoré par Git) change. Le build de production refuse un aperçu.
 */
import { heureDeParis } from "../src/lib/calendrier.ts";
import { lireCleMaitresse } from "../src/lib/coffre.ts";
import { fabriquer } from "./generer.ts";
import { CHEMIN_GENERE, ecrireJson, lireConfig, lireEtat } from "./lib/fichiers.ts";
import { calculerEtat } from "./robot.ts";

const argument = process.argv[2];

if (!argument || argument === "stop") {
  ecrireJson(CHEMIN_GENERE, fabriquer(lireEtat().cases, null));
  console.log("✓ Aperçu arrêté : le site local montre l'état réel.");
} else {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(argument);
  if (!m) throw new Error("Usage : pnpm apercu 2026-12-12  (ou pnpm apercu stop)");
  const maintenant = heureDeParis(Number(m[1]), Number(m[2]), Number(m[3]), 12, 0);
  const config = { ...lireConfig(), mode: "normal" as const };
  const etat = calculerEtat(config, maintenant, lireCleMaitresse(process.env.CONTENU_CLE));
  const genere = fabriquer(etat.cases, argument);
  ecrireJson(CHEMIN_GENERE, genere);
  console.log(`✓ Aperçu au ${argument} : ${genere.cases.length} case(s) ouverte(s). Lance \`pnpm dev\` et ouvre http://localhost:3000`);
}
