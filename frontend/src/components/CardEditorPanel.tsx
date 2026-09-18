"use client";

import { FormEvent, useEffect, useState } from "react";
import { RichTextEditor } from "./RichTextEditor";
import type { Card as CardType } from "@/lib/types";

type CardEditorPanelProps = {
  card: CardType;
  onSave: (updates: {
    title: string;
    details: string;
    deadline: string | null;
  }) => void;
  onClose: () => void;
};

export function CardEditorPanel({ card, onSave, onClose }: CardEditorPanelProps) {
  const [title, setTitle] = useState(card.title);
  const [details, setDetails] = useState(card.details);
  const [deadline, setDeadline] = useState(card.deadline ?? "");

  useEffect(() => {
    setTitle(card.title);
    setDetails(card.details);
    setDeadline(card.deadline ?? "");
  }, [card.id, card.title, card.details, card.deadline]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), details, deadline: deadline || null });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="card-editor-panel">
      <button
        type="button"
        aria-label="Close editor"
        data-testid="card-editor-backdrop"
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[1px]"

        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-[var(--border-subtle)] bg-[var(--panel)] shadow-2xl">
        <header className="border-b border-[var(--border-subtle)] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--blue-primary)]">
            Edit card
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--dark-navy)]">
            Details
          </h2>
          <span className="mt-2 block h-0.5 w-10 bg-[var(--accent-yellow)]" />
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--gray-text)]">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Card title"
              data-testid="card-editor-title"
              className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel)] px-3 py-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--dark-navy)] outline-none focus:border-[var(--blue-primary)]"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-editor-deadline"
              className="text-xs font-medium uppercase tracking-wider text-[var(--gray-text)]"
            >
              Deadline
            </label>
            <div className="flex items-center gap-2">
              <input
                id="card-editor-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                data-testid="card-editor-deadline"
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--dark-navy)] outline-none focus:border-[var(--blue-primary)]"
              />
              {deadline ? (
                <button
                  type="button"
                  onClick={() => setDeadline("")}
                  data-testid="card-editor-deadline-clear"
                  className="rounded-md px-2 py-1 text-sm text-[var(--gray-text)] hover:text-[var(--dark-navy)]"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div
            role="group"
            aria-labelledby="card-editor-description-label"
            className="flex flex-col gap-1.5"
          >
            <span
              id="card-editor-description-label"
              className="text-xs font-medium uppercase tracking-wider text-[var(--gray-text)]"
            >
              Description
            </span>
            <RichTextEditor
              key={card.id}
              content={details}
              onChange={setDetails}
            />
          </div>

          <div className="mt-auto flex gap-2 border-t border-[var(--border-subtle)] pt-4">
            <button
              type="submit"
              data-testid="card-editor-save"
              className="rounded-md bg-[var(--purple-secondary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="card-editor-cancel"
              className="rounded-md px-4 py-2 text-sm text-[var(--gray-text)] hover:text-[var(--dark-navy)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
