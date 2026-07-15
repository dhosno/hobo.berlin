import {
  blockedCellKey,
  type GridBounds,
  type GridPosition,
} from "../map/tiled-contract";

export type Direction = "up" | "down" | "left" | "right";

const DIRECTION_DELTAS: Record<Direction, GridPosition> = {
  up: { column: 0, row: -1 },
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
  right: { column: 1, row: 0 },
};

export function moveGridPosition(
  current: GridPosition,
  direction: Direction,
  bounds: GridBounds,
  blockedCells: ReadonlySet<string>,
): GridPosition {
  const delta = DIRECTION_DELTAS[direction];
  const candidate = {
    column: current.column + delta.column,
    row: current.row + delta.row,
  };

  if (
    candidate.column < 0 ||
    candidate.column >= bounds.columns ||
    candidate.row < 0 ||
    candidate.row >= bounds.rows
  ) {
    return current;
  }
  if (blockedCells.has(blockedCellKey(candidate))) {
    return current;
  }

  return candidate;
}
