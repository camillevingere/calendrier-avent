"use client";

/**
 * Un sprite en voxels : deux InstancedMesh, l'un éclairé par la scène, l'autre
 * lumineux (couleurs au-delà de 1 : le bloom les fait briller). Les pixels
 * dont le caractère figure dans `lumineux` vont dans le second.
 */
import type { ThreeElements, ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Modele, Voxel } from "../voxels";

type Props = Omit<ThreeElements["group"], "onClick"> & {
  modele: Modele;
  unite: number;
  /** Caractère → intensité lumineuse (1 = couleur normale, 3 = très brillant). */
  lumineux?: Record<string, number>;
  /** Tous les pixels lumineux : pour les objets du ciel, que la lumière de la scène n'atteint pas. */
  toutLumineux?: number;
  onClick?: () => void;
  brouillard?: boolean;
};

const AUCUN: Record<string, number> = {};
const tmp = new THREE.Object3D();
const couleur = new THREE.Color();

const remplir = (mesh: THREE.InstancedMesh | null, voxels: Voxel[], unite: number, intensite: (v: Voxel) => number) => {
  if (!mesh) return;
  voxels.forEach((v, k) => {
    tmp.position.set(v.x * unite, v.y * unite, v.z * unite);
    tmp.updateMatrix();
    mesh.setMatrixAt(k, tmp.matrix);
    mesh.setColorAt(k, couleur.set(v.couleur).multiplyScalar(intensite(v)));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
};

export const VoxelSprite = ({ modele, unite, lumineux = AUCUN, toutLumineux, onClick, brouillard = true, ...groupe }: Props) => {
  const eclaires = useRef<THREE.InstancedMesh>(null);
  const brillants = useRef<THREE.InstancedMesh>(null);

  const [normaux, lumiere] = useMemo((): [Voxel[], Voxel[]] => {
    if (toutLumineux !== undefined) return [[], modele.voxels];
    return [modele.voxels.filter((v) => !(v.car in lumineux)), modele.voxels.filter((v) => v.car in lumineux)];
  }, [modele, lumineux, toutLumineux]);

  useLayoutEffect(() => {
    remplir(eclaires.current, normaux, unite, () => 1);
    remplir(brillants.current, lumiere, unite, (v) => toutLumineux ?? lumineux[v.car] ?? 1);
  }, [normaux, lumiere, unite, lumineux, toutLumineux]);

  const clic = onClick
    ? {
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick();
        },
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        },
        onPointerOut: () => {
          document.body.style.cursor = "";
        },
      }
    : {};

  return (
    <group {...groupe} {...clic}>
      {normaux.length > 0 && (
        <instancedMesh key={`e${normaux.length}`} ref={eclaires} args={[undefined, undefined, normaux.length]} frustumCulled={false}>
          <boxGeometry args={[unite, unite, unite]} />
          <meshStandardMaterial roughness={0.85} fog={brouillard} />
        </instancedMesh>
      )}
      {lumiere.length > 0 && (
        <instancedMesh key={`b${lumiere.length}`} ref={brillants} args={[undefined, undefined, lumiere.length]} frustumCulled={false}>
          <boxGeometry args={[unite, unite, unite]} />
          <meshBasicMaterial toneMapped={false} fog={brouillard} />
        </instancedMesh>
      )}
    </group>
  );
};
