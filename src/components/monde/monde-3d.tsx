"use client";

/**
 * Le monde 3D, en plein écran derrière la page. Le scroll fait avancer la
 * caméra sur le chemin (voir voyage.ts), de niveau en niveau, jusqu'à la porte Fyliz.
 *
 * Chargé côté client uniquement (next/dynamic, ssr: false) : three.js ne part
 * pas dans le bundle de la page tant que le monde n'est pas affiché.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useRef } from "react";
import * as THREE from "three";
import type { EtatSecrets } from "../secrets";
import { pointDuChemin } from "./chemin";
import { Ciel, Flocons, Foret, Maison, Porte, Route, SapinGeant, Sol } from "./decor-3d";
import { Eclats, HAUTEUR_OBJET, Stations, type EtatStation } from "./stations";
import { voyage } from "./voyage";

export type PropsMonde = {
  etats: EtatStation[];
  assemblage: { jour: number; cle: number } | null;
  secrets: EtatSecrets;
  onActiver: (k: number) => void;
  onAller: (k: number) => void;
  onFinAssemblage: (jour: number) => void;
};

const NUIT = "#0b0c12";

export default function Monde3D({ etats, assemblage, secrets, onActiver, onAller, onFinAssemblage }: PropsMonde) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ fov: 50, near: 0.1, far: 600, position: [0, 9, 40] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[NUIT]} />
      <fog attach="fog" args={[NUIT, 16, 95]} />
      <hemisphereLight args={["#7d8ab8", "#0f0f10", 0.75]} />
      <directionalLight position={[-40, 60, -60]} intensity={0.9} color="#c9d4ff" />
      <LumiereStation />

      <CameraVoyage tempete={secrets.tempete} />
      <Ciel secrets={secrets} />
      <Sol />
      <Route />
      <Foret />
      <SapinGeant secrets={secrets} />
      <Maison secrets={secrets} />
      <Porte />
      <Stations
        etats={etats}
        assemblage={assemblage}
        onActiver={onActiver}
        onAller={onAller}
        onFinAssemblage={onFinAssemblage}
      />
      {assemblage && <Eclats key={assemblage.cle} jour={assemblage.jour} />}
      <Flocons tempete={secrets.tempete} couleur={secrets.couleur} />

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.75} luminanceSmoothing={0.2} />
        <Noise opacity={0.05} />
        <Vignette offset={0.2} darkness={0.8} />
      </EffectComposer>
    </Canvas>
  );
}

const pos = new THREE.Vector3();
const vise = new THREE.Vector3();
const regard = new THREE.Vector3();

/**
 * La caméra suit le chemin, un peu en retrait du niveau courant.
 * Au début (s < 0), elle survole la vallée ; à la fin, elle lève les yeux vers la porte.
 */
const CameraVoyage = ({ tempete }: { tempete: boolean }) => {
  const { camera, pointer } = useThree();
  const souris = useRef({ x: 0, y: 0 });
  const premier = useRef(true);

  useFrame((state, dt) => {
    // Première image : on se place directement là où la page est défilée (pas de travelling depuis s = -2).
    const init = premier.current;
    if (init) {
      voyage.actuel = voyage.cible;
      premier.current = false;
    }
    voyage.actuel = THREE.MathUtils.damp(voyage.actuel, voyage.cible, 3, Math.min(dt, 0.1));
    const s = voyage.actuel;
    const intro = THREE.MathUtils.smoothstep(-s, 0.15, 1.1);
    const fin = THREE.MathUtils.smoothstep(s, 23.3, 24.6);

    pointDuChemin(s - 0.5 - fin * 0.6, pos);
    pos.y = 2.4 + intro * 7.5 + fin * 1.2;
    pointDuChemin(s + intro * 4 + fin * 1.6, vise);
    vise.y = HAUTEUR_OBJET - 0.1 + intro * 6 + fin * 5;

    souris.current.x = THREE.MathUtils.damp(souris.current.x, pointer.x, 2.5, dt);
    souris.current.y = THREE.MathUtils.damp(souris.current.y, pointer.y, 2.5, dt);
    pos.x += souris.current.x * 0.6;
    pos.y += souris.current.y * 0.3;

    if (tempete) {
      const t = state.clock.elapsedTime * 40;
      pos.x += Math.sin(t) * 0.04;
      pos.y += Math.cos(t * 1.3) * 0.04;
    }

    camera.position.copy(pos);
    // Le regard est lissé lui aussi : pas d'à-coups dans les virages.
    regard.lerp(vise, init ? 1 : Math.min(1, dt * 6));
    camera.lookAt(regard);
  });
  return null;
};

/** Une lumière orange suit le niveau le plus proche : elle guide le regard. */
const LumiereStation = () => {
  const lumiere = useRef<THREE.PointLight>(null);
  const cible = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const l = lumiere.current;
    if (!l) return;
    const k = THREE.MathUtils.clamp(Math.round(voyage.actuel), 0, 23);
    pointDuChemin(k, cible.current).add(new THREE.Vector3(0, 4.2, 2.5));
    l.position.lerp(cible.current, Math.min(1, dt * 4));
  });
  return <pointLight ref={lumiere} color="#ff9a4a" intensity={45} distance={16} decay={1.6} />;
};
