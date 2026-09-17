import type { Board, Workspace } from "./types";
import { isValidBoard } from "./storage";

export const BOARD_EXPORT_FORMAT = "flowdeck-board";
export const BOARD_EXPORT_VERSION = 1;

export type BoardExportPayload = {
  format: typeof BOARD_EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  board: Board;
};

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function serializeBoardExport(board: Board): string {
  const payload: BoardExportPayload = {
    format: BOARD_EXPORT_FORMAT,
    version: BOARD_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    board,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBoardExport(raw: string): Board | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const payload = parsed as Record<string, unknown>;

    if (
      payload.format === BOARD_EXPORT_FORMAT &&
      typeof payload.version === "number" &&
      isValidBoard(payload.board)
    ) {
      return payload.board;
    }

    // Allow importing a bare board object
    if (isValidBoard(parsed)) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/** Fresh IDs so re-importing the same file does not collide. */
export function remintBoardIds(board: Board): Board {
  return {
    ...board,
    id: nextId("board"),
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => ({
        ...card,
        id: nextId("card"),
      })),
    })),
  };
}

export function importBoard(
  workspace: Workspace,
  board: Board
): Workspace {
  const imported = remintBoardIds(board);
  return {
    boards: [...workspace.boards, imported],
    activeBoardId: imported.id,
  };
}

export function boardExportFilename(boardName: string): string {
  const slug = boardName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "board"}.flowdeck.json`;
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
