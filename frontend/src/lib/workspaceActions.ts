import type { Board, Workspace } from "./types";
import { emptyColumns } from "./dummyData";

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getActiveBoard(workspace: Workspace): Board {
  return (
    workspace.boards.find((b) => b.id === workspace.activeBoardId) ??
    workspace.boards[0]
  );
}

export function selectBoard(
  workspace: Workspace,
  boardId: string
): Workspace {
  if (!workspace.boards.some((b) => b.id === boardId)) return workspace;
  return { ...workspace, activeBoardId: boardId };
}

export function createBoard(
  workspace: Workspace,
  name: string,
  description = ""
): Workspace {
  const board: Board = {
    id: nextId("board"),
    name: name.trim() || "Untitled board",
    description: description.trim(),
    columns: emptyColumns(),
  };

  return {
    boards: [...workspace.boards, board],
    activeBoardId: board.id,
  };
}

export function updateBoardMeta(
  workspace: Workspace,
  boardId: string,
  updates: { name: string; description: string }
): Workspace {
  return {
    ...workspace,
    boards: workspace.boards.map((board) =>
      board.id === boardId
        ? {
            ...board,
            name: updates.name.trim() || board.name,
            description: updates.description.trim(),
          }
        : board
    ),
  };
}

export function updateActiveBoard(
  workspace: Workspace,
  updater: (board: Board) => Board
): Workspace {
  return {
    ...workspace,
    boards: workspace.boards.map((board) =>
      board.id === workspace.activeBoardId ? updater(board) : board
    ),
  };
}

export function deleteBoard(
  workspace: Workspace,
  boardId: string
): Workspace {
  if (workspace.boards.length <= 1) {
    return workspace;
  }

  const boards = workspace.boards.filter((board) => board.id !== boardId);
  if (boards.length === workspace.boards.length) {
    return workspace;
  }

  const activeBoardId =
    workspace.activeBoardId === boardId
      ? boards[0].id
      : workspace.activeBoardId;

  return { boards, activeBoardId };
}
