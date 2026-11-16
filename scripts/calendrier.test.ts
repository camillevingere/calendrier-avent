import assert from "node:assert/strict";
import { test } from "node:test";
import { casesDues, ouvertureDe, type Config } from "../src/lib/calendrier.ts";

const normal: Config = {
  annee: 2026,
  heureOuverture: "07:00",
  mode: "normal",
  accelere: { depart: "2026-11-16T20:30:00+01:00", intervalleMinutes: 5 },
};
const accelere: Config = { ...normal, mode: "accelere" };

test("aucune case avant le 1er décembre 07:00 (Paris)", () => {
  assert.deepEqual(casesDues(normal, new Date("2026-12-01T05:59:59Z")), []);
  assert.deepEqual(casesDues(normal, new Date("2026-12-01T06:00:00Z")), [1]);
});

test("un passage sauté se rattrape : toutes les cases dues sont ouvertes", () => {
  assert.deepEqual(casesDues(normal, new Date("2026-12-05T10:00:00Z")), [1, 2, 3, 4, 5]);
});

test("jamais trop tôt : la case 12 n'est pas due le 11 à 23h59 Paris", () => {
  assert.equal(casesDues(normal, new Date("2026-12-11T22:59:00Z")).includes(12), false);
});

test("après le 24, les 24 cases restent ouvertes", () => {
  assert.equal(casesDues(normal, new Date("2027-01-15T00:00:00Z")).length, 24);
});

test("mode accéléré : une case par tranche de 5 minutes à partir du départ", () => {
  assert.deepEqual(casesDues(accelere, new Date("2026-11-16T19:29:59Z")), []);
  assert.deepEqual(casesDues(accelere, new Date("2026-11-16T19:30:00Z")), [1]);
  assert.deepEqual(casesDues(accelere, new Date("2026-11-16T19:44:00Z")), [1, 2, 3]);
  assert.equal(ouvertureDe(accelere, 24).toISOString(), "2026-11-16T21:25:00.000Z");
});

test("deux calculs au même instant donnent le même résultat", () => {
  const t = new Date("2026-12-10T12:00:00Z");
  assert.deepEqual(casesDues(normal, t), casesDues(normal, t));
});
