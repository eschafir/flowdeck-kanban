import type { Board, Card, Column } from "./types";

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function renameColumn(
  board: Board,
  columnId: string,
  name: string
): Board {
  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId ? { ...column, name } : column
    ),
  };
}

export function addColumn(board: Board, name = "New column"): Board {
  const column: Column = {
    id: nextId("col"),
    name: name.trim() || "New column",
    cards: [],
  };
  return {
    ...board,
    columns: [...board.columns, column],
  };
}

export function deleteColumn(board: Board, columnId: string): Board {
  if (board.columns.length <= 1) return board;
  if (!board.columns.some((column) => column.id === columnId)) return board;
  return {
    ...board,
    columns: board.columns.filter((column) => column.id !== columnId),
  };
}

export function moveColumn(
  board: Board,
  columnId: string,
  toIndex: number
): Board {
  const fromIndex = board.columns.findIndex((column) => column.id === columnId);
  if (fromIndex === -1) return board;

  const clamped = Math.max(0, Math.min(toIndex, board.columns.length - 1));
  if (fromIndex === clamped) return board;

  const columns = [...board.columns];
  const [column] = columns.splice(fromIndex, 1);
  columns.splice(clamped, 0, column);
  return { ...board, columns };
}

export function addCard(
  board: Board,
  columnId: string,
  title: string,
  details: string
): Board {
  const card: Card = {
    id: nextId("card"),
    title: title.trim(),
    details: details.trim(),
  };

  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? { ...column, cards: [...column.cards, card] }
        : column
    ),
  };
}

export function deleteCard(board: Board, cardId: string): Board {
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => card.id !== cardId),
    })),
  };
}

export function updateCard(
  board: Board,
  cardId: string,
  updates: { title: string; details: string; deadline?: string | null }
): Board {
  const title = updates.title.trim();
  const details = updates.details;

  function applyDeadline(card: Card): Card {
    if (updates.deadline === undefined) return card;
    const next = { ...card };
    if (updates.deadline) {
      next.deadline = updates.deadline;
    } else {
      delete next.deadline;
    }
    return next;
  }

  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.map((card) =>
        card.id === cardId
          ? applyDeadline({ ...card, title: title || card.title, details })
          : card
      ),
    })),
  };
}

export function findCardLocation(
  board: Board,
  cardId: string
): { columnId: string; index: number } | null {
  for (const column of board.columns) {
    const index = column.cards.findIndex((card) => card.id === cardId);
    if (index !== -1) {
      return { columnId: column.id, index };
    }
  }
  return null;
}

export function moveCard(
  board: Board,
  cardId: string,
  targetColumnId: string,
  targetIndex: number
): Board {
  const source = findCardLocation(board, cardId);
  if (!source) return board;

  const sourceColumn = board.columns.find((c) => c.id === source.columnId);
  if (!sourceColumn) return board;

  const card = sourceColumn.cards[source.index];
  if (!card) return board;

  let insertIndex = targetIndex;

  if (source.columnId === targetColumnId && source.index < targetIndex) {
    insertIndex = targetIndex - 1;
  }

  if (source.columnId === targetColumnId && source.index === insertIndex) {
    return board;
  }

  const columns = board.columns.map((column) => {
    if (column.id === source.columnId && column.id === targetColumnId) {
      const cards = [...column.cards];
      cards.splice(source.index, 1);
      cards.splice(insertIndex, 0, card);
      return { ...column, cards };
    }

    if (column.id === source.columnId) {
      return {
        ...column,
        cards: column.cards.filter((c) => c.id !== cardId),
      };
    }

    if (column.id === targetColumnId) {
      const cards = [...column.cards];
      cards.splice(insertIndex, 0, card);
      return { ...column, cards };
    }

    return column;
  });

  return { ...board, columns };
}
