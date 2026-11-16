/** Affiche une nouvelle clé maîtresse, à copier dans .env.local et dans les secrets GitHub. */
import { randomBytes } from "node:crypto";

console.log(`CONTENU_CLE=${randomBytes(32).toString("base64")}`);
console.log("\nCopie cette ligne dans .env.local, puis dans GitHub : Settings → Secrets and variables → Actions → New repository secret.");
console.log("Ne la mets jamais dans un fichier suivi par Git, ni sur Vercel : le site n'en a pas besoin.");
