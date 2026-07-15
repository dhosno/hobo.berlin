// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { existsSync } from "node:fs";
// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { readFile } from "node:fs/promises";
// @ts-expect-error Node ambient types are intentionally excluded from the browser project.
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { blockedCellKey, parseTiledMap } from "../../src/game/map/tiled-contract";

function validMap(): unknown {
  return {
    orientation: "orthogonal",
    infinite: false,
    width: 24,
    height: 16,
    tilewidth: 32,
    tileheight: 32,
    layers: [
      {
        type: "objectgroup",
        name: "Spawn",
        objects: [{ id: 1, name: "player", point: true, x: 64, y: 64 }],
      },
      {
        type: "objectgroup",
        name: "Collision",
        objects: [{ id: 2, x: 160, y: 64, width: 32, height: 32 }],
      },
    ],
  };
}

function playerObject(map: unknown): Record<string, unknown> {
  const layers = (map as { layers: Array<{ name: string; objects: Record<string, unknown>[] }> })
    .layers;
  return layers.find((layer) => layer.name === "Spawn")!.objects[0];
}

function collisionLayer(map: unknown): Record<string, unknown> {
  const layers = (map as { layers: Array<Record<string, unknown>> }).layers;
  return layers.find((layer) => layer.name === "Collision")!;
}

function collisionObject(map: unknown): Record<string, unknown> {
  return (collisionLayer(map).objects as Record<string, unknown>[])[0];
}

