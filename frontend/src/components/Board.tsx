"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Column } from "./Column";
import { CardEditorPanel } from "./CardEditorPanel";
import { CreateBoardModal } from "./CreateBoardModal";
import { EditBoardModal } from "./EditBoardModal";
import { BoardMenu } from "./BoardMenu";
import { ThemeToggle } from "./ThemeToggle";
import { initialWorkspace } from "@/lib/dummyData";
import {
  addCard,
  addColumn,
  deleteCard,
  deleteColumn,
  findCardLocation,
  moveColumn,
  renameColumn,
  updateCard,
} from "@/lib/boardActions";
import { htmlToPlainText } from "@/lib/plainText";
import { loadWorkspace, saveWorkspace } from "@/lib/storage";
import {
  createBoard,
  deleteBoard,
  getActiveBoard,
  selectBoard,
  updateActiveBoard,
  updateBoardMeta,
} from "@/lib/workspaceActions";
import {
  boardExportFilename,
  downloadTextFile,
  importBoard,
  parseBoardExport,
  serializeBoardExport,
} from "@/lib/boardTransfer";
import type {
  Board as BoardType,
  Card as CardType,
  Column as ColumnType,
  Workspace,
} from "@/lib/types";

function moveCardBetween(
  board: BoardType,
  activeId: string,
  overId: string
): BoardType {
  const activeLocation = findCardLocation(board, activeId);
  if (!activeLocation) return board;

  const overIsColumn = board.columns.some((c) => c.id === overId);
  const overLocation = overIsColumn ? null : findCardLocation(board, overId);
  const targetColumnId = overIsColumn ? overId : overLocation?.columnId;
  if (!targetColumnId) return board;

  const sourceColumnIndex = board.columns.findIndex(
    (c) => c.id === activeLocation.columnId
  );
  const targetColumnIndex = board.columns.findIndex(
    (c) => c.id === targetColumnId
  );
  if (sourceColumnIndex === -1 || targetColumnIndex === -1) return board;

  const sourceColumn = board.columns[sourceColumnIndex];
  const targetColumn = board.columns[targetColumnIndex];
  const activeCard = sourceColumn.cards[activeLocation.index];
  if (!activeCard) return board;

  if (activeLocation.columnId === targetColumnId) {
    if (overIsColumn) return board;
    const newIndex = overLocation!.index;
    if (activeLocation.index === newIndex) return board;

    const columns = board.columns.map((column, index) => {
      if (index !== sourceColumnIndex) return column;
      return {
        ...column,
        cards: arrayMove(column.cards, activeLocation.index, newIndex),
      };
    });
    return { ...board, columns };
  }

  const targetIndex = overIsColumn
    ? targetColumn.cards.length
    : overLocation!.index;

  const columns = board.columns.map((column, index) => {
    if (index === sourceColumnIndex) {
      return {
        ...column,
        cards: column.cards.filter((c) => c.id !== activeId),
      };
    }
    if (index === targetColumnIndex) {
      const cards = [...column.cards];
      cards.splice(targetIndex, 0, activeCard);
      return { ...column, cards };
    }
    return column;
  });

  return { ...board, columns };
}

const columnCollision: CollisionDetection = (args) => {
  const activeId = String(args.active.id);
  if (!activeId.startsWith("column:")) {
    return closestCorners(args);
  }

  const containers = args.droppableContainers.filter((container) =>
    String(container.id).startsWith("column:")
  );

  return closestCorners({ ...args, droppableContainers: containers });
};

