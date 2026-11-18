"use client";

/**
 * Le monde autour du chemin : sol enneigé, route balisée, forêt de sapins en
 * voxels, ciel étoilé, neige… et quatre des six secrets, cachés dans le décor :
 * la lune (3 clics), le traîneau, le sapin géant et la maison du lutin.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { EtatSecrets } from "../secrets";
import { LUNE, MAISON, PALETTE_TRAINEAU, SAPIN, TRAINEAU, paletteLune, paletteMaison, paletteSapin } from "../sprites";
import { extruder, pixelsDuTexte } from "../voxels";
import { directionDuChemin, echantillons, hasard, PORTE, pointDuChemin, S_MAX, S_MIN } from "./chemin";
import { VoxelSprite } from "./voxel-sprite";

const LARGEUR_ROUTE = 2.2;

/** Où poser un élément : à `s` sur le chemin, décalé de `cote` unités sur le côté. */
const aCote = (s: number, cote: number) => {
  const p = pointDuChemin(s);
  const d = directionDuChemin(s);
  return { position: p.add(new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(cote)), angle: Math.atan2(-d.x, -d.z) };
};

/* ------------------------------------------------------------------ Sol et route */

export const Sol = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -170]}>
    <planeGeometry args={[420, 560]} />
    <meshStandardMaterial color="#aab3c8" roughness={1} />
  </mesh>
);

