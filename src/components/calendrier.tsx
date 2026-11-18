"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { CaseAffichee, Grille } from "@/lib/grille";
import { reglerSon, sonActif, sonPowerUp, sonVerrou } from "@/lib/son";
import { Fenetre } from "./fenetre";
import { useSecrets } from "./secrets";
import { VoyageNiveaux } from "./voyage-niveaux";

type Props = { grille: Grille; email: string | null };

const CLE_VUS = "skill-quest-vus";

/** La 3D est réservée aux appareils qui la supportent et aux visiteurs qui acceptent les animations. */
const peut3D = (): boolean => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

const indexDeDepart = (grille: Grille): number => {
  const duJour = grille.cases.findIndex((c) => c.etat === "jour");
  if (duJour >= 0) return duJour;
  const ouvertes = grille.cases.filter((c) => c.etat !== "fermee");
  return ouvertes.length ? ouvertes[ouvertes.length - 1].jour - 1 : 0;
};

export const Calendrier = ({ grille, email }: Props) => {
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [porteOuverte, setPorteOuverte] = useState(false);
  const [aOuvrirApresInscription, setAOuvrirApresInscription] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [vue, setVue] = useState<"3d" | "grille" | null>(null);
  const [vus, setVus] = useState<Set<number>>(new Set());
  const [assemblage, setAssemblage] = useState<{ jour: number; cle: number } | null>(null);
  const [son, setSon] = useState(true);
  const secrets = useSecrets();
  const { setImmersif } = secrets;

  // En passant d'une vue à l'autre, on repart du haut : l'écran titre ouvre le voyage.
  const vuePrecedente = useRef(vue);
  useEffect(() => {
    setImmersif(vue === "3d");
    if (vuePrecedente.current !== vue) window.scrollTo({ top: 0 });
    vuePrecedente.current = vue;
  }, [vue, setImmersif]);

  useEffect(() => {
    setVue(peut3D() ? "3d" : "grille");
    setSon(sonActif());
    try {
      setVus(new Set(JSON.parse(localStorage.getItem(CLE_VUS) ?? "[]") as number[]));
    } catch {
      // Pas de stockage : chaque visite redéballe les objets, ce n'est pas grave.
    }
  }, []);

  /** Déballer un niveau : l'objet s'assemble, puis la fiche du skill s'ouvre. */
  const deballer = useCallback(
    (jour: number) => {
      if (vue !== "3d" || vus.has(jour)) {
        setOuverte(jour);
        return;
      }
      setOuverte(null);
      setAssemblage({ jour, cle: Date.now() });
      sonPowerUp();
    },
    [vue, vus],
  );

  const finAssemblage = useCallback((jour: number) => {
    setVus((avant) => {
      const apres = new Set(avant).add(jour);
      try {
        localStorage.setItem(CLE_VUS, JSON.stringify([...apres]));
      } catch {
        // Idem : la mémoire ne vaut que pour cette visite.
      }
      return apres;
    });
    setOuverte(jour);
  }, []);

  // Après l'inscription, la page est rechargée côté serveur avec le contenu : on ouvre la case demandée.
  useEffect(() => {
    if (email && aOuvrirApresInscription) {
      deballer(aOuvrirApresInscription);
      setAOuvrirApresInscription(null);
    }
  }, [email, aOuvrirApresInscription, deballer]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const choisir = (c: CaseAffichee) => {
    if (c.etat === "fermee") {
      setMessage(`🔒 Niveau ${c.jour} verrouillé. Il se débloque le ${c.ouverture}.`);
      sonVerrou();
      return;
    }
    if (!email) {
      setAOuvrirApresInscription(c.jour);
      setPorteOuverte(true);
      return;
    }
    deballer(c.jour);
  };

  const caseOuverte = grille.cases.find((c) => c.jour === ouverte) ?? null;

  const commandes = (
    <>
      <button type="button" className="hover:text-orange" onClick={() => setVue(vue === "3d" ? "grille" : "3d")}>
        {vue === "3d" ? "▦ VUE GRILLE" : "◆ MONDE 3D"}
      </button>
      <button
        type="button"
        className="hover:text-orange"
        aria-pressed={son}
        onClick={() => {
          reglerSon(!son);
          setSon(!son);
        }}
      >
        {son ? "♪ SON : ON" : "♪ SON : OFF"}
      </button>
    </>
  );

  return (
    <section className="flex flex-col gap-6" aria-label="Calendrier">
      <Hud grille={grille} email={email} fixe={vue === "3d"} />

      {grille.apercu && (
        <Bandeau ton="info">
          APERCU LOCAL AU {grille.apercu} — `pnpm apercu stop` pour revenir à l&apos;état réel.
        </Bandeau>
      )}
      {grille.termine && (
        <Bandeau ton="succes">
          ★ GAME COMPLETE ★ Les 24 niveaux restent ouverts : relis-les quand tu veux. Rendez-vous l&apos;an prochain !
        </Bandeau>
      )}
      {grille.ouvertes === 0 && grille.prochaine && (
        <Bandeau ton="info">
          <span className="clignote">▶</span> PRESS START — premier niveau le {grille.prochaine}. Inscris-toi pour
          être prêt·e.
        </Bandeau>
      )}

      {!email && (
        <div
          id="porte-email"
          className={vue === "3d" ? "interactif ombre-pixel mx-auto my-[20svh] w-full max-w-3xl scroll-mt-28" : "ombre-pixel"}
        >
          <div className="pixel bg-ardoise/90 p-5 backdrop-blur-sm sm:p-8">
            <PorteEmail
              titre="INSERT COIN"
              texte="Entre ton email pour jouer : les 24 niveaux se débloquent ici, sur le site, et cet appareil s'en souviendra."
              onInscrit={() => setPorteOuverte(false)}
            />
          </div>
        </div>
      )}

      {vue === "3d" ? (
        <VoyageNiveaux
          cases={grille.cases}
          vus={vus}
          inscrit={email !== null}
          assemblage={assemblage}
          secrets={secrets}
          depart={indexDeDepart(grille)}
          commandes={commandes}
          onChoisir={choisir}
          onFinAssemblage={finAssemblage}
        />
      ) : (
        <>
          <ol className="grid grid-cols-3 gap-3 min-[420px]:grid-cols-4 sm:grid-cols-6 sm:gap-4 lg:grid-cols-8">
            {grille.cases.map((c) => (
              <li key={c.jour}>
                <CaseBouton c={c} accelere={grille.mode === "accelere"} onClick={() => choisir(c)} />
              </li>
            ))}
          </ol>
          <Legende />
          {vue !== null && (
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-pixel text-[0.55rem] text-gris-clair">
              {commandes}
            </div>
          )}
        </>
      )}

      <Fenetre
        ouverte={caseOuverte !== null}
        onFermer={() => setOuverte(null)}
        titre={caseOuverte ? `Niveau ${caseOuverte.jour}` : "Niveau"}
        variante={vue === "3d" ? "tiroir" : "centre"}
      >
        {caseOuverte && <ContenuCase c={caseOuverte} />}
      </Fenetre>

      {message && (
        <div
          role="status"
          className="pixel fixed! inset-x-4 bottom-4 z-40 mx-auto max-w-md bg-nuit p-3 text-center text-xl sm:bottom-8"
        >
          {message}
        </div>
      )}

      <Fenetre ouverte={porteOuverte} onFermer={() => setPorteOuverte(false)} titre="Insérer une pièce">
        <PorteEmail
          titre="INSERT COIN"
          texte="Ce niveau est débloqué ! Entre ton email pour l'ouvrir : tu n'auras plus à le faire sur cet appareil."
          onInscrit={() => setPorteOuverte(false)}
        />
      </Fenetre>
    </section>
  );
};

const Hud = ({ grille, email, fixe }: Props & { fixe: boolean }) => (
  <div
    className={`pixel flex flex-col gap-3 px-4 py-3 ${fixe ? "fixed! inset-x-3 top-3 z-30 mx-auto max-w-6xl bg-nuit/80 backdrop-blur-sm sm:inset-x-6" : "bg-ardoise"} font-pixel text-[0.6rem] leading-relaxed sm:flex-row sm:items-center sm:justify-between sm:text-[0.65rem]`}
  >
    <div className="flex items-center gap-3">
      <span className="text-orange">NIVEAU</span>
      <span>
        {String(grille.ouvertes).padStart(2, "0")}/24
      </span>
      <span className="flex h-3 w-28 border-2 border-gris-clair sm:w-40" aria-hidden="true">
        <span className="h-full bg-orange" style={{ width: `${(grille.ouvertes / 24) * 100}%` }} />
      </span>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-gris-clair">
      {grille.mode === "accelere" && <span className="clignote text-orange">⏩ MODE SOIREE</span>}
      {grille.prochaine && !grille.termine && (
        <span>
          PROCHAIN : <span className="text-creme">{grille.prochaine}</span>
        </span>
      )}
      <span>{email ? <span className="text-sapin">● JOUEUR 1 CONNECTE</span> : "○ INSERT COIN"}</span>
    </div>
  </div>
);

const STYLE_ETAT = {
  fermee: "bg-ardoise text-gris-clair [--bord:var(--color-gris)]",
  ouverte: "bg-gris text-creme hover:bg-[#33302d] [--bord:var(--color-orange)]",
  jour: "bg-orange text-nuit [--bord:var(--color-orange-clair)]",
} as const;

const CaseBouton = ({ c, accelere, onClick }: { c: CaseAffichee; accelere: boolean; onClick: () => void }) => {
  const libelle =
    c.etat === "fermee"
      ? `Case ${c.jour}, fermée, s'ouvre le ${c.ouverture}`
      : c.etat === "jour"
        ? `Case ${c.jour}, case du jour, ouverte`
        : `Case ${c.jour}, ouverte`;

  return (
    <div className={c.etat === "fermee" ? "" : "ombre-pixel"}>
      <button
        type="button"
        onClick={onClick}
        aria-label={libelle}
        className={`pixel flex aspect-square w-full flex-col items-center justify-between p-2 text-center transition-colors ${STYLE_ETAT[c.etat]} ${c.etat === "fermee" ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className="self-start font-pixel text-[0.5rem] opacity-70" aria-hidden="true">
          {c.etat === "fermee" ? "🔒" : c.etat === "jour" ? "▶" : "★"}
        </span>
        <span className={`font-pixel text-2xl sm:text-3xl ${c.etat === "jour" ? "flotte" : ""}`}>{c.jour}</span>
        <span className="font-pixel text-[0.45rem] leading-tight sm:text-[0.5rem]">
          {c.manquante ? (
            <span className="bg-[#ff3b3b] px-1 text-nuit">CONTENU MANQUANT</span>
          ) : c.etat === "fermee" ? (
            // En soirée, toutes les cases tombent le même jour : on montre l'heure.
            accelere ? c.ouverture.replace(/^.* à /, "") : c.ouverture.replace(/ à .*/, "")
          ) : c.etat === "jour" ? (
            <span className="clignote">JOUR J</span>
          ) : (
            "OUVERTE"
          )}
        </span>
      </button>
    </div>
  );
};

const Legende = () => (
  <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-lg text-gris-clair">
    <li>
      <span className="text-orange">▶ JOUR J</span> : le niveau du jour
    </li>
    <li>
      <span className="text-creme">★ OUVERTE</span> : à rejouer
    </li>
    <li>🔒 date : pas encore débloquée</li>
  </ul>
);

const Bandeau = ({ ton, children }: { ton: "info" | "succes"; children: React.ReactNode }) => (
  <p
    className={`pixel px-4 py-3 text-center font-pixel text-[0.6rem] leading-relaxed sm:text-xs ${ton === "succes" ? "bg-[#12301f] text-sapin [--bord:var(--color-sapin)]" : "bg-ardoise text-orange-clair"}`}
  >
    {children}
  </p>
);

const PorteEmail = ({ titre, texte, onInscrit }: { titre: string; texte: string; onInscrit: () => void }) => {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [, demarrer] = useTransition();

  const soumettre = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEnvoi(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/inscription", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), site: form.get("site") || undefined }),
      });
      const corps = (await reponse.json().catch(() => ({}))) as { erreur?: string };
      if (!reponse.ok) throw new Error(corps.erreur ?? "Oups, réessaie.");
      onInscrit();
      demarrer(() => router.refresh());
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="font-pixel text-lg text-orange sm:text-xl">
          <span className="clignote">▶</span> {titre}
        </p>
        <p className="text-xl text-creme">{texte}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={`email-${titre}`}>
          Ton email
        </label>
        <input
          id={`email-${titre}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="toi@entreprise.fr"
          className="pixel min-w-0 flex-1 bg-nuit px-4 py-3 text-2xl text-creme placeholder:text-gris-clair focus:outline-none [--bord:var(--color-gris-clair)] focus:[--bord:var(--color-orange)]"
        />
        {/* Piège à robots : invisible pour un humain. */}
        <input name="site" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button type="submit" disabled={envoi} className="bouton-pixel px-5 py-4 text-xs">
          {envoi ? "CHARGEMENT…" : "JOUER ▶"}
        </button>
      </div>
      <p className="pixel bg-nuit px-3 py-2 text-lg leading-snug text-orange-clair [--bord:var(--color-orange-sombre)]">
        🎁 BONUS : un skill exclusif, introuvable sur le site, t&apos;attend dans ta boîte mail. Pense à
        ouvrir l&apos;email de Fyliz !
      </p>
      {erreur && (
        <p role="alert" className="text-xl text-[#ff6b6b]">
          ✗ {erreur}
        </p>
      )}
      <p className="text-base leading-snug text-gris-clair">
        Pas un email par jour : tout se passe sur le site. Tu reçois ton skill exclusif, puis de temps en temps des
        conseils IA et automatisation de Fyliz. Désinscription en un clic.
      </p>
    </form>
  );
};

const ContenuCase = ({ c }: { c: CaseAffichee }) => {
  const [copie, setCopie] = useState(false);
  const contenu = c.contenu;

  if (!contenu) {
    return <p className="text-xl">Ce niveau est ouvert, mais son contenu est introuvable. Le maître du jeu a été prévenu.</p>;
  }

  const copier = async () => {
    await navigator.clipboard.writeText(contenu.installation);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <p className="font-pixel text-[0.6rem] text-gris-clair">
          NIVEAU {String(c.jour).padStart(2, "0")} · {contenu.categorie.toUpperCase()}
        </p>
        <h2 className="font-pixel text-lg leading-relaxed text-orange sm:text-xl">{contenu.titre}</h2>
        <p className="text-2xl text-creme">{contenu.accroche}</p>
        <p className="text-lg text-gris-clair">
          Skill <span className="text-orange-clair">{contenu.skill}</span> · par {contenu.auteur}
        </p>
      </header>

      <div className="pixel flex flex-col gap-2 bg-nuit p-3 [--bord:var(--color-gris)]">
        <p className="font-pixel text-[0.55rem] text-gris-clair">INSTALLER (CLAUDE CODE, CODEX, CURSOR…)</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xl text-sapin">
            $ {contenu.installation}
          </code>
          <button type="button" onClick={copier} className="bouton-pixel shrink-0 px-3 py-2 text-[0.55rem]">
            {copie ? "COPIE ✓" : "COPIER"}
          </button>
        </div>
      </div>

      <div className="contenu-case text-xl" dangerouslySetInnerHTML={{ __html: contenu.html }} />

      <footer className="mt-2 flex flex-col gap-3 border-t-4 border-dashed border-gris pt-4 sm:flex-row sm:items-center sm:justify-between">
        <a href={contenu.lien} target="_blank" rel="noreferrer" className="text-lg text-orange underline underline-offset-4">
          Voir le skill sur skills.sh ↗
        </a>
        <a href="https://fyliz.com" target="_blank" rel="noreferrer" className="bouton-pixel px-4 py-3 text-center text-[0.55rem]">
          AUTOMATISER MA PME AVEC FYLIZ
        </a>
      </footer>
    </article>
  );
};
