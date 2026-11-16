/** Neige en pixels, décorative. Positions déterministes pour un rendu stable. */
export type CouleurNeige = "creme" | "orange" | "fete";

const FETE = ["#ff781a", "#ffcc33", "#3ddc84", "#ff4d6d", "#4dc9ff", "#fff4e8"];

const flocons = (nombre: number) =>
  Array.from({ length: nombre }, (_, i) => ({
    left: (i * 37 + (i % 3) * 11) % 100,
    duree: 9 + ((i * 7) % 11),
    delai: -((i * 13) % 20),
    taille: i % 5 === 0 ? 6 : 4,
  }));

const NORMAL = flocons(36);
const TEMPETE = flocons(110);

export const Neige = ({ tempete = false, couleur = "creme" }: { tempete?: boolean; couleur?: CouleurNeige }) => (
  <div aria-hidden="true">
    {(tempete ? TEMPETE : NORMAL).map((f, i) => (
      <span
        key={i}
        className={tempete ? "flocon flocon-tempete" : "flocon"}
        style={{
          left: `${f.left}%`,
          width: tempete ? f.taille + 2 : f.taille,
          height: tempete ? f.taille + 2 : f.taille,
          animationDuration: `${tempete ? f.duree / 3 : f.duree}s`,
          animationDelay: `${f.delai}s`,
          background:
            couleur === "fete" ? FETE[i % FETE.length] : couleur === "orange" ? "var(--color-orange)" : undefined,
          opacity: couleur === "creme" ? undefined : 0.9,
        }}
      />
    ))}
  </div>
);
