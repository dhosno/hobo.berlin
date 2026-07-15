import type { GridPosition } from "./tiled-contract";

export type TerrainKind = "asphalt" | "grass";

export const TREE_POSITIONS = [
  { column: 1, row: 9 },
  { column: 8, row: 7 },
  { column: 8, row: 9 },
  { column: 11, row: 7 },
  { column: 13, row: 8 },
  { column: 21, row: 6 },
] as const satisfies readonly GridPosition[];

export const TRASH_CAN_POSITIONS = [
  { column: 7, row: 3 },
  { column: 17, row: 7 },
  { column: 15, row: 12 },
] as const satisfies readonly GridPosition[];

export const GATE_PLACEMENT = {
  column: 20,
  row: 0,
  width: 4,
  height: 3,
} as const;

export function terrainAt(column: number, row: number): TerrainKind {
  const isAsphalt =
    (row >= 2 && row <= 4) ||
    (row >= 11 && row <= 13) ||
    (column >= 3 && column <= 5) ||
    (column >= 16 && column <= 18);

  return isAsphalt ? "asphalt" : "grass";
}
