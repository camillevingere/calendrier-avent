"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { CaseAffichee, Grille } from "@/lib/grille";

type Props = { grille: Grille; email: string | null };

export const Calendrier = ({ grille, email }: Props) => {
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [porteOuverte, setPorteOuverte] = useState(false);
  const [aOuvrirApresInscription, setAOuvrirApresInscription] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Après l'inscription, la page est rechargée côté serveur avec le contenu : on ouvre la case demandée.
  useEffect(() => {
    if (email && aOuvrirApresInscription) {
      setOuverte(aOuvrirApresInscription);
      setAOuvrirApresInscription(null);
    }
  }, [email, aOuvrirApresInscription]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const choisir = (c: CaseAffichee) => {
    if (c.etat === "fermee") {
      setMessage(`🔒 Niveau ${c.jour} verrouillé. Il se débloque le ${c.ouverture}.`);
      return;
    }
    if (!email) {
      setAOuvrirApresInscription(c.jour);
      setPorteOuverte(true);
      return;
    }
    setOuverte(c.jour);
  };

  const caseOuverte = grille.cases.find((c) => c.jour === ouverte) ?? null;

  return (
    <section className="flex flex-col gap-6" aria-label="Calendrier">
      <Hud grille={grille} email={email} />

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
        <div className="ombre-pixel">
          <div className="pixel bg-ardoise p-5 sm:p-8">
            <PorteEmail
              titre="INSERT COIN"
              texte="Entre ton email pour jouer : les 24 niveaux se débloquent ici, sur le site, et cet appareil s'en souviendra."
              onInscrit={() => setPorteOuverte(false)}
            />
          </div>
        </div>
      )}

      <ol className="grid grid-cols-3 gap-3 min-[420px]:grid-cols-4 sm:grid-cols-6 sm:gap-4 lg:grid-cols-8">
        {grille.cases.map((c) => (
          <li key={c.jour}>
            <CaseBouton c={c} accelere={grille.mode === "accelere"} onClick={() => choisir(c)} />
          </li>
        ))}
      </ol>

      <Legende />

      {message && (
        <div
          role="status"
          className="pixel fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md bg-nuit p-3 text-center text-xl sm:bottom-8"
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

      <Fenetre
        ouverte={caseOuverte !== null}
        onFermer={() => setOuverte(null)}
        titre={caseOuverte?.contenu?.titre ?? "Case"}
      >
        {caseOuverte && <ContenuCase c={caseOuverte} />}
      </Fenetre>
    </section>
  );
};

const Hud = ({ grille, email }: Props) => (
  <div className="pixel flex flex-col gap-3 bg-ardoise px-4 py-3 font-pixel text-[0.6rem] leading-relaxed sm:flex-row sm:items-center sm:justify-between sm:text-[0.65rem]">
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
      <span>{email ? <span className="text-sapin">● JOUEUR 1 CONNECTE</span> : "○ PAS DE JOUEUR"}</span>
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
        🎁 NIVEAU SECRET : un skill exclusif, introuvable sur le site, t&apos;attend dans ta boîte mail. Pense à
        ouvrir l&apos;email de Fyliz !
      </p>
      {erreur && (
        <p role="alert" className="text-xl text-[#ff6b6b]">
          ✗ {erreur}
        </p>
      )}
      <p className="text-base leading-snug text-gris-clair">
        Pas un email par jour : tout se passe sur le site. Tu reçois ton skill secret, puis de temps en temps des
        conseils IA et automatisation de Fyliz. Désinscription en un clic.
      </p>
    </form>
  );
};

const Fenetre = ({
  ouverte,
  onFermer,
  titre,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouverte && !d.open) d.showModal();
    if (!ouverte && d.open) d.close();
  }, [ouverte]);

  return (
    <dialog
      ref={ref}
      aria-label={titre}
      onClose={onFermer}
      onClick={(e) => e.target === ref.current && onFermer()}
      className="m-auto max-h-[90dvh] w-[min(46rem,calc(100vw-2rem))] bg-transparent p-0 text-creme"
    >
      <div className="pixel max-h-[90dvh] overflow-y-auto bg-ardoise p-5 sm:p-8">
        <button
          type="button"
          onClick={onFermer}
          className="float-right ml-4 font-pixel text-xs text-gris-clair hover:text-orange"
          aria-label="Fermer"
        >
          [X]
        </button>
        {children}
      </div>
    </dialog>
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
