import { cookies } from "next/headers";
import { Calendrier } from "@/components/calendrier";
import { Decor } from "@/components/decor";
import { COOKIE_ACCES, lireTicket } from "@/lib/acces";
import { construireGrille } from "@/lib/grille";

// La page dépend du cookie du visiteur : elle est rendue à chaque requête.
export const dynamic = "force-dynamic";

export default async function Accueil() {
  const email = lireTicket((await cookies()).get(COOKIE_ACCES)?.value);
  const grille = construireGrille(email !== null);

  return (
    <>
      <Decor />
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex flex-col items-center gap-4 text-center">
          <a
            href="https://fyliz.com"
            className="font-pixel text-[0.6rem] tracking-[0.3em] text-gris-clair hover:text-orange sm:text-xs"
          >
            FYLIZ PRESENTE
          </a>
          <h1 className="texte-neon font-pixel text-3xl leading-tight text-orange sm:text-5xl md:text-6xl">
            SKILL
            <br className="sm:hidden" /> QUEST
          </h1>
          <p className="font-pixel text-[0.6rem] leading-relaxed text-creme sm:text-xs">
            LE CALENDRIER DE L&apos;AVENT IA · EDITION {new Date().getFullYear()}
          </p>
          <p className="max-w-2xl text-xl text-gris-clair sm:text-2xl">
            24 skills IA testés et expliqués pour faire gagner du temps à ta PME. Un niveau se débloque
            chaque jour de décembre, à minuit pile.
          </p>
        </header>

        <Calendrier grille={grille} email={email} />

        <footer className="flex flex-col items-center gap-2 pb-28 text-center text-lg text-gris-clair">
          <p>
            Les cases fermées ne sont pas dans cette page : elles sont chiffrées, et c&apos;est un robot qui
            publie la clé du jour. Inutile de fouiller le code source 😉
          </p>
          <p>
            Un cadeau de{" "}
            <a href="https://fyliz.com" className="text-orange underline underline-offset-4">
              Fyliz
            </a>
            , ton équipe IA externalisée.
          </p>
          <p className="text-base">Psst… 6 secrets se cachent sur cette page. Les curieux qui fouillent le code ont un indice 😉</p>
        </footer>
      </main>
    </>
  );
}
