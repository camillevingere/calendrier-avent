/** Neige en pixels, décorative. Positions déterministes pour un rendu stable. */
const FLOCONS = Array.from({ length: 36 }, (_, i) => ({
  left: (i * 37) % 100,
  duree: 9 + ((i * 7) % 11),
  delai: -((i * 13) % 20),
  taille: i % 5 === 0 ? 6 : 4,
}));

export const Neige = () => (
  <div aria-hidden="true">
    {FLOCONS.map((f, i) => (
      <span
        key={i}
        className="flocon"
        style={{
          left: `${f.left}%`,
          width: f.taille,
          height: f.taille,
          animationDuration: `${f.duree}s`,
          animationDelay: `${f.delai}s`,
        }}
      />
    ))}
  </div>
);
