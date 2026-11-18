/**
 * Le chemin du voyage : une route qui serpente dans la forêt enneigée.
 *
 * Tout se repère avec une seule coordonnée `s` (« station ») :
 *   s = 0 … 23 : les 24 niveaux (le jour j est à s = j − 1) ;
 *   s < 0      : l'arrivée dans la vallée (écran titre) ;
 *   s ≈ 25     : la porte Fyliz, au bout du chemin.
 * Le scroll de la page pilote `s`, la caméra suit.
 */
import * as THREE from "three";

export const NB = 24;
export const S_MIN = -4;
export const S_MAX = 28;
export const PORTE = 25.6;
const PAS_Z = 14;

const points: THREE.Vector3[] = [];
for (let k = S_MIN; k <= S_MAX; k++) {
  points.push(new THREE.Vector3(Math.sin(k * 0.72) * 4.8 + Math.sin(k * 0.23) * 3, 0, -k * PAS_Z));
}
// getPoint (et non getPointAt) : chaque point de contrôle tombe pile sur un s entier.
const courbe = new THREE.CatmullRomCurve3(points, false, "centripetal");

const t = (s: number) => THREE.MathUtils.clamp((s - S_MIN) / (S_MAX - S_MIN), 0, 1);

export const pointDuChemin = (s: number, cible = new THREE.Vector3()) => courbe.getPoint(t(s), cible);

/** Direction de la route en s (vecteur unitaire, horizontal). */
export const directionDuChemin = (s: number, cible = new THREE.Vector3()) => courbe.getTangent(t(s), cible).setY(0).normalize();

/** Les points de la route, régulièrement espacés : pour la tracer et poser les balises. */
export const echantillons = (n: number) => courbe.getSpacedPoints(n);

/** Un générateur pseudo-aléatoire à graine : la forêt est la même à chaque visite. */
export const hasard = (graine: number) => {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};