export const Route = () => {
  const balises = useRef<THREE.InstancedMesh>(null);

  const { geometrie, positions } = useMemo(() => {
    const pts = echantillons(900);
    const sommets: number[] = [];
    const indices: number[] = [];
    pts.forEach((p, i) => {
      const suivant = pts[Math.min(i + 1, pts.length - 1)];
      const precedent = pts[Math.max(i - 1, 0)];
      const d = suivant.clone().sub(precedent).setY(0).normalize();
      const n = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(LARGEUR_ROUTE);
      sommets.push(p.x + n.x, 0.02, p.z + n.z, p.x - n.x, 0.02, p.z - n.z);
      if (i < pts.length - 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    });
    const geometrie = new THREE.BufferGeometry();
    geometrie.setAttribute("position", new THREE.Float32BufferAttribute(sommets, 3));
    geometrie.setIndex(indices);
    geometrie.computeVertexNormals();

    // Balises lumineuses de chaque côté, comme une piste d'atterrissage.
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length; i += 4) {
      const p = pts[i];
      const d = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).setY(0).normalize();
      const n = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(LARGEUR_ROUTE + 0.35);
      positions.push(p.clone().add(n).setY(0.12), p.clone().sub(n).setY(0.12));
    }
    return { geometrie, positions };
  }, []);

  useLayoutEffect(() => {
    const m = balises.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    positions.forEach((p, i) => {
      o.position.copy(p);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      // Une balise sur trois en crème : la route a un rythme.
      m.setColorAt(i, i % 6 < 2 ? c.set("#fff4e8").multiplyScalar(1.4) : c.set("#ff781a").multiplyScalar(2.6));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [positions]);

  return (
    <>
      <mesh geometry={geometrie}>
        <meshStandardMaterial color="#1a1a1f" roughness={0.9} />
      </mesh>
      <instancedMesh ref={balises} args={[undefined, undefined, positions.length]} frustumCulled={false}>
        <boxGeometry args={[0.16, 0.16, 0.16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
};

/* ------------------------------------------------------------------ Forêt */

const ETAGES = [2.3, 1.75, 1.2, 0.65];

export const Foret = () => {
  const largeur = useThree((s) => s.size.width);
  const nombre = largeur < 700 ? 200 : 380;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const blocs = useMemo(() => {
    const r = hasard(2026);
    const o = new THREE.Object3D();
    const liste: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const tronc = new THREE.Color("#4a2c1e");
    const verts = ["#14432a", "#1a5634", "#1f6b3a"].map((c) => new THREE.Color(c));
    const neige = new THREE.Color("#f2f4fa");
    const evite = [
      { s: 4.5, cote: -11 }, // le sapin géant
      { s: 12.5, cote: 12 }, // la maison
    ];
    const bloc = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rot: number, c: THREE.Color) => {
      o.position.set(x, y, z);
      o.rotation.set(0, rot, 0);
      o.scale.set(sx, sy, sz);
      o.updateMatrix();
      liste.push({ m: o.matrix.clone(), c });
    };

    let poses = 0;
    while (poses < nombre) {
      const s = S_MIN + r() * (S_MAX - S_MIN);
      const cote = (r() < 0.5 ? -1 : 1) * (5 + Math.pow(r(), 1.5) * 42);
      // Pas de sapin dans les arches, ni sur le sapin géant ou la maison.
      if (Math.abs(cote) < 6.5 && Math.abs(s - Math.round(s)) < 0.25) continue;
      if (Math.abs(s - PORTE) < 1 && Math.abs(cote) < 12) continue;
      if (evite.some((e) => Math.abs(e.s - s) < 0.6 && Math.abs(e.cote - cote) < 7)) continue;
      const { position: p } = aCote(s, cote);
      const t = 0.7 + r() * 1.3;
      const rot = r() * Math.PI;
      bloc(p.x, 0.4 * t, p.z, 0.4 * t, 0.8 * t, 0.4 * t, rot, tronc);
      ETAGES.forEach((l, e) => {
        const y = (0.8 + e * 0.72 + 0.36) * t;
        bloc(p.x, y, p.z, l * t, 0.72 * t, l * t, rot, verts[(e + poses) % 3]);
        bloc(p.x, y + 0.42 * t, p.z, l * 0.72 * t, 0.12 * t, l * 0.72 * t, rot, neige);
      });
      poses++;
    }
    return liste;
  }, [nombre]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    blocs.forEach((b, i) => {
      m.setMatrixAt(i, b.m);
      m.setColorAt(i, b.c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [blocs]);

  return (
    <instancedMesh key={blocs.length} ref={mesh} args={[undefined, undefined, blocs.length]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial roughness={0.9} flatShading />
    </instancedMesh>
  );
};

/* ------------------------------------------------------------------ Ciel */

/** Étoiles, lune et traîneau : accrochés à la caméra, ils restent toujours à l'horizon. */
export const Ciel = ({ secrets }: { secrets: EtatSecrets }) => {
  const groupe = useRef<THREE.Group>(null);
  const traineau = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);

  const etoiles = useMemo(() => {
    const r = hasard(7);
    const N = 1400;
    const p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const theta = r() * Math.PI * 2;
      const y = 0.05 + r() * 0.95;
      const rr = Math.sqrt(1 - y * y);
      p.set([Math.cos(theta) * rr * 180, y * 180, Math.sin(theta) * rr * 180], i * 3);
    }
    return p;
  }, []);

  const lune = useMemo(() => extruder(LUNE, paletteLune(secrets.luneFyliz), 2), [secrets.luneFyliz]);
  const modeleTraineau = useMemo(() => extruder(TRAINEAU, PALETTE_TRAINEAU, 2), []);

  useFrame((state) => {
    groupe.current?.position.copy(camera.position);
    const t = traineau.current;
    if (t) {
      // Un passage toutes les 26 secondes, d'un bout à l'autre du ciel.
      const phase = ((state.clock.elapsedTime + 6) % 26) / 26;
      t.position.set(-150 + phase * 300, 40 + Math.sin(phase * Math.PI * 6) * 3, -120);
    }
  });

  return (
    <group ref={groupe}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[etoiles, 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.8} sizeAttenuation={false} color="#fff4e8" fog={false} transparent opacity={0.85} />
      </points>
      <VoxelSprite
        modele={lune}
        unite={1.5}
        toutLumineux={secrets.luneFyliz ? 1.6 : 1.25}
        brouillard={false}
        position={[-48, 58, -120]}
        rotation={[0.25, 0.35, 0]}
        onClick={secrets.cliquerLune}
      />
      <group ref={traineau}>
        <VoxelSprite modele={modeleTraineau} unite={0.85} toutLumineux={1.05} brouillard={false} onClick={secrets.cliquerTraineau} />
      </group>
    </group>
  );
};

/* ------------------------------------------------------------------ Neige */

const FETE = ["#ff781a", "#ffcc33", "#3ddc84", "#ff4d6d", "#4dc9ff", "#fff4e8"].map((c) => new THREE.Color(c));

export const Flocons = ({ tempete, couleur }: { tempete: boolean; couleur: EtatSecrets["couleur"] }) => {
  const points = useRef<THREE.Points>(null);
  const camera = useThree((s) => s.camera);
  const largeur = useThree((s) => s.size.width);
  const N = largeur < 700 ? 900 : 1800;
  const TAILLE = 60;
  const HAUTEUR = 26;

  const { base, positions, couleurs } = useMemo(() => {
    const r = hasard(99);
    const base = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) base.set([r() * TAILLE, r() * HAUTEUR, r() * TAILLE], i * 3);
    return { base, positions: new Float32Array(N * 3), couleurs: new Float32Array(N * 3) };
  }, [N]);

  useLayoutEffect(() => {
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const v = couleur === "fete" ? FETE[i % FETE.length] : c.set(couleur === "orange" ? "#ff9a4a" : "#fff4e8");
      couleurs.set([v.r * 1.3, v.g * 1.3, v.b * 1.3], i * 3);
    }
    const attr = points.current?.geometry.getAttribute("color");
    if (attr) attr.needsUpdate = true;
  }, [couleur, couleurs, N]);

  useFrame((state, dt) => {
    const pts = points.current;
    if (!pts) return;
    const vitesse = tempete ? 7 : 1.1;
    const vent = tempete ? 9 : 0.3;
    const t = state.clock.elapsedTime;
    const cx = camera.position.x;
    const cz = camera.position.z;
    const mod = (v: number, m: number) => ((v % m) + m) % m;
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      base[j] += (vent + Math.sin(t + i) * 0.3) * dt;
      base[j + 1] -= vitesse * (0.7 + (i % 5) * 0.12) * dt;
      // La neige suit la caméra : on « replie » chaque flocon dans une boîte autour d'elle.
      positions[j] = cx + mod(base[j] - cx, TAILLE) - TAILLE / 2;
      positions[j + 1] = mod(base[j + 1], HAUTEUR);
      positions[j + 2] = cz + mod(base[j + 2] - cz, TAILLE) - TAILLE * 0.75;
    }
    (pts.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[couleurs, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={tempete ? 0.16 : 0.09}
        vertexColors
        toneMapped={false}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
};

/* ------------------------------------------------------------------ Secrets du décor */

export const SapinGeant = ({ secrets }: { secrets: EtatSecrets }) => {
  const { position, angle } = useMemo(() => aCote(4.5, -11), []);
  const modele = useMemo(() => extruder(SAPIN, paletteSapin(secrets.sapinAllume), 3), [secrets.sapinAllume]);
  const lumineux = useMemo((): Record<string, number> => (secrets.sapinAllume ? { y: 3, o: 3 } : {}), [secrets.sapinAllume]);
  return (
    <group position={position} rotation={[0, angle + 0.5, 0]}>
      <VoxelSprite modele={modele} unite={0.75} lumineux={lumineux} position={[0, 6, 0]} onClick={secrets.allumerSapin} />
      {secrets.sapinAllume && <pointLight position={[0, 6, 3]} color="#ffb27a" intensity={60} distance={18} />}
    </group>
  );
};

export const Maison = ({ secrets }: { secrets: EtatSecrets }) => {
  const { position, angle } = useMemo(() => aCote(12.5, 12), []);
  const modele = useMemo(() => extruder(MAISON, paletteMaison(secrets.lumiere), 9), [secrets.lumiere]);
  const lumineux = useMemo((): Record<string, number> => (secrets.lumiere ? { l: 3.5 } : {}), [secrets.lumiere]);
  return (
    <group position={position} rotation={[0, angle - 0.6, 0]}>
      <VoxelSprite modele={modele} unite={0.62} lumineux={lumineux} position={[0, 3.1, 0]} onClick={secrets.basculerLumiere} />
      {secrets.lumiere && <pointLight position={[-2, 2.5, 4]} color="#ffcc33" intensity={25} distance={12} />}
    </group>
  );
};

/* ------------------------------------------------------------------ Porte finale */

export const Porte = () => {
  const lettres = useRef<THREE.InstancedMesh>(null);
  const { position, angle } = useMemo(() => aCote(PORTE, 0), []);
  const pixels = useMemo(() => pixelsDuTexte("FYLIZ"), []);

  useLayoutEffect(() => {
    const m = lettres.current;
    if (!m) return;
    const o = new THREE.Object3D();
    pixels.forEach((p, i) => {
      o.position.set(p.x * 0.62, 11.5 + p.y * 0.62, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [pixels]);

  useFrame((state) => {
    const m = lettres.current?.material as THREE.MeshBasicMaterial | undefined;
    if (m) m.color.setRGB(4, 1.4, 0.25).multiplyScalar(0.85 + Math.sin(state.clock.elapsedTime * 2) * 0.15);
  });

  return (
    <group position={position} rotation={[0, angle, 0]}>
      {[-1, 1].map((cote) => (
        <mesh key={cote} position={[cote * 7, 5, 0]}>
          <boxGeometry args={[1.4, 10, 1.4]} />
          <meshStandardMaterial color="#1c1c1f" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 9.6, 0]}>
        <boxGeometry args={[15.4, 1.2, 1.4]} />
        <meshStandardMaterial color="#1c1c1f" roughness={0.6} />
      </mesh>
      {/* Le passage brille : au bout du chemin, Fyliz. */}
      <mesh position={[0, 4.5, -0.2]}>
        <planeGeometry args={[12.6, 9]} />
        <meshBasicMaterial color={[2.2, 0.75, 0.15]} toneMapped={false} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={lettres} args={[undefined, undefined, pixels.length]} frustumCulled={false}>
        <boxGeometry args={[0.58, 0.58, 0.58]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <pointLight position={[0, 6, 6]} color="#ff781a" intensity={80} distance={30} />
    </group>
  );
};
