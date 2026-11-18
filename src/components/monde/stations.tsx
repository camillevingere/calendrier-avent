"use client";

/**
 * Les 24 stations du chemin. Chacune a :
 * - une arche en sucre d'orge, avec son numéro qui brille au-dessus ;
 * - un socle lumineux ;
 * - l'objet du jour, en voxels :
 *     verrouillé → fil de fer gris ;
 *     « nu » (ouvert, jamais déballé ici) → fil de fer orange qui pulse ;
 *     complet → l'objet en couleurs, après l'assemblage cube par cube.
 */
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { modeleDuJour, pixelsDuTexte } from "../voxels";
import { directionDuChemin, pointDuChemin } from "./chemin";
import { voyage } from "./voyage";

export type EtatObjet = "verrouille" | "nu" | "complet";
export type EtatStation = { etat: EtatObjet; jourJ: boolean };

export const UNITE = 0.19;
export const HAUTEUR_OBJET = 2.1;
export const DUREE = 1.6; // secondes, pour l'unité de progression de l'assemblage
export const FIN = 1.15; // progression à laquelle le dernier cube est posé

const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** Position et orientation (face à la caméra qui arrive) de la station k. */
const repere = (k: number) => {
  const p = pointDuChemin(k);
  const d = directionDuChemin(k);
  return { p, d, angle: Math.atan2(-d.x, -d.z) };
};

type Props = {
  etats: EtatStation[];
  assemblage: { jour: number; cle: number } | null;
  onActiver: (k: number) => void;
  onAller: (k: number) => void;
  onFinAssemblage: (jour: number) => void;
};

export const Stations = ({ etats, assemblage, onActiver, onAller, onFinAssemblage }: Props) => (
  <>
    <Arches etats={etats} />
    {etats.map((e, k) => {
      const { p, angle } = repere(k);
      return (
        <group key={k} position={p} rotation={[0, angle, 0]}>
          <Socle etat={e} k={k} />
          <Objet
            k={k}
            etat={e.etat}
            assemblage={assemblage?.jour === k + 1 ? assemblage.cle : null}
            onFin={onFinAssemblage}
            onClic={() => (Math.abs(voyage.actuel - k) < 0.5 ? onActiver(k) : onAller(k))}
          />
        </group>
      );
    })}
  </>
);

/* ------------------------------------------------------------------ Arches */

const CUBE = 0.5;
const ECART = 3.7; // demi-largeur de l'arche
const HAUT = 10; // cubes par pilier

const couleurNumero = (e: EtatStation) =>
  e.etat === "verrouille"
    ? new THREE.Color("#5a5a63").multiplyScalar(0.7)
    : e.etat === "complet"
      ? new THREE.Color("#fff4e8").multiplyScalar(1.6)
      : new THREE.Color("#ff781a").multiplyScalar(e.jourJ ? 4 : 2.4);

