/**
 * Le « ticket » d'un visiteur inscrit : un cookie signé, gardé 400 jours.
 *
 * Il contient l'email et une signature HMAC (GATE_SECRET) : impossible de le
 * fabriquer à la main dans les outils du navigateur. Le contenu des cases
 * ouvertes n'est envoyé qu'aux visiteurs qui ont ce ticket.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_ACCES = "skillquest_acces";
export const DUREE_ACCES_SECONDES = 400 * 24 * 60 * 60;

const secret = (): string => {
  const valeur = process.env.GATE_SECRET;
  if (valeur) return valeur;
  if (process.env.NODE_ENV === "production") throw new Error("GATE_SECRET manquant.");
  return "secret-de-developpement";
};

const signature = (charge: string) => createHmac("sha256", secret()).update(charge).digest("base64url");

export const creerTicket = (email: string): string => {
  const charge = Buffer.from(email, "utf8").toString("base64url");
  return `${charge}.${signature(charge)}`;
};

/** L'email du visiteur si son ticket est valide, sinon null. */
export const lireTicket = (ticket: string | undefined): string | null => {
  if (!ticket) return null;
  const [charge, signe] = ticket.split(".");
  if (!charge || !signe) return null;
  const attendu = Buffer.from(signature(charge));
  const recu = Buffer.from(signe);
  if (attendu.length !== recu.length || !timingSafeEqual(attendu, recu)) return null;
  return Buffer.from(charge, "base64url").toString("utf8");
};
