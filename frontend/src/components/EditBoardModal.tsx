"use client";

import { FormEvent, useEffect, useState } from "react";

type EditBoardModalProps = {
  name: string;
  description: string;
  onSave: (name: string, description: string) => void;
  onClose: () => void;
};

export function EditBoardModal({
  name: initialName,
  description: initialDescription,
  onSave,
  onClose,
}: EditBoardModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
  }, [initialName, initialDescription]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit board"
        data-testid="edit-board-backdrop"
        className="absolute inset-0 bg-[var(--dark-navy)]/35 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        data-testid="edit-board-modal"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-white p-6 shadow-2xl"
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--blue-primary)]">
          Edit board
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--dark-navy)]">
          Board details
        </h2>
        <span className="mt-2 block h-0.5 w-10 bg-[var(--accent-yellow)]" />

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--gray-text)]">
              Name
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Board name"
              data-testid="edit-board-name"
              className="rounded-md border border-[var(--border-subtle)] px-3 py-2 text-[var(--dark-navy)] outline-none focus:border-[var(--blue-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--gray-text)]">
              Description (optional)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Board description"
              data-testid="edit-board-description"
              rows={3}
              placeholder="What is this board for?"
              className="resize-none rounded-md border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--dark-navy)] outline-none focus:border-[var(--blue-primary)]"
            />
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              data-testid="edit-board-submit"
              className="rounded-md bg-[var(--purple-secondary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="edit-board-cancel"
              className="rounded-md px-4 py-2 text-sm text-[var(--gray-text)] hover:text-[var(--dark-navy)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