const Arches = ({ etats }: { etats: EtatStation[] }) => {
  const piliers = useRef<THREE.InstancedMesh>(null);
  const chiffres = useRef<THREE.InstancedMesh>(null);

  const { blocs, pixels } = useMemo(() => {
    const blocs: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const pixels: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const o = new THREE.Object3D();
    const ajouter = (liste: typeof blocs, base: THREE.Object3D, x: number, y: number, z: number, taille: number, c: THREE.Color) => {
      o.position.set(x, y, z);
      o.scale.setScalar(taille);
      o.updateMatrix();
      liste.push({ m: new THREE.Matrix4().multiplyMatrices(base.matrix, o.matrix), c });
    };
    const base = new THREE.Object3D();
    etats.forEach((e, k) => {
      const { p, angle } = repere(k);
      base.position.copy(p);
      base.rotation.set(0, angle, 0);
      base.updateMatrix();
      const ouverte = e.etat !== "verrouille";
      const a = new THREE.Color(ouverte ? "#ff781a" : "#3a3a42");
      const b = new THREE.Color(ouverte ? "#fff4e8" : "#24242a");
      // Piliers en sucre d'orge : on alterne les couleurs une rangée sur deux.
      for (const cote of [-1, 1]) {
        for (let y = 0; y < HAUT; y++) {
          ajouter(blocs, base, cote * ECART, CUBE / 2 + y * CUBE, 0, CUBE, (y + (cote > 0 ? 1 : 0)) % 2 ? a : b);
        }
      }
      // Linteau.
      const nb = Math.round((ECART * 2) / CUBE) + 1;
      for (let i = 0; i < nb; i++) {
        ajouter(blocs, base, -ECART + i * CUBE, CUBE / 2 + HAUT * CUBE, 0, CUBE, i % 2 ? a : b);
      }
      // Numéro lumineux au-dessus.
      const c = couleurNumero(e);
      for (const px of pixelsDuTexte(String(k + 1).padStart(2, "0"))) {
        ajouter(pixels, base, px.x * 0.3, (HAUT + 1) * CUBE + 0.95 + px.y * 0.3, 0, 0.28, c);
      }
    });
    return { blocs, pixels };
  }, [etats]);

  useLayoutEffect(() => {
    for (const [mesh, liste] of [
      [piliers.current, blocs],
      [chiffres.current, pixels],
    ] as const) {
      if (!mesh) continue;
      liste.forEach((b, i) => {
        mesh.setMatrixAt(i, b.m);
        mesh.setColorAt(i, b.c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [blocs, pixels]);

  return (
    <>
      <instancedMesh key={`p${blocs.length}`} ref={piliers} args={[undefined, undefined, blocs.length]} frustumCulled={false}>
        <boxGeometry args={[0.96, 0.96, 0.96]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh key={`c${pixels.length}`} ref={chiffres} args={[undefined, undefined, pixels.length]} frustumCulled={false}>
        <boxGeometry args={[0.92, 0.92, 0.92]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
};

/* ------------------------------------------------------------------ Socle */

const Socle = ({ etat, k }: { etat: EtatStation; k: number }) => {
  const anneau = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const couleur = useMemo(
    () =>
      etat.etat === "verrouille"
        ? new THREE.Color("#5a5a63")
        : etat.etat === "complet"
          ? new THREE.Color("#3ddc84").multiplyScalar(2)
          : new THREE.Color("#ff781a").multiplyScalar(3.5),
    [etat],
  );
  useFrame((state) => {
    const r = anneau.current;
    if (!r || !mat.current) return;
    const proche = Math.abs(voyage.actuel - k) < 0.5;
    r.rotation.z = state.clock.elapsedTime * (proche ? 0.9 : 0.25);
    mat.current.color.copy(couleur).multiplyScalar(proche ? 1 : 0.55);
  });
  return (
    <group>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[1.45, 1.6, 0.44, 8]} />
        <meshStandardMaterial color="#1c1c1f" roughness={0.7} flatShading />
      </mesh>
      <mesh ref={anneau} position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.3, 8, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial ref={mat} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/* ------------------------------------------------------------------ Objet */

const Objet = ({
  k,
  etat,
  assemblage,
  onFin,
  onClic,
}: {
  k: number;
  etat: EtatObjet;
  assemblage: number | null;
  onFin: (jour: number) => void;
  onClic: () => void;
}) => {
  const jour = k + 1;
  const modele = useMemo(() => modeleDuJour(jour), [jour]);
  const n = modele.voxels.length;
  const racine = useRef<THREE.Group>(null);
  const support = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const plein = useRef<THREE.InstancedMesh>(null);
  const fantome = useRef<THREE.InstancedMesh>(null);
  const fantomeMat = useRef<THREE.MeshBasicMaterial>(null);
  const anim = useRef<{ debut: number; fini: boolean } | null>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  // Les cubes du bas tombent d'abord, avec un peu de désordre pour que ça vive.
  const delais = useMemo(
    () =>
      modele.voxels.map(
        (v, i) => ((v.y + modele.hauteur / 2) / modele.hauteur) * 0.55 + (((i * 2654435761) >>> 0) % 1000) / 4000,
      ),
    [modele],
  );

  const poser = (mesh: THREE.InstancedMesh, i: number, echelle: number, dy: number, tour: number) => {
    const v = modele.voxels[i];
    tmp.position.set(v.x * UNITE, v.y * UNITE + dy, v.z * UNITE);
    tmp.rotation.set(tour, tour * 0.7, 0);
    tmp.scale.setScalar(echelle);
    tmp.updateMatrix();
    mesh.setMatrixAt(i, tmp.matrix);
  };

  useLayoutEffect(() => {
    const p = plein.current;
    const f = fantome.current;
    if (!p || !f) return;
    const couleur = new THREE.Color();
    for (let i = 0; i < n; i++) {
      poser(p, i, 1, 0, 0);
      poser(f, i, 1, 0, 0);
      p.setColorAt(i, couleur.set(modele.voxels[i].couleur));
    }
    p.instanceMatrix.needsUpdate = true;
    f.instanceMatrix.needsUpdate = true;
    if (p.instanceColor) p.instanceColor.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modele]);

  useEffect(() => {
    if (assemblage === null) return;
    anim.current = { debut: performance.now() / 1000, fini: false };
  }, [assemblage]);

  useFrame((state, dt) => {
    const r = racine.current;
    const s = support.current;
    const pv = pivot.current;
    const p = plein.current;
    const f = fantome.current;
    if (!r || !s || !pv || !p || !f) return;

    // Les objets loin de la caméra ne sont pas dessinés.
    const distance = Math.abs(voyage.actuel - k);
    // Une fois dépassé, l'objet disparaît : la caméra passerait au travers.
    r.visible = distance < 7 && voyage.actuel - k < 0.3;
    if (!r.visible) return;

    const a = anim.current;
    const enCours = a !== null && !a.fini;
    const t = state.clock.elapsedTime;
    const selectionne = distance < 0.5;

    pv.rotation.y += dt * (enCours ? 2.4 : selectionne ? 0.55 : 0.2);
    s.position.y = HAUTEUR_OBJET + Math.sin(t * 1.4 + jour) * 0.1;
    s.scale.setScalar(THREE.MathUtils.damp(s.scale.x, selectionne ? 1.2 : 0.95, 5, dt));

    if (enCours) {
      const prog = (performance.now() / 1000 - a.debut) / DUREE;
      for (let i = 0; i < n; i++) {
        const local = THREE.MathUtils.clamp((prog - delais[i]) / 0.35, 0, 1);
        const e = local === 0 ? 0 : easeOutBack(local);
        poser(p, i, Math.max(e, 0.0001), (1 - Math.min(e, 1)) * 3.6, (1 - local) * 2.5);
      }
      p.instanceMatrix.needsUpdate = true;
      if (prog >= FIN) {
        a.fini = true;
        for (let i = 0; i < n; i++) poser(p, i, 1, 0, 0);
        p.instanceMatrix.needsUpdate = true;
        onFin(jour);
      }
    }

    p.visible = etat === "complet" || a !== null;
    f.visible = etat !== "complet" && !(a?.fini ?? false);

    const m = fantomeMat.current;
    if (m) {
      m.opacity = etat === "verrouille" ? 0.28 : enCours ? 0.15 : 0.55 + Math.sin(t * 3) * 0.25;
    }
  });

  const couleurFantome = etat === "verrouille" ? "#6a6a73" : "#ff9a4a";

  return (
    <group ref={racine}>
      <group ref={support} position={[0, HAUTEUR_OBJET, 0]}>
        <group
          ref={pivot}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onClic();
          }}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <instancedMesh ref={plein} args={[undefined, undefined, n]} visible={false} frustumCulled={false}>
            <boxGeometry args={[UNITE * 0.94, UNITE * 0.94, UNITE * 0.94]} />
            <meshStandardMaterial roughness={0.45} metalness={0.05} />
          </instancedMesh>
          <instancedMesh ref={fantome} args={[undefined, undefined, n]} frustumCulled={false}>
            <boxGeometry args={[UNITE * 0.94, UNITE * 0.94, UNITE * 0.94]} />
            <meshBasicMaterial
              ref={fantomeMat}
              color={couleurFantome}
              wireframe
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </instancedMesh>
        </group>
      </group>
    </group>
  );
};

/** L'explosion de pixels quand l'objet est terminé. */
export const Eclats = ({ jour }: { jour: number }) => {
  const points = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const N = 220;
  const debut = useRef<number | null>(null);
  const { positions, vitesses } = useMemo(() => {
    const origine = pointDuChemin(jour - 1).setY(HAUTEUR_OBJET);
    const positions = new Float32Array(N * 3);
    const vitesses = new Float32Array(N * 3);
    const dir = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      positions.set([origine.x, origine.y, origine.z], i * 3);
      // Directions réparties sur la sphère (spirale de Fibonacci) : pas de hasard dans le rendu.
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * 2.399963;
      dir.set(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(2.5 + (i % 7) * 0.7);
      vitesses.set([dir.x, Math.abs(dir.y) + 2.5, dir.z], i * 3);
    }
    return { positions, vitesses };
  }, [jour]);

  useFrame((_, dt) => {
    const pts = points.current;
    if (!pts || !mat.current) return;
    const now = performance.now() / 1000;
    // Les éclats partent quand le dernier cube se pose.
    debut.current ??= now + DUREE * FIN;
    const age = now - debut.current;
    pts.visible = age >= 0 && age < 1.8;
    if (age < 0) return;
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      vitesses[i * 3 + 1] -= 9 * dt;
      attr.setXYZ(
        i,
        attr.getX(i) + vitesses[i * 3] * dt,
        attr.getY(i) + vitesses[i * 3 + 1] * dt,
        attr.getZ(i) + vitesses[i * 3 + 2] * dt,
      );
    }
    attr.needsUpdate = true;
    mat.current.opacity = Math.max(0, 1 - age / 1.8);
  });

  return (
    <points ref={points} visible={false} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={mat} size={0.16} color={[3, 1.8, 0.4]} toneMapped={false} transparent depthWrite={false} />
    </points>
  );
};
