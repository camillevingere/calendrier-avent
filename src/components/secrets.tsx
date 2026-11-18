"use client";

/**
 * Les six secrets, partagés entre le décor 2D (vue grille) et le monde 3D.
 * Ce module garde l'état (trouvés, tempête, lune orange…), écoute le clavier
 * (Konami code, mot magique) et affiche annonces, compteur et niveau bonus.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CouleurNeige } from "./neige";
import { NiveauBonus } from "./niveau-bonus";

const SECRETS = {
  lune: "La lune Fyliz",
  traineau: "Le traîneau express",
  sapin: "Le sapin illuminé",
  maison: "Le lutin insomniaque",
  konami: "Le cheat code",
  fyliz: "Le mot magique",
} as const;
type Secret = keyof typeof SECRETS;
const TOTAL = Object.keys(SECRETS).length;
const CLE_STOCKAGE = "skillquest-secrets";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export type EtatSecrets = {
  tempete: boolean;
  couleur: CouleurNeige;
  sapinAllume: boolean;
  lumiere: boolean;
  luneFyliz: boolean;
  cliquerLune: () => void;
  cliquerTraineau: () => void;
  allumerSapin: () => void;
  basculerLumiere: () => void;
};

type Valeur = EtatSecrets & {
  /** Vrai quand le monde 3D occupe l'écran : le décor 2D s'efface. */
  immersif: boolean;
  setImmersif: (v: boolean) => void;
};

const Contexte = createContext<Valeur | null>(null);

export const useSecrets = (): Valeur => {
  const v = useContext(Contexte);
  if (!v) throw new Error("useSecrets doit être utilisé dans <Secrets>");
  return v;
};

