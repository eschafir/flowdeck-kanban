import type { Board, Card, Column, Workspace } from "./types";
import { initialBoard } from "./dummyData";

export const WORKSPACE_STORAGE_KEY = "flowdeck.workspace";
/** Legacy single-board key from earlier versions */
export const LEGACY_BOARD_STORAGE_KEY = "kanban.board";

function isCard(value: unknown): value is Card {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" &&
    typeof card.title === "string" &&
    typeof card.details === "string"
  );
}

function isColumn(value: unknown): value is Column {
  if (!value || typeof value !== "object") return false;
  const column = value as Record<string, unknown>;
  return (
    typeof column.id === "string" &&
    typeof column.name === "string" &&
    Array.isArray(column.cards) &&
    column.cards.every(isCard)
  );
}

export function isValidBoard(value: unknown): value is Board {
  if (!value || typeof value !== "object") return false;
  const board = value as Record<string, unknown>;
  return (
    typeof board.id === "string" &&
    typeof board.name === "string" &&
    typeof board.description === "string" &&
    Array.isArray(board.columns) &&
    board.columns.length === 5 &&
    board.columns.every(isColumn)
  );
}

export function isValidWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Record<string, unknown>;
  if (!Array.isArray(workspace.boards) || workspace.boards.length === 0) {
    return false;
  }
  if (typeof workspace.activeBoardId !== "string") return false;
  if (!workspace.boards.every(isValidBoard)) return false;
  return workspace.boards.some((b) => b.id === workspace.activeBoardId);
}

export function migrateLegacyBoard(value: unknown): Workspace | null {
  if (!value || typeof value !== "object") return null;
  const legacy = value as Record<string, unknown>;
  if (
    !Array.isArray(legacy.columns) ||
    legacy.columns.length !== 5 ||
    !legacy.columns.every(isColumn)
  ) {
    return null;
  }

  const board: Board = {
    id: initialBoard.id,
    name: initialBoard.name,
    description: initialBoard.description,
    columns: legacy.columns,
  };

  return { boards: [board], activeBoardId: board.id };
}

function parseWorkspace(raw: string | null): Workspace | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValidWorkspace(parsed)) return parsed;
    return migrateLegacyBoard(parsed);
  } catch {
    return null;
  }
}

function loadFromLocalStorage(): Workspace | null {
  if (typeof window === "undefined") return null;
  try {
    const current = parseWorkspace(
      window.localStorage.getItem(WORKSPACE_STORAGE_KEY)
    );
    if (current) return current;
    return parseWorkspace(
      window.localStorage.getItem(LEGACY_BOARD_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function clearLegacyLocalStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_BOARD_STORAGE_KEY);
}

/**
 * Prefer Electron file storage when available; otherwise localStorage (web/dev).
 * Migrates one-time from localStorage into the Electron file when present.
 */
export async function loadWorkspace(): Promise<Workspace | null> {
  if (typeof window === "undefined") return null;

  if (window.flowdeck) {
    try {
      const fromFile: unknown = await window.flowdeck.loadWorkspace();
      if (isValidWorkspace(fromFile)) {
        return fromFile;
      }

      const migrated = loadFromLocalStorage();
      if (migrated) {
        await window.flowdeck.saveWorkspace(migrated);
        clearLegacyLocalStorage();
        return migrated;
      }

      return null;
    } catch {
      return null;
    }
  }

  return loadFromLocalStorage();
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  if (typeof window === "undefined") return;

  if (window.flowdeck) {
    await window.flowdeck.saveWorkspace(workspace);
    return;
  }

  window.localStorage.setItem(
    WORKSPACE_STORAGE_KEY,
    JSON.stringify(workspace)
  );
}
