"use client";

/**
 * Le niveau bonus : la récompense de ceux qui trouvent les 6 secrets du décor.
 * Il n'est pas chiffré comme les cases : c'est un cadeau pour les curieux,
 * et ceux qui fouillent le code jusqu'ici l'ont bien mérité.
 */
import { useState } from "react";
import { Fenetre } from "./fenetre";

const INSTALLATION = "npx skills add anthropics/knowledge-work-plugins --skill crm-autopilot";

export const NiveauBonus = ({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) => {
  const [copie, setCopie] = useState(false);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(INSTALLATION);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {}
  };

  return (
    <Fenetre ouverte={ouvert} onFermer={onFermer} titre="Niveau bonus">
      <article className="flex flex-col gap-4">
        <header className="flex flex-col gap-3">
          <p className="font-pixel text-[0.6rem] text-sapin">★ 6/6 SECRETS · NIVEAU BONUS DEBLOQUE ★</p>
          <h2 className="font-pixel text-lg leading-relaxed text-orange sm:text-xl">L&apos;écuyer infatigable</h2>
          <p className="text-2xl text-creme">Ton CRM se met à jour tout seul. Tu n&apos;ouvres plus jamais HubSpot pour faire de la saisie.</p>
          <p className="text-lg text-gris-clair">
            Skill <span className="text-orange-clair">crm-autopilot</span> · par Anthropic (Small Business)
          </p>
        </header>

        <div className="pixel flex flex-col gap-2 bg-nuit p-3 [--bord:var(--color-gris)]">
          <p className="font-pixel text-[0.55rem] text-gris-clair">INSTALLER (CLAUDE CODE, CODEX, CURSOR…)</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xl text-sapin">$ {INSTALLATION}</code>
            <button type="button" onClick={copier} className="bouton-pixel shrink-0 px-3 py-2 text-[0.55rem]">
              {copie ? "COPIE ✓" : "COPIER"}
            </button>
          </div>
        </div>

        <div className="contenu-case text-xl">
          <p>
            Bravo, joueur. Ce niveau n&apos;est pas dans les 24 cases : seuls ceux qui ont trouvé les 6 secrets le
            voient.
          </p>

          <h2>Ce que ça change pour toi</h2>
          <p>
            Le CRM, tout le monde sait qu&apos;il faut le tenir à jour. Personne ne le fait. Résultat : des prospects
            oubliés et des relances qui ne partent jamais. Ce skill fait la saisie à ta place :
          </p>
          <ul>
            <li>il crée et met à jour contacts et affaires à partir de tes <strong>emails, rendez-vous et appels</strong> ;</li>
            <li>il note chaque échange dans la bonne fiche, sans que tu touches au clavier ;</li>
            <li>il repère les <strong>affaires qui refroidissent</strong> et te prépare la relance ;</li>
            <li>il tient une liste des prochaines actions, pour que rien ne reste sans responsable ;</li>
            <li>il fait le ménage : doublons, fiches mortes, infos périmées.</li>
          </ul>
          <p>
            Pas de CRM ? Il t&apos;en monte un <strong>dans un simple tableur</strong>. Tu démarres aujourd&apos;hui.
          </p>

          <h2>Essaie ce prompt</h2>
          <blockquote>
            <p>
              Regarde mes emails et mon agenda de la semaine, mets mon CRM à jour, et dis-moi quelles affaires n&apos;ont
              pas bougé depuis 10 jours. Prépare une relance pour chacune.
            </p>
          </blockquote>

          <h2>L&apos;astuce Fyliz</h2>
          <p>
            Programme-le chaque vendredi en fin de journée. Le lundi, ton pipeline est propre et tes relances
            t&apos;attendent. C&apos;est exactement le genre de routine qu&apos;on branche chez nos clients pour
            qu&apos;elle tourne sans eux.
          </p>
        </div>

        <footer className="mt-2 flex flex-col gap-3 border-t-4 border-dashed border-gris pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg text-gris-clair">Partage pas la soluce 🤫</p>
          <a href="https://fyliz.com" target="_blank" rel="noreferrer" className="bouton-pixel px-4 py-3 text-center text-[0.55rem]">
            AUTOMATISER MA PME AVEC FYLIZ
          </a>
        </footer>
      </article>
    </Fenetre>
  );
};