export const Secrets = ({ children }: { children: React.ReactNode }) => {
  const [trouves, setTrouves] = useState<Secret[]>([]);
  const [annonce, setAnnonce] = useState<string | null>(null);
  const [tempete, setTempete] = useState(false);
  const [couleur, setCouleur] = useState<CouleurNeige>("creme");
  const [sapinAllume, setSapinAllume] = useState(false);
  const [lumiere, setLumiere] = useState(true);
  const [luneFyliz, setLuneFyliz] = useState(false);
  const [bonusOuvert, setBonusOuvert] = useState(false);
  const [immersif, setImmersif] = useState(false);
  const clicsLune = useRef(0);
  const trouvesRef = useRef<Secret[]>([]);

  useEffect(() => {
    try {
      const lus = JSON.parse(localStorage.getItem(CLE_STOCKAGE) ?? "[]") as Secret[];
      const valides = lus.filter((s) => s in SECRETS);
      trouvesRef.current = valides;
      setTrouves(valides);
    } catch {
      // Stockage indisponible (navigation privée…) : on joue sans mémoire.
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("immersif", immersif);
  }, [immersif]);

  useEffect(() => {
    if (!annonce) return;
    const t = setTimeout(() => setAnnonce(null), 4500);
    return () => clearTimeout(t);
  }, [annonce]);

  const declencherTempete = useCallback((duree: number) => {
    setTempete(true);
    document.body.classList.add("secousse");
    setTimeout(() => document.body.classList.remove("secousse"), 700);
    setTimeout(() => setTempete(false), duree);
  }, []);

  const trouver = useCallback(
    (secret: Secret, texte: string) => {
      const avant = trouvesRef.current;
      if (avant.includes(secret)) {
        setAnnonce(texte);
        return;
      }
      const apres = [...avant, secret];
      trouvesRef.current = apres;
      setTrouves(apres);
      try {
        localStorage.setItem(CLE_STOCKAGE, JSON.stringify(apres));
      } catch {}
      if (apres.length === TOTAL) {
        setAnnonce(`★ 100% ★ Tous les secrets trouvés ! NIVEAU BONUS débloqué…`);
        setCouleur("fete");
        declencherTempete(9000);
        setTimeout(() => setBonusOuvert(true), 2500);
      } else {
        setAnnonce(`★ SECRET ${apres.length}/${TOTAL} : ${SECRETS[secret]} — ${texte}`);
      }
    },
    [declencherTempete],
  );

  // Clavier : Konami code et mot magique (ignorés quand on tape dans un champ).
  useEffect(() => {
    let dernieres: string[] = [];
    let mot = "";
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA" || cible.isContentEditable)) return;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      // On garde les 10 dernières touches : une touche en trop ne casse pas la séquence.
      dernieres = [...dernieres, k].slice(-KONAMI.length);
      // Dès ↑↑↓, on considère le code commencé : les flèches arrêtent de faire défiler la page.
      const avancee = dernieres.reduce((max, _, debut) => {
        const fin = dernieres.slice(debut);
        return fin.every((t, i) => t === KONAMI[i]) ? Math.max(max, fin.length) : max;
      }, 0);
      if (avancee >= 3 && k.startsWith("Arrow") && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        // Le monde 3D écoute aussi ← → : on lui signale que c'est le cheat code, pas un déplacement.
        (e as KeyboardEvent & { cheatCode?: boolean }).cheatCode = true;
      }
      if (dernieres.join() === KONAMI.join()) {
        dernieres = [];
        declencherTempete(8000);
        trouver("konami", "CHEAT CODE ACTIVÉ : +30 vies et tempête de neige !");
      }
      if (k.length === 1) {
        mot = (mot + k).slice(-5);
        if (mot === "fyliz") {
          setCouleur((c) => (c === "fete" ? c : "orange"));
          trouver("fyliz", "La neige passe aux couleurs de Fyliz.");
        }
      }
    };
    // Phase de capture : le cheat code est repéré avant les autres écouteurs du clavier.
    window.addEventListener("keydown", touche, true);
    return () => window.removeEventListener("keydown", touche, true);
  }, [trouver, declencherTempete]);

  // Un mot pour ceux qui fouillent la console.
  useEffect(() => {
    console.log(
      "%c SKILL QUEST %c\nTu fouilles le code ? Bien vu 😏\nLes cases futures ne sont pas ici : elles sont chiffrées (AES-256-GCM) et un robot publie la clé du jour.\nPar contre, 6 secrets se cachent dans ce monde. Indices : ↑↑↓↓←→←→BA… et le nom de la maison, tapé au clavier.\nFyliz, ton équipe IA externalisée → https://fyliz.com",
      "background:#ff781a;color:#0f0f10;font:bold 16px monospace;padding:4px 8px",
      "color:#ffb27a;font:13px monospace",
    );
  }, []);

  const cliquerLune = useCallback(() => {
    clicsLune.current += 1;
    if (clicsLune.current >= 3) {
      clicsLune.current = 0;
      setLuneFyliz((v) => !v);
      trouver("lune", "Même la lune est orange chez Fyliz.");
    }
  }, [trouver]);

  const cliquerTraineau = useCallback(
    () => trouver("traineau", "Ho ho ho ! Le Père Noël livre aussi des skills."),
    [trouver],
  );

  const allumerSapin = useCallback(() => {
    setSapinAllume(true);
    trouver("sapin", "Les guirlandes sont branchées.");
  }, [trouver]);

  const basculerLumiere = useCallback(() => {
    setLumiere((v) => !v);
    trouver("maison", "Chut… le lutin révise ses skills en pleine nuit.");
  }, [trouver]);

  const valeur = useMemo<Valeur>(
    () => ({
      tempete,
      couleur,
      sapinAllume,
      lumiere,
      luneFyliz,
      cliquerLune,
      cliquerTraineau,
      allumerSapin,
      basculerLumiere,
      immersif,
      setImmersif,
    }),
    [tempete, couleur, sapinAllume, lumiere, luneFyliz, cliquerLune, cliquerTraineau, allumerSapin, basculerLumiere, immersif],
  );

  return (
    <Contexte.Provider value={valeur}>
      {children}

      {/* Compteur (cliquable une fois les 6 trouvés) et annonces */}
      {trouves.length > 0 && trouves.length < TOTAL && (
        <p className="pointer-events-none fixed bottom-7 left-1/2 z-30 -translate-x-1/2 font-pixel text-[0.5rem] text-orange-clair xl:bottom-4 xl:left-24 xl:translate-x-0 [.immersif_&]:xl:left-8">
          ★ SECRETS {trouves.length}/{TOTAL}
        </p>
      )}
      {trouves.length === TOTAL && (
        <button
          type="button"
          onClick={() => setBonusOuvert(true)}
          className="clignote-lent fixed bottom-7 left-1/2 z-30 -translate-x-1/2 cursor-pointer whitespace-nowrap font-pixel text-[0.5rem] text-sapin hover:text-orange xl:bottom-4 xl:left-24 xl:translate-x-0 [.immersif_&]:xl:left-8"
        >
          ★ {TOTAL}/{TOTAL} · NIVEAU BONUS ▶
        </button>
      )}
      <NiveauBonus ouvert={bonusOuvert} onFermer={() => setBonusOuvert(false)} />
      {annonce && (
        <p
          role="status"
          className="pop pixel fixed! inset-x-4 top-16 z-50 [.immersif_&]:top-20 mx-auto max-w-lg bg-nuit px-4 py-3 text-center font-pixel text-[0.55rem] leading-relaxed text-orange-clair sm:text-[0.6rem]"
        >
          {annonce}
        </p>
      )}
    </Contexte.Provider>
  );
};
