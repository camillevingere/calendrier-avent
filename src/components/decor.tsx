"use client";

/**
 * Le décor 2D de la vue grille : nuit étoilée, lune, étoiles filantes, traîneau,
 * sapin, maison… Les secrets eux-mêmes vivent dans <Secrets>. Quand le monde 3D
 * occupe l'écran, ce décor s'efface : ses éléments existent alors en voxels.
 */
import { Neige } from "./neige";
import { PixelArt } from "./pixel-art";
import { useSecrets } from "./secrets";
import { LUNE, MAISON, PALETTE_TRAINEAU, SAPIN, TRAINEAU, paletteLune, paletteMaison, paletteSapin } from "./sprites";

const ETOILES = Array.from({ length: 44 }, (_, i) => ({
  left: (i * 53 + 7) % 100,
  top: (i * 29 + 3) % 72,
  taille: i % 7 === 0 ? 4 : 2,
  duree: 2 + (i % 5),
  delai: -(i % 4),
}));

export const Decor = () => {
  const s = useSecrets();
  if (s.immersif) return null;

  return (
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

      <Neige tempete={s.tempete} couleur={s.couleur} />

      {/* Lune : trois clics */}
      <button
        type="button"
        tabIndex={-1}
        onClick={s.cliquerLune}
        className="lune fixed right-4 top-4 z-20 cursor-pointer sm:right-10 sm:top-8"
      >
        <PixelArt art={LUNE} taille={5} palette={paletteLune(s.luneFyliz)} />
      </button>

      {/* Traîneau qui traverse le ciel */}
      <button
        type="button"
        tabIndex={-1}
        onClick={s.cliquerTraineau}
        className="traineau fixed left-0 top-[18%] z-20 cursor-pointer"
      >
        <PixelArt art={TRAINEAU} taille={4} palette={PALETTE_TRAINEAU} />
      </button>

      {/* Sol enneigé */}
      <div className="sol pointer-events-none fixed inset-x-0 bottom-0 z-0 h-5" />

      <button
        type="button"
        tabIndex={-1}
        onClick={s.allumerSapin}
        className="pointer-events-none fixed bottom-3 left-3 z-0 opacity-70 xl:pointer-events-auto xl:z-20 xl:cursor-pointer xl:opacity-100"
      >
        <PixelArt
          art={SAPIN}
          taille={4}
          className={s.sapinAllume ? "sapin-allume" : undefined}
          palette={paletteSapin(s.sapinAllume)}
        />
      </button>

      <button
        type="button"
        tabIndex={-1}
        onClick={s.basculerLumiere}
        className="pointer-events-none fixed bottom-3 right-3 z-0 opacity-70 xl:pointer-events-auto xl:z-20 xl:cursor-pointer xl:opacity-100"
      >
        <PixelArt art={MAISON} taille={4} palette={paletteMaison(s.lumiere)} />
      </button>
    </div>
  );
};
