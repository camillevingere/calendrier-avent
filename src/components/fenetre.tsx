"use client";

import { useEffect, useRef } from "react";

/**
 * Une fenêtre modale (<dialog>) : au centre, ou en tiroir qui glisse depuis la
 * droite pour garder le monde 3D visible derrière.
 */
export const Fenetre = ({
  ouverte,
  onFermer,
  titre,
  variante = "centre",
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  variante?: "centre" | "tiroir";
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouverte && !d.open) d.showModal();
    if (!ouverte && d.open) d.close();
  }, [ouverte]);

  const tiroir = variante === "tiroir";

  return (
    <dialog
      ref={ref}
      aria-label={titre}
      onClose={onFermer}
      onClick={(e) => e.target === ref.current && onFermer()}
      className={
        tiroir
          ? "tiroir my-0 mr-0 ml-auto h-dvh max-h-dvh w-[min(46rem,100vw)] max-w-none bg-transparent p-0 text-creme"
          : "m-auto max-h-[90dvh] w-[min(46rem,calc(100vw-2rem))] bg-transparent p-0 text-creme"
      }
    >
      <div
        className={
          tiroir
            ? "pixel h-full overflow-y-auto bg-ardoise/95 p-5 backdrop-blur-sm sm:p-10 [--bord:var(--color-orange)]"
            : "pixel max-h-[90dvh] overflow-y-auto bg-ardoise p-5 sm:p-8"
        }
      >
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
