import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { chiffrer, cleDeLaCase, dechiffrer } from "../src/lib/coffre.ts";

const maitresse = randomBytes(32);

test("une case se déchiffre avec sa propre clé", () => {
  const c = chiffrer(cleDeLaCase(maitresse, 3), 3, "secret du 3");
  assert.equal(dechiffrer(cleDeLaCase(maitresse, 3), c), "secret du 3");
});

test("la clé de la case 3 n'ouvre pas la case 24", () => {
  const c = chiffrer(cleDeLaCase(maitresse, 24), 24, "secret du 24");
  assert.throws(() => dechiffrer(cleDeLaCase(maitresse, 3), c));
});

test("renommer un fichier chiffré ne trompe pas le déchiffrement", () => {
  const c = chiffrer(cleDeLaCase(maitresse, 24), 24, "secret du 24");
  assert.throws(() => dechiffrer(cleDeLaCase(maitresse, 24), { ...c, jour: 3 }));
});
