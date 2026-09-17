"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card } from "./Card";
import type { Column as ColumnType } from "@/lib/types";

type ColumnProps = {
  column: ColumnType;
  onRename: (columnId: string, name: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenCard: (cardId: string) => void;
};

export function Column({
  column,
  onRename,
  onAddCard,
  onDeleteCard,
  onOpenCard,
}: ColumnProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  function commitRename() {
    const trimmed = name.trim() || column.name;
    setName(trimmed);
    onRename(column.id, trimmed);
    setEditing(false);
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      commitRename();
    }
    if (event.key === "Escape") {
      setName(column.name);
      setEditing(false);
    }
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAddCard(column.id, title, details);
    setTitle("");
    setDetails("");
    setAdding(false);
  }

  return (
    <section
      data-testid={`column-${column.id}`}
      className={`flex min-w-0 flex-1 flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--column-bg)] backdrop-blur-sm transition-shadow ${
        isOver ? "ring-2 ring-[var(--accent-yellow)] shadow-lg" : "shadow-sm"
      }`}
    >
      <header className="border-b border-[var(--border-subtle)] px-4 pb-3 pt-4">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleNameKeyDown}
            aria-label="Column name"
            data-testid={`rename-input-${column.id}`}
            className="w-full rounded-md border border-[var(--blue-primary)] bg-[var(--panel)] px-2 py-1 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dark-navy)] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            data-testid={`rename-${column.id}`}
            className="group w-full text-left"
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--dark-navy)]">
              {column.name}
            </h2>
            <span className="mt-1 block h-0.5 w-8 bg-[var(--accent-yellow)] transition-all group-hover:w-12" />
          </button>
        )}
        <p className="mt-2 text-xs uppercase tracking-wider text-[var(--gray-text)]">
          {column.cards.length} {column.cards.length === 1 ? "card" : "cards"}
        </p>
      </header>

      <div
        ref={setNodeRef}
        data-testid={`column-drop-${column.id}`}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3"
      >
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onOpen={onOpenCard}
              onDelete={onDeleteCard}
            />
          ))}
        </SortableContext>
      </div>

      <footer className="border-t border-[var(--border-subtle)] px-3 py-3">
        {adding ? (
          <form onSubmit={handleAdd} className="flex flex-col gap-2" data-testid={`add-form-${column.id}`}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
              aria-label="Card title"
              data-testid={`add-title-${column.id}`}
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel)] px-2.5 py-1.5 text-sm text-[var(--dark-navy)] outline-none focus:border-[var(--blue-primary)]"
            />
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Details"
              aria-label="Card details"
              rows={2}
              data-testid={`add-details-${column.id}`}
              className="resize-none rounded-md border border-[var(--border-subtle)] bg-[var(--panel)] px-2.5 py-1.5 text-sm text-[var(--dark-navy)] outline-none focus:border-[var(--blue-primary)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                data-testid={`add-submit-${column.id}`}
                className="rounded-md bg-[var(--purple-secondary)] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                  setDetails("");
                }}
                className="rounded-md px-3 py-1.5 text-sm text-[var(--gray-text)] hover:text-[var(--dark-navy)]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            data-testid={`add-card-${column.id}`}
            className="w-full rounded-md border border-dashed border-[var(--blue-primary)]/40 px-3 py-2 text-sm font-medium text-[var(--blue-primary)] transition-colors hover:border-[var(--blue-primary)] hover:bg-[var(--panel-muted)]"
          >
            + Add card
          </button>
        )}
      </footer>
    </section>
  );
}
