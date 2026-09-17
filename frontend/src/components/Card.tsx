"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { htmlToPlainText } from "@/lib/plainText";
import type { Card as CardType } from "@/lib/types";

type CardProps = {
  card: CardType;
  onOpen: (cardId: string) => void;
  onDelete: (cardId: string) => void;
};

export function Card({ card, onOpen, onDelete }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: "card" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const preview = htmlToPlainText(card.details);

  return (
    <article
      ref={setNodeRef}
      style={style}
      data-testid={card.id}
      className={`group relative cursor-grab rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-strong)] p-3.5 shadow-[var(--shadow-soft)] transition-shadow active:cursor-grabbing ${
        isDragging
          ? "z-20 opacity-50 shadow-xl ring-2 ring-[var(--blue-primary)]"
          : "hover:shadow-md"
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onOpen(card.id)}
          data-testid={`open-${card.id}`}
          className="min-w-0 flex-1 rounded-md text-left"
        >
          <h3 className="font-[family-name:var(--font-display)] text-[0.95rem] font-semibold leading-snug text-[var(--dark-navy)]">
            {card.title}
          </h3>
          {preview ? (
            <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[var(--gray-text)]">
              {preview}
            </p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(card.id);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label={`Delete ${card.title}`}
          data-testid={`delete-${card.id}`}
          className="rounded-md px-1.5 py-0.5 text-sm text-[var(--gray-text)] opacity-0 transition-opacity hover:bg-[var(--danger-soft)] hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
        >
          x
        </button>
      </div>
    </article>
  );
}
