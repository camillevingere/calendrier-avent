"use client";

/**
 * Le décor de fond : nuit étoilée, lune, étoiles filantes, traîneau, sapin,
 * maison… et six secrets à trouver. Rien ici ne touche au contenu des cases.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Neige, type CouleurNeige } from "./neige";
import { NiveauBonus } from "./niveau-bonus";
import { PixelArt } from "./pixel-art";

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

const LUNE = [
  "....mmmm....",
  "..mmmmmmmm..",
  ".mmmmmmcmmm.",
  ".mmcmmmmmmm.",
  "mmcccmmmmmmm",
  "mmmcmmmmmcmm",
  "mmmmmmmmcccm",
  "mmmmmmmmmcmm",
  ".mmmmcmmmmm.",
  ".mmmmmmmmmm.",
  "..mmmmmmmm..",
  "....mmmm....",
];

const TRAINEAU = [
  "..........................a.a.",
  "...........................aa.",
  "........w.................bbbr",
  ".......rrr.......gggggggggbbb.",
  "......rrrrr.....g....bbbbbbb..",
  "..sssssssssss..g.....bbbbbbb..",
  "...sssssssssggg......b.b.b.b..",
  "....sssssssss.................",
  "..yyyyyyyyyyyy................",
];

const SAPIN = [
  ".....y.....",
  "....yyy....",
  ".....v.....",
  "....vvv....",
  "...vvovv...",
  "....vvv....",
  "...vvvvv...",
  "..vvovvov..",
  "...vvvvv...",
  "..vvvvvvv..",
  ".vvovvvvov.",
  "..vvvvvvv..",
  ".vvvvvvvvv.",
  "vvovvvovvvv",
  ".....t.....",
  "....ttt....",
];

const MAISON = [
  "..cc..........",
  "..cc.wwww.....",
  "..wwwwwwwww...",
  ".wwwwwwwwwwww.",
  "wwwwwwwwwwwwww",
  ".hhhhhhhhhhhh.",
  ".hhllhhhhhddh.",
  ".hhllhhhhhddh.",
  ".hhhhhhhhhddh.",
  ".hhhhhhhhhddh.",
];

const ETOILES = Array.from({ length: 44 }, (_, i) => ({
  left: (i * 53 + 7) % 100,
  top: (i * 29 + 3) % 72,
  taille: i % 7 === 0 ? 4 : 2,
  duree: 2 + (i % 5),
  delai: -(i % 4),
}));

export const Decor = () => {
  const [trouves, setTrouves] = useState<Secret[]>([]);
  const [annonce, setAnnonce] = useState<string | null>(null);
  const [tempete, setTempete] = useState(false);
  const [couleur, setCouleur] = useState<CouleurNeige>("creme");
  const [sapinAllume, setSapinAllume] = useState(false);
  const [lumiere, setLumiere] = useState(true);
  const [luneFyliz, setLuneFyliz] = useState(false);
  const [bonusOuvert, setBonusOuvert] = useState(false);
  const clicsLune = useRef(0);

  useEffect(() => {
    try {
      const lus = JSON.parse(localStorage.getItem(CLE_STOCKAGE) ?? "[]") as Secret[];
      setTrouves(lus.filter((s) => s in SECRETS));
    } catch {
      // Stockage indisponible (navigation privée…) : on joue sans mémoire.
    }
  }, []);

  useEffect(() => {
    if (!annonce) return;
    const t = setTimeout(() => setAnnonce(null), 4500);
    return () => clearTimeout(t);
  }, [annonce]);

  const trouvesRef = useRef<Secret[]>([]);
  useEffect(() => {
    trouvesRef.current = trouves;
  }, [trouves]);

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
      const avancee = dernieres.reduce(
        (max, _, debut) => {
          const fin = dernieres.slice(debut);
          return fin.every((t, i) => t === KONAMI[i]) ? Math.max(max, fin.length) : max;
        },
        0,
      );
      if (avancee >= 3 && k.startsWith("Arrow") && !document.querySelector("dialog[open]")) e.preventDefault();
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
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [trouver, declencherTempete]);

  // Un mot pour ceux qui fouillent la console.
  useEffect(() => {
    console.log(
      "%c SKILL QUEST %c\nTu fouilles le code ? Bien vu 😏\nLes cases futures ne sont pas ici : elles sont chiffrées (AES-256-GCM) et un robot publie la clé du jour.\nPar contre, 6 secrets se cachent sur la page. Indices : ↑↑↓↓←→←→BA… et le nom de la maison, tapé au clavier.\nFyliz, ton équipe IA externalisée → https://fyliz.com",
      "background:#ff781a;color:#0f0f10;font:bold 16px monospace;padding:4px 8px",
      "color:#ffb27a;font:13px monospace",
    );
  }, []);

  const cliquerLune = () => {
    clicsLune.current += 1;
    if (clicsLune.current >= 3) {
      clicsLune.current = 0;
      setLuneFyliz((v) => !v);
      trouver("lune", "Même la lune est orange chez Fyliz.");
    }
  };

  return (
    <>
    <div aria-hidden="true">
      {/* Étoiles */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {ETOILES.map((e, i) => (
          <span
            key={i}
            className="scintille absolute bg-creme"
            style={{
              left: `${e.left}%`,
              top: `${e.top}%`,
              width: e.taille,
              height: e.taille,
              animationDuration: `${e.duree}s`,
              animationDelay: `${e.delai}s`,
            }}
          />
        ))}
        <span className="filante" style={{ top: "12%", left: "10%", animationDelay: "3s" }} />
        <span className="filante" style={{ top: "28%", left: "55%", animationDelay: "11s" }} />
      </div>

      <Neige tempete={tempete} couleur={couleur} />

      {/* Lune : trois clics */}
      <button
        type="button"
        tabIndex={-1}
        onClick={cliquerLune}
        className="lune fixed right-4 top-4 z-20 cursor-pointer sm:right-10 sm:top-8"
      >
        <PixelArt
          art={LUNE}
          taille={5}
          palette={luneFyliz ? { m: "#ff781a", c: "#b8500a" } : { m: "#fff4e8", c: "#d9cbb8" }}
        />
      </button>

      {/* Traîneau qui traverse le ciel */}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => trouver("traineau", "Ho ho ho ! Le Père Noël livre aussi des skills.")}
        className="traineau fixed left-0 top-[18%] z-20 cursor-pointer"
      >
        <PixelArt
          art={TRAINEAU}
          taille={4}
          palette={{ a: "#8b5a2b", b: "#a0522d", r: "#e3342f", w: "#fff4e8", s: "#c81e1e", g: "#ffcc33", y: "#ffcc33" }}
        />
      </button>

      {/* Sol enneigé */}
      <div className="sol pointer-events-none fixed inset-x-0 bottom-0 z-0 h-5" />

      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          setSapinAllume(true);
          trouver("sapin", "Les guirlandes sont branchées.");
        }}
        className="pointer-events-none fixed bottom-3 left-3 z-0 opacity-70 xl:pointer-events-auto xl:z-20 xl:cursor-pointer xl:opacity-100"
      >
        <PixelArt
          art={SAPIN}
          taille={4}
          className={sapinAllume ? "sapin-allume" : undefined}
          palette={{
            v: "#1f6b3a",
            t: "#6b3a2a",
            y: sapinAllume ? "#ffcc33" : "#55555c",
            o: sapinAllume ? "#ff781a" : "#174f2b",
          }}
        />
      </button>

      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          setLumiere((v) => !v);
          trouver("maison", "Chut… le lutin révise ses skills en pleine nuit.");
        }}
        className="pointer-events-none fixed bottom-3 right-3 z-0 opacity-70 xl:pointer-events-auto xl:z-20 xl:cursor-pointer xl:opacity-100"
      >
        <PixelArt
          art={MAISON}
          taille={4}
          palette={{
            c: "#6b3a2a",
            w: "#fff4e8",
            h: "#3a2a22",
            d: "#8b5a2b",
            l: lumiere ? "#ffcc33" : "#1c1c1f",
          }}
        />
      </button>

    </div>

      {/* Compteur (cliquable une fois les 6 trouvés) et annonces */}
      {trouves.length > 0 && trouves.length < TOTAL && (
        <p className="pointer-events-none fixed bottom-7 left-1/2 z-30 -translate-x-1/2 font-pixel text-[0.5rem] text-orange-clair xl:bottom-4 xl:left-24 xl:translate-x-0">
          ★ SECRETS {trouves.length}/{TOTAL}
        </p>
      )}
      {trouves.length === TOTAL && (
        <button
          type="button"
          onClick={() => setBonusOuvert(true)}
          className="clignote-lent fixed bottom-7 left-1/2 z-30 -translate-x-1/2 cursor-pointer whitespace-nowrap font-pixel text-[0.5rem] text-sapin hover:text-orange xl:bottom-4 xl:left-24 xl:translate-x-0"
        >
          ★ {TOTAL}/{TOTAL} · NIVEAU BONUS ▶
        </button>
      )}
      <NiveauBonus ouvert={bonusOuvert} onFermer={() => setBonusOuvert(false)} />
      {annonce && (
        <p
          role="status"
          className="pop pixel fixed inset-x-4 top-4 z-40 mx-auto max-w-lg bg-nuit px-4 py-3 text-center font-pixel text-[0.55rem] leading-relaxed text-orange-clair sm:text-[0.6rem]"
        >
          {annonce}
        </p>
      )}
    </>
  );
};
