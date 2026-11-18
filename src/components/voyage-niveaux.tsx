"use client";

/**
 * Le voyage : le monde 3D occupe tout l'écran, et la page défile par-dessus.
 * Chaque écran de défilement avance la caméra d'un niveau. Par-dessus la scène,
 * en HTML : le panneau du niveau courant, le rail des 24 niveaux, les commandes.
 * Tout reste accessible au clavier (← → Entrée) et aux lecteurs d'écran.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CaseAffichee } from "@/lib/grille";
import { sonTic, sonVerrou } from "@/lib/son";
import { NB, S_MIN } from "./monde/chemin";
import type { EtatStation } from "./monde/stations";
import { voyage } from "./monde/voyage";
import type { EtatSecrets } from "./secrets";

const Monde3D = dynamic(() => import("./monde/monde-3d"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-[#0b0c12] font-pixel text-xs text-orange">
      <span className="clignote">CHARGEMENT DU MONDE...</span>
    </div>
  ),
});

type Props = {
  cases: CaseAffichee[];
  vus: Set<number>;
  inscrit: boolean;
  assemblage: { jour: number; cle: number } | null;
  secrets: EtatSecrets;
  depart: number;
  commandes: React.ReactNode;
  onChoisir: (c: CaseAffichee) => void;
  onFinAssemblage: (jour: number) => void;
};

type Phase = "intro" | "voyage" | "fin";

export const VoyageNiveaux = ({
  cases,
  vus,
  inscrit,
  assemblage,
  secrets,
  depart,
  commandes,
  onChoisir,
  onFinAssemblage,
}: Props) => {
  const piste = useRef<HTMLDivElement>(null);
  const [station, setStation] = useState<number | null>(null);
  const [proche, setProche] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");

  // Le défilement de la page → la position sur le chemin.
  // Sans email, pas de voyage : la caméra reste sur la vallée et la page s'arrête à la porte d'inscription.
  useEffect(() => {
    let precedente: number | null = null;
    const maj = () => {
      if (!inscrit) {
        voyage.cible = -1.5;
        setStation(null);
        setPhase(window.scrollY < window.innerHeight * 0.3 ? "intro" : "fin");
        return;
      }
      const el = piste.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pas = r.height / NB;
      const s = (window.innerHeight / 2 - r.top) / pas - 0.5;
      voyage.cible = Math.min(Math.max(s, S_MIN + 1), 25);
      const k = Math.round(s);
      const sur = k >= 0 && k < NB && Math.abs(s - k) < 0.3 ? k : null;
      if (sur !== null && sur !== precedente) sonTic();
      precedente = sur;
      setStation(sur);
      setProche(Math.min(Math.max(k, 0), NB - 1));
      setPhase(s < -0.6 ? "intro" : s > NB - 0.4 ? "fin" : "voyage");
    };
    maj();
    // La mise en page bouge encore après le montage (l'écran titre s'agrandit en mode immersif) :
    // on recalcule à chaque changement de taille de la page, pas seulement au défilement.
    const observateur = new ResizeObserver(maj);
    observateur.observe(document.body);
    window.addEventListener("scroll", maj, { passive: true });
    return () => {
      observateur.disconnect();
      window.removeEventListener("scroll", maj);
    };
  }, [inscrit]);

  // Sans email, la page s'arrête à la porte : vouloir descendre plus bas la fait refuser (secousse, bord rouge).
  useEffect(() => {
    if (inscrit) return;
    let dernier = 0;
    let departDoigt = 0;
    const enBas = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    const refuser = () => {
      const porte = document.getElementById("porte-email");
      const maintenant = Date.now();
      if (!porte || !enBas() || maintenant - dernier < 700) return;
      dernier = maintenant;
      porte.classList.remove("refus");
      void porte.offsetWidth; // relance l'animation
      porte.classList.add("refus");
      sonVerrou();
    };
    const molette = (e: WheelEvent) => e.deltaY > 0 && refuser();
    const debut = (e: TouchEvent) => (departDoigt = e.touches[0].clientY);
    const glisse = (e: TouchEvent) => departDoigt - e.touches[0].clientY > 30 && refuser();
    const touche = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (["ArrowDown", "PageDown", "End", " "].includes(e.key)) refuser();
    };
    window.addEventListener("wheel", molette, { passive: true });
    window.addEventListener("touchstart", debut, { passive: true });
    window.addEventListener("touchmove", glisse, { passive: true });
    window.addEventListener("keydown", touche);
    return () => {
      window.removeEventListener("wheel", molette);
      window.removeEventListener("touchstart", debut);
      window.removeEventListener("touchmove", glisse);
      window.removeEventListener("keydown", touche);
    };
  }, [inscrit]);

  const allerA = useCallback((k: number) => {
    const el = piste.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pas = r.height / NB;
    window.scrollTo({ top: window.scrollY + r.top + pas * (k + 0.5) - window.innerHeight / 2, behavior: "smooth" });
  }, []);

  // Clavier : ← → pour voyager, Entrée pour ouvrir le niveau devant soi.
  const etat = useRef({ station, proche, onChoisir });
  etat.current = { station, proche, onChoisir };
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      // Le Konami code passe aussi par ← → : il a déjà réclamé ces touches.
      if (e.defaultPrevented || !inscrit) return;
      const cible = e.target as HTMLElement;
      if (cible.closest("input, textarea") || document.querySelector("dialog[open]")) return;
      const { station: st, proche: pr } = etat.current;
      if (e.key === "ArrowRight") allerA(Math.min(pr + (st === null && pr === 0 ? 0 : 1), NB - 1));
      else if (e.key === "ArrowLeft") allerA(Math.max(pr - 1, 0));
      else if (e.key === "Enter" && st !== null && cible === document.body) etat.current.onChoisir(cases[st]);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [allerA, cases, inscrit]);

  const etats: EtatStation[] = useMemo(
    () =>
      cases.map((c) => ({
        etat: c.etat === "fermee" ? "verrouille" : vus.has(c.jour) ? "complet" : "nu",
        jourJ: c.etat === "jour",
      })),
    [cases, vus],
  );

  const c = station !== null ? cases[station] : null;
  const enCours = c !== null && assemblage?.jour === c.jour && !vus.has(c.jour);

  return (
    <>
      {/* La scène, fixe, derrière toute la page */}
      <div className="monde interactif fixed inset-0 -z-10" aria-hidden="true">
        <Monde3D
          etats={etats}
          assemblage={assemblage}
          secrets={secrets}
          onActiver={(k) => onChoisir(cases[k])}
          onAller={allerA}
          onFinAssemblage={onFinAssemblage}
        />
      </div>

      {/* La piste : un écran de défilement par niveau, aimanté au centre */}
      {inscrit && (
        <div ref={piste} aria-hidden="true">
          {cases.map((x) => (
            <div key={x.jour} className="h-svh snap-center" />
          ))}
        </div>
      )}

      {/* Écran titre : l'invitation à partir */}
      <div
        className={`interactif fixed inset-x-0 bottom-10 z-20 flex flex-col items-center gap-4 transition-all duration-500 ${
          phase === "intro" ? "opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={() =>
            inscrit
              ? allerA(depart)
              : document.getElementById("porte-email")?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          className="bouton-pixel px-5 py-4 text-[0.6rem] sm:text-xs"
        >
          {inscrit ? "▶ PRESS START" : "▶ INSERT COIN"}
        </button>
        <p className="font-pixel text-[0.5rem] tracking-[0.2em] text-gris-clair">
          <span className="clignote">↓</span>{" "}
          {inscrit ? "OU SCROLLE POUR PARTIR A L'AVENTURE" : "ENTRE TON EMAIL POUR PARTIR A L'AVENTURE"}
        </p>
      </div>

      {/* Le panneau du niveau devant soi */}
      <section
        aria-live="polite"
        className={`interactif fixed inset-x-4 bottom-14 z-20 flex flex-col gap-3 transition-all duration-300 sm:inset-x-auto sm:bottom-12 sm:left-10 sm:max-w-md ${
          c ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {c && (
          <>
            <div className="flex items-end gap-4">
              <span key={c.jour} className="niveau-geant font-pixel text-6xl leading-none sm:text-8xl" data-etat={c.etat}>
                {String(c.jour).padStart(2, "0")}
              </span>
              <span className="pb-1 font-pixel text-[0.5rem] leading-relaxed text-gris-clair sm:text-[0.6rem]">
                NIVEAU
                <br />
                {c.etat === "fermee" ? "VERROUILLE" : c.etat === "jour" ? <span className="clignote text-orange">▶ JOUR J</span> : "DEBLOQUE"}
              </span>
            </div>
            <p className="max-w-sm text-xl leading-tight text-creme sm:text-2xl">
              {c.etat === "fermee"
                ? `Se débloque le ${c.ouverture}.`
                : c.contenu
                  ? c.contenu.titre
                  : inscrit
                    ? "Un skill t'attend ici."
                    : "Insère une pièce pour découvrir ce skill."}
            </p>
            <div>
              <button
                type="button"
                onClick={() => onChoisir(c)}
                disabled={enCours}
                aria-label={c.etat === "fermee" ? `Niveau ${c.jour} verrouillé, s'ouvre le ${c.ouverture}` : `Ouvrir le niveau ${c.jour}`}
                className={`px-5 py-4 text-[0.6rem] sm:text-xs ${
                  c.etat === "fermee" ? "pixel bg-ardoise font-pixel text-gris-clair [--bord:var(--color-gris)]" : "bouton-pixel"
                }`}
              >
                {enCours
                  ? "ASSEMBLAGE..."
                  : c.etat === "fermee"
                    ? `🔒 ${c.ouverture.toUpperCase()}`
                    : vus.has(c.jour)
                      ? "REVOIR LE SKILL ▶"
                      : "DEBALLER ▶"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Le rail des 24 niveaux : où j'en suis, et voyage rapide */}
      <nav
        aria-label="Aller à un niveau"
        className={`interactif fixed right-2 top-1/2 z-20 -translate-y-1/2 transition-opacity duration-500 sm:right-5 ${
          phase === "voyage" ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ol className="flex flex-col gap-[3px] sm:gap-1">
          {cases.map((x, i) => {
            const ici = i === proche;
            return (
              <li key={x.jour}>
                <button
                  type="button"
                  onClick={() => allerA(i)}
                  aria-label={`Niveau ${x.jour}`}
                  aria-current={ici ? "step" : undefined}
                  className="group flex items-center justify-end gap-2 py-[2px]"
                >
                  <span
                    className={`font-pixel text-[0.45rem] transition-opacity ${ici ? "text-orange opacity-100" : "text-gris-clair opacity-0 group-hover:opacity-100"}`}
                  >
                    {String(x.jour).padStart(2, "0")}
                  </span>
                  <span
                    className={`block h-[3px] transition-all ${
                      ici
                        ? "w-7 bg-orange"
                        : x.etat === "fermee"
                          ? "w-3 bg-gris"
                          : vus.has(x.jour)
                            ? "w-4 bg-creme/70"
                            : "w-4 bg-orange/60"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Commandes (vue grille, son) */}
      <div className="interactif fixed bottom-4 right-4 z-30 flex gap-5 font-pixel text-[0.5rem] text-gris-clair sm:right-8">
        {commandes}
      </div>
    </>
  );
};
