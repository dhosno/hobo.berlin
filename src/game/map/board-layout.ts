export type TerrainKind = "asphalt" | "grass";

export function terrainAt(column: number, row: number): TerrainKind {
  const isAsphalt =
    (column >= 2 && column <= 4) ||
    (column >= 13 && column <= 15) ||
    (row >= 7 && row <= 9) ||
    (row >= 20 && row <= 22);

  return isAsphalt ? "asphalt" : "grass";
}