export function Board() {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const board = getActiveBoard(workspace);
  const boardRef = useRef(board);
  boardRef.current = board;
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [editingBoard, setEditingBoard] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const saved = await loadWorkspace();
      if (cancelled) return;
      if (saved) {
        setWorkspace(saved);
      }
      hydrated.current = true;
      setReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !hydrated.current) return;
    void saveWorkspace(workspace);
  }, [workspace, ready]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function patchActiveBoard(updater: (current: BoardType) => BoardType) {
    setWorkspace((current) => updateActiveBoard(current, updater));
  }

  function handleRename(columnId: string, name: string) {
    patchActiveBoard((current) => renameColumn(current, columnId, name));
  }

  function handleAddColumn() {
    patchActiveBoard((current) => addColumn(current));
  }

  function handleDeleteColumn(columnId: string) {
    const column = board.columns.find((item) => item.id === columnId);
    if (column) {
      const openInColumn = column.cards.some((card) => card.id === selectedCardId);
      if (openInColumn) setSelectedCardId(null);
    }
    patchActiveBoard((current) => deleteColumn(current, columnId));
  }

  function handleAddCard(columnId: string, title: string, details: string) {
    patchActiveBoard((current) => addCard(current, columnId, title, details));
  }

  function handleDeleteCard(cardId: string) {
    patchActiveBoard((current) => deleteCard(current, cardId));
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    }
  }

  function handleOpenCard(cardId: string) {
    setSelectedCardId(cardId);
  }

  function handleSaveCard(updates: { title: string; details: string }) {
    if (!selectedCardId) return;
    patchActiveBoard((current) =>
      updateCard(current, selectedCardId, updates)
    );
    setSelectedCardId(null);
  }

  function handleClosePanel() {
    setSelectedCardId(null);
  }

  function handleSelectBoard(boardId: string) {
    setSelectedCardId(null);
    setWorkspace((current) => selectBoard(current, boardId));
  }

  function handleCreateBoard(name: string, description: string) {
    setSelectedCardId(null);
    setWorkspace((current) => createBoard(current, name, description));
    setCreatingBoard(false);
  }

  function handleEditBoard(name: string, description: string) {
    setWorkspace((current) =>
      updateBoardMeta(current, current.activeBoardId, { name, description })
    );
    setEditingBoard(false);
  }

  function handleDeleteBoard() {
    if (workspace.boards.length <= 1) return;
    const confirmed = window.confirm(
      `Delete “${board.name}”? This cannot be undone.`
    );
    if (!confirmed) return;
    setSelectedCardId(null);
    setWorkspace((current) => deleteBoard(current, current.activeBoardId));
  }

  async function handleExportBoard() {
    const content = serializeBoardExport(board);
    const filename = boardExportFilename(board.name);

    if (window.flowdeck?.exportBoardFile) {
      await window.flowdeck.exportBoardFile(filename, content);
      return;
    }

    downloadTextFile(filename, content);
  }

  function applyImportedRaw(raw: string) {
    const parsed = parseBoardExport(raw);
    if (!parsed) {
      setImportError("That file is not a valid Flowdeck board.");
      return;
    }
    setImportError(null);
    setSelectedCardId(null);
    setWorkspace((current) => importBoard(current, parsed));
  }

  async function handleImportBoard() {
    setImportError(null);
    if (window.flowdeck?.importBoardFile) {
      const raw = await window.flowdeck.importBoardFile();
      if (raw == null) return;
      applyImportedRaw(raw);
      return;
    }
    importInputRef.current?.click();
  }

  function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void file.text().then(applyImportedRaw);
  }

  function parseColumnSortableId(id: string): string | null {
    return id.startsWith("column:") ? id.slice("column:".length) : null;
  }

  function resolveColumnId(overId: string): string | null {
    return parseColumnSortableId(overId);
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    const columnId = parseColumnSortableId(activeId);
    if (columnId) {
      setActiveColumn(
        boardRef.current.columns.find((c) => c.id === columnId) ?? null
      );
      setActiveCard(null);
      return;
    }

    const location = findCardLocation(boardRef.current, activeId);
    if (!location) return;
    const host = boardRef.current.columns.find(
      (c) => c.id === location.columnId
    );
    setActiveCard(host?.cards[location.index] ?? null);
    setActiveColumn(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeColumnId = parseColumnSortableId(activeId);
    if (activeColumnId) {
      const overColumnId = resolveColumnId(overId);
      if (!overColumnId || overColumnId === activeColumnId) return;

      const fromIndex = boardRef.current.columns.findIndex(
        (c) => c.id === activeColumnId
      );
      const toIndex = boardRef.current.columns.findIndex(
        (c) => c.id === overColumnId
      );
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      // Only commit when the pointer has crossed the over column's midpoint.
      // Without this, adjacent columns flip-flop on every dragOver frame.
      const activeRect = active.rect.current.translated;
      const overRect = over.rect;
      if (activeRect && overRect) {
        const overMidX = overRect.left + overRect.width / 2;
        if (fromIndex < toIndex && activeRect.right < overMidX) return;
        if (fromIndex > toIndex && activeRect.left > overMidX) return;
      }

      patchActiveBoard((current) =>
        moveColumn(current, activeColumnId, toIndex)
      );
      return;
    }

    const activeLocation = findCardLocation(boardRef.current, activeId);
    if (!activeLocation) return;

    const overIsColumn = boardRef.current.columns.some((c) => c.id === overId);
    const overLocation = overIsColumn
      ? null
      : findCardLocation(boardRef.current, overId);
    const targetColumnId = overIsColumn ? overId : overLocation?.columnId;
    if (!targetColumnId) return;
    if (activeLocation.columnId === targetColumnId) return;

    patchActiveBoard((current) => moveCardBetween(current, activeId, overId));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);
    const activeColumnId = parseColumnSortableId(activeId);

    if (activeColumnId) {
      setActiveColumn(null);
      if (!over) return;

      const overColumnId = resolveColumnId(String(over.id));
      if (!overColumnId || overColumnId === activeColumnId) return;

      const fromIndex = boardRef.current.columns.findIndex(
        (c) => c.id === activeColumnId
      );
      const toIndex = boardRef.current.columns.findIndex(
        (c) => c.id === overColumnId
      );
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

      patchActiveBoard((current) =>
        moveColumn(current, activeColumnId, toIndex)
      );
      return;
    }

    setActiveCard(null);
    if (!over) return;

    const overId = String(over.id);
    if (activeId === overId) return;

    patchActiveBoard((current) => moveCardBetween(current, activeId, overId));
  }

  const selectedCard =
    selectedCardId != null
      ? board.columns.flatMap((c) => c.cards).find((c) => c.id === selectedCardId) ??
        null
      : null;

  const columnNodes = board.columns.map((column) => (
    <Column
      key={column.id}
      column={column}
      canDelete={board.columns.length > 1}
      onRename={handleRename}
      onDelete={handleDeleteColumn}
      onAddCard={handleAddCard}
      onDeleteCard={handleDeleteCard}
      onOpenCard={handleOpenCard}
    />
  ));

  const boardColumns = (
    <div
      data-testid="board"
      className="flex flex-1 gap-4 overflow-x-auto px-6 pb-10 pt-6 sm:px-10"
    >
      <SortableContext
        items={board.columns.map((column) => `column:${column.id}`)}
        strategy={horizontalListSortingStrategy}
      >
        {columnNodes}
      </SortableContext>
      <button
        type="button"
        onClick={handleAddColumn}
        data-testid="add-column"
        className="flex min-w-[15rem] flex-1 shrink-0 items-center justify-center rounded-2xl border border-dashed border-[var(--blue-primary)]/40 bg-[var(--column-bg)] px-4 py-6 text-sm font-medium text-[var(--blue-primary)] transition-colors hover:border-[var(--blue-primary)] hover:bg-[var(--panel-muted)]"
      >
        + Add column
      </button>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col">
      <header className="relative z-40 px-6 pb-2 pt-8 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--blue-primary)]">
            Flowdeck
          </p>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div
              className="flex items-center gap-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-muted)] p-1 shadow-[var(--shadow-soft)] backdrop-blur-sm"
              data-testid="board-controls"
            >
              <select
                value={board.id}
                onChange={(e) => handleSelectBoard(e.target.value)}
                aria-label="Select board"
                data-testid="board-select"
                className="max-w-[11rem] cursor-pointer appearance-none rounded-lg bg-transparent py-1.5 pl-3 pr-7 text-sm font-medium text-[var(--dark-navy)] outline-none transition-colors hover:bg-[var(--blue-primary)]/8 focus:bg-[var(--blue-primary)]/8 sm:max-w-[14rem]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888888' d='M3 4.5L6 8l3-3.5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.55rem center",
                }}
              >
                {workspace.boards.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <span
                aria-hidden
                className="mx-0.5 h-4 w-px bg-[var(--border-subtle)]"
              />

              <BoardMenu
                onEdit={() => setEditingBoard(true)}
                onExport={() => void handleExportBoard()}
                onImport={() => void handleImportBoard()}
                onNew={() => setCreatingBoard(true)}
                onDelete={handleDeleteBoard}
                canDelete={workspace.boards.length > 1}
              />
            </div>
          </div>
        </div>

        {importError ? (
          <p
            data-testid="import-board-error"
            className="mt-3 text-sm text-red-600"
          >
            {importError}
          </p>
        ) : null}

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="import-board-input"
          onChange={handleImportFileChange}
        />

        <div className="mt-5 min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--dark-navy)] sm:text-5xl">
            {board.name}
          </h1>
          <span className="mt-3 block h-1 w-16 rounded-full bg-[var(--accent-yellow)]" />
          {board.description ? (
            <p className="mt-3 max-w-xl text-[var(--gray-text)]">
              {board.description}
            </p>
          ) : null}
        </div>
      </header>

      {ready ? (
        <DndContext
          sensors={sensors}
          collisionDetection={columnCollision}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {boardColumns}
          <DragOverlay>
            {activeColumn ? (
              <div className="min-w-[15rem] flex-1 rounded-2xl border border-[var(--blue-primary)] bg-[var(--column-bg)] p-4 shadow-xl">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dark-navy)]">
                  {activeColumn.name}
                </h3>
                <p className="mt-2 text-xs uppercase tracking-wider text-[var(--gray-text)]">
                  {activeColumn.cards.length}{" "}
                  {activeColumn.cards.length === 1 ? "card" : "cards"}
                </p>
              </div>
            ) : activeCard ? (
              <div className="w-[min(18rem,100%)] rounded-xl border border-[var(--blue-primary)] bg-[var(--surface-strong)] p-3.5 shadow-xl">
                <h3 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold text-[var(--dark-navy)]">
                  {activeCard.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--gray-text)]">
                  {htmlToPlainText(activeCard.details)}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div
          data-testid="board"
          className="flex flex-1 gap-4 overflow-x-auto px-6 pb-10 pt-6 sm:px-10"
        >
          {columnNodes}
        </div>
      )}

      {selectedCard ? (
        <CardEditorPanel
          card={selectedCard}
          onSave={handleSaveCard}
          onClose={handleClosePanel}
        />
      ) : null}

      {creatingBoard ? (
        <CreateBoardModal
          onCreate={handleCreateBoard}
          onClose={() => setCreatingBoard(false)}
        />
      ) : null}

      {editingBoard ? (
        <EditBoardModal
          name={board.name}
          description={board.description}
          onSave={handleEditBoard}
          onClose={() => setEditingBoard(false)}
        />
      ) : null}
    </div>
  );
}
