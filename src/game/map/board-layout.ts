export type TerrainKind = "asphalt" | "grass";

export function terrainAt(column: number, row: number): TerrainKind {
  const isAsphalt =
    (column >= 2 && column <= 4) ||
    (column >= 13 && column <= 15) ||
    (row >= 6 && row <= 8) ||
    (row >= 19 && row <= 21);

  return isAsphalt ? "asphalt" : "grass";
}
