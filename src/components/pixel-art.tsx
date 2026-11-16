/**
 * Dessine un sprite à partir d'une grille de caractères : chaque caractère est
 * un pixel, "." est transparent, les autres prennent la couleur de la palette.
 */
type Props = {
  art: readonly string[];
  palette: Record<string, string>;
  taille?: number;
  className?: string;
};

export const PixelArt = ({ art, palette, taille = 4, className }: Props) => {
  const largeur = Math.max(...art.map((l) => l.length));
  const rects: React.ReactNode[] = [];
  art.forEach((ligne, y) => {
    // Regroupe les pixels voisins de même couleur en un seul rectangle.
    let x = 0;
    while (x < ligne.length) {
      const c = ligne[x];
      let fin = x + 1;
      while (fin < ligne.length && ligne[fin] === c) fin++;
      if (c !== "." && palette[c]) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={fin - x} height={1} fill={palette[c]} />);
      }
      x = fin;
    }
  });
  return (
    <svg
      viewBox={`0 0 ${largeur} ${art.length}`}
      width={largeur * taille}
      height={art.length * taille}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
};
