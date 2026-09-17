"use client";

import { useEffect, useRef, useState } from "react";

type BoardMenuProps = {
  onEdit: () => void;
  onExport: () => void;
  onImport: () => void;
  onNew: () => void;
  onDelete: () => void;
  canDelete: boolean;
};

export function BoardMenu({
  onEdit,
  onExport,
  onImport,
  onNew,
  onDelete,
  canDelete,
}: BoardMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Board actions"
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="board-menu"
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--dark-navy)] transition-colors hover:bg-[var(--blue-primary)]/10"
      >
        <span className="flex flex-col gap-[3px]" aria-hidden>
          <span className="block h-0.5 w-3.5 rounded-full bg-current" />
          <span className="block h-0.5 w-3.5 rounded-full bg-current" />
          <span className="block h-0.5 w-3.5 rounded-full bg-current" />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          data-testid="board-menu-panel"
          className="absolute right-0 z-50 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--panel)] py-1 shadow-[var(--shadow-soft)]"
        >
          <button
            type="button"
            role="menuitem"
            data-testid="edit-board"
            onClick={() => run(onEdit)}
            className="block w-full px-3 py-2 text-left text-sm text-[var(--dark-navy)] transition-colors hover:bg-[var(--blue-primary)]/10"
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid="export-board"
            onClick={() => run(onExport)}
            className="block w-full px-3 py-2 text-left text-sm text-[var(--dark-navy)] transition-colors hover:bg-[var(--blue-primary)]/10"
          >
            Export
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid="import-board"
            onClick={() => run(onImport)}
            className="block w-full px-3 py-2 text-left text-sm text-[var(--dark-navy)] transition-colors hover:bg-[var(--blue-primary)]/10"
          >
            Import
          </button>
          <div className="my-1 border-t border-[var(--border-subtle)]" />
          <button
            type="button"
            role="menuitem"
            data-testid="new-board"
            onClick={() => run(onNew)}
            className="block w-full px-3 py-2 text-left text-sm font-medium text-[var(--purple-secondary)] transition-colors hover:bg-[var(--purple-secondary)]/10"
          >
            New board
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid="delete-board"
            disabled={!canDelete}
            onClick={() => {
              if (!canDelete) return;
              run(onDelete);
            }}
            className="block w-full px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:text-[var(--gray-text)] disabled:hover:bg-transparent"
          >
            Delete board
          </button>
        </div>
      ) : null}
    </div>
  );
}