describe("parseTiledMap", () => {
  it("parses a valid map", () => {
    const result = parseTiledMap(validMap());

    expect(result.bounds).toEqual({ columns: 24, rows: 16 });
    expect(result.spawn).toEqual({ column: 2, row: 2 });
    expect(result.blockedCells).toEqual(new Set([blockedCellKey({ column: 5, row: 2 })]));
  });

  it("expands a multi-cell Collision rectangle", () => {
    const map = validMap() as { layers: Array<{ name: string; objects: unknown[] }> };
    map.layers.find((layer) => layer.name === "Collision")!.objects = [
      { id: 2, x: 160, y: 64, width: 64, height: 64 },
    ];

    expect(parseTiledMap(map).blockedCells).toEqual(new Set(["5,2", "6,2", "5,3", "6,3"]));
  });

  it("accepts an empty Collision layer", () => {
    const map = validMap() as { layers: Array<{ name: string; objects: unknown[] }> };
    map.layers.find((layer) => layer.name === "Collision")!.objects = [];

    expect(() => parseTiledMap(map)).not.toThrow();
    expect(parseTiledMap(map).blockedCells).toEqual(new Set());
  });

  it.each(["Spawn", "Collision"])("rejects a missing %s layer", (layerName) => {
    const map = validMap() as { layers: Array<{ name: string }> };
    map.layers = map.layers.filter((layer) => layer.name !== layerName);

    expect(() => parseTiledMap(map)).toThrow(layerName);
  });

  it.each(["Spawn", "Collision"])("rejects a duplicate %s layer", (layerName) => {
    const map = validMap() as { layers: Array<Record<string, unknown>> };
    const layer = map.layers.find((candidate) => candidate.name === layerName)!;
    map.layers.push(structuredClone(layer));

    expect(() => parseTiledMap(map)).toThrow(layerName);
  });

  it("rejects a Spawn layer with no player", () => {
    const map = validMap() as { layers: Array<{ name: string; objects: unknown[] }> };
    map.layers.find((layer) => layer.name === "Spawn")!.objects = [];

    expect(() => parseTiledMap(map)).toThrow(/player/i);
  });

  it("rejects a Spawn layer with multiple players", () => {
    const map = validMap() as { layers: Array<{ name: string; objects: unknown[] }> };
    map.layers.find((layer) => layer.name === "Spawn")!.objects.push({
      id: 3,
      name: "player",
      point: true,
      x: 96,
      y: 64,
    });

    expect(() => parseTiledMap(map)).toThrow(/player/i);
  });

  it.each([
    ["non-point", { point: false }],
    ["misaligned", { x: 65 }],
    ["outside the map", { x: 768 }],
  ])("rejects a %s player", (_description, changes) => {
    const map = validMap();
    Object.assign(playerObject(map), changes);

    expect(() => parseTiledMap(map)).toThrow(/player/i);
  });

  it.each([
    ["ellipse", { ellipse: true }],
    ["polygon", { polygon: [{ x: 0, y: 0 }] }],
    ["polyline", { polyline: [{ x: 0, y: 0 }] }],
    ["tile object", { gid: 1 }],
    ["text object", { text: { text: "player" } }],
  ])("rejects a player carrying alternate Tiled kind fields: %s", (_description, changes) => {
    const map = validMap();
    Object.assign(playerObject(map), changes);

    expect(() => parseTiledMap(map)).toThrow(/player/i);
  });

  it("rejects hidden and malformed non-player objects on Spawn", () => {
    const hiddenObjectMap = validMap() as {
      layers: Array<{ name: string; objects: unknown[] }>;
    };
    hiddenObjectMap.layers.find((layer) => layer.name === "Spawn")!.objects.push({
      id: 4,
      name: "marker",
      point: true,
      visible: false,
      x: 96,
      y: 64,
    });
    expect(() => parseTiledMap(hiddenObjectMap)).toThrow(/4/);

    const malformedObjectMap = validMap() as {
      layers: Array<{ name: string; objects: unknown[] }>;
    };
    malformedObjectMap.layers.find((layer) => layer.name === "Spawn")!.objects.push(null);
    expect(() => parseTiledMap(malformedObjectMap)).toThrow(/Spawn object/i);
  });

  it("rejects a spawn on a blocker", () => {
    const map = validMap();
    Object.assign(playerObject(map), { x: 160, y: 64 });

    expect(() => parseTiledMap(map)).toThrow(/spawn/i);
  });

  it.each([
    ["orientation", { orientation: "isometric" }],
    ["finite geometry", { infinite: true }],
    ["dimensions", { width: 23 }],
    ["dimensions", { height: 15 }],
    ["tile size", { tilewidth: 16 }],
    ["tile size", { tileheight: 16 }],
  ])("rejects unsupported map geometry: %s", (contract, changes) => {
    const map = validMap() as Record<string, unknown>;
    Object.assign(map, changes);

    expect(() => parseTiledMap(map)).toThrow(new RegExp(contract, "i"));
  });

  it.each([
    ["point", { point: true }],
    ["ellipse", { ellipse: true }],
    ["polygon", { polygon: [{ x: 0, y: 0 }] }],
    ["polyline", { polyline: [{ x: 0, y: 0 }] }],
    ["tile object", { gid: 1 }],
    ["text object", { text: { text: "blocked" } }],
    ["hidden object", { visible: false }],
    ["zero width", { width: 0 }],
    ["zero height", { height: 0 }],
    ["misaligned x", { x: 161 }],
    ["misaligned y", { y: 65 }],
    ["misaligned width", { width: 33 }],
    ["misaligned height", { height: 33 }],
    ["out-of-map x", { x: 768 }],
    ["out-of-map y", { y: 512 }],
    ["out-of-map width", { x: 736, width: 64 }],
    ["out-of-map height", { y: 480, height: 64 }],
  ])("rejects invalid Collision object %s and names its ID", (_description, changes) => {
    const map = validMap();
    Object.assign(collisionObject(map), changes);

    expect(() => parseTiledMap(map)).toThrow(/2/);
  });

  it("rejects a hidden Collision layer", () => {
    const map = validMap();
    collisionLayer(map).visible = false;

    expect(() => parseTiledMap(map)).toThrow(/Collision/);
  });

  it.each(["Spawn", "Collision"])(
    "rejects a same-named non-object layer alongside valid %s",
    (layerName) => {
      const map = validMap() as { layers: Array<Record<string, unknown>> };
      map.layers.push({ name: layerName, type: "tilelayer", data: [] });

      expect(() => parseTiledMap(map)).toThrow(layerName);
    },
  );

  it("accepts explicit visibility and rejects a hidden Spawn layer or player", () => {
    const visibleMap = validMap() as { layers: Array<Record<string, unknown>> };
    for (const layer of visibleMap.layers) {
      layer.visible = true;
      for (const object of layer.objects as Record<string, unknown>[]) object.visible = true;
    }
    expect(() => parseTiledMap(visibleMap)).not.toThrow();

    const hiddenLayerMap = validMap();
    const spawnLayer = (hiddenLayerMap as { layers: Array<Record<string, unknown>> }).layers.find(
      (layer) => layer.name === "Spawn",
    )!;
    spawnLayer.visible = false;
    expect(() => parseTiledMap(hiddenLayerMap)).toThrow(/Spawn/);

    const hiddenPlayerMap = validMap();
    playerObject(hiddenPlayerMap).visible = false;
    expect(() => parseTiledMap(hiddenPlayerMap)).toThrow(/player/i);
  });

  it("parses the checked-in phase 0 map", async () => {
    const mapPath = resolve("src/assets/maps/phase-0.json");

    expect(existsSync(mapPath)).toBe(true);
    const input: unknown = JSON.parse(await readFile(mapPath, "utf8"));
    const result = parseTiledMap(input);
    expect(result.spawn).toEqual({ column: 2, row: 2 });
    expect(result.blockedCells.has("5,2")).toBe(true);
  });
});
