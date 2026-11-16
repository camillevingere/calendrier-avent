/**
 * Le coffre : chiffrement des 24 cases.
 *
 * Une seule clé maîtresse (CONTENU_CLE) vit dans ton .env.local et dans les
 * secrets GitHub, nulle part ailleurs. De cette clé, on dérive une clé par case
 * (HKDF). Le dépôt public ne contient que le contenu chiffré ; le robot publie,
 * case par case, la clé dérivée des seules cases ouvertes. Connaître la clé de
 * la case 3 ne dit rien de celle de la case 24.
 *
 * Chiffrement : AES-256-GCM, avec le numéro de la case en donnée authentifiée,
 * pour qu'on ne puisse pas échanger deux fichiers chiffrés entre eux.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

export type Chiffre = {
  v: 1;
  jour: number;
  iv: string;
  tag: string;
  data: string;
};

const SEL = "fyliz-calendrier-avent";
const etiquette = (jour: number) => Buffer.from(`case-${String(jour).padStart(2, "0")}`);

export const lireCleMaitresse = (valeur: string | undefined): Buffer => {
  if (!valeur) {
    throw new Error("CONTENU_CLE manquante. Génère-la avec `pnpm cle` et mets-la dans .env.local (et dans les secrets GitHub).");
  }
  const cle = Buffer.from(valeur, "base64");
  if (cle.length !== 32) throw new Error("CONTENU_CLE doit faire 32 octets encodés en base64 (`pnpm cle`).");
  return cle;
};

/** La clé propre à une case, dérivée de la clé maîtresse. */
export const cleDeLaCase = (maitresse: Buffer, jour: number): Buffer =>
  Buffer.from(hkdfSync("sha256", maitresse, SEL, etiquette(jour), 32));

export const chiffrer = (cle: Buffer, jour: number, texte: string): Chiffre => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cle, iv);
  cipher.setAAD(etiquette(jour));
  const data = Buffer.concat([cipher.update(texte, "utf8"), cipher.final()]);
  return {
    v: 1,
    jour,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
};

/** Lève une erreur si la clé ne correspond pas ou si le fichier a été modifié. */
export const dechiffrer = (cle: Buffer, chiffre: Chiffre): string => {
  const decipher = createDecipheriv("aes-256-gcm", cle, Buffer.from(chiffre.iv, "base64"));
  decipher.setAAD(etiquette(chiffre.jour));
  decipher.setAuthTag(Buffer.from(chiffre.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(chiffre.data, "base64")), decipher.final()]).toString("utf8");
};
